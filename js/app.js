(function () {
  const documentStore = window.CrossCheckDocumentStore || null;
  const schemeLibrary = documentStore ? documentStore.SCHEME_LIBRARY : window.SAMPLE_SETS;
  const categories = documentStore && documentStore.getCategories ? documentStore.getCategories() : [];
  const { extractClaims, fmt } = window.CrossCheckExtraction;
  const { compare } = window.CrossCheckMatching;
  const I18n = window.CrossCheckI18n;
  const t = I18n.t;

  let currentScheme = "pmayg";
  let claimsA = [];
  let claimsB = [];
  let lastRows = [];
  let hasRun = false;

  const el = {
    schemeNav: document.getElementById("schemeNav"),
    schemeFilter: document.getElementById("schemeFilter"),
    tolSlider: document.getElementById("toleranceSlider"),
    tolValue: document.getElementById("toleranceValue"),
    runBtn: document.getElementById("runBtn"),
    exportBtn: document.getElementById("exportBtn"),
    controlSchemeName: document.getElementById("controlSchemeName"),
    controlSchemeMinistry: document.getElementById("controlSchemeMinistry"),
    docATitle: document.getElementById("docATitle"),
    docASource: document.getElementById("docASource"),
    docAInput: document.getElementById("docAInput"),
    docARead: document.getElementById("docARead"),
    docBTitle: document.getElementById("docBTitle"),
    docBSource: document.getElementById("docBSource"),
    docBInput: document.getElementById("docBInput"),
    docBRead: document.getElementById("docBRead"),
    summaryRow: document.getElementById("summaryRow"),
    resultsBody: document.getElementById("resultsBody"),
    resultsViewToggle: document.getElementById("resultsViewToggle"),
    schemeSourcesLabel: document.getElementById("schemeSourcesLabel"),
    schemeSources: document.getElementById("schemeSources"),
    allSources: document.getElementById("allSources"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    drawerBody: document.getElementById("drawerBody"),
    drawerClose: document.getElementById("drawerClose"),
  };

  let resultsView = "table";
  let fontSizeLevel = 0;

  function applyAccessibilityState() {
    const root = document.documentElement;
    const baseSize = 15;
    const sizePx = baseSize + fontSizeLevel;

    root.style.setProperty("--app-font-size", sizePx + "px");
    root.style.fontSize = sizePx + "px";

    const activeLang = root.lang || "en";
    const activeFont = document.getElementById("fontFamilySelect")?.value || "sans";

    document.body.classList.toggle("lang-hi", activeLang === "hi");
    document.body.classList.toggle("font-serif", activeFont === "serif");
    document.body.classList.toggle("font-hindi", activeFont === "hindi");
    document.body.classList.toggle("font-sans", activeFont === "sans");

    document.querySelectorAll(".lang-toggle").forEach(function (btn) {
      const isActive = btn.dataset.lang === activeLang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });

    document.querySelectorAll(".font-size-btn").forEach(function (btn) {
      const isReset = btn.dataset.action === "reset";
      btn.classList.toggle("active", isReset && fontSizeLevel === 0);
    });

    const familySelect = document.getElementById("fontFamilySelect");
    if (familySelect) familySelect.value = activeFont;
  }

  function setLanguage(lang) {
    document.documentElement.lang = lang;
    document.body.classList.toggle("lang-hi", lang === "hi");
    applyAccessibilityState();
    I18n.setLang(lang);
    updateTolText();
    updateStatusPill();
    if (hasRun) recompute();
  }

  function changeFontSize(action) {
    if (action === "increase") fontSizeLevel = Math.min(4, fontSizeLevel + 1);
    if (action === "decrease") fontSizeLevel = Math.max(-4, fontSizeLevel - 1);
    if (action === "reset") fontSizeLevel = 0;
    applyAccessibilityState();
  }

  function setFontFamily(family) {
    const select = document.getElementById("fontFamilySelect");
    if (select) select.value = family;
    applyAccessibilityState();
  }

  function setupAccessibilityControls() {
    document.querySelectorAll(".lang-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLanguage(btn.dataset.lang || "en");
      });
    });

    document.querySelectorAll(".font-size-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        changeFontSize(btn.dataset.action || "reset");
      });
    });

    const familySelect = document.getElementById("fontFamilySelect");
    if (familySelect) {
      familySelect.addEventListener("change", function () {
        setFontFamily(familySelect.value);
      });
    }

    document.documentElement.lang = document.documentElement.lang || "en";
    setFontFamily(document.getElementById("fontFamilySelect") ? document.getElementById("fontFamilySelect").value || "sans" : "sans");
    applyAccessibilityState();
  }

  function getSchemeEntry(key) {
    return (schemeLibrary && schemeLibrary[key]) || (window.SAMPLE_SETS && window.SAMPLE_SETS[key]) || null;
  }

  function getAllSchemesOrdered() {
    if (documentStore && documentStore.getAllSchemes) return documentStore.getAllSchemes();
    return Object.keys(schemeLibrary || {}).map(function (k) { return schemeLibrary[k]; });
  }

  function resolveDocEntry(set, which) {
    if (!set) return { title: which === "A" ? "Document A" : "Document B", source: "", text: "" };
    const docs = Array.isArray(set.docs) && set.docs.length ? set.docs : [];
    const index = which === "A" ? 0 : 1;
    if (docs[index]) return { title: docs[index].title, source: docs[index].source, text: docs[index].text };
    const legacyKey = which === "A" ? "docA" : "docB";
    const legacy = set[legacyKey] || { title: which === "A" ? "Document A" : "Document B", source: "", text: "" };
    return { title: legacy.title, source: legacy.source, text: legacy.text };
  }

  function escapeHtml(s) {
    const value = String(s || "");
    return value.replace(/[&<>]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]; });
  }

  // ---- Sidebar scheme directory, grouped by sector ----
  function renderSchemeNav() {
    const all = getAllSchemesOrdered();
    const byCategory = {};
    all.forEach(function (s) {
      const cat = s.category || "Other";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(s);
    });

    const order = categories.length ? categories : Object.keys(byCategory);
    let html = "";
    order.forEach(function (cat) {
      const items = byCategory[cat];
      if (!items || !items.length) return;
      html += '<div class="scheme-cat" data-cat="' + escapeHtml(cat) + '">';
      html += '<div class="scheme-cat-label">' + escapeHtml(cat) + "</div>";
      items.forEach(function (s) {
        html += '<button class="scheme-item' + (s.key === currentScheme ? " active" : "") + '" data-key="' + s.key + '" data-search="' +
          escapeHtml((s.label + " " + (s.ministry || "")).toLowerCase()) + '">' +
          escapeHtml(s.label) + (s.ministry ? '<span class="si-ministry">' + escapeHtml(s.ministry) + "</span>" : "") +
          "</button>";
      });
      html += "</div>";
    });
    el.schemeNav.innerHTML = html;
    el.schemeNav.querySelectorAll(".scheme-item").forEach(function (btn) {
      btn.addEventListener("click", function () { selectScheme(btn.dataset.key); });
    });
  }

  function filterSchemeNav(query) {
    const q = (query || "").trim().toLowerCase();
    el.schemeNav.querySelectorAll(".scheme-item").forEach(function (btn) {
      const match = !q || (btn.dataset.search || "").indexOf(q) !== -1;
      btn.classList.toggle("hidden", !match);
    });
    el.schemeNav.querySelectorAll(".scheme-cat").forEach(function (group) {
      const anyVisible = Array.prototype.some.call(group.querySelectorAll(".scheme-item"), function (btn) {
        return !btn.classList.contains("hidden");
      });
      group.style.display = anyVisible ? "" : "none";
    });
  }

  function selectScheme(key) {
    currentScheme = key;
    const set = getSchemeEntry(key) || { label: key, ministry: "", sourcePool: window.OFFICIAL_SOURCES || [] };
    const docA = resolveDocEntry(set, "A");
    const docB = resolveDocEntry(set, "B");

    el.controlSchemeName.textContent = set.label || key;
    el.controlSchemeMinistry.textContent = set.ministry || "Custom input — paste your own text";

    el.docATitle.textContent = docA.title;
    el.docASource.textContent = docA.source;
    el.docAInput.value = docA.text;
    el.docBTitle.textContent = docB.title;
    el.docBSource.textContent = docB.source;
    el.docBInput.value = docB.text;
    setView("A", "edit");
    setView("B", "edit");
    hasRun = false;
    el.summaryRow.innerHTML = "";
    el.resultsBody.innerHTML = '<div class="empty-state">Press &ldquo;Run CrossCheck&rdquo; to extract and compare claims for this scheme.</div>';

    el.schemeNav.querySelectorAll(".scheme-item").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.key === key);
    });

    renderSources(set);
    runCrossCheck();
  }

  function renderSources(set) {
    const sources = set && (set.sourcePool || set.sources || []);
    el.schemeSourcesLabel.textContent = set && set.ministry ? "Relevant to " + set.label : "Relevant sources";
    el.schemeSources.innerHTML = (sources || []).map(sourceItem).join("") ||
      '<li class="source-note-empty" style="color:var(--ink-soft);font-size:0.78rem;">Paste your own document text above, then check it against the full source directory on the right.</li>';
    el.allSources.innerHTML = (window.OFFICIAL_SOURCES || []).map(sourceItem).join("");
  }

  function sourceItem(s) {
    return '<li><a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(s.label) +
      ' <span class="ext-arrow">&#8599;</span></a>' + (s.note ? '<span class="source-note">' + escapeHtml(s.note) + "</span>" : "") + "</li>";
  }

  function setView(doc, view) {
    const input = doc === "A" ? el.docAInput : el.docBInput;
    const read = doc === "A" ? el.docARead : el.docBRead;
    const toggle = document.querySelector('.view-toggle[data-doc="' + doc + '"]');
    if (!toggle) return;
    toggle.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", b.dataset.view === view); });
    if (view === "edit") {
      input.style.display = "";
      read.style.display = "none";
    } else {
      input.style.display = "none";
      read.style.display = "";
      renderHighlighted(doc);
    }
  }

  function renderHighlighted(doc) {
    const input = doc === "A" ? el.docAInput : el.docBInput;
    const read = doc === "A" ? el.docARead : el.docBRead;
    const text = input.value;
    if (!hasRun) {
      read.className = "doc-read empty";
      read.textContent = "Run CrossCheck first to see highlighted claims here.";
      return;
    }
    read.className = "doc-read";
    let html = escapeHtml(text);
    const rows = lastRows.filter(function (r) { return doc === "A" ? r.a : r.b; });
    const items = rows.map(function (r) {
      const claim = doc === "A" ? r.a : r.b;
      return { snippet: claim.snippet, cls: r.verdict === "match" ? "match" : (r.verdict === "mismatch" ? "mismatch" : null) };
    }).filter(function (it) { return it.cls; }).sort(function (a, b) { return b.snippet.length - a.snippet.length; });

    items.forEach(function (it) {
      const escSnippet = escapeHtml(it.snippet);
      if (html.indexOf(escSnippet) !== -1) {
        html = html.split(escSnippet).join('<mark class="' + it.cls + '">' + escSnippet + '</mark>');
      }
    });
    read.innerHTML = html;
  }

  function currentTolerance() { return parseFloat(el.tolSlider.value); }
  function updateTolText() { el.tolValue.textContent = t("tolText", { v: parseFloat(el.tolSlider.value).toFixed(1) }); }
  function updateStatusPill() {
    const n = getAllSchemesOrdered().filter(function (s) { return s.key !== "custom"; }).length;
    document.getElementById("statusPill").textContent = t("indexed", { n: n });
  }

  function runCrossCheck() {
    claimsA = extractClaims(el.docAInput.value);
    claimsB = extractClaims(el.docBInput.value);
    hasRun = true;
    recompute();
  }

  function recompute() {
    lastRows = compare(claimsA, claimsB, currentTolerance());
    renderSummary(lastRows);
    renderResults(lastRows);
    ["A", "B"].forEach(function (doc) {
      const read = doc === "A" ? el.docARead : el.docBRead;
      if (read.style.display !== "none") renderHighlighted(doc);
    });
  }

  function renderSummary(rows) {
    const counts = { match: 0, mismatch: 0, unverif: 0 };
    rows.forEach(function (r) { counts[r.verdict]++; });
    el.summaryRow.innerHTML =
      statCard(counts.match, t("match"), "match") +
      statCard(counts.mismatch, t("mismatch"), "mismatch") +
      statCard(counts.unverif, t("unverif"), "unverif");
  }

  function statCard(n, label, cls) {
    return '<div class="stat-card ' + cls + '"><div class="stat-num">' + n + '</div><div class="stat-label">' + label + '</div></div>';
  }

  function renderResults(rows) {
    if (!rows.length) {
      el.resultsBody.innerHTML = '<div class="empty-state">No recognised metrics found in either document. Try a scheme from the directory, or paste text containing phrases like &ldquo;X crore houses sanctioned&rdquo; or &ldquo;X% coverage&rdquo;.</div>';
      return;
    }
    if (resultsView === "grid") renderResultsGrid(rows);
    else renderResultsTable(rows);
  }

  function renderResultsTable(rows) {
    let html = '<table class="verdict-table"><thead><tr>' +
      "<th style='width:24%'>Metric</th><th style='width:26%'>Document A</th><th style='width:26%'>Document B</th>" +
      "<th style='width:12%'>Verdict</th><th style='width:12%'>Detail</th></tr></thead><tbody>";
    rows.forEach(function (r, i) {
      html += '<tr class="row-clickable" data-idx="' + i + '">';
      html += '<td class="metric-name">' + escapeHtml(r.label) + "</td>";
      html += "<td>" + cellFor(r.a) + "</td>";
      html += "<td>" + cellFor(r.b) + "</td>";
      html += '<td><span class="badge ' + r.verdict + '">' + verdictLabel(r.verdict) + "</span></td>";
      html += "<td>" + detailFor(r) + "</td>";
      html += "</tr>";
    });
    html += "</tbody></table>";
    el.resultsBody.innerHTML = html;
    el.resultsBody.querySelectorAll("tr[data-idx]").forEach(function (tr) {
      tr.addEventListener("click", function () { openDrawer(parseInt(tr.dataset.idx, 10)); });
    });
  }

  function renderResultsGrid(rows) {
    let html = '<div class="verdict-grid">';
    rows.forEach(function (r, i) {
      html += '<div class="verdict-card ' + r.verdict + '" data-idx="' + i + '" tabindex="0">';
      html += '<div class="vc-top"><span class="badge ' + r.verdict + '">' + verdictLabel(r.verdict) + "</span></div>";
      html += '<div class="vc-metric">' + escapeHtml(r.label) + "</div>";
      html += '<div class="vc-values">';
      html += '<div class="vc-val"><span class="vc-doc-tag">A</span>' + (r.a ? escapeHtml(fmt(r.a.value, r.a.unit)) : "<em>not found</em>") + "</div>";
      html += '<div class="vc-val"><span class="vc-doc-tag">B</span>' + (r.b ? escapeHtml(fmt(r.b.value, r.b.unit)) : "<em>not found</em>") + "</div>";
      html += "</div>";
      html += '<div class="vc-detail">' + detailFor(r) + "</div>";
      html += '<div class="vc-open">View detail &rarr;</div>';
      html += "</div>";
    });
    html += "</div>";
    el.resultsBody.innerHTML = html;
    el.resultsBody.querySelectorAll(".verdict-card").forEach(function (card) {
      card.addEventListener("click", function () { openDrawer(parseInt(card.dataset.idx, 10)); });
      card.addEventListener("mousemove", handleTilt);
      card.addEventListener("mouseleave", resetTilt);
    });
  }

  function handleTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = "perspective(700px) rotateY(" + (x * 7) + "deg) rotateX(" + (-y * 7) + "deg) translateY(-2px)";
  }

  function resetTilt(e) { e.currentTarget.style.transform = ""; }

  function openDrawer(idx) {
    const r = lastRows[idx];
    if (!r) return;
    const set = getSchemeEntry(currentScheme) || {};
    let html = "";
    html += '<span class="badge ' + r.verdict + '">' + verdictLabel(r.verdict) + "</span>";
    html += "<h2>" + escapeHtml(r.label) + "</h2>";
    html += '<div class="drawer-meta">' + escapeHtml((set.ministry || "Custom input")) + " &middot; " + escapeHtml(set.label || "Case file") + "</div>";

    html += '<div class="drawer-block"><div class="drawer-block-label">Document A' + (r.a ? "" : " — not found") + "</div>";
    if (r.a) {
      html += '<div class="drawer-value">' + escapeHtml(fmt(r.a.value, r.a.unit)) + "</div>";
      html += '<blockquote>' + escapeHtml(r.a.snippet) + "</blockquote>";
    }
    html += "</div>";

    html += '<div class="drawer-block"><div class="drawer-block-label">Document B' + (r.b ? "" : " — not found") + "</div>";
    if (r.b) {
      html += '<div class="drawer-value">' + escapeHtml(fmt(r.b.value, r.b.unit)) + "</div>";
      html += '<blockquote>' + escapeHtml(r.b.snippet) + "</blockquote>";
    }
    html += "</div>";

    html += '<div class="drawer-block"><div class="drawer-block-label">Verdict detail</div>';
    if (r.verdict === "mismatch" && r.a && r.b) {
      const diff = Math.abs(r.a.value - r.b.value);
      html += "<p>Values differ by " + escapeHtml(fmt(diff, r.a.unit)) + ", a " + r.pctDiff.toFixed(2) +
        "% gap — outside the current " + currentTolerance() + "% tolerance.</p>";
    } else if (r.verdict === "match" && r.a && r.b) {
      html += "<p>Values agree within the current " + currentTolerance() + "% tolerance" +
        (r.pctDiff > 0 ? " (" + r.pctDiff.toFixed(2) + "% apart)." : ".") + "</p>";
    } else {
      html += "<p>This metric was only found in one of the two documents, so no comparison could be made.</p>";
    }
    html += "</div>";

    const sources = set && (set.sourcePool || set.sources || []);
    if (sources && sources.length) {
      html += '<div class="drawer-block"><div class="drawer-block-label">Verify against the real source</div><ul class="source-list">' +
        sources.map(sourceItem).join("") + "</ul></div>";
    }

    el.drawerBody.innerHTML = html;
    el.drawerOverlay.classList.add("open");
  }

  function closeDrawer() { el.drawerOverlay.classList.remove("open"); }

  function cellFor(claim) {
    if (!claim) return "<em style='color:var(--ink-soft)'>not found</em>";
    return '<span class="val-num">' + escapeHtml(fmt(claim.value, claim.unit)) + '</span>' +
      '<div class="snippet-quote">&ldquo;' + escapeHtml(claim.snippet) + '&rdquo;</div>';
  }

  function verdictLabel(v) { return t(v === "match" ? "match" : v === "mismatch" ? "mismatch" : "unverif"); }

  function detailFor(r) {
    if (r.verdict === "mismatch" && r.a && r.b) {
      const diff = Math.abs(r.a.value - r.b.value);
      return '<div class="delta-note">&Delta; ' + escapeHtml(fmt(diff, r.a.unit)) + " (" + r.pctDiff.toFixed(1) + "% apart)</div>";
    }
    if (r.verdict === "unverif") return "<span style='color:var(--ink-soft); font-size:11.5px;'>only found in one document</span>";
    return "<span style='color:var(--ink-soft); font-size:11.5px;'>within tolerance</span>";
  }

  function exportReport() {
    const set = getSchemeEntry(currentScheme) || {};
    const reportText = documentStore && documentStore.buildProfessionalReport ? documentStore.buildProfessionalReport({
      scheme: { label: set.label || 'CrossCheck Scheme', ministry: set.ministry || 'Ministry not specified' },
      rows: lastRows,
      tolerance: currentTolerance(),
      documentNames: [el.docATitle.textContent, el.docBTitle.textContent],
      createdAt: new Date().toISOString()
    }) : buildLegacyReport(set);

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crosscheck-report-" + currentScheme + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function buildLegacyReport(set) {
    const lines = [];
    lines.push("CROSSCHECK — CLAIM CONSISTENCY REPORT");
    lines.push("=".repeat(60));
    lines.push("Scheme: " + (set.label || "CrossCheck Scheme"));
    lines.push("Ministry: " + (set.ministry || "(not specified)"));
    lines.push("Tolerance applied: " + currentTolerance() + "%");
    lines.push("Generated: " + new Date().toISOString());
    lines.push("");
    lines.push("Document A: " + el.docATitle.textContent + " — " + el.docASource.textContent);
    lines.push("Document B: " + el.docBTitle.textContent + " — " + el.docBSource.textContent);
    lines.push("");
    lines.push("-".repeat(60));
    if (!lastRows.length) {
      lines.push("No claims extracted. Run CrossCheck before exporting.");
    } else {
      lastRows.forEach(function (r) {
        lines.push("METRIC: " + r.label);
        lines.push("  Document A: " + (r.a ? fmt(r.a.value, r.a.unit) + '  ("' + r.a.snippet + '")' : "not found"));
        lines.push("  Document B: " + (r.b ? fmt(r.b.value, r.b.unit) + '  ("' + r.b.snippet + '")' : "not found"));
        lines.push("  Verdict: " + verdictLabel(r.verdict).toUpperCase() + (r.pctDiff != null ? " (" + r.pctDiff.toFixed(1) + "% apart)" : ""));
        lines.push("");
      });
    }
    lines.push("-".repeat(60));
    lines.push("Generated locally by the CrossCheck prototype. Sample data is illustrative, not a quotation of any real document.");
    return lines.join("\n");
  }

  document.querySelectorAll(".view-toggle[data-doc]").forEach(function (toggle) {
    toggle.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () { setView(toggle.dataset.doc, btn.dataset.view); });
    });
  });

  el.tolSlider.addEventListener("input", function () {
    updateTolText();
    if (hasRun) recompute();
    document.dispatchEvent(new CustomEvent("cc:tolerance", { detail: currentTolerance() }));
  });

  el.runBtn.addEventListener("click", runCrossCheck);
  el.exportBtn.addEventListener("click", exportReport);

  el.resultsViewToggle.querySelectorAll("button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      resultsView = btn.dataset.view;
      el.resultsViewToggle.querySelectorAll("button").forEach(function (b) { b.classList.toggle("active", b === btn); });
      if (hasRun) renderResults(lastRows);
    });
  });

  el.schemeFilter.addEventListener("input", function () { filterSchemeNav(el.schemeFilter.value); });

  el.drawerClose.addEventListener("click", closeDrawer);
  el.drawerOverlay.addEventListener("click", function (e) { if (e.target === el.drawerOverlay) closeDrawer(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  // ---- Tabs ----
  document.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.toggle("active", b === btn); b.setAttribute("aria-selected", String(b === btn)); });
      document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.toggle("active", p.id === "tab-" + btn.dataset.tab); });
      document.dispatchEvent(new CustomEvent("cc:tab", { detail: btn.dataset.tab }));
    });
  });

  // ---- Re-run automatically (debounced) when the user edits either document ----
  let editTimer = null;
  [el.docAInput, el.docBInput].forEach(function (ta) {
    ta.addEventListener("input", function () { clearTimeout(editTimer); editTimer = setTimeout(runCrossCheck, 350); });
  });

  window.CrossCheckApp = { getSchemes: getAllSchemesOrdered, getTolerance: currentTolerance };
  setupAccessibilityControls();
  renderSchemeNav();
  updateTolText();
  updateStatusPill();
  selectScheme("pmayg");
})();
