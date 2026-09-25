-- Il preventivatore pubblico e' la pagina che il serramentista mette sul
-- proprio sito: chi la apre non ha un account, quindi auth.uid() e' nullo e
-- le policy RLS gli negavano sia la lettura del catalogo sia l'invio della
-- richiesta. Risultato: la pagina era vuota per tutti gli abbonati e nessuna
-- richiesta poteva arrivare.
--
-- Si apre il minimo indispensabile, con funzioni SECURITY DEFINER invece di
-- allargare le policy: le tabelle restano chiuse e dal catalogo escono solo
-- nome, tipologia e marca. I prezzi (base_price) non escono mai.
--
-- Il preventivatore non e' compreso nell'abbonamento: si vende a parte, e si
-- accende un cliente alla volta dalla pagina Admin.

alter table public.profiles
  add column if not exists preventivatore_web boolean not null default false;

-- Gli amministratori lo hanno acceso da subito: serve per mostrarlo.
update public.profiles set preventivatore_web = true where role = 'admin';

create or replace function public.widget_abilitato(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = p_user_id
      -- Il servizio va comprato a parte...
      and p.preventivatore_web
      -- ...e l'abbonamento deve essere comunque in corso.
      and (
        p.role = 'admin'
        or (p.plan in ('starter', 'standard', 'pro', 'business') and p.trial_ends_at > now())
      )
  );
$$;

-- Restituisce sempre una riga: la pagina deve poter distinguere "servizio
-- spento" da "catalogo vuoto", senza per questo rivelare se l'utente esiste.
create or replace function public.widget_negozio(p_user_id uuid)
returns table (attivo boolean, company_name text, logo_base64 text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.widget_abilitato(p_user_id), s.company_name, s.logo_base64
  from (select 1) unica
  left join public.user_settings s
    on s.user_id = p_user_id
   and public.widget_abilitato(p_user_id);
$$;

create or replace function public.widget_catalogo(p_user_id uuid)
returns table (id uuid, nome text, tipologia text, marca text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.id, c.nome, c.tipologia, c.marca
  from public.sistemi_cam c
  where c.user_id = p_user_id
    and c.is_active
    -- Stessa visibilita' del preventivo: i sistemi nascosti restano nascosti.
    and coalesce(c.specs ->> 'nel_preventivo', 'true') <> 'false'
    and public.widget_abilitato(p_user_id)
  order by c.tipologia, c.nome;
$$;

create or replace function public.widget_richiesta(p_user_id uuid, p_cliente text, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_recenti integer;
begin
  if not public.widget_abilitato(p_user_id) then
    raise exception 'preventivatore non attivo';
  end if;

  if p_cliente is null or length(btrim(p_cliente)) = 0 or length(p_cliente) > 200 then
    raise exception 'nome cliente non valido';
  end if;

  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50
     or length(p_items::text) > 20000 then
    raise exception 'richiesta non valida';
  end if;

  -- La pagina e' pubblica e senza login: un freno agli invii automatici,
  -- altrimenti la casella Ordini di un abbonato si riempie di spazzatura.
  select count(*) into v_recenti
  from public.ordini o
  where o.user_id = p_user_id
    and o.stato = 'Bozza dal Web'
    and o.created_at > now() - interval '1 hour';

  if v_recenti >= 20 then
    raise exception 'troppe richieste, riprova piu tardi';
  end if;

  insert into public.ordini (user_id, cliente, totale, stato, items)
  values (p_user_id, btrim(p_cliente), 0, 'Bozza dal Web', p_items);
end;
$$;

revoke all on function public.widget_abilitato(uuid) from public;
revoke all on function public.widget_negozio(uuid) from public;
revoke all on function public.widget_catalogo(uuid) from public;
revoke all on function public.widget_richiesta(uuid, text, jsonb) from public;

grant execute on function public.widget_negozio(uuid) to anon, authenticated;
grant execute on function public.widget_catalogo(uuid) to anon, authenticated;
grant execute on function public.widget_richiesta(uuid, text, jsonb) to anon, authenticated;
