-- Il profilo di un utente: piano, scadenza, ruolo, preventivatore web.
--
-- La regola "Users update own profile" valeva per ALL, cioe' anche per
-- INSERT e DELETE, mentre il controllo su piano e ruolo scattava solo
-- sull'UPDATE. Un utente qualunque poteva cancellare il proprio profilo e
-- rifarselo con plan 'business', scadenza nel 2099 e role 'admin', e da
-- admin leggere i profili di tutti. Il preventivatore web, che si paga a
-- parte, se lo poteva accendere da solo con un UPDATE.
--
-- Ora: l'utente legge e aggiorna solo il suo profilo; lo crea soltanto
-- handle_new_user (alla registrazione, sempre 'free'); piano, scadenza,
-- ruolo, preventivatore web e cliente Stripe li cambiano solo il webhook di
-- Stripe (service_role) e l'amministratore.

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke insert, delete, truncate on public.profiles from authenticated;
revoke all on public.profiles from anon;

create or replace function public.prevent_self_plan_upgrade()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if (new.plan is distinct from old.plan
      or new.trial_ends_at is distinct from old.trial_ends_at
      or new.role is distinct from old.role
      or new.preventivatore_web is distinct from old.preventivatore_web
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.user_id is distinct from old.user_id)
     and auth.role() <> 'service_role'
     and not public.is_admin() then
    raise exception 'Non puoi modificare piano, scadenza o ruolo direttamente.';
  end if;
  return new;
end;
$function$;
