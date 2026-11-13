# Passo a passo para colocar no ar

Tempo estimado: 30 a 40 minutos, uma vez só.

## 1. Supabase (banco, login e imagens)

1. Crie uma conta em <https://supabase.com> e clique em **New project**.
   - Região: **South America (São Paulo)**.
   - Guarde a senha do banco num gerenciador de senhas (não vai no site).
2. Abra **SQL Editor → New query**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
   Depois faça o mesmo com `supabase/log.sql` (log de alterações que só o admin vê no painel).
3. Ainda no SQL Editor, cadastre o dono como primeiro admin (troque o e-mail):
   ```sql
   insert into public.equipe_admin (email, papel) values ('dono@gmail.com', 'admin');
   ```
4. **Desligue o login por e-mail/senha**: *Authentication → Sign In / Providers → Email* → desativar. Só o Google fica ligado.
5. Copie a **URL do projeto** (*Project Settings → Data API*, ou botão **Connect** na tela inicial) e a chave **publishable** (`sb_publishable_...`) ou **anon** (aba *Legacy*) em *Project Settings → API Keys*. Cole em `js/config.js`.
   > Nunca use a chave `secret` / `service_role` no site.

> A sessão de 15 minutos é garantida pelo banco (função `papel_atual()` no SQL) e pelo painel, que desloga sozinho. Não é preciso mudar o tempo do token no painel do Supabase.

## 2. Google (login OAuth)

1. Acesse <https://console.cloud.google.com>, crie um projeto (ex.: "Barbearia site").
2. **APIs e serviços → Tela de consentimento OAuth**: tipo *Externo*, preencha nome e e-mail de suporte. Pode deixar em **Testando**: em *Público → Usuários de teste* adicione o e-mail Google de cada pessoa da equipe (só eles conseguem logar, o que é uma camada extra de segurança).
3. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
   - *URIs de redirecionamento autorizados*: `https://SEU-PROJETO.supabase.co/auth/v1/callback`
4. Copie o **Client ID** e o **Client secret**.
5. No Supabase: *Authentication → Sign In / Providers → Google* → ative, cole os dois valores e salve.
6. No Supabase: *Authentication → URL Configuration*:
   - **Site URL**: `https://dravanz.github.io/blackwhite-site/` (ou o domínio próprio)
   - **Redirect URLs**: adicione `https://dravanz.github.io/blackwhite-site/admin.html`
     (e `http://localhost:3000/admin.html` se for testar localmente)

## 3. GitHub Pages (site)

1. No repositório: *Settings → Pages → Build and deployment → Deploy from a branch* → `main` / `(root)`.
2. Em alguns minutos o site fica em `https://dravanz.github.io/blackwhite-site/`.
3. **Keep-alive** (evita que o Supabase grátis pause por inatividade): *Settings → Secrets and variables → Actions → Variables* → crie `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os mesmos valores do `js/config.js`.

### Domínio próprio (opcional)

Registre no Registro.br, crie um registro `CNAME` apontando para `dravanz.github.io`
e informe o domínio em *Settings → Pages → Custom domain* (marque **Enforce HTTPS**).
Depois atualize **Site URL** e **Redirect URLs** no Supabase.

## 4. Primeiro acesso

1. Abra `/admin.html`, clique em **Entrar com Google** com o e-mail cadastrado no passo 1.3.
2. Na aba **Informações**, preencha WhatsApp, Instagram, endereço e horário.
3. Para liberar gerentes: no Supabase, *Table Editor → equipe_admin → Insert row* (e-mail em minúsculas, papel `gerente`). Também adicione o e-mail em *Usuários de teste* no Google.
4. Cadastre cortes, barbeiros, itens do café e produtos.

## Limites do plano grátis (Supabase Free)

- 500 MB de banco (sobra muito para esse uso).
- 1 GB de imagens (as fotos são otimizadas para ~150–300 KB, então cabem milhares).
- 5 GB de tráfego por mês.
- Pausa após 7 dias sem acesso (resolvido pelo keep-alive).

Se um dia passar disso, o plano Pro custa US$ 25/mês, ou dá para migrar para o servidor próprio.
