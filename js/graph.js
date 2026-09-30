/**
 * graph.js - GraphRAG for multi-hop questions, fully client-side.
 *
 * 1. buildGraph(): documents -> knowledge graph. Nodes: ministry, sector, scheme, document,
 *    claim, metric, period, state, region. Edges: administered_by, in_sector, describes,
 *    states, measures, reports, covers_period, conflicts_with / agrees_with, allocated_to, in_region.
 * 2. Vector search: a TF-IDF index over every node's text (cosine similarity).
 * 3. ask(): vector search seeds the query, entity linking + intent detection turn the question
 *    into a traversal plan, and the graph is walked hop by hop (ministry -> scheme -> document ->
 *    claim -> conflict, scheme -> state ...). Every answer carries the evidence path it used.
 */
(function (global) {
  const isNode = typeof module !== "undefined";
  const Ext = isNode ? require("./extraction.js") : global.CrossCheckExtraction;
  const Match = isNode ? require("./matching.js") : global.CrossCheckMatching;
  const Alloc = isNode ? require("./allocations.js") : global.CrossCheckAllocations;

  // ---------- vector index (TF-IDF + cosine) ----------
  const STOP = new Set("the a an of in on for to and or is are was were be by with at as from that this which what who whom how many much do does did have has had under across between per me all any it its their there than then into over show tell list me give".split(" "));
  function stem(t) { return t.replace(/(ations?|ing|ed|es|s|e)$/, "").slice(0, 5) || t; }
  function tokens(s) { return (String(s || "").toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (t) { return !STOP.has(t); }).map(stem); }

  function buildIndex(items) {
    const df = {}, docs = items.map(function (it) {
      const tf = {}; tokens(it.text).forEach(function (t) { tf[t] = (tf[t] || 0) + 1; });
      Object.keys(tf).forEach(function (t) { df[t] = (df[t] || 0) + 1; });
      return { id: it.id, tf: tf };
    });
    const N = docs.length, idf = {};
    Object.keys(df).forEach(function (t) { idf[t] = Math.log(1 + N / df[t]); });
    function vec(tf) {
      const v = {}; let n = 0;
      Object.keys(tf).forEach(function (t) { if (idf[t]) { v[t] = (1 + Math.log(tf[t])) * idf[t]; n += v[t] * v[t]; } });
      n = Math.sqrt(n) || 1; Object.keys(v).forEach(function (t) { v[t] /= n; }); return v;
    }
    docs.forEach(function (d) { d.v = vec(d.tf); });
    return {
      search: function (query, k) {
        const tf = {}; tokens(query).forEach(function (t) { tf[t] = (tf[t] || 0) + 1; });
        const q = vec(tf);
        return docs.map(function (d) {
          let s = 0; Object.keys(q).forEach(function (t) { if (d.v[t]) s += q[t] * d.v[t]; });
          return { id: d.id, score: s };
        }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, k || 8);
      }
    };
  }

  // ---------- analysis + graph construction ----------
  function analyze(schemes, tol) {
    return schemes.filter(function (s) { return s.key !== "custom" && s.docs && s.docs.length > 1; }).map(function (s) {
      const cA = Ext.extractClaims(s.docs[0].text), cB = Ext.extractClaims(s.docs[1].text);
      const rows = Match.compare(cA, cB, tol);
      const t = Alloc.schemeTotal(s.key, cA.concat(cB));
      return { scheme: s, cA: cA, cB: cB, rows: rows, total: t.total, basis: t.basis, alloc: Alloc.allocate(s.key, t.total),
        mismatches: rows.filter(function (r) { return r.verdict === "mismatch"; }).length };
    });
  }

  function buildGraph(an) {
    const G = { nodes: {}, out: {}, inn: {}, schemeIds: [], analysis: an, edgeCount: 0 };
    function node(id, type, label, text, props) {
      if (!G.nodes[id]) { G.nodes[id] = Object.assign({ id: id, type: type, label: label, text: text || label }, props || {}); G.out[id] = []; G.inn[id] = []; }
      return G.nodes[id];
    }
    function edge(a, b, rel, props) {
      if (G.out[a].some(function (e) { return e.to === b && e.rel === rel; })) return;
      const e = Object.assign({ from: a, to: b, rel: rel }, props || {}); G.out[a].push(e); G.inn[b].push(e); G.edgeCount++;
    }
    Alloc.STATES.forEach(function (s) {
      const cities = Object.keys(Alloc.CITIES).filter(function (c) { return Alloc.CITIES[c] === s.code; }).join(" ");
      node("state:" + s.code, "state", s.name, s.name + " " + cities, { code: s.code });
      node("region:" + s.region, "region", s.region + " India");
      edge("state:" + s.code, "region:" + s.region, "in_region");
    });
    an.forEach(function (a) {
      const s = a.scheme, sid = "scheme:" + s.key;
      node(sid, "scheme", s.label, s.label + " " + s.ministry + " " + s.category, { key: s.key });
      G.schemeIds.push(sid);
      node("ministry:" + s.ministry, "ministry", s.ministry); edge(sid, "ministry:" + s.ministry, "administered_by");
      node("sector:" + s.category, "sector", s.category); edge(sid, "sector:" + s.category, "in_sector");
      [a.cA, a.cB].forEach(function (claims, i) {
        const d = s.docs[i], did = "doc:" + s.key + ":" + i;
        node(did, "document", d.title + " (" + s.label + ")", d.title + " " + d.source + " " + s.label, { scheme: sid });
        edge(did, sid, "describes");
        (d.text.match(/\b20\d{2}-\d{2}\b/g) || []).forEach(function (p) { node("period:" + p, "period", p); edge(did, "period:" + p, "covers_period"); });
        claims.forEach(function (c) {
          const cl = "claim:" + s.key + ":" + i + ":" + c.metricKey;
          node(cl, "claim", c.metricLabel + " [" + (i ? "B" : "A") + "]", c.metricLabel + " " + c.snippet + " " + s.label, { scheme: sid, claim: c, doc: i });
          edge(did, cl, "states");
          node("metric:" + c.metricKey, "metric", c.metricLabel);
          edge(cl, "metric:" + c.metricKey, "measures"); edge(sid, "metric:" + c.metricKey, "reports");
        });
      });
      a.rows.forEach(function (r) {
        if (r.a && r.b) edge("claim:" + s.key + ":0:" + r.key, "claim:" + s.key + ":1:" + r.key, r.verdict === "mismatch" ? "conflicts_with" : "agrees_with", { pct: r.pctDiff, metric: r.label, metricKey: r.key });
      });
      a.alloc.forEach(function (x) { edge(sid, "state:" + x.code, "allocated_to", { amount: x.amount }); });
    });
    G.index = buildIndex(Object.keys(G.nodes).map(function (id) { return { id: id, text: G.nodes[id].text }; }));
    G.aliases = buildAliases(G);
    return G;
  }

  // ---------- graph helpers ----------
  function outs(G, id, rel) { return (G.out[id] || []).filter(function (e) { return !rel || e.rel === rel; }); }
  function ins(G, id, rel) { return (G.inn[id] || []).filter(function (e) { return !rel || e.rel === rel; }); }
  function lbl(G, id) { return G.nodes[id].label; }
  function fmtCr(n) { return "\u20b9" + Math.round(n).toLocaleString("en-IN") + " crore"; }
  function schemeClaims(G, sid) {
    const out = [];
    ins(G, sid, "describes").forEach(function (d) { outs(G, d.from, "states").forEach(function (c) { out.push(c.to); }); });
    return out;
  }
  function schemeConflicts(G, sid, metricSet) {   // scheme <-describes- doc -states-> claim -conflicts_with-> claim
    const res = [];
    schemeClaims(G, sid).forEach(function (cid) {
      outs(G, cid, "conflicts_with").forEach(function (e) {
        if (!metricSet || !metricSet.length || metricSet.indexOf("metric:" + e.metricKey) !== -1) res.push(e);
      });
    });
    return res;
  }
  function schemesOfNode(G, id) {
    const n = G.nodes[id]; if (!n) return [];
    if (n.type === "scheme") return [id];
    if (n.scheme) return [n.scheme];
    if (n.type === "ministry") return ins(G, id, "administered_by").map(function (e) { return e.from; });
    if (n.type === "sector") return ins(G, id, "in_sector").map(function (e) { return e.from; });
    if (n.type === "metric") return ins(G, id, "reports").map(function (e) { return e.from; });
    if (n.type === "state") return ins(G, id, "allocated_to").map(function (e) { return e.from; });
    return [];
  }

  // ---------- entity linking ----------
  const METRIC_WORDS = { funds_released_cr: ["released", "fund release", "central funds"], funds_allocated_cr: ["funds allocated"], completion_pct: ["completion", "completed"], coverage_pct: ["coverage"],
    units_sanctioned: ["sanctioned", "houses sanctioned"], persondays_generated: ["person-days", "persondays"], subsidy_disbursed_cr: ["subsidy"], capacity_added_gw: ["capacity"],
    loans_disbursed_cr: ["loans"], accounts_opened: ["accounts opened", "accounts"], beneficiaries_covered: ["beneficiaries"], wages_disbursed: ["wages"], claims_settled_cr: ["claims"],
    villages_covered_lakh: ["villages"], hospitals_empanelled: ["hospitals"], schools_covered_lakh: ["schools"], children_covered_cr: ["children"], installations_completed_lakh: ["installations"],
    road_length_km: ["roads", "road length"], target_achieved_pct: ["target"], gram_panchayats_connected: ["gram panchayats"], average_wage_rate: ["wage rate"] };
  const REGION_PATTERNS = { "Northeast": /\bnorth[\s-]?east(ern)?\b/, "North": /\bnorth(ern)?\b/, "South": /\bsouth(ern)?\b/, "East": /\beast(ern)?\b/, "West": /\bwest(ern)?\b/, "Central": /\bcentral\b/, "Islands": /\bislands?\b/ };

  function aliasRegex(a) {
    const parts = a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    return parts.length ? new RegExp("\\b" + parts.join("[^a-z0-9]*") + "\\b") : null;
  }
  function buildAliases(G) {
    const list = [];
    function add(id, type, alias) { const re = aliasRegex(alias); if (re && alias.length >= 3) list.push({ id: id, type: type, re: re }); }
    Object.keys(G.nodes).forEach(function (id) {
      const n = G.nodes[id];
      if (n.type === "scheme") {
        n.label.split(/\s[\u2014\u2013-]\s/).forEach(function (p) { add(id, "scheme", p); });
      } else if (n.type === "ministry") {
        add(id, "ministry", n.label);
        n.label.split(",").forEach(function (p) { add(id, "ministry", p.trim()); add(id, "ministry", p.replace(/^(Ministry|Dept\.?|Department) of /i, "").trim()); });
      } else if (n.type === "sector") {
        add(id, "sector", n.label); n.label.split(/\s*(?:&|,|\/| and )\s*/).forEach(function (p) { if (p.trim().length >= 6) add(id, "sector", p.trim()); });
      } else if (n.type === "state") {
        add(id, "state", n.label); Object.keys(Alloc.CITIES).forEach(function (c) { if ("state:" + Alloc.CITIES[c] === id) add(id, "state", c); });
      } else if (n.type === "metric") {
        add(id, "metric", n.label); ((METRIC_WORDS[id.slice(7)]) || []).forEach(function (w) { add(id, "metric", w); });
      }
    });
    return list;
  }
  function link(G, question) {
    const q = question.toLowerCase(), L = { scheme: [], ministry: [], sector: [], state: [], metric: [], period: [], region: [] };
    G.aliases.forEach(function (a) { if (a.re.test(q) && L[a.type].indexOf(a.id) === -1) L[a.type].push(a.id); });
    (q.match(/\b20\d{2}-\d{2}\b/g) || []).forEach(function (p) { if (G.nodes["period:" + p]) L.period.push("period:" + p); });
    let rq = q;
    ["Northeast", "Islands", "Central", "South", "East", "West", "North"].forEach(function (r) {
      if (REGION_PATTERNS[r].test(rq) && (/\b(region|zone|states?|parts?|india)\b|ern\b|\b(in|across|for|of) the\b/.test(rq) || r === "Northeast" || r === "Islands")) { L.region.push("region:" + r); }
      rq = rq.replace(REGION_PATTERNS[r], " ");
    });
    if (L.ministry.length || L.scheme.length) L.sector = [];
    if (L.state.length) L.region = [];   // a named place is more specific than a region
    return L;
  }

  // ---------- multi-hop question answering ----------
  function ask(G, question) {
    const q = question.toLowerCase(), L = link(G, question), trace = [];
    const flags = { mismatch: /mismatch|disagree|conflict|inconsist|discrepan|differ|contradict/.test(q), alloc: /alloc|fund|budget|money|receiv|crore|share|spend|amount|rupee|\u20b9|how much/.test(q),
      top: /\b(top|most|highest|largest|biggest|maximum)\b/.test(q), low: /\b(lowest|least|smallest|minimum)\b/.test(q) };
    const hits = G.index.search(question, 8).map(function (h) { return { node: G.nodes[h.id], score: h.score }; });
    trace.push({ hop: "Vector search", text: hits.length ? "Top semantic matches: " + hits.slice(0, 4).map(function (h) { return h.node.label + " (" + h.score.toFixed(2) + ")"; }).join(", ") : "No semantic matches found." });
    const linkedNames = [];
    ["ministry", "scheme", "sector", "state", "metric", "period", "region"].forEach(function (t) { if (L[t].length) linkedNames.push(t + ": " + L[t].map(function (id) { return lbl(G, id); }).join(" / ")); });
    if (linkedNames.length) trace.push({ hop: "Entity linking", text: linkedNames.join(" \u00b7 ") });

    let cands = G.schemeIds.slice(), constrained = false;
    if (L.scheme.length) { cands = L.scheme.slice(); constrained = true; }
    if (L.ministry.length) {
      cands = cands.filter(function (s) { return outs(G, s, "administered_by").some(function (e) { return L.ministry.indexOf(e.to) !== -1; }); }); constrained = true;
      trace.push({ hop: "Hop 1", text: "Ministry \u2190administered_by\u2190 Scheme: " + cands.length + " scheme(s) under " + L.ministry.map(function (m) { return lbl(G, m); }).join(" / ") });
    } else if (L.sector.length) {
      cands = cands.filter(function (s) { return outs(G, s, "in_sector").some(function (e) { return L.sector.indexOf(e.to) !== -1; }); }); constrained = true;
      trace.push({ hop: "Hop 1", text: "Sector \u2190in_sector\u2190 Scheme: " + cands.length + " scheme(s) in " + L.sector.map(function (m) { return lbl(G, m); }).join(" / ") });
    }
    if (L.metric.length) {
      const before = cands.length;
      cands = cands.filter(function (s) { return outs(G, s, "reports").some(function (e) { return L.metric.indexOf(e.to) !== -1; }); }); constrained = true;
      trace.push({ hop: "Hop 2", text: "Scheme \u2190describes\u2190 Document \u2192states\u2192 Claim \u2192measures\u2192 Metric (" + L.metric.map(function (m) { return lbl(G, m); }).join(", ") + "): " + before + " \u2192 " + cands.length });
    }
    if (L.period.length) {
      cands = cands.filter(function (s) { return ins(G, s, "describes").some(function (d) { return outs(G, d.from, "covers_period").some(function (e) { return L.period.indexOf(e.to) !== -1; }); }); }); constrained = true;
      trace.push({ hop: "Hop 2", text: "Document \u2192covers_period\u2192 Period: " + cands.length + " scheme(s) report " + L.period.map(function (p) { return lbl(G, p); }).join(", ") });
    }
    let source = "graph";
    if (!constrained && !flags.mismatch) {                     // pure semantic question: seed from vector hits, then expand
      const seeded = []; hits.slice(0, 5).forEach(function (h) { schemesOfNode(G, h.node.id).forEach(function (s) { if (seeded.indexOf(s) === -1) seeded.push(s); }); });
      if (seeded.length && !(L.state.length || L.region.length)) { cands = seeded.slice(0, 6); source = "vector"; trace.push({ hop: "Seed", text: "Schemes reached from the vector hits: " + cands.map(function (s) { return lbl(G, s); }).join(", ") }); }
    }

    const nothing = !constrained && source === "graph" && !flags.mismatch && !flags.alloc && !L.state.length && !L.region.length;
    if (nothing) cands = [];
    const metricFilter = L.metric.length ? L.metric : null;
    let results = cands.map(function (sid) { return { sid: sid, conflicts: schemeConflicts(G, sid, metricFilter), amount: 0 }; });
    if (flags.mismatch) {
      results = results.filter(function (r) { return r.conflicts.length; });
      trace.push({ hop: "Hop 3", text: "Scheme \u2190describes\u2190 Document \u2192states\u2192 Claim \u2192conflicts_with\u2192 Claim: " + results.length + " scheme(s) have disagreeing documents" });
    }
    const target = L.state.slice();
    L.region.forEach(function (r) { ins(G, r, "in_region").forEach(function (e) { if (target.indexOf(e.from) === -1) target.push(e.from); }); });
    if (target.length) {
      results.forEach(function (r) { outs(G, r.sid, "allocated_to").forEach(function (e) { if (target.indexOf(e.to) !== -1) r.amount += e.amount; }); });
      trace.push({ hop: "Hop " + (flags.mismatch ? 4 : 3), text: "Scheme \u2192allocated_to\u2192 State: summed allocation to " + target.slice(0, 4).map(function (s) { return lbl(G, s); }).join(", ") + (target.length > 4 ? " +" + (target.length - 4) + " more" : "") });
    } else {
      results.forEach(function (r) { r.amount = G.analysis.find(function (a) { return "scheme:" + a.scheme.key === r.sid; }).total; });
    }
    const maxPct = function (r) { return r.conflicts.length ? Math.max.apply(null, r.conflicts.map(function (e) { return e.pct; })) : 0; };
    results.sort(function (a, b) {
      if (flags.mismatch && !flags.alloc) return maxPct(b) - maxPct(a);
      return flags.low ? a.amount - b.amount : b.amount - a.amount;
    });
    const shown = results.slice(0, flags.top || flags.low ? 5 : 12);

    // per-state totals across matched schemes (when no place was named)
    const stateTotals = {};
    if (!target.length) results.forEach(function (r) { outs(G, r.sid, "allocated_to").forEach(function (e) { stateTotals[e.to] = (stateTotals[e.to] || 0) + e.amount; }); });
    const topStates = Object.keys(stateTotals).sort(function (a, b) { return stateTotals[b] - stateTotals[a]; }).slice(0, 5);

    // graph-expansion: siblings reached via ministry / sector
    const related = [];
    shown.slice(0, 3).forEach(function (r) {
      outs(G, r.sid, "administered_by").forEach(function (m) { ins(G, m.to, "administered_by").forEach(function (s) { if (s.from !== r.sid && !results.some(function (x) { return x.sid === s.from; }) && related.indexOf(s.from) === -1) related.push(s.from); }); });
    });

    // answer text
    const paragraphs = [], items = [];
    const cons = []; if (L.ministry.length) cons.push("ministry " + L.ministry.map(function (m) { return lbl(G, m); }).join(" / ")); if (L.sector.length) cons.push("sector " + L.sector.map(function (m) { return lbl(G, m); }).join(" / "));
    if (L.metric.length) cons.push("metric " + L.metric.map(function (m) { return lbl(G, m); }).join(" / ")); if (target.length) cons.push("location " + (L.state.length ? L.state.map(function (m) { return lbl(G, m); }).join(" / ") : L.region.map(function (m) { return lbl(G, m); }).join(" / ")));
    if (flags.mismatch) cons.push("documents disagree"); if (L.period.length) cons.push("period " + L.period.map(function (p) { return lbl(G, p); }).join(", "));
    if (nothing) {
      paragraphs.push("I could not link that question to any ministry, scheme, sector, state, metric or period. Try naming one, for example a ministry (\"Ministry of Jal Shakti\"), a place (\"Karnataka\"), or a topic (\"tap water\", \"solar capacity\").");
    } else if (!results.length) {
      paragraphs.push("The graph found no scheme satisfying all constraints" + (cons.length ? " (" + cons.join("; ") + ")" : "") + ". Try relaxing the tolerance slider or naming a ministry, sector, state or metric.");
    } else {
      paragraphs.push(results.length + " scheme" + (results.length > 1 ? "s" : "") + " reached by graph traversal" + (cons.length ? " for " + cons.join("; ") : "") + ".");
      if (target.length) { const tot = results.reduce(function (s, r) { return s + r.amount; }, 0); paragraphs.push("Combined illustrative allocation to " + (L.state.length ? L.state.map(function (m) { return lbl(G, m); }).join(" / ") : "the selected region") + " across these schemes: " + fmtCr(tot) + "."); }
      else if (topStates.length && flags.alloc) paragraphs.push("States receiving the most across these schemes: " + topStates.slice(0, 3).map(function (s) { return lbl(G, s) + " (" + fmtCr(stateTotals[s]) + ")"; }).join(", ") + ".");
    }
    if (results.length && results.length <= 8) {
      const mins = []; results.forEach(function (r) { outs(G, r.sid, "administered_by").forEach(function (e) { if (mins.indexOf(lbl(G, e.to)) === -1) mins.push(lbl(G, e.to)); }); });
      paragraphs.push("Administered by: " + mins.join("; ") + ".");
    }
    shown.forEach(function (r) {
      const n = G.nodes[r.sid], min = outs(G, r.sid, "administered_by")[0], parts = [];
      if (r.conflicts.length) parts.push(r.conflicts.map(function (e) {
        const a = G.nodes[e.from].claim, b = G.nodes[e.to].claim;
        return e.metric + ": " + Ext.fmt(a.value, a.unit) + " (A) vs " + Ext.fmt(b.value, b.unit) + " (B), " + e.pct.toFixed(1) + "% apart";
      }).join("; "));
      if (!r.conflicts.length && metricFilter) schemeClaims(G, r.sid).forEach(function (cid) {
        const c = G.nodes[cid]; if (metricFilter.indexOf("metric:" + c.claim.metricKey) !== -1) parts.push(c.claim.metricLabel + " [" + (c.doc ? "B" : "A") + "]: " + Ext.fmt(c.claim.value, c.claim.unit));
      });
      if (flags.alloc || target.length) parts.push((target.length ? "Allocation to selected location: " : "National fund base: ") + fmtCr(r.amount));
      items.push({ id: r.sid, label: n.label, ministry: min ? lbl(G, min.to) : "", detail: parts.join(" \u00b7 "), conflict: r.conflicts.length > 0,
        path: (min ? lbl(G, min.to) + " \u2190administered_by\u2190 " : "") + n.label + (r.conflicts.length ? " \u2190describes\u2190 Doc A/B \u2192states\u2192 Claims \u2192conflicts_with\u2192 Claims" : "") });
    });

    // baseline: plain vector search only
    // (a vector-only system returns passages, so only hits that are themselves scheme/claim/document text count)
    const vecSchemes = []; hits.slice(0, 5).forEach(function (h) {
      if (["scheme", "claim", "document"].indexOf(h.node.type) !== -1) schemesOfNode(G, h.node.id).forEach(function (s) { if (vecSchemes.indexOf(s) === -1) vecSchemes.push(s); });
    });
    const vecCorrect = vecSchemes.filter(function (s) { return results.some(function (r) { return r.sid === s; }); });

    // subgraph for the visual
    const sel = {}; const add = function (id) { if (id && G.nodes[id]) sel[id] = true; };
    shown.slice(0, 4).forEach(function (r) {
      add(r.sid); outs(G, r.sid, "administered_by").forEach(function (e) { add(e.to); });
      r.conflicts.slice(0, 1).forEach(function (e) { add(e.from); add(e.to); add(G.nodes[e.from].scheme && "doc:" + G.nodes[e.from].scheme.slice(7) + ":0"); add("doc:" + G.nodes[e.from].scheme.slice(7) + ":1"); });
    });
    if (target.length) target.slice(0, 3).forEach(add); else topStates.slice(0, 3).forEach(add);
    if (!shown.some(function (r) { return r.conflicts.length; })) shown.slice(0, 3).forEach(function (r) { schemeClaims(G, r.sid).slice(0, 2).forEach(add); });
    const ids = Object.keys(sel).slice(0, 40), edges = [];
    ids.forEach(function (id) { outs(G, id).forEach(function (e) { if (sel[e.to] && ["in_region", "reports", "measures", "in_sector", "covers_period"].indexOf(e.rel) === -1) edges.push(e); }); });

    return { question: question, flags: flags, linked: L, trace: trace, paragraphs: paragraphs, items: items, total: results.length, related: related.slice(0, 6).map(function (s) { return lbl(G, s); }),
      hits: hits.slice(0, 5), vector: { schemes: vecSchemes.map(function (s) { return lbl(G, s); }), correct: vecCorrect.length }, graphCount: results.length, source: source,
      subgraph: { nodes: ids.map(function (id) { return G.nodes[id]; }), edges: edges } };
  }

  const EXAMPLES = [
    "Which schemes under the Ministry of Jal Shakti have documents that disagree?",
    "Which mismatched schemes give the most allocation to Karnataka?",
    "Which energy schemes report capacity and who administers them?",
    "How much is allocated to Bihar across health schemes?",
    "Which schemes have conflicting funds released figures in the northeast?",
    "Which ministry runs schemes about tap water and what do the reports say?"
  ];

  function stats(G) {
    const c = {}; Object.keys(G.nodes).forEach(function (id) { const t = G.nodes[id].type; c[t] = (c[t] || 0) + 1; });
    return { nodes: Object.keys(G.nodes).length, edges: G.edgeCount, byType: c };
  }

  const api = { analyze: analyze, buildGraph: buildGraph, ask: ask, stats: stats, buildIndex: buildIndex, EXAMPLES: EXAMPLES, fmtCr: fmtCr };
  if (isNode) module.exports = api; else global.CrossCheckGraph = api;
})(typeof window !== "undefined" ? window : this);
