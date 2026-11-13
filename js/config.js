// =====================================================================
//  Configuração do site. Preencha depois de criar o projeto no Supabase
//  (Project Settings > API). A chave "anon" é pública por natureza:
//  a segurança vem das regras do banco (supabase/schema.sql), não dela.
//  NUNCA coloque aqui a chave "service_role".
// =====================================================================
window.SITE_CONFIG = {
  supabaseUrl: "https://ytzuunjbstfvzgbohets.supabase.co",
  supabaseAnonKey: "sb_publishable_nfO0L20qYw-IaUHXaLrIKw_3foedsnW", // chave publishable (pública)

  // Nomes exibidos no site
  marca: { a: "Black", b: "White" },
  barbearia: "Barbearia",
  cafe: "Café",
  loja: "Loja",

  // Agenda online (Booksy). Abre dentro do site no botão "Agendar horário".
  booksy: "https://booksy.com/pt-br/instant-experiences/widget/399419",

  // Tempo máximo de sessão do painel (o banco também confere isso)
  sessaoMinutos: 15,
};
