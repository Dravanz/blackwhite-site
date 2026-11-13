// =====================================================================
//  Painel administrativo
//  Segurança em camadas:
//   1. Login só por OAuth (Google), fluxo PKCE, sem senha guardada aqui.
//   2. Sessão fica no sessionStorage (some ao fechar a aba) e NÃO é
//      renovada: após 15 min o painel desloga e pede login de novo.
//   3. O banco confere sozinho (RLS) se o e-mail está na equipe e se a
//      sessão tem menos de 15 min. Mesmo burlando esta tela, nada muda.
//   4. Imagens são redimensionadas e convertidas para WebP antes do envio
//      (remove dados de GPS/EXIF das fotos e economiza espaço).
// =====================================================================
(function () {
  "use strict";
  const C = window.SITE_CONFIG;
  const $ = (id) => document.getElementById(id);
  const MAX_MIN = C.sessaoMinutos || 15;

  if (!C.supabaseUrl || !C.supabaseAnonKey) {
    $("login-msg").textContent = "Supabase ainda não configurado: preencha js/config.js (veja SETUP.md).";
    $("login-msg").classList.add("is-err");
    $("btn-google").disabled = true;
    return;
  }

  const db = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, {
    auth: { flowType: "pkce", autoRefreshToken: false, persistSession: true, detectSessionInUrl: true, storage: window.sessionStorage },
  });

  // ---------- utilitários ----------
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const brl = (n) => n == null || n === "" ? "" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const SAFE_PATH = /^(barbeiros|cortes|cafe|loja)\/[A-Za-z0-9_-]+\.(webp|jpe?g|png)$/;
  const imgUrl = (p) => p && SAFE_PATH.test(p) ? db.storage.from("imagens").getPublicUrl(p).data.publicUrl : null;
  let toastT;
  const toast = (msg, err) => { const t = $("toast"); t.textContent = msg; t.className = "toast show" + (err ? " err" : ""); clearTimeout(toastT); toastT = setTimeout(() => t.className = "toast", 3200); };
  const friendly = (e) => {
    const m = (e && (e.message || e.error_description)) || String(e);
    if (/row-level security|permission denied|42501|Unauthorized|JWT/i.test(m)) return "Sem permissão ou sessão expirada. Entre de novo.";
    if (/check constraint/i.test(m)) return "Algum campo está fora do permitido (tamanho ou valor). Confira e tente de novo.";
    return m;
  };

  // ---------- definição das seções ----------
  const CATS_CAFE = ["Cafés", "Gelados", "Chás", "Bebidas", "Salgados", "Doces"];
  const CATS_LOJA = ["Camisetas", "Moletons", "Calças", "Bermudas", "Bonés", "Acessórios", "Cuidados"];
  const TABS = {
    cortes: { label: "Cortes", table: "cortes", folder: "cortes", sub: (r) => [brl(r.preco), r.duracao_min && r.duracao_min + " min"].filter(Boolean).join(" · "),
      flags: (r) => [["Destaque", r.destaque]],
      fields: [
        { k: "foto", t: "image", label: "Foto do corte" },
        { k: "nome", t: "text", label: "Nome", req: true, max: 60 },
        { k: "descricao", t: "textarea", label: "Descrição", max: 300 },
        { k: "preco", t: "money", label: "Valor (R$)", req: true },
        { k: "duracao_min", t: "int", label: "Duração (min)", min: 5, max: 600 },
        { k: "ordem", t: "int", label: "Ordem de exibição", hint: "Menor aparece primeiro" },
        { k: "destaque", t: "bool", label: "Destaque" },
        { k: "ativo", t: "bool", label: "Visível no site", def: true },
      ] },
    barbeiros: { label: "Barbeiros", table: "barbeiros", folder: "barbeiros", sub: (r) => r.frase,
      fields: [
        { k: "foto", t: "image", label: "Foto" },
        { k: "nome", t: "text", label: "Nome", req: true, max: 60 },
        { k: "frase", t: "textarea", label: "Frase curta", max: 160 },
        { k: "instagram", t: "text", label: "Instagram (sem @)", max: 30, pattern: /^[A-Za-z0-9._]*$/ },
        { k: "ordem", t: "int", label: "Ordem de exibição" },
        { k: "ativo", t: "bool", label: "Visível no site", def: true },
      ] },
    cafe: { label: "Café", table: "cafe_itens", folder: "cafe", sub: (r) => `${r.categoria} · ${brl(r.preco)}`,
      flags: (r) => [["Destaque", r.destaque], ["Esgotado", r.disponivel === false]],
      fields: [
        { k: "foto", t: "image", label: "Foto (opcional)" },
        { k: "nome", t: "text", label: "Nome", req: true, max: 60 },
        { k: "descricao", t: "textarea", label: "Descrição", max: 300 },
        { k: "categoria", t: "select", label: "Categoria", opts: CATS_CAFE, def: "Cafés", free: true },
        { k: "preco", t: "money", label: "Valor (R$)", req: true },
        { k: "ordem", t: "int", label: "Ordem de exibição" },
        { k: "destaque", t: "bool", label: "Destaque (★)" },
        { k: "disponivel", t: "bool", label: "Disponível hoje", def: true },
        { k: "ativo", t: "bool", label: "Visível no site", def: true },
      ] },
    loja: { label: "Loja", table: "produtos", folder: "loja",
      sub: (r) => `${r.categoria} · ${r.preco_promo != null ? brl(r.preco_promo) + " (de " + brl(r.preco) + ")" : brl(r.preco)}`,
      flags: (r) => [["Destaque", r.destaque], ["Promo", r.preco_promo != null], ["Esgotado", r.esgotado]],
      fields: [
        { k: "foto", t: "image", label: "Foto do produto" },
        { k: "nome", t: "text", label: "Nome", req: true, max: 80 },
        { k: "descricao", t: "textarea", label: "Descrição", max: 500 },
        { k: "categoria", t: "select", label: "Categoria", opts: CATS_LOJA, def: "Camisetas", free: true },
        { k: "preco", t: "money", label: "Preço normal (R$)", req: true },
        { k: "preco_promo", t: "money", label: "Preço promocional (R$)", hint: "Deixe vazio se não estiver em promoção. Mostra o selo de % OFF." },
        { k: "promo_ate", t: "datetime", label: "Promoção termina em", hint: "Opcional. Mostra contagem regressiva e encerra sozinha." },
        { k: "tamanhos", t: "tags", label: "Tamanhos", hint: "Separados por vírgula: P, M, G, GG" },
        { k: "selo", t: "select", label: "Selo", opts: ["", "Novo", "Mais vendido", "Últimas peças", "Exclusivo", "Lançamento"], free: true, max: 24 },
        { k: "ordem", t: "int", label: "Ordem de exibição" },
        { k: "destaque", t: "bool", label: "Destaque (aparece grande no topo)" },
        { k: "esgotado", t: "bool", label: "Esgotado" },
        { k: "ativo", t: "bool", label: "Visível no site", def: true },
      ] },
    config: { label: "Informações", table: "config", adminOnly: true, key: "chave", kv: true },
    equipe: { label: "Acessos", table: "equipe_admin", adminOnly: true, key: "email", sub: (r) => r.papel,
      flags: (r) => [["Ativo", r.ativo]],
      fields: [
        { k: "email", t: "email", label: "E-mail Google", req: true, lockOnEdit: true },
        { k: "papel", t: "select", label: "Papel", opts: ["gerente", "admin"], def: "gerente", hint: "Gerente edita conteúdo. Admin também gerencia acessos e informações." },
        { k: "ativo", t: "bool", label: "Acesso liberado", def: true },
      ] },
  };
  const CONFIG_KEYS = [["whatsapp", "WhatsApp (com DDD, só números)"], ["instagram", "Instagram (sem @)"], ["endereco", "Endereço"], ["horario", "Horário de funcionamento"]];

  // ---------- sessão ----------
  let papel = null, expiraEm = 0, timerT = null, current = "cortes", rows = [];

  async function sair(msg, deny) {
    clearInterval(timerT);
    await db.auth.signOut().catch(() => {});
    sessionStorage.clear();
    $("panel").hidden = true; $("login").hidden = false;
    if ($("dlg").open) $("dlg").close();
    if (msg) { $("login-msg").textContent = msg; $("login-msg").classList.add("is-err"); $("login-msg").classList.toggle("login__msg--deny", !!deny); }
  }

  function startTimer() {
    clearInterval(timerT);
    const tick = () => {
      const s = Math.max(0, Math.round((expiraEm - Date.now()) / 1000));
      $("timer").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
      $("timer").classList.toggle("is-low", s < 120);
      if (s <= 0) sair("Sua sessão de 15 minutos terminou. Entre de novo.");
    };
    tick(); timerT = setInterval(tick, 1000);
  }

  async function boot() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return;
    const { data, error } = await db.rpc("minha_sessao");
    const info = data && data[0];
    if (error || !info || !info.papel) {
      return sair(error ? friendly(error) : `Você não tem acesso ao painel com a conta ${session.user.email}. Entre em contato com o administrador para liberar o acesso.`, true);
    }
    papel = info.papel;
    const tokenExp = session.expires_at * 1000;
    expiraEm = Math.min(new Date(info.expira_em).getTime(), tokenExp, Date.now() + MAX_MIN * 60000);
    $("who").textContent = `${session.user.email} · ${papel}`;
    $("login").hidden = true; $("panel").hidden = false;
    history.replaceState(null, "", location.pathname);
    buildTabs(); startTimer(); open(current);
  }

  $("btn-google").addEventListener("click", async () => {
    $("btn-google").disabled = true;
    const { error } = await db.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: "select_account" } } });
    if (error) { $("btn-google").disabled = false; $("login-msg").textContent = friendly(error); $("login-msg").classList.add("is-err"); }
  });
  $("btn-sair").addEventListener("click", () => sair("Você saiu do painel."));

  // ---------- abas e lista ----------
  function buildTabs() {
    $("tabs").replaceChildren(...Object.entries(TABS).filter(([, t]) => !t.adminOnly || papel === "admin").map(([id, t]) => {
      const b = h("button", { type: "button", role: "tab", "aria-selected": id === current ? "true" : "false", text: t.label });
      b.addEventListener("click", () => open(id));
      b.dataset.id = id;
      return b;
    }));
  }

  async function open(id) {
    current = id;
    const tab = TABS[id];
    $("tabs").querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b.dataset.id === id ? "true" : "false"));
    $("tab-title").textContent = tab.label;
    $("btn-novo").hidden = !!tab.kv;
    $("rows").replaceChildren(h("p", { class: "empty", text: "Carregando…" }));
    let q = db.from(tab.table).select("*");
    if (!tab.kv && !tab.key) q = q.order("ordem").order("criado_em");
    const { data, error } = await q;
    if (error) { $("rows").replaceChildren(h("p", { class: "empty", text: friendly(error) })); return; }
    rows = data;
    if (tab.kv) return drawConfig();
    $("rows").replaceChildren(...(rows.length ? rows.map((r) => {
      const thumb = imgUrl(r.foto);
      const el = h("button", { type: "button", class: "row" + (r.ativo === false ? " is-off" : "") },
        h("span", { class: "row__img" }, thumb ? h("img", { src: thumb, alt: "", loading: "lazy" }) : null),
        h("span", {}, h("b", { text: r.nome || r.email }), h("small", { text: tab.sub ? tab.sub(r) || "" : "" })),
        h("span", { class: "row__flags" }, (tab.flags ? tab.flags(r) : []).filter(([, on]) => on).map(([l]) => h("span", { class: "flag flag--on", text: l })),
          r.ativo === false ? h("span", { class: "flag", text: "Oculto" }) : null));
      el.addEventListener("click", () => edit(r));
      return el;
    }) : [h("p", { class: "empty", text: "Nada cadastrado ainda. Clique em + Novo." })]));
  }

  function drawConfig() {
    const map = Object.fromEntries(rows.map((r) => [r.chave, r.valor]));
    const form = h("form", { class: "dlg__body", novalidate: true },
      CONFIG_KEYS.map(([k, label]) => h("label", { class: "f" }, h("span", { text: label }), h("input", { type: "text", name: k, value: map[k] || "", maxlength: "500" }))),
      h("button", { class: "btn btn--light btn--sm", type: "submit", text: "Salvar informações" }));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = CONFIG_KEYS.map(([k]) => ({ chave: k, valor: String(fd.get(k) || "").trim().slice(0, 500) }));
      const bad = payload.find((p) => (p.chave === "whatsapp" && p.valor && !/^\d{10,13}$/.test(p.valor)) || (p.chave === "instagram" && p.valor && !/^[A-Za-z0-9._]{1,30}$/.test(p.valor)));
      if (bad) return toast(bad.chave === "whatsapp" ? "WhatsApp: use só números com DDD, ex.: 5553999998888" : "Instagram inválido", true);
      const { error } = await db.from("config").upsert(payload);
      if (error) return toast(friendly(error), true);
      toast("Informações salvas");
    });
    $("rows").replaceChildren(form);
  }

  // ---------- formulário ----------
  let editing = null, pendingFile = null, removeFoto = false;

  function fieldEl(f, val, isNew) {
    const id = "f_" + f.k;
    if (f.t === "bool") {
      return h("label", { class: "f f--check" }, h("input", { type: "checkbox", id, name: f.k, checked: (val ?? f.def ?? false) ? true : null }), h("span", { text: f.label }));
    }
    let input;
    if (f.t === "textarea") { input = h("textarea", { id, name: f.k, maxlength: f.max }); input.value = val ?? ""; }
    else if (f.t === "select") {
      const opts = [...new Set([...(f.opts || []), ...(val ? [val] : [])])];
      if (f.free) {
        input = h("input", { type: "text", id, name: f.k, list: id + "_l", maxlength: f.max || 40, value: val ?? f.def ?? "" });
        input = [input, h("datalist", { id: id + "_l" }, opts.filter(Boolean).map((o) => h("option", { value: o })))];
      } else {
        input = h("select", { id, name: f.k }, opts.map((o) => h("option", { value: o, text: o || "—", selected: (val ?? f.def) === o ? true : null })));
      }
    }
    else if (f.t === "money") input = h("input", { type: "text", inputmode: "decimal", id, name: f.k, placeholder: "0,00", value: val != null ? String(val).replace(".", ",") : "" });
    else if (f.t === "int") input = h("input", { type: "number", id, name: f.k, step: "1", min: f.min, max: f.max, value: val ?? (f.k === "ordem" ? 0 : "") });
    else if (f.t === "datetime") input = h("input", { type: "datetime-local", id, name: f.k, value: val ? toLocalInput(val) : "" });
    else if (f.t === "tags") input = h("input", { type: "text", id, name: f.k, value: (val || []).join(", ") });
    else if (f.t === "email") input = h("input", { type: "email", id, name: f.k, value: val ?? "", readonly: !isNew && f.lockOnEdit ? true : null, autocomplete: "off" });
    else if (f.t === "image") return imageField(f, val);
    else input = h("input", { type: "text", id, name: f.k, maxlength: f.max, value: val ?? "" });
    return h("label", { class: "f", for: id }, h("span", { text: f.label + (f.req ? " *" : "") }), input, f.hint && h("small", { text: f.hint }));
  }

  function imageField(f, val) {
    const thumb = h("div", { class: "f__thumb" });
    const show = (src) => thumb.replaceChildren(src ? h("img", { src, alt: "" }) : "");
    show(imgUrl(val));
    const file = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp" });
    const rm = h("button", { type: "button", class: "btn btn--sm btn--outline", text: "Remover foto" });
    file.addEventListener("change", () => {
      const fl = file.files[0];
      if (!fl) return;
      if (!/^image\/(jpeg|png|webp)$/.test(fl.type)) { toast("Use JPG, PNG ou WebP", true); file.value = ""; return; }
      if (fl.size > 15 * 1024 * 1024) { toast("Imagem muito grande (máx. 15 MB)", true); file.value = ""; return; }
      pendingFile = fl; removeFoto = false; show(URL.createObjectURL(fl));
    });
    rm.addEventListener("click", () => { pendingFile = null; removeFoto = true; file.value = ""; show(null); });
    return h("div", { class: "f" }, h("span", { text: f.label }), h("div", { class: "f__pic" }, thumb, h("div", { class: "f__pic-btns" }, file, rm)),
      h("small", { text: "A foto é otimizada automaticamente (WebP, até 1600px)." }));
  }

  function toLocalInput(iso) { const d = new Date(iso); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }

  function edit(row) {
    const tab = TABS[current];
    editing = row; pendingFile = null; removeFoto = false;
    $("form-title").textContent = row ? "Editar" : "Novo · " + tab.label;
    $("form-err").textContent = "";
    $("fields").replaceChildren(...tab.fields.map((f) => fieldEl(f, row ? row[f.k] : undefined, !row)));
    $("btn-excluir").hidden = !row;
    $("dlg").showModal();
  }
  $("btn-novo").addEventListener("click", () => edit(null));
  $("btn-fechar").addEventListener("click", () => $("dlg").close());

  function collect() {
    const tab = TABS[current], fd = new FormData($("form")), out = {};
    for (const f of tab.fields) {
      if (f.t === "image") continue;
      let v = fd.get(f.k);
      if (f.t === "bool") { out[f.k] = v === "on"; continue; }
      v = (v ?? "").toString().trim();
      if (f.req && !v) throw new Error(`Preencha: ${f.label}`);
      if (f.max && v.length > f.max) throw new Error(`${f.label}: máximo ${f.max} caracteres`);
      if (f.pattern && v && !f.pattern.test(v)) throw new Error(`${f.label}: formato inválido`);
      if (f.t === "money") {
        if (!v) { out[f.k] = null; continue; }
        const n = Number(v.replace(/\./g, "").replace(",", "."));
        if (!isFinite(n) || n < 0 || n >= 100000) throw new Error(`${f.label}: valor inválido`);
        out[f.k] = Math.round(n * 100) / 100;
      } else if (f.t === "int") {
        if (!v) { out[f.k] = f.k === "ordem" ? 0 : null; continue; }
        const n = parseInt(v, 10);
        if (!Number.isInteger(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) throw new Error(`${f.label}: valor inválido`);
        out[f.k] = n;
      } else if (f.t === "datetime") out[f.k] = v ? new Date(v).toISOString() : null;
      else if (f.t === "tags") out[f.k] = v ? [...new Set(v.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 12).map((s) => s.slice(0, 10)) : [];
      else if (f.t === "email") {
        const e = v.toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error("E-mail inválido");
        out[f.k] = e;
      } else out[f.k] = v || (f.t === "select" && f.k === "selo" ? null : v);
    }
    if ("preco_promo" in out && out.preco_promo != null && out.preco_promo >= out.preco) throw new Error("O preço promocional precisa ser menor que o preço normal");
    if ("instagram" in out && !out.instagram) out.instagram = null;
    return out;
  }

  // Redimensiona e converte para WebP (também remove metadados EXIF/GPS)
  async function toWebp(file) {
    const bmp = await createImageBitmap(file);
    const max = 1600, scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", .82));
    if (!blob || blob.size > 3 * 1024 * 1024) throw new Error("Não foi possível otimizar a imagem. Tente outra foto.");
    return blob;
  }

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const tab = TABS[current], btn = $("btn-salvar");
    $("form-err").textContent = "";
    let data;
    try { data = collect(); } catch (err) { $("form-err").textContent = err.message; return; }
    btn.disabled = true;
    const oldFoto = editing?.foto || null;
    let uploaded = null;
    try {
      if (tab.folder && pendingFile) {
        const blob = await toWebp(pendingFile);
        const path = `${tab.folder}/${crypto.randomUUID()}.webp`;
        const { error } = await db.storage.from("imagens").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
        if (error) throw error;
        uploaded = data.foto = path;
      } else if (tab.folder && removeFoto) data.foto = null;

      const key = tab.key || "id";
      const res = editing
        ? await db.from(tab.table).update(data).eq(key, editing[key]).select()
        : await db.from(tab.table).insert(data).select();
      if (res.error) throw res.error;
      if (!res.data?.length) throw new Error("Sem permissão ou sessão expirada. Entre de novo.");
      if (oldFoto && (uploaded || removeFoto)) await db.storage.from("imagens").remove([oldFoto]);
      $("dlg").close(); toast("Salvo!"); open(current);
    } catch (err) {
      if (uploaded) await db.storage.from("imagens").remove([uploaded]).catch(() => {});
      $("form-err").textContent = friendly(err);
    } finally { btn.disabled = false; }
  });

  $("btn-excluir").addEventListener("click", async () => {
    const tab = TABS[current];
    if (!editing || !confirm(`Excluir "${editing.nome || editing.email}"? Não dá para desfazer.`)) return;
    const key = tab.key || "id";
    const { data, error } = await db.from(tab.table).delete().eq(key, editing[key]).select();
    if (error || !data?.length) { $("form-err").textContent = error ? friendly(error) : "Sem permissão ou sessão expirada."; return; }
    if (editing.foto) await db.storage.from("imagens").remove([editing.foto]).catch(() => {});
    $("dlg").close(); toast("Excluído"); open(current);
  });

  // Se o token expirar ou outra aba sair, volta para o login
  db.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_OUT" && !$("panel").hidden) sair("Sessão encerrada."); });
  boot();
})();
