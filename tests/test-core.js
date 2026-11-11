// Snelle controle van de kernlogica: node tests/test-core.js
const N = require("../nav-core.js");
const assert = require("assert");

// nep-OSRM-route: 1 km noord, dan rechtsaf 500 m oost, dan rotonde, dan aankomst
const A = [4.9, 52.37], B = [4.9, 52.379], C = [4.9073, 52.379], D = [4.912, 52.379];
const osrm = {
  distance: 1820, duration: 200,
  legs: [{ steps: [
    { maneuver: { type: "depart", modifier: "straight", location: A }, name: "Damrak", distance: 1000, duration: 100, geometry: { coordinates: [A, [4.9, 52.3745], B] } },
    { maneuver: { type: "turn", modifier: "right", location: B }, name: "Prins Hendrikkade", distance: 500, duration: 60, geometry: { coordinates: [B, C] } },
    { maneuver: { type: "roundabout", modifier: "straight", exit: 2, location: C }, name: "", ref: "s100", distance: 320, duration: 40, geometry: { coordinates: [C, D] } },
    { maneuver: { type: "arrive", modifier: "left", location: D }, name: "", distance: 0, duration: 0, geometry: { coordinates: [D, D] } }
  ] }]
};
const r = N.buildRoute(osrm);
assert.strictEqual(r.steps.length, 4);
assert.strictEqual(r.steps[1].text, "Sla rechtsaf naar Prins Hendrikkade");
assert.strictEqual(r.steps[2].text, "Neem op de rotonde de tweede afslag naar s100");
assert.strictEqual(r.steps[3].text, "Je bestemming ligt links");
assert.ok(Math.abs(r.steps[1].startDist - 1001) < 5, "startDist stap 2 " + r.steps[1].startDist);

// positie 30 m naast de weg halverwege
const loc = N.locate(r, 52.3745, 4.9004, 0);
assert.ok(loc.off > 20 && loc.off < 35, "off " + loc.off);
assert.ok(Math.abs(loc.along - 500) < 10, "along " + loc.along);
assert.strictEqual(N.nextStepIndex(r, loc.along), 1);
const rem = N.remainingTime(r, loc.along);
assert.ok(rem > 140 && rem < 160, "rem " + rem);

// teksten
assert.strictEqual(N.fmtDist(347), "350 m");
assert.strictEqual(N.fmtDist(1260), "1,3 km");
assert.strictEqual(N.sayDist(1500), "anderhalve kilometer");
assert.strictEqual(N.sayDist(2000), "2 kilometer");
assert.strictEqual(N.fmtDur(4000), "1 u 07");

const t = (m, extra) => N.instruction(Object.assign({ maneuver: m, name: "Hoofdweg" }, extra || {})).text;
assert.strictEqual(t({ type: "off ramp", modifier: "slight right" }, { exits: "12", destinations: "A4: Den Haag, Leiden" }), "Neem afrit 12 rechts richting Den Haag");
assert.strictEqual(t({ type: "fork", modifier: "slight left" }), "Houd links aan naar Hoofdweg");
assert.strictEqual(t({ type: "merge", modifier: "straight" }), "Voeg in naar Hoofdweg");
assert.strictEqual(t({ type: "end of road", modifier: "left" }), "Sla aan het einde van de weg linksaf naar Hoofdweg");
assert.strictEqual(t({ type: "turn", modifier: "uturn" }), "Keer om naar Hoofdweg");
assert.ok(N.instruction({ maneuver: { type: "new name", modifier: "straight" }, name: "X" }).silent);

// punten op de route: flitser 10 m naast de weg na 1200 m, één ver weg, één verkeerde kijkrichting
const cams = [
  { id: 1, lat: 52.3791, lon: 4.9029 },
  { id: 2, lat: 52.40, lon: 4.95 },
  { id: 3, lat: 52.3791, lon: 4.9050, h: 0 }
];
const on = N.pointsOnRoute(r, cams, 40);
assert.deepStrictEqual(on.map(o => o.p.id), [1]);
assert.ok(Math.abs(on[0].along - 1200) < 20, "along cam " + on[0].along);

// vrij rijden: rijrichting noord, flitser 300 m voor je
const fa = N.aheadFree(52.37, 4.9, 0, [{ lat: 52.3727, lon: 4.9 }, { lat: 52.367, lon: 4.9 }], 500);
assert.ok(fa && fa.d > 280 && fa.d < 320);

console.log("Alle kerntests geslaagd");
// extra: punt op route en bord
const pa = N.pointAt(r, 500); assert.ok(Math.abs(pa.lat - 52.3745) < 0.0002 && Math.abs(pa.lon - 4.9) < 1e-6);
assert.deepStrictEqual(N.parseSign("A4: Den Haag, Leiden", ""), { refs: ["A4"], places: ["Den Haag", "Leiden"] });
assert.deepStrictEqual(N.parseSign("Centrum, Station", "N227"), { refs: ["N227"], places: ["Centrum", "Station"] });
const st2 = N.buildRoute({ legs: [{ steps: [{ maneuver: { type: "depart", location: A }, name: "X", distance: 10, duration: 1, geometry: { coordinates: [A, B] },
  intersections: [{ bearings: [0, 90, 180], in: 2, out: 1, lanes: [{ valid: true, indications: ["right"] }] }], destinations: "A4: Den Haag" }] }] }).steps[0];
assert.strictEqual(st2.inter.out, 1); assert.strictEqual(st2.dest, "A4: Den Haag");
console.log("Extra kerntests geslaagd");
const rs = N.buildRoute({ geometry: { coordinates: [A, B, C] }, legs: [{ annotation: { maxspeed: [{ speed: 50, unit: "km/h" }, { unknown: true }] },
  steps: [{ maneuver: { type: "depart", location: A }, name: "X", distance: 1500, duration: 100, geometry: { coordinates: [A, B, C] } }] }] });
assert.strictEqual(N.speedAt(rs, 300), 50); assert.strictEqual(N.speedAt(rs, 1200), null);
console.log("Snelheidstests geslaagd");
// afgeronde hoek: 90 graden knik wordt een boog, eindpunten blijven gelijk, geen punt verder dan 6 m van de knik-lijnen
const sm = N.smoothPath([[4.9, 52.37], [4.9, 52.371], [4.9015, 52.371]], 14);
assert.ok(sm.length > 5); assert.deepStrictEqual(sm[0], [4.9, 52.37]); assert.deepStrictEqual(sm[sm.length - 1], [4.9015, 52.371]);
assert.ok(N.distM(sm[1][1], sm[1][0], 52.371, 4.9) > 5, "boog begint voor de hoek");
console.log("Bochttests geslaagd");
