/**
 * allocations.js
 * States/UTs (with centroid, region and tile-map position) plus an illustrative
 * state-wise allocation model. Each scheme's national fund total (taken from the
 * scheme's own extracted claims, else a fallback budget) is split across states
 * by population weight, a special-category uplift (North-East, hill states, small
 * UTs) and a stable per-scheme jitter. Illustrative model - not published data.
 */
(function (global) {
  // [name, code, region, lat, lon, popWeight, gridX, gridY]
  const S = [
    ["Ladakh","LA","North",34.15,77.58,0.03,2,0],["Jammu & Kashmir","JK","North",33.78,76.58,1.0,3,0],
    ["Punjab","PB","North",31.15,75.34,2.3,2,1],["Himachal Pradesh","HP","North",31.10,77.17,0.6,3,1],["Uttarakhand","UK","North",30.07,79.02,0.9,4,1],
    ["Arunachal Pradesh","AR","Northeast",28.22,94.73,0.12,9,1],["Chandigarh","CH","North",30.73,76.78,0.08,1,2],["Haryana","HR","North",29.06,76.09,2.1,2,2],
    ["Delhi","DL","North",28.70,77.10,1.4,3,2],["Uttar Pradesh","UP","North",26.85,80.91,16.5,4,2],["Bihar","BR","East",25.10,85.31,8.6,5,2],
    ["Sikkim","SK","Northeast",27.53,88.51,0.05,6,2],["Assam","AS","Northeast",26.20,92.94,2.6,8,2],["Nagaland","NL","Northeast",26.16,94.56,0.2,9,2],
    ["Rajasthan","RJ","North",27.02,74.22,5.6,2,3],["Madhya Pradesh","MP","Central",22.97,78.66,6.0,3,3],["Chhattisgarh","CG","Central",21.28,81.86,2.1,4,3],
    ["Jharkhand","JH","East",23.61,85.28,3.0,5,3],["West Bengal","WB","East",22.99,87.85,7.5,6,3],["Meghalaya","ML","Northeast",25.47,91.37,0.3,7,3],
    ["Manipur","MN","Northeast",24.66,93.91,0.25,8,3],["Gujarat","GJ","West",22.26,71.19,5.0,1,4],["Maharashtra","MH","West",19.75,75.71,9.3,2,4],
    ["Telangana","TG","South",18.11,79.02,2.9,3,4],["Odisha","OD","East",20.95,85.10,3.5,4,4],["Tripura","TR","Northeast",23.94,91.99,0.3,7,4],
    ["Mizoram","MZ","Northeast",23.16,92.94,0.1,8,4],["Dadra & Nagar Haveli and Daman & Diu","DD","West",20.42,72.84,0.08,0,4],
    ["Goa","GA","West",15.30,74.12,0.12,1,5],["Karnataka","KA","South",15.32,75.71,4.9,2,5],["Andhra Pradesh","AP","South",15.91,79.74,4.0,3,5],
    ["Andaman & Nicobar Islands","AN","Islands",11.74,92.66,0.03,6,5],["Lakshadweep","LD","Islands",10.57,72.64,0.005,1,6],
    ["Kerala","KL","South",10.85,76.27,2.8,2,6],["Tamil Nadu","TN","South",11.13,78.66,5.6,3,6],["Puducherry","PY","South",11.94,79.81,0.1,4,6]
  ].map(function (r) {
    return { name: r[0], code: r[1], region: r[2], lat: r[3], lon: r[4], weight: r[5], gx: r[6], gy: r[7] };
  });

  // City / town -> state code, for "location based search".
  const CITIES = {
    "mumbai":"MH","pune":"MH","nagpur":"MH","nashik":"MH","delhi":"DL","new delhi":"DL","bengaluru":"KA","bangalore":"KA","mysuru":"KA","mysore":"KA","hubballi":"KA",
    "chennai":"TN","coimbatore":"TN","madurai":"TN","hyderabad":"TG","warangal":"TG","kolkata":"WB","siliguri":"WB","lucknow":"UP","kanpur":"UP","varanasi":"UP","noida":"UP","agra":"UP",
    "patna":"BR","gaya":"BR","jaipur":"RJ","jodhpur":"RJ","udaipur":"RJ","ahmedabad":"GJ","surat":"GJ","vadodara":"GJ","bhopal":"MP","indore":"MP","raipur":"CG","ranchi":"JH","jamshedpur":"JH",
    "bhubaneswar":"OD","cuttack":"OD","guwahati":"AS","shillong":"ML","imphal":"MN","aizawl":"MZ","kohima":"NL","agartala":"TR","itanagar":"AR","gangtok":"SK","chandigarh":"CH","ludhiana":"PB","amritsar":"PB",
    "gurugram":"HR","gurgaon":"HR","faridabad":"HR","dehradun":"UK","shimla":"HP","srinagar":"JK","jammu":"JK","leh":"LA","panaji":"GA","visakhapatnam":"AP","vijayawada":"AP","amaravati":"AP",
    "thiruvananthapuram":"KL","kochi":"KL","kozhikode":"KL","puducherry":"PY","pondicherry":"PY","port blair":"AN","kavaratti":"LD","daman":"DD","silvassa":"DD"
  };

  // Fallback national budget (Rs crore, illustrative) for schemes whose documents carry no rupee figure.
  const FALLBACK_BUDGET_CR = { pmjdy: 12000, apy: 4200, indradhanush: 6800, pmgdisha: 2300, ssy: 1500 };
  const FUND_KEYS = ["funds_allocated_cr", "funds_released_cr", "subsidy_disbursed_cr", "loans_disbursed_cr", "claims_settled_cr", "wages_disbursed"];

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }

  function schemeTotal(schemeKey, claims) {
    for (let i = 0; i < FUND_KEYS.length; i++) {
      const c = (claims || []).find(function (x) { return x.metricKey === FUND_KEYS[i]; });
      if (c) return { total: c.normValue != null ? c.normValue : c.value, basis: c.metricLabel };
    }
    return { total: FALLBACK_BUDGET_CR[schemeKey] || 3000, basis: "Illustrative budget (no rupee figure in documents)" };
  }

  function allocate(schemeKey, total) {
    const raw = S.map(function (st) {
      const special = (st.region === "Northeast" || st.region === "Islands" || ["JK", "HP", "UK", "LA"].indexOf(st.code) !== -1) ? 1.8 : (st.weight < 0.2 ? 1.5 : 1);
      return { st: st, w: st.weight * special * (0.6 + 0.8 * hash(schemeKey + "|" + st.code)) };
    });
    const sum = raw.reduce(function (a, r) { return a + r.w; }, 0);
    return raw.map(function (r) { return { code: r.st.code, name: r.st.name, amount: Math.round(total * r.w / sum * 100) / 100 }; })
      .sort(function (a, b) { return b.amount - a.amount; });
  }

  function byCode(code) { return S.find(function (s) { return s.code === code; }) || null; }

  // Resolve free text ("Bengaluru", "karnataka") to a state.
  function resolvePlace(text) {
    const q = String(text || "").trim().toLowerCase();
    if (!q) return null;
    const exact = S.find(function (s) { return s.name.toLowerCase() === q || s.code.toLowerCase() === q; });
    if (exact) return exact;
    if (CITIES[q]) return byCode(CITIES[q]);
    const part = S.find(function (s) { return s.name.toLowerCase().indexOf(q) !== -1; });
    if (part) return part;
    const city = Object.keys(CITIES).find(function (c) { return c.indexOf(q) !== -1; });
    return city ? byCode(CITIES[city]) : null;
  }

  // State capitals (lat, lon) used as anchors: far more reliable than raw centroids for real GPS fixes.
  const CAPITALS = { LA:[34.15,77.58], JK:[34.08,74.80], PB:[30.73,76.78], HP:[31.10,77.17], UK:[30.32,78.03], AR:[27.10,93.62], CH:[30.73,76.78], HR:[30.73,76.78],
    DL:[28.61,77.21], UP:[26.85,80.95], BR:[25.61,85.14], SK:[27.33,88.61], AS:[26.14,91.74], NL:[25.67,94.11], RJ:[26.91,75.79], MP:[23.26,77.41], CG:[21.25,81.63],
    JH:[23.34,85.31], WB:[22.57,88.36], ML:[25.58,91.89], MN:[24.82,93.94], GJ:[23.22,72.65], MH:[19.08,72.88], TG:[17.39,78.49], OD:[20.30,85.82], TR:[23.83,91.28],
    MZ:[23.73,92.72], DD:[20.40,72.83], GA:[15.50,73.83], KA:[12.97,77.59], AP:[16.51,80.65], AN:[11.62,92.73], LD:[10.57,72.64], KL:[8.52,76.94], TN:[13.08,80.27], PY:[11.93,79.83] };

  // Nearest state centroid to a coordinate (great-circle distance).
  function nearestState(lat, lon) {
    const rad = Math.PI / 180;
    let best = null, bd = Infinity;
    S.forEach(function (s) {
      const pts = [[s.lat, s.lon]].concat(CAPITALS[s.code] ? [CAPITALS[s.code]] : []);
      pts.forEach(function (p) {
      const dLat = (p[0] - lat) * rad, dLon = (p[1] - lon) * rad;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * rad) * Math.cos(p[0] * rad) * Math.sin(dLon / 2) ** 2;
      const d = 6371 * 2 * Math.asin(Math.sqrt(a));
      if (d < bd) { bd = d; best = s; }
      });
    });
    return { state: best, km: Math.round(bd) };
  }

  const api = { STATES: S, CITIES: CITIES, schemeTotal: schemeTotal, allocate: allocate, byCode: byCode, resolvePlace: resolvePlace, nearestState: nearestState };
  if (typeof module !== "undefined") module.exports = api; else global.CrossCheckAllocations = api;
})(typeof window !== "undefined" ? window : this);
