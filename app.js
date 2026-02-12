/* ============================================================
   App.js — Avigliano 2027 UI Controller v2
   ============================================================ */
const App = (() => {
  const A = DataStore.AREAS;
  const FC = {
    Avigliano: [42.6533, 12.4272],
    Sismano: [42.6717, 12.3975],
    "Santa Restituta": [42.6383, 12.3883],
    Toscolano: [42.6267, 12.3817],
    Dunarobba: [42.665, 12.4467],
    "Tutto il territorio": [42.6533, 12.4272],
  };
  let curArea = "all",
    search = "",
    fLoc = "",
    fStato = "",
    fTipo = "";
  let map = null,
    markers = [];

  function init() {
    renderHeroStats();
    renderKPIs();
    renderAreaTabs();
    renderPromises();
    renderOpere();
    initMap();
    renderWIP();
    renderVotes();
    renderFAQ();
    initEvents();
    initReveal();
  }

  function renderHeroStats() {
    const m = DataStore.match(),
      ps = DataStore.getProjects();
    const done = ps.filter((p) => p.stato === "concluso").length;
    const pct = m.total > 0 ? Math.round((m.covered / m.total) * 100) : 0;
    document.getElementById("hero-stats").innerHTML = `
      <div style="text-align:center"><p class="hero-stat-num"><span class="ctr" data-t="${pct}">0</span>%</p><p class="hero-stat-label">Programma coperto</p></div>
      <div style="text-align:center"><p class="hero-stat-num"><span class="ctr" data-t="${done}">0</span></p><p class="hero-stat-label">Progetti conclusi</p></div>
      <div style="text-align:center"><p class="hero-stat-num"><span class="ctr" data-t="${ps.length}">0</span></p><p class="hero-stat-label">Azioni totali</p></div>
    `;
  }

  /* ---- KPIs ---- */
  function renderKPIs() {
    const m = DataStore.match(),
      ps = DataStore.getProjects();
    const done = ps.filter((p) => p.stato === "concluso").length;
    const wip = ps.filter((p) => p.stato === "in_corso").length;
    const inv = ps.reduce((s, p) => s + (p.importo || 0), 0);
    const pct = m.total > 0 ? Math.round((m.covered / m.total) * 100) : 0;
    const circ = 2 * Math.PI * 42;
    document.getElementById("kpi-grid").innerHTML = `
      <div class="kpi-card kpi-featured">
        <div style="display:flex;align-items:center;justify-content:center;margin-bottom:12px">
          <svg width="120" height="120" viewBox="0 0 100 100">
            <circle class="prog-bg" cx="50" cy="50" r="42"/>
            <circle class="prog-bar" cx="50" cy="50" r="42" stroke-dasharray="${circ}" stroke-dashoffset="${circ}" data-pct="${pct}"/>
            <text x="50" y="55" text-anchor="middle" font-size="26" font-weight="900" fill="var(--ink)">${pct}%</text>
          </svg>
        </div>
        <p class="kpi-label text-center">Avanzamento programma</p>
      </div>
      <div class="kpi-card"><p class="kpi-num"><span class="ctr" data-t="${m.covered}">0</span><span class="kpi-num-sub"> / ${m.total}</span></p><p class="kpi-label">Promesse coperte</p></div>
      <div class="kpi-card"><p class="kpi-num" style="color:var(--green)"><span class="ctr" data-t="${done}">0</span></p><p class="kpi-label">Progetti conclusi</p></div>
      <div class="kpi-card"><p class="kpi-num" style="color:var(--amber)"><span class="ctr" data-t="${wip}">0</span></p><p class="kpi-label">In corso</p></div>
      <div class="kpi-card"><p class="kpi-num">€<span class="ctr" data-t="${inv}">0</span></p><p class="kpi-label">Investimenti (dati disponibili)</p></div>`;
    setTimeout(() => {
      document.querySelectorAll(".ctr").forEach((c) => {
        const t = parseInt(c.dataset.t);
        if (isNaN(t)) return;
        gsap.to(
          { v: 0 },
          {
            v: t,
            duration: 2,
            ease: "power2.out",
            onUpdate() {
              c.textContent = Math.round(this.targets()[0].v).toLocaleString(
                "it-IT",
              );
            },
          },
        );
      });
      document.querySelectorAll(".prog-bar").forEach((c) => {
        const p = parseInt(c.dataset.pct),
          ci = 2 * Math.PI * 42;
        gsap.to(c, {
          strokeDashoffset: ci - (ci * p) / 100,
          duration: 2.2,
          ease: "power2.out",
        });
      });
    }, 400);
  }

  /* ---- Area tabs ---- */
  function renderAreaTabs() {
    let h = '<button class="pill active" data-area="all">Tutte</button>';
    Object.entries(A).forEach(([k, v]) => {
      h += `<button class="pill" data-area="${k}">${v.icon} ${v.name}</button>`;
    });
    document.getElementById("area-tabs").innerHTML = h;
    let mh = '<button class="pill active" data-area="all">Tutti</button>';
    Object.entries(A).forEach(([k, v]) => {
      mh += `<button class="pill" data-area="${k}">${v.icon}</button>`;
    });
    document.getElementById("map-filters").innerHTML = mh;
    let oh = '<button class="pill active" data-area="all">Tutte</button>';
    Object.entries(A).forEach(([k, v]) => {
      oh += `<button class="pill" data-area="${k}">${v.icon}</button>`;
    });
    document.getElementById("opere-filters").innerHTML = oh;
  }

  /* ---- Promesse vs Risultati ---- */
  function renderPromises() {
    const el = document.getElementById("promise-list");
    const promises = DataStore.getPromises(),
      projects = DataStore.getProjects();
    const s = search.toLowerCase();
    let filtered = promises;
    if (curArea !== "all")
      filtered = filtered.filter((p) => p.area === curArea);
    if (s)
      filtered = filtered.filter((p) => {
        const linked = projects.filter(
          (r) => r.promesse && r.promesse.includes(p.id),
        );
        return (
          p.testo.toLowerCase().includes(s) ||
          p.tema.toLowerCase().includes(s) ||
          linked.some((r) => r.titolo.toLowerCase().includes(s))
        );
      });
    let html = "";
    filtered.forEach((pr) => {
      let linked = projects.filter(
        (p) => p.promesse && p.promesse.includes(pr.id),
      );
      if (fLoc) linked = linked.filter((r) => r.localita === fLoc);
      if (fStato) linked = linked.filter((r) => r.stato === fStato);
      if (fTipo) linked = linked.filter((r) => r.tipo === fTipo);
      const a = A[pr.area] || { name: "", icon: "", color: "#666" };
      html += `<div class="promise-card" id="promise-${pr.id}">
        <div class="promise-header" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.promise-arrow').style.transform=this.nextElementSibling.classList.contains('open')?'rotate(180deg)':''">
          <span class="promise-icon">${a.icon}</span>
          <div class="promise-meta">
            <div class="promise-badges">
              <span class="badge badge-area" style="background:${a.color}15;color:${a.color}">${a.name}</span>
              <span class="promise-tema">${pr.tema}</span>
              ${linked.length > 0 ? `<span class="badge badge-concluso">${linked.length} risultat${linked.length > 1 ? "i" : "o"}</span>` : '<span class="badge" style="background:var(--bg-card);color:var(--ink-4)">In attesa</span>'}
            </div>
            <p class="promise-text">${pr.testo}</p>
          </div>
          <svg class="promise-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
        </div>
        <div class="promise-body">
          <div class="promise-body-inner">
            ${
              linked.length > 0
                ? linked
                    .map((r) => {
                      const tl =
                        r.tipo === "opera"
                          ? "🏗️ Opera"
                          : r.tipo === "servizio"
                            ? "🟢 Servizio"
                            : "📋 Azione";
                      return `<div class="result-card tipo-${r.tipo}">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">
                  <span class="result-title">${r.titolo}</span>
                  <span class="badge badge-${r.stato}">${r.stato === "concluso" ? "✓ Concluso" : r.stato === "in_corso" ? "⏳ In corso" : "📋 Programmato"}</span>
                  <span class="badge badge-${r.tipo}">${tl}</span>
                </div>
                <p class="result-desc">${r.desc}</p>
                ${r.impatto ? `<p class="result-impact">${r.impatto}</p>` : ""}
                <div class="result-meta">
                  ${r.localita ? `<span>📍 ${r.localita}</span>` : ""}${r.anno ? `<span>📅 ${r.anno}</span>` : ""}${r.importo ? `<span>💰 €${r.importo.toLocaleString("it-IT")}</span>` : ""}${r.fonte ? `<span>🏛 ${r.fonte}</span>` : ""}
                </div>
                ${r.link ? `<a href="${r.link}" target="_blank" style="font-size:12px;color:var(--c-500);margin-top:6px;display:inline-block;text-decoration:underline">Vedi atto →</a>` : ""}
              </div>`;
                    })
                    .join("")
                : '<p style="font-size:13px;color:var(--ink-4);font-style:italic">Nessun risultato collegato.</p>'
            }
          </div>
        </div>
      </div>`;
    });
    el.innerHTML =
      html ||
      '<p class="text-center" style="color:var(--ink-4);padding:48px 0">Nessun risultato.</p>';
  }

  /* ---- Opere Prima/Dopo ---- */
  function renderOpere(area) {
    area = area || "all";
    const el = document.getElementById("opere-grid"),
      emp = document.getElementById("opere-empty");
    let ps = DataStore.getProjects().filter((p) => p.tipo === "opera");
    if (area !== "all") ps = ps.filter((p) => p.area === area);
    ps.sort((a, b) => {
      const aH = a.prima?.length > 0 || a.dopo?.length > 0 ? 0 : 1;
      const bH = b.prima?.length > 0 || b.dopo?.length > 0 ? 0 : 1;
      return aH - bH;
    });
    let html = "";
    ps.forEach((p) => {
      const hasBa = p.prima?.length > 0 && p.dopo?.length > 0;
      const hasAny = p.prima?.length > 0 || p.dopo?.length > 0;
      const a = A[p.area] || { name: "", color: "#666" };
      html += `<div class="opera-card">
        ${
          hasBa
            ? `<div class="ba-slider"><img class="ba-after" src="${p.dopo[0]}" alt="Dopo: ${p.titolo}" loading="lazy"><div class="ba-before"><img src="${p.prima[0]}" alt="Prima: ${p.titolo}"></div><div class="ba-handle" style="left:50%"></div><span class="ba-label ba-label-prima">PRIMA</span><span class="ba-label ba-label-dopo">DOPO</span></div>`
            : hasAny
              ? `<div style="aspect-ratio:16/10;overflow:hidden;cursor:pointer" onclick="document.getElementById('lightbox-img').src='${p.dopo?.[0] || p.prima?.[0]}';document.getElementById('lightbox').classList.add('open')"><img src="${p.dopo?.[0] || p.prima?.[0]}" alt="${p.titolo}" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>`
              : `<div class="opera-placeholder"><span style="font-size:24px;opacity:.3">📷</span><span>Foto in arrivo</span></div>`
        }
        <div class="opera-body">
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
            <span class="badge badge-${p.stato}">${p.stato === "concluso" ? "✓ Concluso" : "⏳ In corso"}</span>
            <span class="badge badge-area" style="background:${a.color}15;color:${a.color}">${a.name}</span>
          </div>
          <h3 class="opera-title">${p.titolo}</h3>
          <p class="opera-desc">${p.desc}</p>
          ${p.note ? `<p class="opera-note">${p.note}</p>` : ""}
          <div class="opera-meta">
            ${p.localita ? `<span>📍 ${p.localita}</span>` : ""}${p.anno ? `<span>📅 ${p.anno}</span>` : ""}${p.importo ? `<span>💰 €${p.importo.toLocaleString("it-IT")}</span>` : ""}${p.fonte ? `<span>🏛 ${p.fonte}</span>` : ""}
          </div>
        </div>
      </div>`;
    });
    if (!html) {
      emp.style.display = "block";
      el.innerHTML = "";
    } else {
      emp.style.display = "none";
      el.innerHTML = html;
    }
    initSliders();
  }

  function initSliders() {
    document.querySelectorAll(".ba-slider").forEach((sl) => {
      const h = sl.querySelector(".ba-handle"),
        b = sl.querySelector(".ba-before");
      if (!h || !b) return;
      function mv(x) {
        const r = sl.getBoundingClientRect();
        let p = Math.max(0, Math.min(1, (x - r.left) / r.width));
        b.style.width = p * 100 + "%";
        h.style.left = p * 100 + "%";
      }
      sl.addEventListener("mousedown", (e) => {
        e.preventDefault();
        mv(e.clientX);
        const mm = (e2) => mv(e2.clientX);
        const mu = () => {
          document.removeEventListener("mousemove", mm);
          document.removeEventListener("mouseup", mu);
        };
        document.addEventListener("mousemove", mm);
        document.addEventListener("mouseup", mu);
      });
      sl.addEventListener(
        "touchstart",
        (e) => {
          mv(e.touches[0].clientX);
          const tm = (e2) => mv(e2.touches[0].clientX);
          const te = () => {
            sl.removeEventListener("touchmove", tm);
            sl.removeEventListener("touchend", te);
          };
          sl.addEventListener("touchmove", tm);
          sl.addEventListener("touchend", te);
        },
        { passive: true },
      );
    });
  }

  /* ---- Map ---- */
  function initMap() {
    map = L.map("map-container").setView([42.6533, 12.4272], 13);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "© CartoDB", maxZoom: 18 },
    ).addTo(map);
    renderMarkers("all");
  }
  function renderMarkers(area) {
    markers.forEach((m) => map.removeLayer(m));
    markers = [];
    const cols = {
      1: "#DC3F6E",
      2: "#D4A74A",
      3: "#7B5CF5",
      4: "#12A87B",
      5: "#2B7FFF",
    };
    let ps = DataStore.getProjects();
    if (area !== "all") ps = ps.filter((p) => p.area === area);
    ps.forEach((p) => {
      const c = FC[p.localita] || FC["Avigliano"];
      const j = [
        c[0] + (Math.random() - 0.5) * 0.004,
        c[1] + (Math.random() - 0.5) * 0.004,
      ];
      const col = cols[p.area] || "#2B7FFF";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${col};border:3px solid #1A1E28;box-shadow:0 2px 8px rgba(0,0,0,.2)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const mk = L.marker(j, { icon }).addTo(map);
      mk.bindPopup(
        `<div style="min-width:180px;font-family:Satoshi,sans-serif"><b style="font-size:13px">${p.titolo}</b><br><span style="font-size:12px;color:#666">${p.desc}</span><br><span style="font-size:11px;color:#999">${p.localita || ""} · ${p.stato}</span></div>`,
      );
      markers.push(mk);
    });
  }

  /* ---- WIP ---- */
  function renderWIP() {
    const el = document.getElementById("wip-grid");
    const wip = DataStore.getWIP();
    el.innerHTML =
      wip
        .map((p) => {
          const a = A[p.area] || { name: "", color: "#666" };
          return `<div class="wip-card wip-${p.area}">
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
          <span class="badge badge-${p.stato}">${p.stato === "in_corso" ? "⏳ In corso" : "📋 Programmato"}</span>
          <span style="font-size:12px;color:${a.color};font-weight:600">${a.icon} ${a.name}</span>
        </div>
        <h3 class="wip-title">${p.titolo}</h3>
        <p class="wip-desc">${p.desc}</p>
        ${p.impatto ? `<p class="wip-impact">${p.impatto}</p>` : ""}
        <div class="wip-meta">${p.localita ? `<span>📍 ${p.localita}</span>` : ""}${p.importo ? `<span>💰 €${p.importo.toLocaleString("it-IT")}</span>` : ""}${p.fonte ? `<span>🏛 ${p.fonte}</span>` : ""}</div>
      </div>`;
        })
        .join("") ||
      '<p class="text-center" style="color:var(--ink-4);padding:48px">Nessun cantiere in corso.</p>';
  }

  /* ---- Votes ---- */
  function renderVotes() {
    const themes = [
      {
        id: "v1",
        icon: "🏗️",
        title: "Opere e manutenzioni",
        desc: "Strade, edifici, infrastrutture",
      },
      {
        id: "v2",
        icon: "🌿",
        title: "Ambiente e sostenibilità",
        desc: "Energia, rifiuti, verde",
      },
      {
        id: "v3",
        icon: "🎭",
        title: "Cultura e turismo",
        desc: "Eventi, borghi, promozione",
      },
      {
        id: "v4",
        icon: "👨‍👩‍👧",
        title: "Sociale e famiglie",
        desc: "Servizi, giovani, anziani",
      },
      {
        id: "v5",
        icon: "💼",
        title: "Lavoro e imprese",
        desc: "Commercio, agricoltura, digitale",
      },
      {
        id: "v6",
        icon: "🔒",
        title: "Sicurezza",
        desc: "Polizia, partecipazione",
      },
    ];
    const votes = JSON.parse(localStorage.getItem("av27_votes") || "{}");
    const sel = JSON.parse(localStorage.getItem("av27_sel") || "[]");
    document.getElementById("vote-grid").innerHTML = themes
      .map(
        (
          t,
        ) => `<div class="vote-card ${sel.includes(t.id) ? "selected" : ""}" data-vid="${t.id}" onclick="App.vote('${t.id}')">
      <span class="vote-icon">${t.icon}</span><h3 class="vote-title">${t.title}</h3><p class="vote-desc">${t.desc}</p>
      ${sel.includes(t.id) ? '<span class="badge" style="background:var(--accent);color:var(--c-950);margin-top:12px">✓ Selezionata</span>' : ""}
    </div>`,
      )
      .join("");
    const maxV = Math.max(1, ...themes.map((t) => votes[t.id] || 0));
    document.getElementById("vote-results").innerHTML = themes
      .map((t) => {
        const v = votes[t.id] || 0;
        return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span style="font-size:16px">${t.icon}</span><div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:13px;color:white;margin-bottom:4px"><span>${t.title}</span><span style="font-weight:800">${v}</span></div><div style="background:rgba(255,255,255,.1);border-radius:999px;height:8px"><div style="background:var(--accent);height:100%;border-radius:999px;width:${maxV > 0 ? (v / maxV) * 100 : 0}%;transition:width .5s"></div></div></div></div>`;
      })
      .join("");
  }
  function vote(id) {
    let sel = JSON.parse(localStorage.getItem("av27_sel") || "[]");
    let votes = JSON.parse(localStorage.getItem("av27_votes") || "{}");
    if (sel.includes(id)) {
      sel = sel.filter((s) => s !== id);
      votes[id] = Math.max(0, (votes[id] || 1) - 1);
    } else {
      if (sel.length >= 3) return;
      sel.push(id);
      votes[id] = (votes[id] || 0) + 1;
    }
    localStorage.setItem("av27_sel", JSON.stringify(sel));
    localStorage.setItem("av27_votes", JSON.stringify(votes));
    renderVotes();
  }

  /* ---- FAQ ---- */
  function renderFAQ() {
    const faqs = [
      {
        q: "I dati sono verificabili?",
        a: "Sì. Ogni progetto è riconducibile a delibere o determine consultabili dall'albo pretorio.",
      },
      {
        q: 'Perché alcuni progetti sono "in corso"?',
        a: "Molti interventi, specie PNRR o regionali, hanno tempi che superano il mandato. Li indichiamo con trasparenza.",
      },
      {
        q: "Come posso segnalare un problema?",
        a: "Sportello del Cittadino, chat WhatsApp comunale, o i contatti in fondo alla pagina.",
      },
      {
        q: "I voti sulle priorità sono vincolanti?",
        a: "No, sono un'indicazione partecipativa per orientare il programma 2027.",
      },
    ];
    document.getElementById("faq-list").innerHTML = faqs
      .map(
        (f) =>
          `<div class="faq-item"><button class="faq-btn" onclick="const c=this.nextElementSibling;c.classList.toggle('open');this.querySelector('.faq-icon').textContent=c.classList.contains('open')?'−':'+'"><span>${f.q}</span><span class="faq-icon">+</span></button><div class="promise-body"><div style="padding:0 22px 18px"><p style="font-size:13px;color:var(--ink-2);line-height:1.65">${f.a}</p></div></div></div>`,
      )
      .join("");
  }

  /* ---- Events ---- */
  function initEvents() {
    document.getElementById("area-tabs").addEventListener("click", (e) => {
      const b = e.target.closest(".pill");
      if (!b) return;
      curArea = b.dataset.area;
      document
        .querySelectorAll("#area-tabs .pill")
        .forEach((t) => t.classList.remove("active"));
      b.classList.add("active");
      renderPromises();
    });
    document.getElementById("map-filters").addEventListener("click", (e) => {
      const b = e.target.closest(".pill");
      if (!b) return;
      document
        .querySelectorAll("#map-filters .pill")
        .forEach((t) => t.classList.remove("active"));
      b.classList.add("active");
      renderMarkers(b.dataset.area);
    });
    document.getElementById("opere-filters").addEventListener("click", (e) => {
      const b = e.target.closest(".pill");
      if (!b) return;
      document
        .querySelectorAll("#opere-filters .pill")
        .forEach((t) => t.classList.remove("active"));
      b.classList.add("active");
      renderOpere(b.dataset.area);
    });
    document.getElementById("search-input").addEventListener("input", (e) => {
      search = e.target.value;
      renderPromises();
    });
    document.getElementById("f-loc").addEventListener("change", (e) => {
      fLoc = e.target.value;
      renderPromises();
    });
    document.getElementById("f-stato").addEventListener("change", (e) => {
      fStato = e.target.value;
      renderPromises();
    });
    document.getElementById("f-tipo").addEventListener("change", (e) => {
      fTipo = e.target.value;
      renderPromises();
    });
    document.getElementById("how-calc-btn").addEventListener("click", () => {
      document.getElementById("modal-calc").style.display = "flex";
    });
    document
      .getElementById("vote-results-btn")
      .addEventListener("click", () => {
        const r = document.getElementById("vote-results");
        r.style.display = r.style.display === "none" ? "block" : "none";
      });
    // Mobile
    document
      .getElementById("menu-btn")
      .addEventListener("click", () =>
        document.getElementById("mob-menu").classList.add("open"),
      );
    document
      .getElementById("mob-close")
      .addEventListener("click", () =>
        document.getElementById("mob-menu").classList.remove("open"),
      );
    document
      .querySelectorAll(".mob-link")
      .forEach((l) =>
        l.addEventListener("click", () =>
          document.getElementById("mob-menu").classList.remove("open"),
        ),
      );
    window.addEventListener("scroll", () => {
      document
        .getElementById("nav")
        .classList.toggle("scrolled", window.scrollY > 40);
    });
    initAdmin();
  }

  /* ---- Reveal ---- */
  function initReveal() {
    gsap.registerPlugin(ScrollTrigger);
    document.querySelectorAll(".reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        },
      );
    });
  }

  /* ---- Admin ---- */
  function initAdmin() {
    const panel = document.getElementById("admin-panel"),
      ov = document.getElementById("admin-overlay");
    const close = () => {
      panel.classList.remove("open");
      ov.classList.remove("open");
    };
    document.getElementById("admin-btn").addEventListener("click", () => {
      panel.classList.add("open");
      ov.classList.add("open");
    });
    document.getElementById("close-admin").addEventListener("click", close);
    ov.addEventListener("click", close);
    document.getElementById("admin-login-btn").addEventListener("click", () => {
      if (document.getElementById("admin-pw").value === "admin") {
        document.getElementById("admin-login").style.display = "none";
        document.getElementById("admin-main").style.display = "block";
        renderAdminProjects();
        renderAdminPromises();
      } else alert("Password errata");
    });
    document.querySelectorAll("#admin-tabs .pill").forEach((t) =>
      t.addEventListener("click", () => {
        document
          .querySelectorAll("#admin-tabs .pill")
          .forEach((b) => b.classList.remove("active"));
        t.classList.add("active");
        ["a-projects", "a-promises", "a-data"].forEach(
          (id) => (document.getElementById(id).style.display = "none"),
        );
        document.getElementById(t.dataset.tab).style.display = "block";
      }),
    );
    document
      .getElementById("add-proj-btn")
      .addEventListener("click", () => openProjModal());
    document
      .getElementById("proj-form")
      .addEventListener("submit", handleProjSave);
    document.querySelector(".close-proj").addEventListener("click", () => {
      document.getElementById("proj-modal").style.display = "none";
    });
    document
      .getElementById("admin-search")
      .addEventListener("input", () => renderAdminProjects());
    document.getElementById("export-btn").addEventListener("click", () => {
      const b = new Blob([DataStore.exportJSON()], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "avigliano2027.json";
      a.click();
    });
    document.getElementById("import-input").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        if (DataStore.importJSON(r.result)) {
          alert("Importato");
          refreshAll();
          renderAdminProjects();
          renderAdminPromises();
        } else alert("Errore");
      };
      r.readAsText(f);
    });
    document.getElementById("reset-btn").addEventListener("click", () => {
      if (confirm("Reset tutti i dati?")) {
        DataStore.reset();
        refreshAll();
        renderAdminProjects();
        renderAdminPromises();
      }
    });
    document.getElementById("pf-tipo").addEventListener("change", (e) => {
      document.getElementById("pf-photo-section").style.display =
        e.target.value === "opera" ? "block" : "none";
    });
  }

  function renderAdminProjects() {
    const el = document.getElementById("admin-proj-list");
    const q = (
      document.getElementById("admin-search")?.value || ""
    ).toLowerCase();
    let ps = DataStore.getProjects();
    if (q)
      ps = ps.filter(
        (p) =>
          p.titolo.toLowerCase().includes(q) ||
          p.desc.toLowerCase().includes(q),
      );
    el.innerHTML = ps
      .map((p) => {
        const a = A[p.area] || { name: "" };
        const hasP = p.prima?.length > 0 || p.dopo?.length > 0;
        return `<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg-3);border-radius:var(--r-sm)">
        <div style="flex:1;min-width:0"><p style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.titolo}</p><p style="font-size:11px;color:var(--ink-3)">${a.name} · ${p.tipo} · ${p.stato}${hasP ? " · 📷" : ""}${p.importo ? " · €" + p.importo.toLocaleString("it-IT") : ""}</p></div>
        <button onclick="App.editProj('${p.id}')" style="background:var(--bg-card);border:none;padding:6px 10px;border-radius:var(--r-sm);cursor:pointer;font-size:12px">✏️</button>
        <button onclick="App.delProj('${p.id}')" style="background:#FEF2F2;border:none;padding:6px 10px;border-radius:var(--r-sm);cursor:pointer;font-size:12px">🗑</button>
      </div>`;
      })
      .join("");
  }

  function renderAdminPromises() {
    const el = document.getElementById("admin-prom-list");
    const projects = DataStore.getProjects();
    el.innerHTML = DataStore.getPromises()
      .map((p) => {
        const linked = projects.filter(
          (r) => r.promesse && r.promesse.includes(p.id),
        );
        return `<div style="padding:10px 12px;background:var(--bg-3);border-radius:var(--r-sm)"><p style="font-size:13px;font-weight:600">${p.id}: ${p.tema}</p><p style="font-size:11px;color:var(--ink-3);margin-top:2px">${p.testo.substring(0, 80)}…</p><p style="font-size:11px;margin-top:4px;color:${linked.length ? "var(--green)" : "var(--ink-4)"}">${linked.length} risultat${linked.length !== 1 ? "i" : "o"}</p></div>`;
      })
      .join("");
  }

  function openProjModal(p) {
    document.getElementById("proj-modal").style.display = "flex";
    document.getElementById("proj-modal-title").textContent = p
      ? "Modifica"
      : "Nuovo Progetto";
    document.getElementById("pf-id").value = p?.id || "";
    document.getElementById("pf-titolo").value = p?.titolo || "";
    document.getElementById("pf-area").value = p?.area || "1";
    document.getElementById("pf-tipo").value = p?.tipo || "opera";
    document.getElementById("pf-desc").value = p?.desc || "";
    document.getElementById("pf-impatto").value = p?.impatto || "";
    document.getElementById("pf-loc").value = p?.localita || "Avigliano";
    document.getElementById("pf-anno").value = p?.anno || "";
    document.getElementById("pf-stato").value = p?.stato || "concluso";
    document.getElementById("pf-importo").value = p?.importo || "";
    document.getElementById("pf-fonte").value = p?.fonte || "";
    document.getElementById("pf-prom").value = (p?.promesse || []).join(",");
    document.getElementById("pf-link").value = p?.link || "";
    document.getElementById("pf-note").value = p?.note || "";
    document.getElementById("pf-photo-section").style.display =
      (p?.tipo || "opera") === "opera" ? "block" : "none";
    document.getElementById("pf-prima-prev").innerHTML = (p?.prima || [])
      .map(
        (img) =>
          `<img src="${img}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;border:1px solid var(--c-100)">`,
      )
      .join("");
    document.getElementById("pf-dopo-prev").innerHTML = (p?.dopo || [])
      .map(
        (img) =>
          `<img src="${img}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;border:1px solid var(--green)">`,
      )
      .join("");
  }

  async function handleProjSave(e) {
    e.preventDefault();
    const id = document.getElementById("pf-id").value;
    const data = {
      id: id || "R" + Date.now(),
      area: document.getElementById("pf-area").value,
      tipo: document.getElementById("pf-tipo").value,
      titolo: document.getElementById("pf-titolo").value,
      desc: document.getElementById("pf-desc").value,
      impatto: document.getElementById("pf-impatto").value,
      localita: document.getElementById("pf-loc").value,
      anno: document.getElementById("pf-anno").value,
      stato: document.getElementById("pf-stato").value,
      importo: parseInt(document.getElementById("pf-importo").value) || null,
      fonte: document.getElementById("pf-fonte").value,
      promesse: document
        .getElementById("pf-prom")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      link: document.getElementById("pf-link").value,
      note: document.getElementById("pf-note").value,
      prima: [],
      dopo: [],
    };
    if (id) {
      const old = DataStore.getProjects().find((p) => p.id === id);
      if (old) {
        data.prima = old.prima || [];
        data.dopo = old.dopo || [];
      }
    }
    const pf = document.getElementById("pf-prima").files;
    const df = document.getElementById("pf-dopo").files;
    for (const f of pf) data.prima.push(await compress(f));
    for (const f of df) data.dopo.push(await compress(f));
    if (id) DataStore.updateProject(id, data);
    else DataStore.addProject(data);
    document.getElementById("proj-modal").style.display = "none";
    renderAdminProjects();
    refreshAll();
  }

  function compress(file) {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          const max = 800;
          let w = img.width,
            h = img.height;
          if (w > max) {
            h = (h * max) / w;
            w = max;
          }
          c.width = w;
          c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          res(c.toDataURL("image/jpeg", 0.7));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  function editProj(id) {
    const p = DataStore.getProjects().find((pr) => pr.id === id);
    if (p) openProjModal(p);
  }
  function delProj(id) {
    if (confirm("Eliminare?")) {
      DataStore.deleteProject(id);
      renderAdminProjects();
      refreshAll();
    }
  }
  function refreshAll() {
    renderKPIs();
    renderPromises();
    renderOpere();
    renderWIP();
    renderMarkers("all");
  }

  return { init, vote, editProj, delProj, refreshAll };
})();
document.addEventListener("DOMContentLoaded", () => App.init());
