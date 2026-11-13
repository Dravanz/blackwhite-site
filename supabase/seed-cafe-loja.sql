-- Itens de exemplo para o Café e a Loja (fotos gratuitas do Unsplash, já no site).
-- Preços e textos são provisórios: ajuste tudo pelo painel.
-- Pode rodar de novo: apaga só os itens que usam estas fotos e recria.

delete from public.cafe_itens where foto like 'img/cafe/%';
insert into public.cafe_itens (nome, descricao, categoria, preco, foto, destaque, ordem) values
  ('Espresso',          'Curto, encorpado, grão especial.',              'Cafés',    7.00, 'img/cafe/espresso.webp',       true,  1),
  ('Cappuccino',        'Espresso, leite vaporizado e espuma cremosa.',  'Cafés',   12.00, 'img/cafe/cappuccino.webp',     false, 2),
  ('Café coado',        'Método filtrado, notas suaves.',                'Cafés',    9.00, 'img/cafe/coado.webp',          false, 3),
  ('Cold brew',         'Extração a frio por 16 h, servido com gelo.',   'Gelados', 14.00, 'img/cafe/cold-brew.webp',      false, 4),
  ('Bolo de chocolate', 'Fatia generosa com cobertura de ganache.',      'Doces',   13.00, 'img/cafe/bolo-chocolate.webp', false, 5),
  ('Bolo de pote',      'Camadas de massa e recheio cremoso.',           'Doces',   15.00, 'img/cafe/bolo-pote.webp',      true,  6),
  ('Brownie',           'Denso, com casquinha crocante.',                'Doces',   10.00, 'img/cafe/brownie.webp',        false, 7),
  ('Pastel folhado',    'Massa folhada amanteigada, assada na hora.',    'Salgados', 9.00, 'img/cafe/pastel-folhado.webp', false, 8),
  ('Pão de queijo',     'Porção com 6 unidades quentinhas.',             'Salgados', 8.00, 'img/cafe/pao-queijo.webp',     false, 9);

delete from public.produtos where foto like 'img/loja/%';
insert into public.produtos (nome, descricao, categoria, preco, preco_promo, promo_ate, tamanhos, selo, foto, destaque, ordem) values
  ('Moletom BlackWhite',   'Moletom flanelado, bordado no peito.',     'Moletons',  219.90, null,  null,                       '{P,M,G,GG}', 'Novo',          'img/loja/moletom.webp',         true,  1),
  ('Boné BlackWhite',      'Aba curva, ajuste traseiro.',              'Bonés',      89.90, 69.90, now() + interval '15 days', '{}',         null,            'img/loja/bone.webp',            false, 2),
  ('Camiseta preta',       'Algodão penteado, estampa minimalista.',   'Camisetas',  79.90, null,  null,                       '{P,M,G,GG}', null,            'img/loja/camiseta-preta.webp',  false, 3),
  ('Camiseta branca',      'Algodão penteado, estampa minimalista.',   'Camisetas',  79.90, 64.90, now() + interval '15 days', '{P,M,G,GG}', 'Últimas peças', 'img/loja/camiseta-branca.webp', false, 4),
  ('Pomada modeladora',    'Fixação média, efeito matte.',             'Cuidados',   49.90, null,  null,                       '{}',         null,            'img/loja/pomada.webp',          false, 5),
  ('Óleo para barba',      'Hidrata e perfuma, 30 ml.',                'Cuidados',   44.90, null,  null,                       '{}',         null,            'img/loja/oleo-barba.webp',      false, 6);
