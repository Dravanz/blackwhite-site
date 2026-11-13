-- Serviços copiados do Booksy da Barbearia BlackWhite (13/11/2026).
-- Cole no Supabase: SQL Editor > New query > Run. Pode rodar de novo: apaga e recria só estes itens.
delete from public.cortes where nome in ('Degradê tradicional', 'Cabelo e barba', 'Barba completa', 'Cabelo, barba e sobrancelha', 'Cabelo e sobrancelha', 'Cabelo, sobrancelha e bigode', 'Tesoura', '1 pente no cabelo', '1 pente na barba', 'Zero navalhado', 'Contorno / pezinho', 'Sobrancelha', 'Bigode', 'Promoção dupla: você + amigo', 'Corte unitário promocional', 'Corte e pigmentação', 'Platinado / nevou + corte', 'Luzes / reflexo + corte', 'Platinado / nevou', 'Luzes / reflexo');
insert into public.cortes (nome, descricao, preco, duracao_min, destaque, foto, ordem, ativo) values
  ('Degradê tradicional', '', 45.00, 40, true, 'img/cortes/booksy-1.webp', 0, true),
  ('Cabelo e barba', 'Combo cabelo e barba.', 80.00, 60, true, 'img/cortes/booksy-4.webp', 10, true),
  ('Barba completa', '', 40.00, 20, false, null, 20, true),
  ('Cabelo, barba e sobrancelha', '', 90.00, 50, false, null, 30, true),
  ('Cabelo e sobrancelha', 'Combo cabelo e sobrancelha.', 60.00, 50, false, null, 40, true),
  ('Cabelo, sobrancelha e bigode', '', 65.00, 45, false, null, 50, true),
  ('Tesoura', '', 50.00, 40, false, null, 60, true),
  ('1 pente no cabelo', '', 35.00, 20, false, null, 70, true),
  ('1 pente na barba', '', 70.00, 30, false, null, 80, true),
  ('Zero navalhado', '', 35.00, 30, false, null, 90, true),
  ('Contorno / pezinho', '', 20.00, 10, false, null, 100, true),
  ('Sobrancelha', '', 20.00, 10, false, null, 110, true),
  ('Bigode', '', 15.00, 30, false, null, 120, true),
  ('Promoção dupla: você + amigo', 'Segunda e terça: trazendo um amigo, cada um paga só R$ 35.', 70.00, 90, true, null, 130, true),
  ('Corte unitário promocional', 'Promoção de segunda e terça.', 40.00, 40, false, null, 140, true),
  ('Corte e pigmentação', '', 85.00, 60, false, null, 150, true),
  ('Platinado / nevou + corte', '', 180.00, 190, false, null, 160, true),
  ('Luzes / reflexo + corte', '', 180.00, 190, false, null, 170, true),
  ('Platinado / nevou', '', 150.00, 150, false, null, 180, true),
  ('Luzes / reflexo', '', 150.00, 150, false, null, 190, true);
