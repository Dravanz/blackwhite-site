// Dados de exemplo: aparecem só enquanto o Supabase não estiver configurado (js/config.js).
window.DEMO = {
  barbeiros: [
    { id: "b1", nome: "Rafa", frase: "Degradê é ciência, navalha é arte.", instagram: "barbearia" },
    { id: "b2", nome: "Léo", frase: "Barba alinhada muda o dia inteiro.", instagram: null },
    { id: "b3", nome: "Duda", frase: "Cada cliente sai com a sua assinatura.", instagram: null },
    { id: "b4", nome: "Thiago", frase: "Clássico nunca sai de moda.", instagram: null },
  ],
  cortes: [
    { id: "c1", nome: "Degradê navalhado", descricao: "Fade baixo com acabamento na navalha.", preco: 45, duracao_min: 40, destaque: true },
    { id: "c2", nome: "Social clássico", descricao: "Tesoura e máquina, alinhado e discreto.", preco: 40, duracao_min: 30 },
    { id: "c3", nome: "Barba completa", descricao: "Toalha quente, navalha e hidratação.", preco: 35, duracao_min: 30 },
    { id: "c4", nome: "Corte + barba", descricao: "O combo da casa.", preco: 70, duracao_min: 60 },
    { id: "c5", nome: "Freestyle", descricao: "Desenho exclusivo na navalha.", preco: 55, duracao_min: 50 },
    { id: "c6", nome: "Platinado", descricao: "Descoloração com matização.", preco: 120, duracao_min: 120 },
  ],
  cafe_itens: [
    { id: "f1", nome: "Espresso", descricao: "Grão especial, torra média.", categoria: "Cafés", preco: 7, disponivel: true },
    { id: "f2", nome: "Cappuccino", descricao: "Espresso, leite vaporizado e cacau.", categoria: "Cafés", preco: 12, disponivel: true, destaque: true },
    { id: "f3", nome: "Cold brew", descricao: "Extração a frio por 16 horas.", categoria: "Gelados", preco: 14, disponivel: true },
    { id: "f4", nome: "Pão de queijo", descricao: "Porção com 6 unidades.", categoria: "Salgados", preco: 10, disponivel: true },
    { id: "f5", nome: "Brownie", descricao: "Com nozes.", categoria: "Doces", preco: 11, disponivel: false },
    { id: "f6", nome: "Chopp artesanal", descricao: "Pilsen 300 ml.", categoria: "Bebidas", preco: 16, disponivel: true },
  ],
  produtos: [
    { id: "p1", nome: "Camiseta Black", descricao: "Algodão 30.1 penteado, estampa frente.", categoria: "Camisetas", preco: 89.9, preco_promo: 69.9, promo_ate: new Date(Date.now() + 3 * 864e5).toISOString(), tamanhos: ["P","M","G","GG"], destaque: true, selo: "Mais vendida" },
    { id: "p2", nome: "Boné aba curva", descricao: "Bordado frontal, regulável.", categoria: "Acessórios", preco: 79.9, tamanhos: ["Único"], selo: "Novo" },
    { id: "p3", nome: "Moletom White", descricao: "Flanelado, capuz forrado.", categoria: "Moletons", preco: 189.9, tamanhos: ["M","G"], selo: "Últimas peças" },
    { id: "p4", nome: "Pomada matte", descricao: "Fixação forte, efeito seco.", categoria: "Cuidados", preco: 49.9, preco_promo: 39.9, tamanhos: [] },
    { id: "p5", nome: "Camiseta White", descricao: "Algodão, estampa costas.", categoria: "Camisetas", preco: 89.9, tamanhos: ["P","M"], esgotado: true },
  ],
  eventos: [
    { id: "e1", nome: "Black White Networking", descricao: "Um dia inteiro de networking com empresários renomados.", inicio: "2026-11-08T09:00:00-03:00", local: "Rampa Hub Quartier · Pelotas", link: "https://dravanz.github.io/blackwhite-evento/", foto: "img/eventos/networking.webp" },
    { id: "e2", nome: "Café & Barba", descricao: "Manhã de café especial e barba na navalha.", inicio: "2026-11-29T09:00:00-03:00", local: "Barbearia BlackWhite", foto: "img/eventos/cafe-e-barba.webp" },
    { id: "e4", nome: "Workshop de barba", descricao: "Em planejamento.", inicio: null, local: "Barbearia BlackWhite" },
    { id: "e3", nome: "Noite do Degradê", descricao: "Cortes, música e brindes.", inicio: "2026-12-13T19:00:00-03:00", local: "Barbearia BlackWhite", foto: "img/eventos/noite-do-degrade.webp" },
  ],
  config: { whatsapp: "", instagram: "", endereco: "Seu endereço aqui", horario: "Ter a sáb · 9h às 20h" },
};
