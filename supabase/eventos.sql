-- =====================================================================
--  Eventos: tabela, permissões, log e pasta de fotos.
--  Rode depois de schema.sql e log.sql. Pode rodar de novo sem problema.
-- =====================================================================
create table if not exists public.eventos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (char_length(nome) between 2 and 80),
  descricao   text not null default '' check (char_length(descricao) <= 500),
  inicio      timestamptz,                  -- vazio = data a definir
  local       text not null default '' check (char_length(local) <= 120),
  link        text check (link is null or (link ~ '^https://' and char_length(link) <= 300)),
  foto        text check (foto is null or char_length(foto) <= 300),
  ordem       int  not null default 0,
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.eventos alter column inicio drop not null;

drop trigger if exists trg_atualizado on public.eventos;
create trigger trg_atualizado before update on public.eventos for each row execute function public.tocar_atualizado();
drop trigger if exists trg_log on public.eventos;
create trigger trg_log after insert or update or delete on public.eventos for each row execute function public.registrar_log();

alter table public.eventos enable row level security;
drop policy if exists "leitura publica" on public.eventos;
drop policy if exists "equipe le tudo" on public.eventos;
drop policy if exists "equipe insere" on public.eventos;
drop policy if exists "equipe altera" on public.eventos;
drop policy if exists "equipe exclui" on public.eventos;
create policy "leitura publica" on public.eventos for select to anon, authenticated using (ativo);
create policy "equipe le tudo" on public.eventos for select to authenticated using (public.pode_editar());
create policy "equipe insere" on public.eventos for insert to authenticated with check (public.pode_editar());
create policy "equipe altera" on public.eventos for update to authenticated using (public.pode_editar()) with check (public.pode_editar());
create policy "equipe exclui" on public.eventos for delete to authenticated using (public.pode_editar());
grant select on public.eventos to anon;
grant select, insert, update, delete on public.eventos to authenticated;

-- libera a pasta "eventos" no bucket de imagens
drop policy if exists "imagens: equipe envia" on storage.objects;
create policy "imagens: equipe envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'imagens' and public.pode_editar()
              and (storage.foldername(name))[1] in ('barbeiros','cortes','cafe','loja','eventos'));

-- ---------------------------------------------------------------------
-- Eventos iniciais. O Networking é real; os dois próximos são EXEMPLOS:
-- edite datas e textos pelo painel ou exclua.
-- ---------------------------------------------------------------------
delete from public.eventos where foto like 'img/eventos/%';
insert into public.eventos (nome, descricao, inicio, local, link, foto) values
  ('Black White Networking', 'Um dia inteiro de networking com empresários renomados, palestras e conexões que viram negócio.',
   '2026-11-08 09:00-03', 'Rampa Hub Quartier · Pelotas', 'https://dravanz.github.io/blackwhite-evento/', 'img/eventos/networking.webp'),
  ('Café & Barba', 'Manhã de café especial e barba feita na navalha. Vagas limitadas.',
   '2026-11-29 09:00-03', 'Barbearia BlackWhite', null, 'img/eventos/cafe-e-barba.webp'),
  ('Noite do Degradê', 'Uma noite de cortes, música e brindes. Chega cedo.',
   '2026-12-13 19:00-03', 'Barbearia BlackWhite', null, 'img/eventos/noite-do-degrade.webp');
