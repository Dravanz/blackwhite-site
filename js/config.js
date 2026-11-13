// =====================================================================
//  Configuração do site. Preencha depois de criar o projeto no Supabase
//  (Project Settings > API). A chave "anon" é pública por natureza:
//  a segurança vem das regras do banco (supabase/schema.sql), não dela.
//  NUNCA coloque aqui a chave "service_role".
// =====================================================================
window.SITE_CONFIG = {
  supabaseUrl: "",      // ex.: "https://abcdefgh.supabase.co"
  supabaseAnonKey: "",  // ex.: "eyJhbGciOi..."

  // Nomes exibidos no site
  marca: { a: "Black", b: "White" },
  barbearia: "Barbearia",
  cafe: "Café",
  loja: "Loja",

  // Tempo máximo de sessão do painel (o banco também confere isso)
  sessaoMinutos: 15,
};
