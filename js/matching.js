/**
 * matching.js
 * Joins claims extracted from two documents on their metric key (the
 * anchor), and classifies each pair as Match / Mismatch / Unverifiable
 * within a caller-supplied percentage tolerance. This is a structured
 * join, not a similarity search — the only "fuzziness" in the whole
 * pipeline is this one explicit, adjustable tolerance value.
 */
(function (global) {
  function nv(c) { return typeof c.normValue === "number" ? c.normValue : c.value; }

  function compare(claimsA, claimsB, tolerancePct) {
    tolerancePct = typeof tolerancePct === "number" ? tolerancePct : 1;
    const allKeys = [];
    const seen = {};
    claimsA.concat(claimsB).forEach(function (c) {
      if (!seen[c.metricKey]) { seen[c.metricKey] = true; allKeys.push(c.metricKey); }
    });

    return allKeys.map(function (key) {
      const ca = claimsA.find(function (c) { return c.metricKey === key; });
      const cb = claimsB.find(function (c) { return c.metricKey === key; });
      const label = (ca || cb).metricLabel;

      if (ca && cb) {
        const va = nv(ca), vb = nv(cb);
        const diff = Math.abs(va - vb);
        const denom = Math.max(Math.abs(va), Math.abs(vb)) || 1;
        const pctDiff = (diff / denom) * 100;
        const isMatch = pctDiff <= tolerancePct;
        return {
          label: label,
          key: key,
          a: ca,
          b: cb,
          pctDiff: pctDiff,
          verdict: isMatch ? "match" : "mismatch"
        };
      }
      return { label: label, key: key, a: ca || null, b: cb || null, pctDiff: null, verdict: "unverif" };
    });
  }

  const api = { compare: compare };
  if (typeof module !== "undefined") module.exports = api;
  else global.CrossCheckMatching = api;
})(typeof window !== "undefined" ? window : this);
