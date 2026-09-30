/**
 * extraction.js
 * A small, hand-built rule set that pulls numeric claims (currency amounts,
 * counts, percentages) out of official document text, tied to a nearby
 * metric keyword. This is intentionally rule-based rather than a trained
 * model — the metric vocabulary used across Government of India scheme
 * documents is a bounded, enumerable list, and a dependable rule set is
 * what makes the pipeline's output checkable and demonstrable rather than
 * a best-case model run. Metrics are written generically (not tied to one
 * scheme) so the same engine works across all 25+ scheme pairs.
 */
(function (global) {
  // Splits on a period/!/? only when it is followed by whitespace AND an
  // uppercase letter (or end of string). This is what keeps "Rs. 1,42,434",
  // "No. 1102" and "31.03.2024" intact as a single sentence, instead of a
  // naive split-on-every-period approach fragmenting them.
  function splitSentences(text) {
    if (!text) return [];
    return text
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  const RS = /(?:Rs\.?|\u20b9|INR)\s?([\d,]+(?:\.\d+)?)\s*(lakh\s+crore|crore)/i;
  // Count regexes must NOT swallow rupee amounts ("Rs. 1,42,434 crore" is money, not a count).
  const CR = /(?<![\d,.]|Rs\.?\s?|\u20b9\s?|INR\s?)([\d,]+(?:\.\d+)?)\s*crore/i;
  const LK = /(?<![\d,.]|Rs\.?\s?|\u20b9\s?|INR\s?)([\d,]+(?:\.\d+)?)\s*lakh(?!\s+crore)/i;

  const METRICS = [
    { key: "units_sanctioned", label: "Units / Houses Sanctioned", test: /\bsanctioned\b/i, valueRegex: CR, unit: "crore units" },
    { key: "units_sanctioned", label: "Units / Houses Sanctioned", test: /\bsanctioned\b/i, valueRegex: LK, unit: "lakh units" },
    { key: "funds_released_cr", label: "Central Funds Released", test: /\breleased\b/i, valueRegex: RS, unit: "\u20b9 crore" },
    { key: "funds_allocated_cr", label: "Funds Allocated", test: /\ballocat(?:ed|ion)\b/i, valueRegex: RS, unit: "\u20b9 crore" },
    { key: "completion_pct", label: "Completion Rate", test: /\bcompletion\b|\bcompleted\b/i, valueRegex: /(\d{1,3}(?:\.\d+)?)\s*%/, unit: "%" },
    { key: "coverage_pct", label: "Coverage Rate", test: /\bcoverage\b|\bcovered\b/i, valueRegex: /(\d{1,3}(?:\.\d+)?)\s*%/, unit: "%" },
    { key: "target_achieved_pct", label: "Target Achieved", test: /\btarget\b/i, valueRegex: /(\d{1,3}(?:\.\d+)?)\s*%/, unit: "%" },
    { key: "persondays_generated", label: "Person-days Generated", test: /\bperson-days\b/i, valueRegex: CR, unit: "crore person-days" },
    { key: "wages_disbursed", label: "Wages Disbursed", test: /\bwage\b[\s\S]*\b(?:disbursed|expenditure)\b|\b(?:disbursed|expenditure)\b[\s\S]*\bwage\b/i, valueRegex: RS, unit: "\u20b9 crore" },
    { key: "average_wage_rate", label: "Average Wage Rate", test: /\baverage wage rate\b|\bwage rate\b/i, valueRegex: /Rs\.?\s?([\d,]+)\s*per day/i, unit: "\u20b9/day" },
    { key: "beneficiaries_covered", label: "Beneficiaries Covered", test: /(?:\b(?:beneficiaries|households|families|family|farmers?|women|students?|workers?|vendors?|subscribers?)\b[\s\S]*\b(?:covered|enrolled|registered|benefited|reached|onboarded)\b)|(?:\b(?:covered|enrolled|registered|benefited|reached|onboarded)\b[\s\S]*\b(?:beneficiaries|households|families|family|farmers?|women|students?|workers?|vendors?|subscribers?)\b)/i, valueRegex: CR, unit: "crore" },
    { key: "beneficiaries_covered", label: "Beneficiaries Covered", test: /(?:\b(?:beneficiaries|households|families|family|farmers?|women|students?|workers?|vendors?|subscribers?)\b[\s\S]*\b(?:covered|enrolled|registered|benefited|reached|onboarded)\b)|(?:\b(?:covered|enrolled|registered|benefited|reached|onboarded)\b[\s\S]*\b(?:beneficiaries|households|families|family|farmers?|women|students?|workers?|vendors?|subscribers?)\b)/i, valueRegex: LK, unit: "lakh" },
    { key: "claims_settled_cr", label: "Claims Settled", test: /\bclaims?\b[\s\S]*\b(?:settled|paid|approved)\b/i, valueRegex: RS, unit: "\u20b9 crore" },
    { key: "loans_disbursed_cr", label: "Loans Sanctioned / Disbursed", test: /\bloans?\b[\s\S]*\b(?:sanctioned|disbursed)\b/i, valueRegex: RS, unit: "\u20b9 crore" },
    { key: "accounts_opened", label: "Accounts Opened", test: /\baccounts?\b[\s\S]*\bopened\b/i, valueRegex: CR, unit: "crore accounts" },
    { key: "accounts_opened", label: "Accounts Opened", test: /\baccounts?\b[\s\S]*\bopened\b/i, valueRegex: LK, unit: "lakh accounts" },
    { key: "villages_covered_lakh", label: "Villages Covered", test: /\bvillages\b/i, valueRegex: LK, unit: "lakh villages" },
    { key: "gram_panchayats_connected", label: "Gram Panchayats Connected", test: /\bgram panchayats\b/i, valueRegex: LK, unit: "lakh gram panchayats" },
    { key: "road_length_km", label: "Road Length Constructed", test: /\broads?\b[\s\S]*\bconstructed\b|\bconstructed\b[\s\S]*\broads?\b/i, valueRegex: /([\d,]+)\s*km/i, unit: "km" },
    { key: "hospitals_empanelled", label: "Hospitals Empanelled", test: /\bhospitals\b[\s\S]*\bempanelled\b|\bempanelled\b[\s\S]*\bhospitals\b/i, valueRegex: /([\d,]+)\s*hospitals/i, unit: "hospitals" },
    { key: "schools_covered_lakh", label: "Schools Covered", test: /\bschools\b/i, valueRegex: LK, unit: "lakh schools" },
    { key: "children_covered_cr", label: "Children Covered", test: /\bchildren\b/i, valueRegex: CR, unit: "crore children" },
    { key: "installations_completed_lakh", label: "Installations Completed", test: /\binstallations?\b/i, valueRegex: LK, unit: "lakh installations" },
    { key: "subsidy_disbursed_cr", label: "Subsidy Disbursed", test: /\bsubsidy\b/i, valueRegex: RS, unit: "\u20b9 crore" },
    { key: "capacity_added_gw", label: "Capacity Added", test: /\bcapacity\b/i, valueRegex: /([\d.]+)\s*GW/i, unit: "GW" }
  ];

  // Canonical scale so "2.94 crore" and "294 lakh" compare as equal.
  function unitMultiplier(unit) {
    if (!unit) return 1;
    if (unit.indexOf("lakh") !== -1) return 1e5;
    if (unit.indexOf("crore") !== -1 && unit.indexOf("\u20b9") === -1) return 1e7;
    return 1;
  }

  function extractClaims(text) {
    const claims = [];
    if (!text) return claims;
    const sentences = splitSentences(text);
    const claimed = {};
    METRICS.forEach(function (m) {
      if (claimed[m.key]) return; // crore/lakh variants share one key; first hit wins
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i];
        if (m.test.test(s)) {
          const vMatch = s.match(m.valueRegex);
          if (vMatch) {
            let value = parseFloat(vMatch[1].replace(/,/g, ""));
            if (m.valueRegex === RS && /lakh/i.test(vMatch[2] || "")) value *= 1e5; // lakh crore -> crore
            claimed[m.key] = true;
            claims.push({
              metricKey: m.key,
              metricLabel: m.label,
              value: value,
              unit: m.unit,
              normValue: value * unitMultiplier(m.unit),
              snippet: s
            });
            break; // one claim per metric per document is enough for this demo
          }
        }
      }
    });
    return claims;
  }

  function fmt(v, unit) {
    if (unit === "%") return v + "%";
    if (unit === "\u20b9 crore") return "\u20b9" + v.toLocaleString("en-IN") + " crore";
    if (unit === "\u20b9/day") return "\u20b9" + v + "/day";
    if (unit === "GW") return v + " GW";
    if (unit === "km") return v.toLocaleString("en-IN") + " km";
    if (unit === "hospitals") return v.toLocaleString("en-IN") + " hospitals";
    if (unit && unit.indexOf("crore") !== -1) return v + " " + unit;
    if (unit && unit.indexOf("lakh") !== -1) return v + " " + unit;
    return v + (unit ? " " + unit : "");
  }

  const api = { METRICS: METRICS, extractClaims: extractClaims, fmt: fmt, splitSentences: splitSentences };
  if (typeof module !== "undefined") module.exports = api;
  else global.CrossCheckExtraction = api;
})(typeof window !== "undefined" ? window : this);
