-- =====================================================================
--  Log de alterações (quem, de qual IP, quando e o que mudou)
--  Gravado pelo próprio banco (gatilhos), então não dá para burlar pelo
--  site. Só o admin consegue ler; ninguém consegue editar ou apagar
--  pelo site. Pode rodar de novo sem problema.
-- =====================================================================
create table if not exists public.log_alteracoes (
  id        bigint generated always as identity primary key,
  quando    timestamptz not null default now(),
  email     text,
  ip        text,
  tabela    text not null,
  acao      text not null check (acao in ('criou', 'alterou', 'excluiu')),
  registro  text,
  mudancas  jsonb not null default '{}'
);
create index if not exists log_alteracoes_quando on public.log_alteracoes (quando desc);

alter table public.log_alteracoes enable row level security;
drop policy if exists "admin le log" on public.log_alteracoes;
create policy "admin le log" on public.log_alteracoes for select to authenticated using (public.e_admin());
revoke all on public.log_alteracoes from anon, authenticated;
grant select on public.log_alteracoes to authenticated;

create or replace function public.registrar_log()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  hdr   jsonb := nullif(current_setting('request.headers', true), '')::jsonb;
  velho jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  novo  jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  dif   jsonb := '{}';
  k     text;
  ip    text;
begin
  ip := coalesce(hdr->>'cf-connecting-ip', nullif(trim(split_part(hdr->>'x-forwarded-for', ',', 1)), ''), hdr->>'x-real-ip');
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(novo) loop
      if k <> 'atualizado_em' and (velho->k) is distinct from (novo->k) then
        dif := dif || jsonb_build_object(k, jsonb_build_object('de', velho->k, 'para', novo->k));
      end if;
    end loop;
    if dif = '{}' then return null; end if;   -- salvou sem mudar nada
  elsif tg_op = 'INSERT' then
    dif := novo - 'id' - 'criado_em' - 'atualizado_em';
  else
    dif := velho - 'id' - 'criado_em' - 'atualizado_em';
  end if;

  insert into public.log_alteracoes (email, ip, tabela, acao, registro, mudancas)
  values (
    coalesce(auth.jwt()->>'email', 'Supabase (SQL/Table Editor)'),
    left(ip, 64),
    tg_table_name,
    case tg_op when 'INSERT' then 'criou' when 'UPDATE' then 'alterou' else 'excluiu' end,
    left(coalesce(novo->>'nome', velho->>'nome', novo->>'chave', velho->>'chave', novo->>'email', velho->>'email'), 120),
    dif);
  return null;
end $$;
revoke all on function public.registrar_log() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['barbeiros','cortes','cafe_itens','produtos','config','equipe_admin'] loop
    execute format('drop trigger if exists trg_log on public.%I', t);
    execute format('create trigger trg_log after insert or update or delete on public.%I
                    for each row execute function public.registrar_log()', t);
  end loop;
end $$;
