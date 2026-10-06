-- Numerazione progressiva dei preventivi: per ogni azienda e per anno,
-- "n. 42/2026". Prima il numero nel PDF era finto (PRV-2026-MON, uguale per
-- tutti i preventivi dello stesso cliente).
--
-- Il numero lo assegna il database all'inserimento, cosi' non dipende dal
-- browser e due salvataggi contemporanei non prendono lo stesso numero
-- (lucchetto per azienda + indice unico). Una volta dato non cambia piu':
-- gli aggiornamenti dal programma non lo possono toccare.

alter table public.ordini add column if not exists numero integer;
alter table public.ordini add column if not exists anno integer;

-- I preventivi gia' esistenti: in ordine di creazione, per azienda e anno.
with numerati as (
  select id,
         extract(year from created_at at time zone 'Europe/Rome')::int as a,
         row_number() over (
           partition by user_id, extract(year from created_at at time zone 'Europe/Rome')
           order by created_at, id
         ) as n
  from public.ordini
  where numero is null
)
update public.ordini o
set numero = numerati.n, anno = numerati.a
from numerati
where o.id = numerati.id;

create unique index if not exists ordini_numero_unico
  on public.ordini (user_id, anno, numero);

create or replace function public.numera_preventivo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    -- Il numero dato resta quello.
    if old.numero is not null then
      new.numero := old.numero;
      new.anno := old.anno;
      return new;
    end if;
  end if;

  if new.numero is null then
    new.anno := extract(year from coalesce(new.created_at, now()) at time zone 'Europe/Rome')::int;
    perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':' || new.anno::text, 0));
    select coalesce(max(numero), 0) + 1 into new.numero
      from public.ordini
     where user_id = new.user_id and anno = new.anno;
  end if;
  return new;
end;
$$;

revoke execute on function public.numera_preventivo() from public, anon, authenticated;

drop trigger if exists ordini_numera on public.ordini;
create trigger ordini_numera
  before insert or update on public.ordini
  for each row execute function public.numera_preventivo();
