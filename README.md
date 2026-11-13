# Site da barbearia · café · loja

Site com três seções no mesmo endereço (Barbearia, Café e Loja) e um painel
administrativo para o dono e os gerentes editarem tudo pelo celular.

- **Barbearia** (`barbearia.html`): portfólio de cortes com foto, nome, valor e duração, e a equipe de barbeiros com uma frase de cada um.
- **Café** (`cafe.html`): cardápio por categoria, com itens em destaque e "esgotado hoje".
- **Loja** (`loja.html`): produtos com destaque grande no topo, preço promocional com % OFF, contagem regressiva da promoção, selos ("Novo", "Últimas peças"), tamanhos e botão "Quero este" direto para o WhatsApp.
- **Painel** (`admin.html`): login com Google, sessão de 15 minutos, cadastro/edição/exclusão com envio de fotos.

Visual baseado no site do evento Black White.

## Como funciona

| Parte | Serviço | Custo |
|---|---|---|
| Site (HTML/CSS/JS estático) | GitHub Pages | grátis |
| Banco de dados, login (OAuth Google) e imagens | Supabase (plano Free) | grátis |
| Domínio próprio (opcional) | Registro.br | ~R$ 40/ano |

Não há servidor próprio para manter. Toda a regra de segurança fica no banco
(Row Level Security), então mesmo quem copiar o código do site não consegue
alterar nada.

## Segurança

- **Login só via OAuth (Google)**, fluxo PKCE. Nenhuma senha passa pelo site.
- **Lista de acesso por e-mail** (`equipe_admin`) com dois papéis: `admin` (tudo, inclusive acessos e informações) e `gerente` (conteúdo).
- **Sessão de 15 minutos conferida no servidor**: a função `papel_atual()` recusa qualquer sessão criada há mais de 15 min, mesmo que o token seja renovado. O painel também não renova o token e desloga sozinho, guardando a sessão só no `sessionStorage` (some ao fechar a aba).
- **Row Level Security** em todas as tabelas: o público só lê itens visíveis; insert/update/delete exigem papel válido.
- **Validação dupla**: no formulário e no banco (limites de tamanho, preço ≥ 0, promo < preço, formato de Instagram, etc.).
- **Upload seguro**: bucket aceita só JPG/PNG/WebP até 3 MB, só em pastas conhecidas, só para a equipe. As fotos são convertidas para WebP no navegador, o que remove os dados de GPS/EXIF.
- **Sem XSS**: todo texto vindo do banco entra com `textContent`, nunca `innerHTML`; caminhos de imagem são validados por regex.
- **Content Security Policy** restritiva em todas as páginas (sem scripts de terceiros; a biblioteca do Supabase fica em `js/vendor/`).
- Painel com `noindex` e bloqueado no `robots.txt`.

## Rodar localmente

Qualquer servidor estático serve. Sem configurar o Supabase, o site abre em
**modo demonstração** com conteúdo de exemplo.

```bash
npx serve .        # ou: python -m http.server 8080
```

## Colocar no ar

Siga o passo a passo em [SETUP.md](SETUP.md).

## Estrutura

```
index.html  barbearia.html  cafe.html  loja.html  admin.html
css/styles.css   css/admin.css
js/config.js     ← URL e chave anon do Supabase
js/site.js       ← site público
js/admin.js      ← painel
js/demo.js       ← conteúdo de exemplo (modo demonstração)
js/vendor/supabase.js
supabase/schema.sql  ← tabelas, regras de segurança e bucket
.github/workflows/supabase-keepalive.yml
```
