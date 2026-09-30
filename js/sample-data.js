/**
 * sample-data.js
 * Central registry for illustrative scheme data and supporting government-source references.
 * When document-store.js has already loaded (the normal case), this module simply mirrors its
 * SCHEME_LIBRARY onto window.SAMPLE_SETS for backward compatibility and extends the official
 * source directory. The hardcoded fallback below only runs if document-store.js is unavailable.
 */
(function (global) {
  const OFFICIAL_SOURCES = [
    { label: "Lok Sabha — Questions & Answers", url: "https://sansad.in/ls/questions/questions-and-answers", note: "Search replies by ministry, member or date" },
    { label: "Rajya Sabha — Questions & Answers", url: "https://sansad.in/rs/questions/questions-and-answers", note: "Search replies by ministry, member or date" },
    { label: "eParlib — Parliament Digital Library", url: "https://eparlib.sansad.in", note: "Full debate and question archives" },
    { label: "Union Budget — Demands for Grants / Outcome Budget", url: "https://www.indiabudget.gov.in", note: "Ministry-wise budget documents, Ministry of Finance" },
    { label: "Press Information Bureau", url: "https://pib.gov.in", note: "Official ministry press releases and briefings" },
    { label: "Open Government Data Platform India", url: "https://data.gov.in", note: "Ministry-published datasets" },
    { label: "MyGov India", url: "https://www.mygov.in", note: "Citizen engagement platform, Government of India" },
    { label: "India.gov.in — National Portal", url: "https://www.india.gov.in", note: "Directory of ministries, departments and schemes" },
    { label: "RTI Online", url: "https://rtionline.gov.in", note: "File a Right to Information request with any public authority" }
  ];

  if (global.CrossCheckDocumentStore && global.CrossCheckDocumentStore.SCHEME_LIBRARY) {
    global.SAMPLE_SETS = global.CrossCheckDocumentStore.SCHEME_LIBRARY;
    global.OFFICIAL_SOURCES = OFFICIAL_SOURCES;
    return;
  }

  // Fallback registry — only used if document-store.js failed to load.
  const SAMPLE_SETS = {
    pmayg: {
      key: "pmayg",
      label: "PMAY-G — Rural Housing",
      ministry: "Ministry of Rural Development",
      category: "Housing & Urban Development",
      sourcePool: [
        { label: "PMAY-Gramin Mission", url: "https://pmayg.nic.in" },
        { label: "Ministry of Rural Development", url: "https://rural.gov.in" },
        { label: "Lok Sabha Q&A", url: "https://sansad.in/ls/questions/questions-and-answers" }
      ],
      docs: [
        { id: "pmayg-a", title: "Document A — Parliament Reply", source: "Lok Sabha Unstarred Question No. 1102 (illustrative)",
          text: "In reply to Lok Sabha Unstarred Question No. 1102, the Minister of Rural Development stated that under the Pradhan Mantri Awas Yojana-Gramin (PMAY-G), a cumulative total of 2.94 crore houses have been sanctioned as on 31 March 2024, against an overall target of 2.95 crore houses for the period 2016-17 to 2023-24. Central assistance amounting to Rs. 1,42,434 crore has been released to States and Union Territories during the corresponding period. As on date, 92% of the sanctioned houses stand completed." },
        { id: "pmayg-b", title: "Document B — Budget Document", source: "Ministry of Rural Development, Outcome Budget 2023-24 (illustrative)",
          text: "Pradhan Mantri Awas Yojana-Gramin (PMAY-G): Houses sanctioned cumulatively stand at 2.94 crore. Central share released under the scheme during the period under review amounted to Rs. 1,32,434 crore. Physical completion of sanctioned houses is reported at 89% as per the latest MIS data." }
      ]
    },
    custom: {
      key: "custom", label: "Custom — paste your own", ministry: "", category: "Custom",
      sourcePool: OFFICIAL_SOURCES,
      docs: [
        { id: "custom-doc-a", title: "Document A", source: "Paste any official text", text: "" },
        { id: "custom-doc-b", title: "Document B", source: "Paste any official text", text: "" }
      ]
    }
  };

  global.SAMPLE_SETS = SAMPLE_SETS;
  global.OFFICIAL_SOURCES = OFFICIAL_SOURCES;
})(typeof module !== "undefined" ? module.exports : window);
