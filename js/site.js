// =====================================================================
//  Site público: carrega os dados e desenha cada seção.
//  Todo texto vindo do banco entra via textContent (nunca innerHTML),
//  então não há como injetar HTML/JS pelo painel.
// =====================================================================
(function () {
  "use strict";
  const C = window.SITE_CONFIG;
  const LIVE = !!(C.supabaseUrl && C.supabaseAnonKey);
  const db = LIVE ? window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey, { auth: { persistSession: false } }) : null;
  const page = document.body.dataset.page;

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
  const icon = (id) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("aria-hidden", "true"); const u = document.createElementNS("http://www.w3.org/2000/svg", "use"); u.setAttribute("href", "#" + id); s.append(u); return s; };
  const brl = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const SAFE_PATH = /^(barbeiros|cortes|cafe|loja|eventos)\/[A-Za-z0-9_-]+\.(webp|jpe?g|png)$/;
  const LOCAL_PATH = /^img\/(barbeiros|cortes|cafe|loja|eventos)\/[a-z0-9-]+\.webp$/; // fotos guardadas no próprio site
  const imgUrl = (p) => !p ? null : LOCAL_PATH.test(p) ? p : (LIVE && SAFE_PATH.test(p)) ? `${C.supabaseUrl}/storage/v1/object/public/imagens/${p}` : null;
  const pic = (path, alt, letter) => {
    const box = h("div", { class: "item__img" });
    const src = imgUrl(path);
    if (src) box.append(h("img", { src, alt, loading: "lazy", decoding: "async" }));
    else box.append(h("span", { class: "item__ph", "aria-hidden": "true", text: (letter || alt || "·").charAt(0) }));
    return box;
  };

  async function load(table, order = "ordem") {
    if (!LIVE) return (window.DEMO[table] || []).map((r) => ({ ativo: true, ...r }));
    const { data, error } = await db.from(table).select("*").eq("ativo", true).order(order).order("criado_em");
    if (error) { console.error(table, error.message); return []; }
    return data;
  }
  async function loadConfig() {
    if (!LIVE) return window.DEMO.config;
    const { data } = await db.from("config").select("chave, valor");
    return Object.fromEntries((data || []).map((r) => [r.chave, r.valor]));
  }

  // ---------- layout comum ----------
  function navBar() {
    const links = [["./", C.barbearia, "barbearia"], ["cafe.html", C.cafe, "cafe"], ["loja.html", C.loja, "loja"], ["eventos.html", C.eventos || "Eventos", "eventos"]];
    const brand = () => h("a", { href: "./", class: "brand", "aria-label": "Início" }, h("i", { "aria-hidden": "true" }), C.marca.a, h("b", { text: " " + C.marca.b }));
    const nav = h("header", { class: "nav" },
      h("div", { class: "wrap nav__in" }, brand(),
        h("a", { href: "admin.html", class: "btn btn--line nav__login", rel: "nofollow", text: "Entrar" })));
    const tabs = h("nav", { class: "tabbar", "aria-label": "Seções" }, links.map(([href, label, id]) => h("a", { href, "aria-current": page === id ? "page" : null, text: label })));
    document.body.prepend(nav, tabs);
    const solid = () => nav.classList.toggle("solid", scrollY > 40);
    addEventListener("scroll", solid, { passive: true }); solid();

  }

  // Agenda do Booksy numa janela por cima do site (carrega só quando abre)
  let agendaDlg = null;
  function agenda(url) {
    if (!agendaDlg) {
      // sandbox SEM "allow-top-navigation": o Booksy não consegue trocar a página inteira
      // (era isso que tirava o cliente do site e sumia com os botões).
      // Logins com Google/Facebook abrem em janela própria (allow-popups).
      const frame = h("iframe", { class: "book__frame", title: "Agenda online", loading: "lazy", referrerpolicy: "strict-origin-when-cross-origin", allow: "payment",
        sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals" });
      const close = h("button", { class: "book__x", type: "button", "aria-label": "Fechar" }, "×");
      agendaDlg = h("dialog", { class: "book", "aria-label": "Agendar horário" },
        h("div", { class: "book__bar" }, h("b", { text: "Agendar horário" }),
          h("a", { href: url, target: "_blank", rel: "noopener noreferrer", class: "book__ext", text: "Abrir em nova aba" }), close),
        h("p", { class: "book__tip", text: "Terminou o agendamento? É só fechar no ×. Se o login do Booksy não abrir aqui, use “Abrir em nova aba”." }),
        frame);
      close.addEventListener("click", () => agendaDlg.close());
      agendaDlg.addEventListener("click", (e) => { if (e.target === agendaDlg) agendaDlg.close(); });
      agendaDlg.addEventListener("close", () => { document.documentElement.classList.remove("lock"); frame.src = url; });
      document.body.append(agendaDlg);
      frame.src = url;
    }
    if (typeof agendaDlg.showModal !== "function") { window.open(url, "_blank", "noopener"); return; }
    document.documentElement.classList.add("lock");
    agendaDlg.showModal();
  }

  function chrome(cfg) {
    const wa = (cfg.whatsapp || "").replace(/\D/g, "");
    const ig = (cfg.instagram || "").replace(/[^A-Za-z0-9._]/g, "");
    const foot = h("footer", { class: "foot" },
      h("p", { class: "foot__big", "aria-hidden": "true", text: `${C.marca.a} ${C.marca.b}` }),
      h("div", { class: "wrap" },
        h("div", { class: "foot__info" }, cfg.endereco && h("span", { text: cfg.endereco }), cfg.horario && h("span", { text: cfg.horario })),
        h("div", { class: "foot__links" },
          wa && h("a", { href: `https://wa.me/${wa}`, target: "_blank", rel: "noopener noreferrer" }, icon("wa"), "WhatsApp"),
          ig && h("a", { href: `https://instagram.com/${ig}`, target: "_blank", rel: "noopener noreferrer" }, icon("ig"), "@" + ig))));
    document.body.append(foot);
    if (!LIVE) foot.querySelector(".wrap").prepend(h("p", { class: "notice", text: "Modo demonstração: conteúdo de exemplo. Preencha js/config.js com os dados do Supabase para usar o conteúdo real." }));

    const cta = document.getElementById("cta");
    const booksy = /^https:\/\/([a-z0-9-]+\.)?booksy\.com\//.test(C.booksy || "") ? C.booksy : null;
    if (cta && page === "barbearia" && booksy) {
      const open = h("button", { class: "btn btn--brass", type: "button" }, "Agendar horário", icon("arrow"));
      open.addEventListener("click", () => agenda(booksy));
      const extra = wa && h("a", { class: "btn btn--line", href: `https://wa.me/${wa}`, target: "_blank", rel: "noopener noreferrer" }, icon("wa"), "WhatsApp");
      cta.prepend(...[open, extra].filter(Boolean));
      const head = document.querySelector("#cortes-sec .sec-head");
      if (head) { const b2 = h("button", { class: "btn btn--line btn--sm", type: "button" }, "Agendar", icon("arrow")); b2.addEventListener("click", () => agenda(booksy)); head.append(b2); }
    } else if (cta && wa) {
      const msg = { barbearia: "Olá! Quero agendar um horário.", cafe: "Olá! Quero fazer um pedido.", loja: "Olá! Quero saber mais sobre os produtos.", eventos: "Olá! Quero saber dos próximos eventos." }[page];
      cta.prepend(h("a", { class: "btn btn--brass", href: `https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, target: "_blank", rel: "noopener noreferrer" }, icon("wa"),
        page === "barbearia" ? "Agendar horário" : "Chamar no WhatsApp"));
    }
    const info = document.getElementById("info");
    if (info) {
      if (cfg.horario) info.append(h("div", {}, h("b", { text: "Horário" }), cfg.horario));
      if (cfg.endereco) info.append(h("div", {}, h("b", { text: "Endereço" }), cfg.endereco));
    }

    // luz que segue o dedo/mouse no topo (só em telas com mouse)
    const hero = document.querySelector(".hero");
    if (hero && matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let raf = 0;
      hero.addEventListener("pointermove", (e) => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = hero.getBoundingClientRect();
          hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
          hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
        });
      });
    }
  }

  function reveal() {
    const els = document.querySelectorAll(".rv");
    document.querySelectorAll(".grid, .team").forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty("--i", i % 4)));
    if (!("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
    els.forEach((e) => io.observe(e));
  }

  // ---------- "Ver mais": mostra só os primeiros itens para não poluir ----------
  const LIMITE = () => (matchMedia("(min-width: 1000px)").matches ? 12 : 10);
  function verMais(container, items, n = LIMITE(), onToggle) {
    container.parentElement.querySelectorAll(":scope > .more").forEach((b) => b.remove());
    if (items.length <= n) { items.forEach((el) => (el.hidden = false)); onToggle && onToggle(); return; }
    let aberto = false;
    const btn = h("button", { class: "btn btn--line more", type: "button" });
    const apply = () => {
      items.forEach((el, i) => { el.hidden = !aberto && i >= n; if (aberto) el.classList.add("in"); });
      btn.replaceChildren(aberto ? "Ver menos" : `Ver mais (${items.length - n})`, icon(aberto ? "up" : "down"));
      onToggle && onToggle();
    };
    btn.addEventListener("click", () => {
      aberto = !aberto; apply();
      if (!aberto) container.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    container.after(btn); apply();
  }

  // botão "Agendar" de cada corte: abre a agenda do Booksy (ou o WhatsApp, se não houver Booksy)
  function agendarBtn(nome) {
    const booksy = /^https:\/\/([a-z0-9-]+\.)?booksy\.com\//.test(C.booksy || "") ? C.booksy : null;
    if (booksy) {
      const b = h("button", { class: "btn btn--line btn--sm item__cta", type: "button" }, "Agendar", icon("arrow"));
      b.addEventListener("click", () => agenda(booksy));
      return b;
    }
    return quero(`Olá! Quero agendar: ${nome}`, "btn--line btn--sm item__cta", "Agendar");
  }

  // ---------- barbearia ----------
  async function barbearia() {
    const [cortes, equipe] = await Promise.all([load("cortes"), load("barbeiros")]);
    const g = document.getElementById("cortes");
    g.replaceChildren(...(cortes.length ? cortes.map((c, i) => h("article", { class: "item rv" },
      c.destaque && h("span", { class: "tag", text: "Destaque" }),
      (() => { const b = pic(c.foto, c.nome); b.append(h("span", { class: "item__n", text: String(i + 1).padStart(2, "0") })); return b; })(),
      h("div", { class: "item__body" },
        h("h3", { text: c.nome }),
        c.descricao && h("p", { class: "item__desc", text: c.descricao }),
        h("div", { class: "item__meta" }, h("span", { class: "price", text: brl(c.preco) }), c.duracao_min && h("span", { class: "small", text: `${c.duracao_min} min` })),
        agendarBtn(c.nome)))) : [h("p", { class: "empty", text: "Em breve" })]));

    if (cortes.length) verMais(g, [...g.children]);

    const t = document.getElementById("equipe");
    t.replaceChildren(...(equipe.length ? equipe.map((b) => h("figure", { class: "member rv" },
      pic(b.foto, b.nome),
      h("figcaption", {}, h("b", { text: b.nome }), b.frase && h("q", { text: b.frase }),
        b.instagram && h("a", { href: `https://instagram.com/${b.instagram}`, target: "_blank", rel: "noopener noreferrer" }, icon("ig"), "@" + b.instagram)))) : [h("p", { class: "empty", text: "Em breve" })]));
  }

  // botão "Quero este" que abre o WhatsApp com o nome do item
  function quero(texto, cls, label = "Quero este") {
    const wa = (window.__cfg?.whatsapp || "").replace(/\D/g, "");
    if (!wa) return null;
    return h("a", { class: "btn " + cls, href: `https://wa.me/${wa}?text=${encodeURIComponent(texto)}`, target: "_blank", rel: "noopener noreferrer" }, label, icon("arrow"));
  }

  // ---------- café ----------
  async function cafe() {
    const itens = await load("cafe_itens");
    const cats = [...new Set(itens.map((i) => i.categoria))];
    const chips = document.getElementById("cats");
    const box = document.getElementById("cardapio");
    const draw = (only) => {
      box.replaceChildren(...cats.filter((c) => !only || c === only).map((cat) => h("section", { class: "menu-cat rv in" },
        h("h3", { text: cat }),
        itens.filter((i) => i.categoria === cat).map((i) => h("div", { class: "menu-row" + (i.disponivel === false ? " is-off" : "") },
          h("div", { class: "menu-row__img" }, imgUrl(i.foto) ? h("img", { src: imgUrl(i.foto), alt: "", loading: "lazy" }) : null),
          h("div", {}, h("b", { text: (i.destaque ? "★ " : "") + i.nome }), i.descricao && h("span", { text: i.descricao })),
          h("div", { class: "menu-row__end" }, h("span", { class: "price", text: brl(i.preco) }),
            i.disponivel !== false && quero(`Olá! Quero pedir: ${i.nome} (${brl(i.preco)})`, "btn--line btn--xs")))))));
      if (!itens.length) return box.replaceChildren(h("p", { class: "empty", text: "Cardápio em breve" }));
      // em "Tudo" mostra só os primeiros itens; ao escolher uma categoria mostra todos
      const rows = [...box.querySelectorAll(".menu-row")];
      const syncCats = () => box.querySelectorAll(".menu-cat").forEach((c) => {
        const vis = [...c.querySelectorAll(".menu-row")].filter((r) => !r.hidden);
        c.hidden = !vis.length;
        c.querySelectorAll(".menu-row").forEach((r) => r.classList.toggle("is-last", r === vis[vis.length - 1]));
      });
      verMais(box, rows, only ? Infinity : LIMITE(), syncCats);
    };
    const btns = [["Tudo", null], ...cats.map((c) => [c, c])].map(([label, val]) => {
      const b = h("button", { class: "chip", type: "button", "aria-pressed": val === null ? "true" : "false", text: label });
      b.addEventListener("click", () => { btns.forEach((x) => x.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); draw(val); });
      return b;
    });
    chips.replaceChildren(...btns);
    draw(null);
  }

  // ---------- loja ----------
  function countdown(el, until) {
    const end = new Date(until).getTime();
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      if (!s) { el.textContent = "Promoção encerrada"; return; }
      const d = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
      el.textContent = `Acaba em ${d ? d + "d " : ""}${hh}h ${String(m).padStart(2, "0")}min`;
      setTimeout(tick, 30000);
    };
    tick();
  }
  const promoAtiva = (p) => p.preco_promo != null && Number(p.preco_promo) < Number(p.preco) && (!p.promo_ate || new Date(p.promo_ate) > new Date());

  function produtoCard(p, big) {
    const promo = promoAtiva(p);
    const off = promo ? Math.round((1 - p.preco_promo / p.preco) * 100) : 0;
    const timer = promo && p.promo_ate ? h("span", { class: "timer" }) : null;
    if (timer) countdown(timer, p.promo_ate);
    const price = h("span", { class: "price" }, promo && h("s", { text: brl(p.preco) }), brl(promo ? p.preco_promo : p.preco));
    const msg = `Olá! Tenho interesse no produto: ${p.nome} (${brl(promo ? p.preco_promo : p.preco)})`;
    const body = [
      h("span", { class: "small", text: p.categoria }),
      h("h3", { text: p.nome }),
      p.descricao && h("p", { class: "item__desc", text: p.descricao }),
      p.tamanhos?.length ? h("ul", { class: "sizes", "aria-label": "Tamanhos" }, p.tamanhos.map((t) => h("li", { text: t }))) : null,
      timer,
      h("div", { class: "item__meta" }, price, p.esgotado && h("span", { class: "small", text: "Esgotado" })),
    ];
    const tags = [
      (p.esgotado ? h("span", { class: "tag tag--out", text: "Esgotado" }) : p.selo ? h("span", { class: "tag", text: p.selo }) : null),
      off ? h("span", { class: "tag tag--off", text: `-${off}%` }) : null,
    ];
    if (big) {
      return h("article", { class: "feature rv" },
        h("div", { class: "item__img" }, ...tags, ...pic(p.foto, p.nome).childNodes),
        h("div", { class: "feature__body" }, ...body, !p.esgotado && quero(msg, "btn--dark")));
    }
    return h("article", { class: "item rv" + (p.esgotado ? " is-out" : "") }, ...tags, pic(p.foto, p.nome),
      h("div", { class: "item__body" }, ...body, !p.esgotado && quero(msg, "btn--line btn--sm item__cta")));
  }

  async function loja() {
    const prods = await load("produtos");
    const ordered = [...prods].sort((a, b) => (b.destaque - a.destaque) || (a.esgotado - b.esgotado));
    const top = ordered.find((p) => p.destaque && !p.esgotado);
    document.getElementById("destaque").replaceChildren(...(top ? [produtoCard(top, true)] : []));
    const ofertas = ordered.filter((p) => promoAtiva(p) && p !== top);
    const of = document.getElementById("ofertas");
    of.hidden = !ofertas.length;
    document.getElementById("ofertas-grid").replaceChildren(...ofertas.map((p) => produtoCard(p)));
    const rest = ordered.filter((p) => p !== top && !ofertas.includes(p));
    const pg = document.getElementById("produtos");
    pg.replaceChildren(...(rest.length || top || ofertas.length ? rest.map((p) => produtoCard(p)) : [h("p", { class: "empty", text: "Novidades em breve" })]));
    if (rest.length) verMais(pg, [...pg.children]);
    const og = document.getElementById("ofertas-grid");
    if (ofertas.length) verMais(og, [...og.children]);
  }

  // ---------- eventos ----------
  const SAFE_LINK = /^https:\/\/[^\s"'<>]+$/;
  const dia = (d) => d.toLocaleDateString("pt-BR", { day: "2-digit", timeZone: "America/Sao_Paulo" });
  const mes = (d) => d.toLocaleDateString("pt-BR", { month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");
  const dataLonga = (d) => d.toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).replace(/,? às /, " · ");

  function faltam(el, quando) {
    const tick = () => {
      const s = Math.floor((quando - Date.now()) / 1000);
      if (s <= 0) { el.textContent = "Acontecendo agora"; return; }
      const d = Math.floor(s / 86400), hh = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
      el.textContent = d ? `Faltam ${d} dia${d > 1 ? "s" : ""} e ${hh}h` : `Faltam ${hh}h ${String(m).padStart(2, "0")}min`;
      setTimeout(tick, 30000);
    };
    tick();
  }

  function eventoCard(e, passado, big) {
    const d = e.inicio ? new Date(e.inicio) : null;
    const chip = d ? h("span", { class: "evt__date" }, h("b", { text: dia(d) }), mes(d)) : h("span", { class: "evt__date evt__date--tbd" }, h("b", { text: "?" }), "data");
    const link = SAFE_LINK.test(e.link || "") && h("a", { class: big ? "btn btn--outline" : "evt__link", href: e.link, target: "_blank", rel: "noopener noreferrer" }, passado ? "Ver como foi" : "Saiba mais", icon("arrow"));
    const timer = !passado && d ? h("span", { class: "timer" }) : null;
    if (timer) faltam(timer, d.getTime());
    const cta = !passado && (d
      ? quero(`Olá! Quero participar do evento: ${e.nome} (${dia(d)}/${String(d.getMonth() + 1).padStart(2, "0")})`, big ? "btn--dark" : "btn--line btn--sm item__cta", "Quero participar")
      : quero(`Olá! Quero ser avisado quando sair a data do evento: ${e.nome}`, big ? "btn--dark" : "btn--line btn--sm item__cta", "Quero ser avisado"));
    const body = [
      h("span", { class: "small", text: d ? dataLonga(d) : "Data a definir" }),
      h("h3", { text: e.nome }),
      e.descricao && h("p", { class: "item__desc", text: e.descricao }),
      e.local && h("span", { class: "evt__local", text: e.local }),
      timer,
    ];
    if (big) {
      const img = pic(e.foto, e.nome);
      return h("article", { class: "feature evt rv" },
        h("div", { class: "item__img" }, h("span", { class: "tag", text: "Próximo evento" }), ...img.childNodes),
        h("div", { class: "feature__body" }, ...body, h("div", { class: "evt__btns" }, cta, link)));
    }
    const img = pic(e.foto, e.nome); img.append(chip);
    return h("article", { class: "item evt rv" + (passado ? " is-past" : "") },
      passado && h("span", { class: "tag tag--out", text: "Encerrado" }),
      img, h("div", { class: "item__body" }, ...body, link, cta));
  }

  function emBreve(cfg) {
    const ig = (cfg.instagram || "").replace(/[^A-Za-z0-9._]/g, "");
    return h("article", { class: "item evt soon rv" },
      h("div", { class: "item__img soon__img", "aria-hidden": "true" }, h("span", { text: "Em" }), h("span", { class: "o", text: "breve" })),
      h("div", { class: "item__body" },
        h("span", { class: "small", text: "Novidades" }),
        h("h3", { text: "Novidades em breve" }),
        h("p", { class: "item__desc", text: "Estamos preparando o próximo encontro. Fique de olho." }),
        ig && h("a", { class: "evt__link", href: `https://instagram.com/${ig}`, target: "_blank", rel: "noopener noreferrer" }, icon("ig"), "@" + ig)));
  }

  async function eventos() {
    const todos = await load("eventos", "ordem");
    const agora = Date.now() - 6 * 3600000; // continua em "próximos" até 6h depois de começar
    const semData = todos.filter((e) => !e.inicio);
    const comData = todos.filter((e) => e.inicio);
    // com data primeiro (mais próximo antes), depois os que ainda estão sendo planejados
    const prox = [...comData.filter((e) => new Date(e.inicio).getTime() >= agora).sort((a, b) => new Date(a.inicio) - new Date(b.inicio)), ...semData];
    const pass = comData.filter((e) => new Date(e.inicio).getTime() < agora).sort((a, b) => new Date(b.inicio) - new Date(a.inicio));
    const [top, ...resto] = prox;
    document.getElementById("proximo").replaceChildren(...(top ? [eventoCard(top, false, true)] : []));
    document.getElementById("agenda").replaceChildren(...resto.map((e) => eventoCard(e)), emBreve(window.__cfg || {}));
    const pg = document.getElementById("passados");
    pg.replaceChildren(...(pass.length ? pass.map((e) => eventoCard(e, true)) : [h("p", { class: "empty", text: "O primeiro está chegando." })]));
    if (pass.length) verMais(pg, [...pg.children]);
  }

  // ---------- início ----------
  (async () => {
    navBar();
    const cfg = await loadConfig().catch(() => ({}));
    window.__cfg = cfg;
    chrome(cfg);
    document.querySelectorAll("[data-name]").forEach((el) => { el.textContent = C[el.dataset.name] || el.textContent; });
    try { await ({ barbearia, cafe, loja, eventos }[page] || (async () => {}))(); }
    finally { reveal(); }
  })();
})();
