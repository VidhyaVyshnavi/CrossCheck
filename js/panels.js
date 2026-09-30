/** panels.js - "Ask the Graph" (GraphRAG) tab and "Ministry & Location Explorer" tab. */
(function () {
  const GR = window.CrossCheckGraph, AL = window.CrossCheckAllocations, I18n = window.CrossCheckI18n, t = I18n.t, App = window.CrossCheckApp;
  const $ = function (id) { return document.getElementById(id); };
  const esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); };
  const inr = function (n) { return "\u20b9" + Math.round(n).toLocaleString("en-IN"); };
  let an = null, graph = null, builtTol = null, lastQ = "", activeTab = "verify";

  function ensure() {
    const tol = App.getTolerance();
    if (!graph || tol !== builtTol) { an = GR.analyze(App.getSchemes(), tol); graph = GR.buildGraph(an); builtTol = tol; }
    return graph;
  }

  // ======================= Ask the Graph =======================
  const COL = { ministry: 0, sector: 0, scheme: 1, document: 2, period: 2, claim: 3, metric: 3, state: 3, region: 3 };
  const COLOR = { ministry: "#0a2647", sector: "#0a2647", scheme: "#146c43", document: "#56626d", period: "#56626d", claim: "#a8781f", metric: "#a8781f", state: "#7a1f2b", region: "#7a1f2b" };
  const EDGE = { conflicts_with: ["#b3261e", "5 4", 2.4], agrees_with: ["#146c43", "", 2], allocated_to: ["#a8781f", "", 1.6] };

  function svgGraph(sub) {
    const W = 860, pw = 160, ph = 24, gap = (W - 110 - 4 * pw) / 3, rowH = 34, cols = [[], [], [], []], pos = {};
    sub.nodes.forEach(function (n) { cols[COL[n.type] != null ? COL[n.type] : 3].push(n); });
    const H = Math.max(150, Math.max.apply(null, cols.map(function (c) { return c.length; })) * rowH + 24);
    cols.forEach(function (c, ci) { const off = (H - c.length * rowH) / 2; c.forEach(function (n, i) { pos[n.id] = { x: 20 + ci * (pw + gap), y: off + i * rowH + (rowH - ph) / 2, ci: ci }; }); });
    let out = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Evidence subgraph" xmlns="http://www.w3.org/2000/svg">';
    sub.edges.forEach(function (e) {
      const a = pos[e.from], b = pos[e.to]; if (!a || !b) return;
      const st = EDGE[e.rel] || ["#9aa5b1", "", 1.2];
      let x1, x2; const y1 = a.y + ph / 2, y2 = b.y + ph / 2;
      if (a.ci < b.ci) { x1 = a.x + pw; x2 = b.x; } else if (a.ci > b.ci) { x1 = a.x; x2 = b.x + pw; } else { x1 = a.x + pw; x2 = b.x + pw; }
      const bulge = a.ci === b.ci ? 46 : (x2 - x1) / 2;
      out += '<path d="M' + x1 + " " + y1 + " C" + (x1 + bulge) + " " + y1 + " " + (x2 - (a.ci === b.ci ? -46 : bulge)) + " " + y2 + " " + x2 + " " + y2 + '" fill="none" stroke="' + st[0] + '" stroke-width="' + st[2] + '"' + (st[1] ? ' stroke-dasharray="' + st[1] + '"' : "") + ' opacity=".8"><title>' + esc(e.rel.replace(/_/g, " ")) + (e.pct != null ? " (" + e.pct.toFixed(1) + "% apart)" : "") + (e.amount ? " " + inr(e.amount) : "") + "</title></path>";
    });
    sub.nodes.forEach(function (n) {
      const p = pos[n.id], c = COLOR[n.type] || "#56626d", lab = n.label.length > 25 ? n.label.slice(0, 24) + "\u2026" : n.label;
      out += '<g><rect x="' + p.x + '" y="' + p.y + '" width="' + pw + '" height="' + ph + '" rx="12" fill="' + c + '" fill-opacity=".12" stroke="' + c + '"/><text x="' + (p.x + pw / 2) + '" y="' + (p.y + 16) + '" text-anchor="middle" font-size="10.5" fill="#16212e">' + esc(lab) + "</text><title>" + esc(n.type + ": " + n.label) + "</title></g>";
    });
    return out + "</svg>";
  }

  function renderAnswer(r) {
    let h = '<div class="ans-card"><h3>' + t("answer") + "</h3>" + r.paragraphs.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    if (r.items.length) {
      h += '<ul class="ans-list">' + r.items.map(function (i) {
        return '<li class="' + (i.conflict ? "conflict" : "") + '"><div><span class="al-name">' + esc(i.label) + '</span> <span class="al-min">' + esc(i.ministry) + "</span></div>" +
          (i.detail ? '<div class="al-detail">' + esc(i.detail) + "</div>" : "") + '<div class="al-path">' + esc(i.path) + "</div></li>";
      }).join("") + "</ul>";
      if (r.total > r.items.length) h += '<p class="panel-sub" style="margin-top:8px">+' + (r.total - r.items.length) + " more schemes matched.</p>";
    }
    if (r.related.length) h += '<p style="margin-top:12px"><b>' + t("related") + ":</b> " + esc(r.related.join(", ")) + "</p>";
    h += "</div>";
    h += '<div class="ans-card"><h3>' + t("trace") + '</h3><ol class="trace">' + r.trace.map(function (s) { return '<li><span class="hop">' + esc(s.hop) + ":</span> " + esc(s.text) + "</li>"; }).join("") + "</ol></div>";
    if (r.graphCount) {
      const hops = r.trace.filter(function (s) { return /^Hop/.test(s.hop); }).length;
      h += '<div class="compare-grid"><div class="cmp-col"><h4>' + t("vecOnly") + '</h4><div class="cmp-big">' + r.vector.correct + " / " + r.graphCount + '</div><div class="panel-sub" style="margin:0">relevant schemes retrieved from the top-5 text matches</div><ul>' +
        r.hits.map(function (x) { return "<li>" + esc(x.node.label) + " (" + x.score.toFixed(2) + ")</li>"; }).join("") + '</ul></div>' +
        '<div class="cmp-col graph"><h4>' + t("graphRag") + '</h4><div class="cmp-big">' + r.graphCount + " / " + r.graphCount + '</div><div class="panel-sub" style="margin:0">relevant schemes reached by ' + (hops || 1) + " graph hop" + (hops === 1 ? "" : "s") + ' with cited evidence paths</div><ul><li>Joins documents that never mention each other</li><li>Every claim traced to its source sentence and document</li></ul></div></div>';
      h += '<div class="ans-card"><h3>' + t("subgraph") + '</h3><div class="svg-wrap">' + svgGraph(r.subgraph) + '</div><div class="svg-legend"><span><i style="border-color:#b3261e"></i>conflicts_with</span><span><i style="border-color:#a8781f"></i>allocated_to</span><span><i style="border-color:#9aa5b1"></i>administered_by / describes / states</span></div></div>';
    }
    return h;
  }

  function runAsk(q) {
    q = (q || "").trim(); if (!q) return;
    lastQ = q; $("askInput").value = q; ensure();
    $("askOutput").innerHTML = renderAnswer(GR.ask(graph, q));
  }
  function renderStats() {
    const s = GR.stats(graph);
    $("graphStats").innerHTML = "<span><b>" + s.nodes + "</b> nodes</span><span><b>" + s.edges + "</b> edges</span>" +
      Object.keys(s.byType).map(function (k) { return "<span>" + k + ": <b>" + s.byType[k] + "</b></span>"; }).join("");
  }
  function initAsk() {
    $("askChips").innerHTML = GR.EXAMPLES.map(function (q, i) { return '<button class="chip" data-i="' + i + '">' + esc(q) + "</button>"; }).join("");
    $("askChips").addEventListener("click", function (e) { const b = e.target.closest(".chip"); if (b) runAsk(GR.EXAMPLES[+b.dataset.i]); });
    $("askBtn").addEventListener("click", function () { runAsk($("askInput").value); });
    $("askInput").addEventListener("keydown", function (e) { if (e.key === "Enter") runAsk($("askInput").value); });
  }

  // ======================= Ministry & Location Explorer =======================
  const st = { ministry: "", scheme: "", state: "" };
  const cap = function (s) { return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); }); };
  const short = function (n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(Math.round(n)); };

  function fillSelects() {
    ensure();
    const mins = Array.from(new Set(an.map(function (a) { return a.scheme.ministry; }))).sort();
    $("exMinistry").innerHTML = '<option value="">' + t("all") + "</option>" + mins.map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + "</option>"; }).join("");
    $("exMinistry").value = st.ministry;
    const sch = an.filter(function (a) { return !st.ministry || a.scheme.ministry === st.ministry; });
    $("exScheme").innerHTML = '<option value="">' + t("all") + "</option>" + sch.map(function (a) { return '<option value="' + a.scheme.key + '">' + esc(a.scheme.label) + "</option>"; }).join("");
    $("exScheme").value = st.scheme;
    $("exState").innerHTML = '<option value="">' + t("all") + "</option>" + AL.STATES.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (s) { return '<option value="' + s.code + '">' + esc(s.name) + "</option>"; }).join("");
    $("exState").value = st.state;
    if (!$("placeList").children.length) $("placeList").innerHTML = AL.STATES.map(function (s) { return '<option value="' + esc(s.name) + '">'; }).join("") + Object.keys(AL.CITIES).map(function (c) { return '<option value="' + esc(cap(c)) + '">'; }).join("");
  }

  function view() {
    ensure();
    const sel = an.filter(function (a) { return (!st.ministry || a.scheme.ministry === st.ministry) && (!st.scheme || a.scheme.key === st.scheme); });
    const per = {}; sel.forEach(function (a) { a.alloc.forEach(function (x) { per[x.code] = (per[x.code] || 0) + x.amount; }); });
    const national = sel.reduce(function (s, a) { return s + a.total; }, 0), inView = st.state ? (per[st.state] || 0) : national;
    const dis = sel.filter(function (a) { return a.mismatches > 0; }).length;
    const card = function (n, l, c) { return '<div class="stat-card ' + c + '"><div class="stat-num" style="font-size:1.5rem">' + n + '</div><div class="stat-label">' + l + "</div></div>"; };
    $("exKpis").innerHTML = card(inr(inView), t("kAlloc") + (st.state ? " \u2014 " + AL.byCode(st.state).name : ""), "match") + card(sel.length, t("kSchemes"), "unverif") + card(dis, t("kDis"), "mismatch");

    // tile map
    const max = Math.max.apply(null, AL.STATES.map(function (s) { return per[s.code] || 0; })) || 1;
    $("exMap").innerHTML = AL.STATES.map(function (s) {
      const v = per[s.code] || 0, k = Math.sqrt(v / max), a = 0.07 + 0.88 * k;
      return '<button class="tile' + (k > 0.5 ? " dark" : "") + (s.code === st.state ? " sel" : "") + '" data-code="' + s.code + '" style="grid-column:' + (s.gx + 1) + ";grid-row:" + (s.gy + 1) + ";background:rgba(10,38,71," + a.toFixed(2) + ')" title="' + esc(s.name + " \u2014 " + inr(v) + " crore") + '" aria-label="' + esc(s.name + " " + inr(v) + " crore") + '">' + s.code + "<small>" + short(v) + "</small></button>";
    }).join("");
    $("exLegend").innerHTML = "<span>" + t("low") + '</span><span class="bar"></span><span>' + t("high") + "</span>";

    // table
    let rows = "", head = "", title = "";
    const bar = function (v, m) { return '<span class="ex-bar" style="width:' + Math.max(2, Math.round(v / (m || 1) * 100)) + '%"></span>'; };
    const badge = function (n) { return n ? '<span class="badge mismatch">' + n + " " + t("mismatch") + "</span>" : '<span class="badge match">' + t("match") + "</span>"; };
    if (st.state) {
      title = t("forState", { s: AL.byCode(st.state).name });
      const list = sel.map(function (a) { const x = a.alloc.find(function (y) { return y.code === st.state; }); return { a: a, v: x ? x.amount : 0 }; }).sort(function (p, q) { return q.v - p.v; }), m = list.length ? list[0].v : 1;
      head = "<th>" + t("scheme") + "</th><th>" + t("ministry") + '</th><th class="num">\u20b9 crore</th><th></th>';
      rows = list.map(function (o) { return '<tr class="clickable" data-scheme="' + o.a.scheme.key + '"><td>' + esc(o.a.scheme.label) + '</td><td>' + esc(o.a.scheme.ministry) + '</td><td class="num">' + inr(o.v) + bar(o.v, m) + "</td><td>" + badge(o.a.mismatches) + "</td></tr>"; }).join("");
    } else if (st.ministry || st.scheme) {
      title = t("byScheme");
      const list = sel.slice().sort(function (p, q) { return q.total - p.total; }), m = list.length ? list[0].total : 1;
      head = "<th>" + t("scheme") + '</th><th class="num">\u20b9 crore</th><th>Top state</th><th></th>';
      rows = list.map(function (a) { return '<tr class="clickable" data-scheme="' + a.scheme.key + '"><td>' + esc(a.scheme.label) + '</td><td class="num">' + inr(a.total) + bar(a.total, m) + "</td><td>" + esc(a.alloc[0].name) + "</td><td>" + badge(a.mismatches) + "</td></tr>"; }).join("");
    } else {
      title = t("byMinistry");
      const g = {}; an.forEach(function (a) { const k = a.scheme.ministry; g[k] = g[k] || { n: 0, v: 0, d: 0 }; g[k].n++; g[k].v += a.total; g[k].d += a.mismatches > 0 ? 1 : 0; });
      const list = Object.keys(g).sort(function (p, q) { return g[q].v - g[p].v; }), m = list.length ? g[list[0]].v : 1;
      head = "<th>" + t("ministry") + "</th><th>" + t("kSchemes") + '</th><th class="num">\u20b9 crore</th><th>' + t("kDis") + "</th>";
      rows = list.map(function (k) { return '<tr class="clickable" data-ministry="' + esc(k) + '"><td>' + esc(k) + "</td><td>" + g[k].n + '</td><td class="num">' + inr(g[k].v) + bar(g[k].v, m) + "</td><td>" + g[k].d + "</td></tr>"; }).join("");
    }
    $("exTableTitle").textContent = title;
    $("exTable").innerHTML = '<table class="ex-table"><thead><tr>' + head + "</tr></thead><tbody>" + rows + "</tbody></table>";
  }

  function setState(code, msg, keepText) { if (!keepText) $("exPlace").value = ""; st.state = code || ""; $("exState").value = st.state; $("exMsg").textContent = msg || ""; view(); }
  function initExplore() {
    $("exMinistry").addEventListener("change", function () { st.ministry = this.value; st.scheme = ""; fillSelects(); view(); });
    $("exScheme").addEventListener("change", function () { st.scheme = this.value; view(); });
    $("exState").addEventListener("change", function () { setState(this.value, ""); });
    $("exMap").addEventListener("click", function (e) { const b = e.target.closest(".tile"); if (b) { const s = AL.byCode(b.dataset.code); setState(s.code, s.name + " \u00b7 " + s.region + " region"); } });
    $("exTable").addEventListener("click", function (e) {
      const tr = e.target.closest("tr.clickable"); if (!tr) return;
      if (tr.dataset.ministry !== undefined) { st.ministry = tr.dataset.ministry; st.scheme = ""; } else st.scheme = tr.dataset.scheme;
      fillSelects(); view();
    });
    const go = function () {
      const q = $("exPlace").value, s = AL.resolvePlace(q);
      if (s) setState(s.code, "\u201c" + q + "\u201d \u2192 " + s.name + " (" + s.region + " region)", true); else $("exMsg").textContent = "No state, UT or city matching \u201c" + q + "\u201d. Try a state name or a major city.";
    };
    $("exGo").addEventListener("click", go);
    $("exPlace").addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    $("exPlace").addEventListener("change", go);
    $("exReset").addEventListener("click", function () { st.ministry = st.scheme = st.state = ""; $("exPlace").value = ""; $("exMsg").textContent = ""; fillSelects(); view(); });
    $("exLocate").addEventListener("click", function () {
      if (!navigator.geolocation) { $("exMsg").textContent = "Geolocation is not supported by this browser. Use the search box instead."; return; }
      $("exMsg").textContent = "Locating\u2026";
      navigator.geolocation.getCurrentPosition(function (p) {
        const r = AL.nearestState(p.coords.latitude, p.coords.longitude);
        setState(r.state.code, "Nearest state/UT: " + r.state.name + " (about " + r.km + " km from its capital) \u00b7 " + r.state.region + " region", true);
      }, function (err) {
        $("exMsg").textContent = (err && err.code === 1 ? "Location permission denied." : "Could not get your location (some browsers block it on file:// pages).") + " Use the search box or the map instead.";
      }, { timeout: 10000 });
    });
  }

  // ======================= wiring =======================
  document.addEventListener("cc:tab", function (e) {
    activeTab = e.detail;
    if (activeTab === "ask") { ensure(); renderStats(); }
    if (activeTab === "explore") { fillSelects(); view(); }
  });
  document.addEventListener("cc:tolerance", function () {
    if (activeTab === "ask") { ensure(); renderStats(); if (lastQ) runAsk(lastQ); }
    if (activeTab === "explore") { fillSelects(); view(); }
  });
  document.addEventListener("cc:lang", function () { if (activeTab === "explore") { fillSelects(); view(); } });
  initAsk(); initExplore();
})();
