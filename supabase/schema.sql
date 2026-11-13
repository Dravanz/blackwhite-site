-- =====================================================================
--  Barbearia · Café · Loja — estrutura do banco (Supabase / Postgres)
--  Rode este arquivo inteiro no Supabase: SQL Editor > New query > Run.
--  Pode rodar de novo sem problema (é idempotente).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Equipe com acesso ao painel (whitelist por e-mail)
--    Só quem estiver aqui consegue alterar alguma coisa, mesmo logado.
-- ---------------------------------------------------------------------
create table if not exists public.equipe_admin (
  email      text primary key check (email = lower(email) and email like '%@%'),
  papel      text not null default 'gerente' check (papel in ('admin', 'gerente')),
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Regra central de segurança
--    Libera escrita só se:
--      a) o e-mail do login está na equipe e ativo;
--      b) o e-mail foi verificado pelo provedor (Google);
--      c) a sessão foi criada há menos de 15 minutos.
--    O item (c) é verificado no servidor: mesmo que alguém renove o
--    token, depois de 15 min do login o banco recusa tudo e é preciso
--    entrar de novo.
-- ---------------------------------------------------------------------
create or replace function public.papel_atual()
returns text
language sql stable security definer set search_path = ''
as $$
  select a.papel
  from public.equipe_admin a
  where a.ativo
    and a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and coalesce((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, false)
    and exists (
      select 1 from auth.sessions s
      where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
        and s.user_id = auth.uid()
        and s.created_at > now() - interval '15 minutes'
    )
  limit 1;
$$;

create or replace function public.pode_editar()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.papel_atual() in ('admin', 'gerente'); $$;

create or replace function public.e_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select public.papel_atual() = 'admin'; $$;

revoke all on function public.papel_atual() from public;
grant execute on function public.papel_atual(), public.pode_editar(), public.e_admin() to anon, authenticated;

-- Usada pelo painel para saber se o usuário logado tem acesso e quanto tempo resta.
create or replace function public.minha_sessao()
returns table (papel text, expira_em timestamptz)
language sql stable security definer set search_path = ''
as $$
  select public.papel_atual(),
         (select s.created_at + interval '15 minutes' from auth.sessions s
           where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid and s.user_id = auth.uid());
$$;
revoke all on function public.minha_sessao() from public, anon;
grant execute on function public.minha_sessao() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Conteúdo
-- ---------------------------------------------------------------------
create table if not exists public.barbeiros (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (char_length(nome) between 2 and 60),
  frase       text not null default '' check (char_length(frase) <= 160),
  instagram   text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  foto        text check (foto is null or char_length(foto) <= 300),
  ordem       int  not null default 0,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.cortes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (char_length(nome) between 2 and 60),
  descricao   text not null default '' check (char_length(descricao) <= 300),
  preco       numeric(8,2) not null check (preco >= 0 and preco < 100000),
  duracao_min int check (duracao_min is null or duracao_min between 5 and 600),
  foto        text check (foto is null or char_length(foto) <= 300),
  destaque    boolean not null default false,
  ordem       int  not null default 0,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.cafe_itens (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (char_length(nome) between 2 and 60),
  descricao   text not null default '' check (char_length(descricao) <= 300),
  categoria   text not null default 'Cafés' check (char_length(categoria) between 2 and 40),
  preco       numeric(8,2) not null check (preco >= 0 and preco < 100000),
  foto        text check (foto is null or char_length(foto) <= 300),
  destaque    boolean not null default false,
  disponivel  boolean not null default true,
  ordem       int  not null default 0,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.produtos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (char_length(nome) between 2 and 80),
  descricao   text not null default '' check (char_length(descricao) <= 500),
  categoria   text not null default 'Camisetas' check (char_length(categoria) between 2 and 40),
  preco       numeric(8,2) not null check (preco >= 0 and preco < 100000),
  preco_promo numeric(8,2) check (preco_promo is null or (preco_promo >= 0 and preco_promo < preco)),
  promo_ate   timestamptz,                      -- contagem regressiva da promoção
  tamanhos    text[] not null default '{}' check (cardinality(tamanhos) <= 12),
  selo        text check (selo is null or char_length(selo) <= 24),  -- "Novo", "Últimas peças"...
  foto        text check (foto is null or char_length(foto) <= 300),
  destaque    boolean not null default false,
  esgotado    boolean not null default false,
  ordem       int  not null default 0,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Informações gerais (WhatsApp, endereço, horários...) — uma linha por chave.
create table if not exists public.config (
  chave  text primary key check (chave ~ '^[a-z_]{2,40}$'),
  valor  text not null default '' check (char_length(valor) <= 500)
);

-- Atualiza "atualizado_em" sozinho
create or replace function public.tocar_atualizado()
returns trigger language plpgsql set search_path = '' as $$
begin new.atualizado_em := now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array['barbeiros','cortes','cafe_itens','produtos'] loop
    execute format('drop trigger if exists trg_atualizado on public.%I', t);
    execute format('create trigger trg_atualizado before update on public.%I
                    for each row execute function public.tocar_atualizado()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4. Row Level Security: público só lê o que está ativo; só a equipe edita
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['barbeiros','cortes','cafe_itens','produtos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "leitura publica" on public.%I', t);
    execute format('drop policy if exists "equipe le tudo" on public.%I', t);
    execute format('drop policy if exists "equipe insere" on public.%I', t);
    execute format('drop policy if exists "equipe altera" on public.%I', t);
    execute format('drop policy if exists "equipe exclui" on public.%I', t);
    execute format('create policy "leitura publica" on public.%I for select to anon, authenticated using (ativo)', t);
    execute format('create policy "equipe le tudo" on public.%I for select to authenticated using (public.pode_editar())', t);
    execute format('create policy "equipe insere" on public.%I for insert to authenticated with check (public.pode_editar())', t);
    execute format('create policy "equipe altera" on public.%I for update to authenticated using (public.pode_editar()) with check (public.pode_editar())', t);
    execute format('create policy "equipe exclui" on public.%I for delete to authenticated using (public.pode_editar())', t);
  end loop;
end $$;

alter table public.config enable row level security;
drop policy if exists "leitura publica" on public.config;
drop policy if exists "admin edita" on public.config;
create policy "leitura publica" on public.config for select to anon, authenticated using (true);
create policy "admin edita" on public.config for all to authenticated using (public.e_admin()) with check (public.e_admin());

-- Lista da equipe: ninguém mexe pelo site. Só pelo painel do Supabase
-- (Table Editor ou SQL Editor), que usa acesso de dono e ignora o RLS.
alter table public.equipe_admin enable row level security;
drop policy if exists "admin gerencia equipe" on public.equipe_admin;

-- Permissões de tabela (RLS decide linha a linha)
grant select on public.barbeiros, public.cortes, public.cafe_itens, public.produtos, public.config to anon;
grant select, insert, update, delete on public.barbeiros, public.cortes, public.cafe_itens,
  public.produtos, public.config to authenticated;
revoke all on public.equipe_admin from anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Bucket de imagens
--    Leitura pública; envio só pela equipe; só imagens, até 3 MB.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', true, 3145728, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set public = true, file_size_limit = 3145728,
      allowed_mime_types = array['image/webp','image/jpeg','image/png'];

drop policy if exists "imagens: equipe le" on storage.objects;
drop policy if exists "imagens: equipe envia" on storage.objects;
drop policy if exists "imagens: equipe altera" on storage.objects;
drop policy if exists "imagens: equipe exclui" on storage.objects;
-- (o Storage precisa de SELECT para conseguir excluir/substituir arquivos)
create policy "imagens: equipe le" on storage.objects for select to authenticated
  using (bucket_id = 'imagens' and public.pode_editar());
create policy "imagens: equipe envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'imagens' and public.pode_editar()
              and (storage.foldername(name))[1] in ('barbeiros','cortes','cafe','loja','eventos'));
create policy "imagens: equipe altera" on storage.objects for update to authenticated
  using (bucket_id = 'imagens' and public.pode_editar());
create policy "imagens: equipe exclui" on storage.objects for delete to authenticated
  using (bucket_id = 'imagens' and public.pode_editar());

-- ---------------------------------------------------------------------
-- 6. Primeiro admin  >>> TROQUE PELO E-MAIL GOOGLE DO DONO <<<
-- ---------------------------------------------------------------------
-- insert into public.equipe_admin (email, papel) values ('dono@gmail.com', 'admin')
--   on conflict (email) do update set papel = 'admin', ativo = true;

-- ---------------------------------------------------------------------
-- 7. Log de alterações: veja supabase/log.sql (rode depois deste arquivo)
-- 8. Eventos: veja supabase/eventos.sql (rode depois do log.sql)
-- ---------------------------------------------------------------------
