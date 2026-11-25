-- La richiesta dal preventivatore pubblico arriva da chiunque, senza login, e
-- finisce fra gli Ordini dell'abbonato. Finora si controllava solo quanti
-- erano gli elementi e quanto pesavano: un contenuto confezionato a mano
-- poteva bloccare la pagina Ordini (un oggetto dove la pagina si aspetta un
-- testo) o infilare un'immagine esterna nel preventivo. Ora si accettano solo
-- i campi che la pagina pubblica manda davvero, con il loro tipo.
create or replace function public.widget_richiesta(p_user_id uuid, p_cliente text, p_items jsonb)
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_recenti integer;
  v_items jsonb;
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

  -- I "case" servono: senza, Postgres puo' valutare jsonb_each anche su un
  -- valore che non e' un oggetto.
  if exists (
    select 1 from jsonb_array_elements(p_items) as e
    where case
      when jsonb_typeof(e) <> 'object' then true
      else
           coalesce(e ->> 'type', '') not in ('item', 'metadata')
        or coalesce(jsonb_typeof(e -> 'id'), 'string') <> 'string'
        or coalesce(jsonb_typeof(e -> 'description'), 'string') <> 'string'
        or coalesce(jsonb_typeof(e -> 'width'), 'number') not in ('number', 'null')
        or coalesce(jsonb_typeof(e -> 'height'), 'number') not in ('number', 'null')
        or coalesce(jsonb_typeof(e -> 'quantity'), 'number') not in ('number', 'null')
        or (e ->> 'type' = 'item' and not e ? 'sistema')
        or case
             when not e ? 'sistema' then false
             when jsonb_typeof(e -> 'sistema') <> 'object' then true
             else exists (select 1 from jsonb_each(e -> 'sistema') as s
                          where jsonb_typeof(s.value) not in ('string', 'null'))
           end
        or case
             when not e ? 'clientData' then false
             when jsonb_typeof(e -> 'clientData') <> 'object' then true
             else exists (select 1 from jsonb_each(e -> 'clientData') as d
                          where jsonb_typeof(d.value) not in ('string', 'null'))
           end
    end
  ) then
    raise exception 'richiesta non valida';
  end if;

  -- Qualunque altro campo (per esempio una foto) si scarta. Anche dentro
  -- "sistema" restano solo i quattro campi del catalogo pubblico: un prezzo
  -- aggiunto a mano verrebbe preso per buono quando l'abbonato apre la
  -- richiesta.
  select jsonb_agg(
           (select jsonb_object_agg(c.key,
                     case when c.key = 'sistema' then
                       (select coalesce(jsonb_object_agg(s.key, s.value), '{}'::jsonb)
                          from jsonb_each(c.value) as s
                         where s.key in ('id', 'nome', 'tipologia', 'marca'))
                     else c.value end)
              from jsonb_each(t.e) as c
             where c.key in ('id', 'type', 'sistema', 'width', 'height', 'quantity', 'description', 'clientData'))
           order by t.n)
    into v_items
    from jsonb_array_elements(p_items) with ordinality as t(e, n);

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
  values (p_user_id, btrim(p_cliente), 0, 'Bozza dal Web', v_items);
end;
$function$;
