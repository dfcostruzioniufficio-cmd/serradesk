-- Numerazione progressiva dei preventivi: per ogni azienda e per anno,
-- "n. 42/2026". Prima il numero nel PDF era finto (PRV-2026-MON, uguale per
-- tutti i preventivi dello stesso cliente).
--
-- Il numero lo assegna il database, da un contatore per azienda e anno che
-- non torna mai indietro: cancellando un preventivo il suo numero non viene
-- riusato, quindi due PDF diversi non possono avere lo stesso numero. Una
-- volta dato il numero non cambia piu': gli aggiornamenti non lo toccano.
--
-- Le richieste arrivate dal preventivatore pubblico ("Bozza dal Web") non
-- prendono il numero all'arrivo, ma al primo salvataggio o cambio di stato:
-- cosi' le richieste anonime non fanno saltare la numerazione.

alter table public.ordini add column if not exists numero integer;
alter table public.ordini add column if not exists anno integer;

create table if not exists public.preventivi_contatori (
  user_id uuid not null,
  anno integer not null,
  ultimo integer not null,
  primary key (user_id, anno)
);
-- Solo il database lo scrive (funzione qui sotto): nessun accesso dal sito.
alter table public.preventivi_contatori enable row level security;
revoke all on public.preventivi_contatori from anon, authenticated;

-- I preventivi gia' esistenti: in ordine di creazione, per azienda e anno,
-- dopo eventuali numeri gia' dati (la migrazione si puo' rieseguire).
with gia as (
  select user_id, anno, max(numero) as m
  from public.ordini
  where numero is not null
  group by user_id, anno
),
numerati as (
  select o.id,
         extract(year from coalesce(o.created_at, now()) at time zone 'Europe/Rome')::int as a,
         row_number() over (
           partition by o.user_id, extract(year from coalesce(o.created_at, now()) at time zone 'Europe/Rome')
           order by o.created_at, o.id
         ) as n,
         o.user_id
  from public.ordini o
  where o.numero is null
)
update public.ordini o
set numero = numerati.n + coalesce(gia.m, 0), anno = numerati.a
from numerati
left join gia on gia.user_id = numerati.user_id and gia.anno = numerati.a
where o.id = numerati.id;

insert into public.preventivi_contatori (user_id, anno, ultimo)
select user_id, anno, max(numero)
from public.ordini
where numero is not null
group by user_id, anno
on conflict (user_id, anno) do update
  set ultimo = greatest(public.preventivi_contatori.ultimo, excluded.ultimo);

create unique index if not exists ordini_numero_unico
  on public.ordini (user_id, anno, numero);

create or replace function public.numera_preventivo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.numero is not null then
    -- Il numero dato resta quello.
    new.numero := old.numero;
    new.anno := old.anno;
    return new;
  end if;

  -- Richiesta appena arrivata dal sito: il numero lo prende piu' avanti.
  if tg_op = 'INSERT' and new.stato = 'Bozza dal Web' then
    new.numero := null;
    new.anno := null;
    return new;
  end if;

  new.anno := extract(year from coalesce(new.created_at, now()) at time zone 'Europe/Rome')::int;
  insert into public.preventivi_contatori as c (user_id, anno, ultimo)
  values (new.user_id, new.anno, 1)
  on conflict (user_id, anno) do update set ultimo = c.ultimo + 1
  returning c.ultimo into new.numero;
  return new;
end;
$$;

revoke execute on function public.numera_preventivo() from public, anon, authenticated;

drop trigger if exists ordini_numera on public.ordini;
create trigger ordini_numera
  before insert or update on public.ordini
  for each row execute function public.numera_preventivo();

notify pgrst, 'reload schema';
