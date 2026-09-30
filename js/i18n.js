/** i18n.js - English / Hindi UI strings. Elements use data-i18n (text) and data-i18n-ph (placeholder). */
(function (global) {
  const D = {
    kicker: ["Numeric Claim Consistency & Cross-Document Audit Portal", "संख्यात्मक दावा संगति एवं अंतर-दस्तावेज़ ऑडिट पोर्टल"],
    subtitle: ["Compares official Parliament replies, budget documents and dashboards for the same scheme and year, and flags where the reported numbers disagree.", "एक ही योजना और वर्ष के लिए संसदीय उत्तरों, बजट दस्तावेज़ों और डैशबोर्ड की तुलना करता है, और जहाँ आँकड़े मेल नहीं खाते वहाँ चिह्नित करता है।"],
    local: ["Runs entirely in your browser · no data leaves this page", "पूरी तरह आपके ब्राउज़र में चलता है · कोई डेटा इस पृष्ठ से बाहर नहीं जाता"],
    indexed: ["{n} SCHEMES INDEXED", "{n} योजनाएँ अनुक्रमित"],
    dir: ["Scheme Directory", "योजना निर्देशिका"], filter: ["Filter by scheme or ministry…", "योजना या मंत्रालय से फ़िल्टर करें…"],
    selected: ["Selected scheme", "चयनित योजना"], tolerance: ["Match tolerance", "मिलान सहनशीलता"], tolText: ["{v}% difference allowed", "{v}% अंतर स्वीकार्य"],
    run: ["Run CrossCheck", "क्रॉसचेक चलाएँ"], edit: ["Edit", "संपादित करें"], highlighted: ["Highlighted", "हाइलाइट"],
    verdicts: ["Claim-by-claim Verdict", "दावा-दर-दावा निर्णय"], table: ["Table", "तालिका"], grid: ["Grid", "ग्रिड"], export: ["Export Report (.txt)", "रिपोर्ट निर्यात (.txt)"],
    match: ["Match", "मेल खाता है"], mismatch: ["Mismatch", "मेल नहीं खाता"], unverif: ["Unverifiable", "सत्यापन योग्य नहीं"],
    sourcesHead: ["Where to find the real documents", "असली दस्तावेज़ कहाँ मिलेंगे"],
    tabVerify: ["Verify Documents", "दस्तावेज़ सत्यापन"], tabAsk: ["Ask the Graph", "ग्राफ़ से पूछें"], tabExplore: ["Ministry & Location Explorer", "मंत्रालय एवं स्थान अन्वेषक"],
    askTitle: ["Ask a multi-hop question", "बहु-चरणीय प्रश्न पूछें"],
    askSub: ["GraphRAG links entities across all indexed documents into a knowledge graph, seeds the search with vector similarity, then walks the graph hop by hop (ministry → scheme → document → claim → conflict, scheme → state) to answer questions no single document can.",
      "ग्राफ़RAG सभी अनुक्रमित दस्तावेज़ों की इकाइयों को ज्ञान-ग्राफ़ में जोड़ता है, वेक्टर समानता से खोज शुरू करता है, फिर ग्राफ़ में चरण-दर-चरण चलकर (मंत्रालय → योजना → दस्तावेज़ → दावा → विरोध, योजना → राज्य) ऐसे प्रश्नों का उत्तर देता है जो कोई एक दस्तावेज़ नहीं दे सकता।"],
    askPh: ["Ask about ministries, schemes, states, funds or disagreements…", "मंत्रालय, योजना, राज्य, निधि या असंगति के बारे में पूछें…"], askBtn: ["Ask the graph", "ग्राफ़ से पूछें"],
    answer: ["Answer", "उत्तर"], trace: ["Reasoning path (hops taken)", "तर्क-पथ (लिए गए चरण)"], compare: ["Why the graph matters", "ग्राफ़ क्यों ज़रूरी है"],
    vecOnly: ["Plain vector search", "केवल वेक्टर खोज"], graphRag: ["GraphRAG (vector + traversal)", "ग्राफ़RAG (वेक्टर + ट्रैवर्सल)"], subgraph: ["Evidence subgraph", "साक्ष्य उप-ग्राफ़"],
    related: ["Also reached through the graph (same ministry)", "ग्राफ़ से मिली अन्य योजनाएँ (समान मंत्रालय)"],
    ministry: ["Ministry", "मंत्रालय"], scheme: ["Scheme", "योजना"], state: ["State / UT", "राज्य / केंद्रशासित प्रदेश"], all: ["All", "सभी"],
    placePh: ["Search a city or state, e.g. Pune, Guwahati, Kerala…", "शहर या राज्य खोजें, जैसे पुणे, गुवाहाटी, केरल…"], search: ["Search", "खोजें"], locate: ["Use my location", "मेरा स्थान उपयोग करें"], reset: ["Reset", "रीसेट"],
    mapTitle: ["Allocation map", "आवंटन मानचित्र"], kAlloc: ["Allocation in view (₹ crore)", "आवंटन (₹ करोड़)"], kSchemes: ["Schemes", "योजनाएँ"], kDis: ["With disagreeing documents", "असंगत दस्तावेज़ वाली"],
    byMinistry: ["Ministry-wise allocation", "मंत्रालय-वार आवंटन"], byScheme: ["Schemes ranked by allocation", "आवंटन के अनुसार योजनाएँ"], forState: ["Schemes allocated to {s}", "{s} को आवंटित योजनाएँ"],
    low: ["Low", "कम"], high: ["High", "अधिक"]
  };
  let lang = "en";
  function t(k, vars) {
    const e = D[k]; let s = e ? e[lang === "hi" ? 1 : 0] : k;
    if (vars) Object.keys(vars).forEach(function (v) { s = s.replace("{" + v + "}", vars[v]); });
    return s;
  }
  function apply(root) {
    (root || document).querySelectorAll("[data-i18n]").forEach(function (n) { if (D[n.dataset.i18n]) n.textContent = t(n.dataset.i18n); });
    (root || document).querySelectorAll("[data-i18n-ph]").forEach(function (n) { if (D[n.dataset.i18nPh]) n.placeholder = t(n.dataset.i18nPh); });
  }
  function setLang(l) { lang = l === "hi" ? "hi" : "en"; apply(); document.dispatchEvent(new CustomEvent("cc:lang", { detail: lang })); }
  global.CrossCheckI18n = { t: t, apply: apply, setLang: setLang, lang: function () { return lang; } };
})(window);
