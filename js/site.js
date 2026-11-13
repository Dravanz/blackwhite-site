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
  const SAFE_PATH = /^(barbeiros|cortes|cafe|loja)\/[A-Za-z0-9_-]+\.(webp|jpe?g|png)$/;
  const imgUrl = (p) => (LIVE && p && SAFE_PATH.test(p)) ? `${C.supabaseUrl}/storage/v1/object/public/imagens/${p}` : null;
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
  function chrome(cfg) {
    const links = [["barbearia.html", C.barbearia, "barbearia"], ["cafe.html", C.cafe, "cafe"], ["loja.html", C.loja, "loja"]];
    const nav = h("header", { class: "nav" },
      h("a", { href: "index.html", class: "brand", "aria-label": "Início" }, h("span", { text: C.marca.a }), h("span", { text: C.marca.b })),
      h("nav", { class: "nav__links", "aria-label": "Seções" }, links.map(([href, label, id]) => h("a", { href, "aria-current": page === id ? "page" : null, text: label }))));
    document.body.prepend(nav);

    const wa = (cfg.whatsapp || "").replace(/\D/g, "");
    const ig = (cfg.instagram || "").replace(/[^A-Za-z0-9._]/g, "");
    const foot = h("footer", { class: "foot" }, h("div", { class: "wrap" },
      h("a", { href: "index.html", class: "brand" }, h("span", { text: C.marca.a }), h("span", { text: C.marca.b })),
      h("div", { class: "foot__info" }, cfg.endereco && h("span", { text: cfg.endereco }), cfg.horario && h("span", { text: cfg.horario })),
      h("div", { class: "foot__links" },
        wa && h("a", { href: `https://wa.me/${wa}`, target: "_blank", rel: "noopener noreferrer" }, icon("wa"), "WhatsApp"),
        ig && h("a", { href: `https://instagram.com/${ig}`, target: "_blank", rel: "noopener noreferrer" }, icon("ig"), "@" + ig)),
      h("a", { href: "admin.html", class: "foot__adm", rel: "nofollow", text: "Área restrita" })));
    document.body.append(foot);
    if (!LIVE) foot.prepend(h("div", { class: "wrap" }, h("p", { class: "notice", text: "Modo demonstração: conteúdo de exemplo. Preencha js/config.js com os dados do Supabase para usar o conteúdo real." })));
  }

  function reveal() {
    const els = document.querySelectorAll(".rv");
    if (!("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
    els.forEach((e) => io.observe(e));
  }

  // ---------- barbearia ----------
  async function barbearia() {
    const [cortes, equipe] = await Promise.all([load("cortes"), load("barbeiros")]);
    const g = document.getElementById("cortes");
    g.replaceChildren(...(cortes.length ? cortes.map((c) => h("article", { class: "item rv" },
      c.destaque && h("span", { class: "tag", text: "Destaque" }),
      pic(c.foto, c.nome),
      h("div", { class: "item__body" },
        h("h3", { text: c.nome }),
        c.descricao && h("p", { class: "item__desc", text: c.descricao }),
        h("div", { class: "item__meta" }, h("span", { class: "price", text: brl(c.preco) }), c.duracao_min && h("span", { class: "small", text: `${c.duracao_min} min` }))))) : [h("p", { class: "empty", text: "Em breve" })]));

    const t = document.getElementById("equipe");
    t.replaceChildren(...(equipe.length ? equipe.map((b) => h("figure", { class: "member rv" },
      pic(b.foto, b.nome),
      h("figcaption", {}, h("b", { text: b.nome }), b.frase && h("q", { text: b.frase }),
        b.instagram && h("a", { href: `https://instagram.com/${b.instagram}`, target: "_blank", rel: "noopener noreferrer" }, icon("ig"), "@" + b.instagram)))) : [h("p", { class: "empty", text: "Em breve" })]));
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
          h("span", { class: "price", text: brl(i.preco) }))))));
      if (!itens.length) box.replaceChildren(h("p", { class: "empty", text: "Cardápio em breve" }));
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
    const msg = encodeURIComponent(`Olá! Tenho interesse no produto: ${p.nome}`);
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
      const wa = (window.__cfg?.whatsapp || "").replace(/\D/g, "");
      return h("article", { class: "feature rv" },
        h("div", { class: "item__img" }, ...tags, ...pic(p.foto, p.nome).childNodes),
        h("div", { class: "feature__body" }, ...body,
          wa && !p.esgotado && h("a", { class: "btn btn--dark", href: `https://wa.me/${wa}?text=${msg}`, target: "_blank", rel: "noopener noreferrer" }, "Quero este", icon("arrow"))));
    }
    return h("article", { class: "item rv" + (p.esgotado ? " is-out" : "") }, ...tags, pic(p.foto, p.nome), h("div", { class: "item__body" }, ...body));
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
    document.getElementById("produtos").replaceChildren(...(rest.length || top || ofertas.length ? rest.map((p) => produtoCard(p)) : [h("p", { class: "empty", text: "Novidades em breve" })]));
  }

  // ---------- home ----------
  async function home() {
    const [c, p, f] = await Promise.all([load("cortes"), load("produtos"), load("cafe_itens")]);
    const bg = { barbearia: c.find((x) => x.foto), loja: p.find((x) => x.foto), cafe: f.find((x) => x.foto) };
    for (const [k, item] of Object.entries(bg)) {
      const url = item && imgUrl(item.foto);
      const el = document.querySelector(`[data-door="${k}"] .door__bg`);
      if (url && el) el.style.backgroundImage = `url("${url}")`;
    }
  }

  // ---------- início ----------
  (async () => {
    const cfg = await loadConfig();
    window.__cfg = cfg;
    chrome(cfg);
    document.querySelectorAll("[data-name]").forEach((el) => { el.textContent = C[el.dataset.name] || el.textContent; });
    try { await ({ home, barbearia, cafe, loja }[page] || (async () => {}))(); }
    finally { reveal(); }
  })();
})();
