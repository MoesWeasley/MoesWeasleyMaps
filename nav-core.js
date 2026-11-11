/* MoesWeasley Maps – kernlogica zonder scherm: route opbouwen, Nederlandse instructies,
   positie op de route bepalen en meldingen langs de route zoeken.
   Werkt in de browser (window.NavCore) en in Node (require) voor tests. */
(function (root) {
  "use strict";
  var R = 6371000, RAD = Math.PI / 180;

  function distM(lat1, lon1, lat2, lon2) {
    var dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function bearing(lat1, lon1, lat2, lon2) {
    var y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
    var x = Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) - Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
    return (Math.atan2(y, x) / RAD + 360) % 360;
  }
  function angleDiff(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

  /* ---------- teksten ---------- */
  var DIR = {
    "uturn": "keer om", "sharp right": "scherp rechtsaf", "right": "rechtsaf", "slight right": "flauw rechtsaf",
    "straight": "rechtdoor", "slight left": "flauw linksaf", "left": "linksaf", "sharp left": "scherp linksaf"
  };
  var SIDE = { "right": "rechts", "slight right": "rechts", "sharp right": "rechts", "left": "links", "slight left": "links", "sharp left": "links", "straight": "rechtdoor" };
  var ORD = ["", "eerste", "tweede", "derde", "vierde", "vijfde", "zesde", "zevende", "achtste"];

  function roadName(s) {
    var n = (s.name || "").trim(), ref = (s.ref || "").split(";")[0].trim();
    if (ref && n && n.indexOf(ref) < 0) return ref + " · " + n;
    return n || ref || "";
  }
  function towards(s) {
    var d = (s.destinations || "").split(":").pop().split(",")[0].trim();
    return d ? "richting " + d : "";
  }

  /* geeft {text, voice, icon, road} voor één OSRM-stap */
  function instruction(s) {
    var m = s.maneuver || {}, type = m.type, mod = m.modifier || "straight";
    var road = roadName(s), dest = towards(s), naar = road ? " naar " + road : "";
    var side = SIDE[mod] || "rechtdoor";
    var text, icon = { kind: "turn", mod: mod };
    switch (type) {
      case "depart":
        text = road ? "Vertrek via " + road : "Vertrek";
        icon = { kind: "turn", mod: "straight" }; break;
      case "arrive":
        text = (mod === "left" || mod === "slight left" || mod === "sharp left") ? "Je bestemming ligt links" :
          (mod === "right" || mod === "slight right" || mod === "sharp right") ? "Je bestemming ligt rechts" : "Je bent op je bestemming";
        icon = { kind: "arrive" }; break;
      case "roundabout": case "rotary": {
        var ex = m.exit || 1;
        text = "Neem op de rotonde de " + (ORD[ex] || ex + "e") + " afslag" + (naar || (dest ? " " + dest : ""));
        icon = { kind: "roundabout", exit: ex, mod: mod }; break;
      }
      case "roundabout turn":
        text = "Sla op de rotonde " + (DIR[mod] || "rechtdoor") + naar; break;
      case "exit roundabout": case "exit rotary":
        text = "Verlaat de rotonde" + naar; icon = { kind: "turn", mod: "slight right" }; break;
      case "on ramp":
        text = "Neem de oprit" + (side !== "rechtdoor" ? " " + side : "") + (dest ? " " + dest : naar);
        icon = { kind: "turn", mod: mod === "straight" ? "slight right" : mod }; break;
      case "off ramp": {
        var nr = (s.exits || "").split(";")[0];
        text = "Neem afrit" + (nr ? " " + nr : "") + (side !== "rechtdoor" ? " " + side : "") + (dest ? " " + dest : naar);
        icon = { kind: "turn", mod: mod === "straight" ? "slight right" : mod }; break;
      }
      case "fork":
        text = (mod.indexOf("left") >= 0 ? "Houd links aan" : mod.indexOf("right") >= 0 ? "Houd rechts aan" : "Ga rechtdoor") + (dest ? " " + dest : naar);
        break;
      case "merge":
        text = "Voeg " + (side === "links" ? "links" : side === "rechts" ? "rechts" : "") + " in" + naar;
        text = text.replace("Voeg  in", "Voeg in");
        icon = { kind: "turn", mod: mod === "straight" ? "slight left" : mod }; break;
      case "end of road":
        text = "Sla aan het einde van de weg " + (DIR[mod] || "rechtsaf") + naar; break;
      case "new name": case "continue": case "use lane": case "notification": default:
        if (mod === "uturn") text = "Keer om" + naar;
        else if (mod === "straight") text = (type === "new name" ? "Ga verder" : "Ga rechtdoor") + naar;
        else if (mod.indexOf("slight") === 0) text = "Houd " + side + " aan" + naar;
        else text = "Sla " + DIR[mod] + naar;
        break;
      case "turn":
        if (mod === "uturn") text = "Keer om" + naar;
        else if (mod === "straight") text = "Ga rechtdoor" + naar;
        else text = "Sla " + DIR[mod] + naar;
        break;
    }
    if (mod === "uturn") icon = { kind: "uturn" };
    /* rechtdoor en "nieuwe naam" zeggen we niet hardop: dat is alleen ruis */
    var silent = (type === "new name" || type === "continue" || type === "use lane" || type === "notification") && mod === "straight";
    var voice = text.replace(/ · /g, ", ").replace(/\bA(\d+)\b/g, "A $1").replace(/\bN(\d+)\b/g, "N $1");
    return { text: text, voice: voice, icon: icon, road: road, silent: silent };
  }

  /* ---------- afstanden ---------- */
  function roundDist(m) {
    if (m < 100) return Math.max(10, Math.round(m / 10) * 10);
    if (m < 1000) return Math.round(m / 50) * 50;
    return Math.round(m / 100) * 100;
  }
  function fmtDist(m) {
    var r = roundDist(m);
    if (r < 1000) return r + " m";
    var km = r / 1000;
    return (km >= 10 ? Math.round(km) : km.toFixed(1).replace(".", ",")) + " km";
  }
  function sayDist(m) {
    var r = roundDist(m);
    if (r < 1000) return r + " meter";
    var km = r / 1000;
    if (km === 1) return "1 kilometer";
    if (km === 1.5) return "anderhalve kilometer";
    return (km >= 10 ? Math.round(km) : km.toFixed(1).replace(".", ",").replace(",0", "")) + " kilometer";
  }
  function fmtDur(sec) {
    var min = Math.max(1, Math.round(sec / 60));
    if (min < 60) return min + " min";
    var h = Math.floor(min / 60), mm = min % 60;
    return h + " u " + (mm < 10 ? "0" : "") + mm;
  }

  /* ---------- route opbouwen uit een OSRM-route ---------- */
  function buildRoute(osrm) {
    var coords = [], cum = [], steps = [], total = 0;
    var legs = osrm.legs || [];
    legs.forEach(function (leg, li) {
      (leg.steps || []).forEach(function (s, si) {
        var g = (s.geometry && s.geometry.coordinates) || [];
        var isLastArrive = s.maneuver && s.maneuver.type === "arrive" && li < legs.length - 1;
        if (isLastArrive) return; /* tussenstop-aankomst overslaan */
        var startDist = total;
        g.forEach(function (c, i) {
          if (coords.length) {
            var p = coords[coords.length - 1];
            if (i === 0 && p[0] === c[0] && p[1] === c[1]) return;
            total += distM(p[1], p[0], c[1], c[0]);
          }
          coords.push([c[0], c[1]]); cum.push(total);
        });
        if (!g.length && s.maneuver && s.maneuver.location) {
          var loc = s.maneuver.location;
          if (!coords.length) { coords.push(loc); cum.push(0); }
        }
        var ins = instruction(s);
        steps.push({
          type: s.maneuver.type, mod: s.maneuver.modifier, loc: s.maneuver.location,
          startDist: startDist, dur: s.duration || 0, dist: s.distance || 0,
          text: ins.text, voice: ins.voice, icon: ins.icon, road: ins.road, silent: ins.silent,
          dest: s.destinations || "", exits: s.exits || "", ref: s.ref || "",
          inter: (s.intersections && s.intersections[0]) ? { bearings: s.intersections[0].bearings || [], "in": s.intersections[0]["in"], out: s.intersections[0].out, lanes: s.intersections[0].lanes || null } : null
        });
      });
    });
    /* tijd per meter langs de route, voor de resterende reistijd */
    var durTotal = osrm.duration || steps.reduce(function (a, s) { return a + s.dur; }, 0);
    /* maximumsnelheid per stukje weg (OSRM annotations=maxspeed, over de overzichtslijn) */
    var ms = null, og = osrm.geometry && osrm.geometry.coordinates;
    if (og && og.length > 1) {
      var sp = [];
      legs.forEach(function (leg) { ((leg.annotation && leg.annotation.maxspeed) || []).forEach(function (m) {
        sp.push(m && m.speed ? (m.unit === "mph" ? Math.round(m.speed * 1.609) : m.speed) : null); }); });
      if (sp.length === og.length - 1 && sp.some(function (x) { return x; })) {
        var oc = [0]; for (var k = 1; k < og.length; k++) oc.push(oc[k - 1] + distM(og[k - 1][1], og[k - 1][0], og[k][1], og[k][0]));
        ms = { cum: oc, sp: sp };
      }
    }
    var route = { coords: coords, cum: cum, steps: steps, distance: total || osrm.distance || 0, duration: durTotal, ms: ms, raw: osrm };
    route.smooth = withCum(smoothPath(coords, 14));
    return route;
  }

  /* resterende tijd: som van de stappen vanaf positie, deelstap naar verhouding */
  function remainingTime(route, along) {
    var t = 0, st = route.steps;
    for (var i = 0; i < st.length; i++) {
      var s = st[i], end = s.startDist + s.dist;
      if (end <= along) continue;
      if (s.startDist >= along) t += s.dur;
      else t += s.dur * (end - along) / Math.max(1, s.dist);
    }
    return t;
  }

  /* ---------- positie op de route ---------- */
  function projSeg(lat, lon, a, b, cosLat) {
    var ax = a[0] * cosLat, ay = a[1], bx = b[0] * cosLat, by = b[1], px = lon * cosLat, py = lat;
    var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    var t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    var qx = (ax + t * dx) / cosLat, qy = ay + t * dy;
    return { t: t, lon: qx, lat: qy, d: distM(lat, lon, qy, qx) };
  }
  /* zoekt het dichtstbijzijnde stuk route; hint = vorige index, zodat we niet terugspringen */
  function locate(route, lat, lon, hint) {
    var c = route.coords, n = c.length;
    if (n < 2) return { off: n ? distM(lat, lon, c[0][1], c[0][0]) : Infinity, along: 0, idx: 0, lat: lat, lon: lon };
    var cosLat = Math.cos(lat * RAD);
    function scan(from, to) {
      var best = null;
      for (var i = Math.max(0, from); i < Math.min(n - 1, to); i++) {
        var p = projSeg(lat, lon, c[i], c[i + 1], cosLat);
        if (!best || p.d < best.d) { best = p; best.i = i; }
      }
      return best;
    }
    var h = hint == null ? 0 : hint;
    var b = scan(h - 3, h + 400);
    if (!b || b.d > 60) { var all = scan(0, n); if (all && (!b || all.d < b.d - 5)) b = all; }
    var segLen = route.cum[b.i + 1] - route.cum[b.i];
    return { off: b.d, along: route.cum[b.i] + segLen * b.t, idx: b.i, lat: b.lat, lon: b.lon,
      segBearing: bearing(c[b.i][1], c[b.i][0], c[b.i + 1][1], c[b.i + 1][0]) };
  }

  /* knikken afronden: elke hoek > 12 graden wordt een vloeiende boog (straal tot R meter) */
  function smoothPath(coords, R) {
    R = R || 14;
    if (coords.length < 3) return coords.slice();
    var lat0 = coords[0][1], lon0 = coords[0][0], kx = Math.cos(lat0 * RAD) * 111320, ky = 110540;
    var P = coords.map(function (c) { return [(c[0] - lon0) * kx, (c[1] - lat0) * ky]; });
    var out = [P[0]];
    for (var i = 1; i < P.length - 1; i++) {
      var a = P[i - 1], b = P[i], c = P[i + 1];
      var d1x = b[0] - a[0], d1y = b[1] - a[1], d2x = c[0] - b[0], d2y = c[1] - b[1];
      var l1 = Math.sqrt(d1x * d1x + d1y * d1y), l2 = Math.sqrt(d2x * d2x + d2y * d2y);
      if (l1 < 0.5 || l2 < 0.5) { out.push(b); continue; }
      d1x /= l1; d1y /= l1; d2x /= l2; d2y /= l2;
      var ang = Math.acos(Math.max(-1, Math.min(1, d1x * d2x + d1y * d2y)));
      if (ang < 0.21) { out.push(b); continue; }
      var t = Math.min(R * Math.tan(ang / 2), 0.45 * Math.min(l1, l2));
      var s0 = [b[0] - d1x * t, b[1] - d1y * t], e0 = [b[0] + d2x * t, b[1] + d2y * t];
      var n = Math.max(4, Math.min(14, Math.round(ang * 9)));
      for (var k = 0; k <= n; k++) { /* kwadratische bezier: start -> hoekpunt -> eind */
        var u = k / n, w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
        out.push([w0 * s0[0] + w1 * b[0] + w2 * e0[0], w0 * s0[1] + w1 * b[1] + w2 * e0[1]]);
      }
    }
    out.push(P[P.length - 1]);
    return out.map(function (p) { return [lon0 + p[0] / kx, lat0 + p[1] / ky]; });
  }
  function withCum(coords) {
    var cum = [0];
    for (var i = 1; i < coords.length; i++) cum.push(cum[i - 1] + distM(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]));
    return { coords: coords, cum: cum };
  }
  /* punt op de afgeronde lijn; "along" is in meters van de echte route en wordt naar verhouding omgerekend */
  function smoothAt(route, along) {
    var sm = route.smooth; if (!sm) return pointAt(route, along);
    var ratio = sm.cum[sm.cum.length - 1] / Math.max(1, route.cum[route.cum.length - 1]);
    return pointAt(sm, along * ratio);
  }

  /* punt op de route op een bepaalde afstand vanaf het begin */
  function pointAt(route, along) {
    var c = route.coords, cum = route.cum, n = c.length;
    if (!n) return null;
    if (along <= 0) return { lat: c[0][1], lon: c[0][0] };
    if (along >= cum[n - 1]) return { lat: c[n - 1][1], lon: c[n - 1][0] };
    var lo = 0, hi = n - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cum[mid] <= along) lo = mid; else hi = mid; }
    var seg = cum[hi] - cum[lo], t = seg ? (along - cum[lo]) / seg : 0;
    return { lat: c[lo][1] + (c[hi][1] - c[lo][1]) * t, lon: c[lo][0] + (c[hi][0] - c[lo][0]) * t };
  }

  /* maximumsnelheid op een afstand langs de route (null = onbekend) */
  function speedAt(route, along) {
    var m = route.ms; if (!m) return null;
    var lo = 0, hi = m.cum.length - 1;
    if (along >= m.cum[hi]) return m.sp[m.sp.length - 1];
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (m.cum[mid] <= along) lo = mid; else hi = mid; }
    return m.sp[Math.min(lo, m.sp.length - 1)];
  }

  /* bord: "A4: Den Haag, Leiden" -> { refs: ["A4"], places: ["Den Haag", "Leiden"] } */
  function parseSign(dest, ref) {
    var refs = [], places = [];
    var d = dest || "";
    var m = d.match(/^([^:]+):\s*(.*)$/);
    if (m) { refs = m[1].split(/[;,]\s*/); d = m[2]; }
    else if (ref) refs = ref.split(/;\s*/).filter(function (r) { return /^[ANEaneS]\d/.test(r) || /^s\d/i.test(r); });
    places = d.split(/,\s*/).filter(function (x) { return x; });
    return { refs: refs.filter(function (x) { return x; }), places: places };
  }

  /* volgende manoeuvre na een positie langs de route */
  function nextStepIndex(route, along) {
    var st = route.steps;
    for (var i = 1; i < st.length; i++) if (st[i].startDist > along + 3) return i;
    return st.length - 1;
  }

  /* wanneer zeggen we iets? afhankelijk van de snelheid (m/s) */
  function thresholds(v) {
    v = v || 0;
    return {
      far: v > 22 ? 1500 : v > 14 ? 800 : 0,
      prep: Math.min(600, Math.max(150, v * 15)),
      now: Math.min(220, Math.max(35, v * 5))
    };
  }

  /* punten (flitsers, verkeersmeldingen) die op de route liggen; geeft afstand langs de route */
  function pointsOnRoute(route, pts, maxOff) {
    maxOff = maxOff || 40;
    var c = route.coords, out = [];
    if (c.length < 2) return out;
    /* snelle voorselectie met een kader om de route */
    var minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
    c.forEach(function (p) { if (p[1] < minLat) minLat = p[1]; if (p[1] > maxLat) maxLat = p[1]; if (p[0] < minLon) minLon = p[0]; if (p[0] > maxLon) maxLon = p[0]; });
    var pad = 0.002;
    var cosLat = Math.cos(((minLat + maxLat) / 2) * RAD);
    /* raster van segmenten, zodat we niet elk punt tegen elk segment testen */
    var cell = 0.01, grid = {};
    function key(x, y) { return Math.floor(x / cell) + ":" + Math.floor(y / cell); }
    for (var i = 0; i < c.length - 1; i++) {
      var x0 = Math.min(c[i][0], c[i + 1][0]), x1 = Math.max(c[i][0], c[i + 1][0]);
      var y0 = Math.min(c[i][1], c[i + 1][1]), y1 = Math.max(c[i][1], c[i + 1][1]);
      for (var gx = Math.floor(x0 / cell); gx <= Math.floor(x1 / cell); gx++)
        for (var gy = Math.floor(y0 / cell); gy <= Math.floor(y1 / cell); gy++) {
          var k = gx + ":" + gy; (grid[k] = grid[k] || []).push(i);
        }
    }
    pts.forEach(function (p) {
      if (p.lat < minLat - pad || p.lat > maxLat + pad || p.lon < minLon - pad || p.lon > maxLon + pad) return;
      var gx = Math.floor(p.lon / cell), gy = Math.floor(p.lat / cell), best = null;
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
        (grid[(gx + dx) + ":" + (gy + dy)] || []).forEach(function (i) {
          var q = projSeg(p.lat, p.lon, c[i], c[i + 1], cosLat);
          if (!best || q.d < best.d) { best = q; best.i = i; }
        });
      }
      if (best && best.d <= maxOff) {
        var segLen = route.cum[best.i + 1] - route.cum[best.i];
        var segB = bearing(c[best.i][1], c[best.i][0], c[best.i + 1][1], c[best.i + 1][0]);
        /* flitser met kijkrichting: alleen als hij onze rijrichting op kijkt */
        if (p.h != null && angleDiff(p.h, segB) > 60 && angleDiff(p.h, (segB + 180) % 360) > 60) return;
        out.push({ p: p, along: route.cum[best.i] + segLen * best.t, off: best.d });
      }
    });
    out.sort(function (a, b) { return a.along - b.along; });
    return out;
  }

  /* punt vóór je zonder route (vrij rijden): binnen een kegel rond je rijrichting */
  function aheadFree(lat, lon, heading, pts, maxDist, cone) {
    cone = cone || 30; var best = null;
    pts.forEach(function (p) {
      var d = distM(lat, lon, p.lat, p.lon);
      if (d > maxDist || d < 15) return;
      if (angleDiff(bearing(lat, lon, p.lat, p.lon), heading) > cone) return;
      if (p.h != null && angleDiff(p.h, heading) > 60 && angleDiff(p.h, (heading + 180) % 360) > 60) return;
      if (!best || d < best.d) best = { p: p, d: d };
    });
    return best;
  }

  var api = {
    distM: distM, bearing: bearing, angleDiff: angleDiff, instruction: instruction,
    fmtDist: fmtDist, sayDist: sayDist, fmtDur: fmtDur, roundDist: roundDist,
    buildRoute: buildRoute, remainingTime: remainingTime, locate: locate,
    nextStepIndex: nextStepIndex, pointAt: pointAt, parseSign: parseSign, speedAt: speedAt, smoothPath: smoothPath, smoothAt: smoothAt, thresholds: thresholds, pointsOnRoute: pointsOnRoute, aheadFree: aheadFree
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.NavCore = api;
})(this);
