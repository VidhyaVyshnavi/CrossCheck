// Run with:  node test-node.js   (no browser needed)
const assert = require('assert');
const ext = require('./js/extraction.js'), match = require('./js/matching.js'), lib = require('./js/document-store.js');
const alloc = require('./js/allocations.js'), graph = require('./js/graph.js');
let passed = 0; const ok = (name, fn) => { fn(); passed++; console.log('  ok  ' + name); };

ok('33 schemes + custom entry load', () => { assert.strictEqual(lib.getAllSchemes().length, 34); assert(lib.getScheme('custom')); });
ok('crore vs lakh normalise to a match', () => {
  const a = ext.extractClaims('2.94 crore houses have been sanctioned.'), b = ext.extractClaims('294 lakh houses have been sanctioned.');
  assert.strictEqual(match.compare(a, b, 1)[0].verdict, 'match');
});
ok('rupee amounts are not mistaken for counts', () => {
  const c = ext.extractClaims('Loans of Rs. 5,41,000 crore have been sanctioned and disbursed.');
  assert(!c.some(x => x.metricKey === 'units_sanctioned'));
});
ok('lakh crore is parsed as money', () => assert.strictEqual(ext.extractClaims('Rs. 1.2 lakh crore has been released.')[0].value, 120000));
ok('every scheme extracts claims from both documents', () => {
  lib.getAllSchemes().filter(s => s.key !== 'custom').forEach(s => { assert(ext.extractClaims(s.docs[0].text).length, s.key + ' A'); assert(ext.extractClaims(s.docs[1].text).length, s.key + ' B'); });
});
ok('allocation split sums to the scheme total', () => { const t = alloc.allocate('x', 1000).reduce((s, r) => s + r.amount, 0); assert(Math.abs(t - 1000) < 0.5); });
ok('place search: city, state and GPS fix', () => {
  assert.strictEqual(alloc.resolvePlace('Bengaluru').code, 'KA'); assert.strictEqual(alloc.resolvePlace('kerala').code, 'KL');
  assert.strictEqual(alloc.nearestState(12.97, 77.59).state.code, 'KA'); assert.strictEqual(alloc.resolvePlace('nowhere-land'), null);
});
const G = graph.buildGraph(graph.analyze(lib.getAllSchemes(), 1));
ok('knowledge graph has all node types', () => { const s = graph.stats(G); ['scheme', 'ministry', 'claim', 'state', 'document', 'metric'].forEach(t => assert(s.byType[t] > 0, t)); });
ok('multi-hop: ministry -> scheme -> document -> claim -> conflict', () => {
  const r = graph.ask(G, 'Which schemes under the Ministry of Jal Shakti have documents that disagree?');
  assert(r.items.length >= 1 && r.items.every(i => i.conflict)); assert(r.items.some(i => /Jal Jeevan/.test(i.label)));
});
ok('multi-hop: mismatch + location + ranking', () => {
  const r = graph.ask(G, 'Which mismatched schemes give the most allocation to Karnataka?'); assert(r.total > 5 && /Karnataka/.test(r.paragraphs[1]));
});
ok('graph beats plain vector search on multi-hop questions', () => {
  const r = graph.ask(G, 'How much is allocated to Bihar across health schemes?'); assert(r.graphCount > r.vector.correct);
});
ok('unanswerable question is handled gracefully', () => assert.strictEqual(graph.ask(G, 'hello').graphCount, 0));
ok('report builder still works', () => {
  const rep = lib.buildProfessionalReport({ scheme: { label: 'Demo', ministry: 'Ministry of Example' }, rows: [{ label: 'Houses', verdict: 'mismatch', a: { value: 2.94, unit: 'crore units' }, b: { value: 3.1, unit: 'crore units' }, pctDiff: 5.44 }], tolerance: 1, documentNames: ['A', 'B'], createdAt: '2026-09-30T00:00:00Z' });
  assert(/MISMATCH/.test(rep));
});
console.log('\nAll ' + passed + ' checks passed.');
