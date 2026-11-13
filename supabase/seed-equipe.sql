-- Equipe copiada do Booksy da Barbearia BlackWhite (13/11/2026).
-- Cole no Supabase: SQL Editor > New query > Run. Pode rodar de novo: apaga e recria só estes nomes.
-- As frases ficam em branco: preencha pelo painel (aba Barbeiros > Editar).
delete from public.barbeiros where nome in ('Maurício Samuel', 'Henry', 'Luan Bueno', 'Robert Camargo Borges', 'Marlaine Amaral');
insert into public.barbeiros (nome, frase, foto, ordem, ativo) values
  ('Robert Camargo Borges', '', 'img/barbeiros/robert-camargo-borges.webp', 0, true),
  ('Maurício Samuel', '', 'img/barbeiros/mauricio-samuel.webp', 10, true),
  ('Henry', '', 'img/barbeiros/henry.webp', 20, true),
  ('Luan Bueno', '', 'img/barbeiros/luan-bueno.webp', 30, true),
  ('Marlaine Amaral', '', 'img/barbeiros/marlaine-amaral.webp', 40, true);
