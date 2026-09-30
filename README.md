# CrossCheck — Numeric Claim Consistency Verifier

Given two official documents about the same scheme and year (e.g. a Parliament reply and a
budget document), CrossCheck extracts numeric claims, anchors them to a metric, joins them
across the documents and reports **Match / Mismatch / Unverifiable**, citing the exact source
sentence. It now also builds a **knowledge graph** over all 33 indexed schemes so you can ask
**multi-hop questions** (GraphRAG) and explore **ministry- and location-wise allocations**.

Everything runs client-side: no backend, no build step, no network calls.

## Quick start
Open `index.html`. If your browser blocks scripts on `file://` pages, or you want the
"Use my location" button to work, serve the folder instead:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
node test-node.js               # 13 engine/graph checks, no browser needed
```

## Features

| Tab | What it does |
|---|---|
| **Verify Documents** | 33 scheme pairs (+ Custom paste-your-own). Edit either document and results re-run automatically. Tolerance slider recomputes verdicts live. Table/Grid views, claim drawer, highlighted evidence view, `.txt` report export. EN/हिंदी switch translates the UI; A-/A/A+ and font-family controls work. |
| **Ask the Graph** | GraphRAG. Ask e.g. *"Which schemes under the Ministry of Jal Shakti have documents that disagree?"* or *"How much is allocated to Bihar across health schemes?"*. Shows the answer, the hop-by-hop reasoning path, a plain-vector-search vs GraphRAG comparison, and an SVG evidence subgraph. |
| **Ministry & Location Explorer** | Filter by ministry, scheme and state/UT. Tile map of allocations by state, ministry-wise totals, per-state scheme rankings, city/state search ("Pune", "Guwahati") and **Use my location** (GPS → nearest state). |

## How the GraphRAG works (`js/graph.js`)
1. **Graph build** — nodes: ministry, sector, scheme, document, claim, metric, period, state, region.
   Edges: `administered_by`, `in_sector`, `describes`, `states`, `measures`, `reports`,
   `covers_period`, `conflicts_with` / `agrees_with`, `allocated_to`, `in_region`.
2. **Vector search** — a TF-IDF index over every node's text (cosine similarity) seeds the query.
3. **Entity linking + intent detection** — ministries, schemes, sectors, states/cities, regions,
   metrics and periods named in the question become traversal constraints.
4. **Traversal** — the graph is walked hop by hop, e.g.
   `Ministry ← administered_by ← Scheme ← describes ← Document → states → Claim → conflicts_with → Claim`,
   then `Scheme → allocated_to → State`. Every answer lists the path it used.
5. **Comparison** — the vector-only baseline counts only schemes whose own text was retrieved, so the
   "relevant schemes found" gap is a fair measure of what traversal adds.

No LLM is used, so answers are deterministic and checkable. To add one later, pass the evidence
paths from `ask()` to a model as context and let it phrase the final answer.

## File structure
```
index.html            Page shell: tabs, sidebar, panels
css/styles.css        Portal theme + tab, graph and map styles
js/document-store.js  Scheme library (33 schemes), categories, report builder
js/sample-data.js     Official-source directory
js/extraction.js      Sentence splitter + rule-based claim extraction (unit-normalised)
js/matching.js        Cross-document join + tolerance verdicts
js/allocations.js     36 states/UTs, city index, allocation model, nearest-state lookup
js/graph.js           Knowledge graph, TF-IDF index, entity linking, multi-hop answering
js/i18n.js            English / Hindi strings
js/app.js             Verify tab, accessibility controls, tabs
js/panels.js          Ask-the-Graph and Explorer tabs
test-node.js          Assertions for engine, allocations and graph
```

## Extending
- **Add a scheme**: add an entry to `SCHEME_LIBRARY` in `js/document-store.js` (two `docs`, a `category`,
  a `ministry`, a `sourcePool`). Graph, explorer and counters pick it up automatically.
- **Add a metric**: add an entry to `METRICS` in `js/extraction.js` (`test` + `valueRegex`); add a phrase
  to `METRIC_WORDS` in `js/graph.js` so questions can name it.
- **Real documents**: paste extracted text (e.g. from `pdfplumber`) into the Custom entry.

## Data notes
- Scheme text is **original illustrative copy** written to resemble Parliament replies and budget
  documents; it is not a quotation of any real document. Links point to real official portals.
- **State-wise allocations are a model, not published data.** Each scheme's national fund figure
  (from its own extracted claims, or a fallback budget for five schemes with no rupee figure) is split
  across states by population weight, a special-category uplift (North-East, hill states, small UTs)
  and a stable per-scheme variation. Replace `allocate()` in `js/allocations.js` with real
  state-wise data when you have it.
- The graph covers the indexed schemes; text typed into the Custom entry is verified but not added to the graph.
