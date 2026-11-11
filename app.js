/* MoesWeasley Maps – scherm en bediening. De rekenwerk-functies staan in nav-core.js. */
(function () {
"use strict";
var N = window.NavCore, CFG = window.NAVI_CFG || {};
var CAP = window.Capacitor, NATIVE = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform()), PL = (CAP && CAP.Plugins) || {};
var $ = function (id) { return document.getElementById(id); };

/* ---------- opslag ---------- */
function load(k, d) { try { var v = localStorage.getItem("mn_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function store(k, v) { try { localStorage.setItem("mn_" + k, JSON.stringify(v)); } catch (e) {} }
var S = Object.assign({ voice: true, flits: true, traffic: true, avoid: true, flow: true }, load("set", {}));
function saveS() { store("set", S); }

/* ---------- kleine hulpjes ---------- */
var toastT;
function toast(msg, err, ms) {
  var t = $("toast"); t.textContent = msg; t.className = err ? "err" : ""; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, ms || 3200);
}
function hhmm(d) { return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function fetchJson(url, ms) {
  var ctl = window.AbortController ? new AbortController() : null;
  var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms || 12000);
  return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { clearTimeout(t); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
}
function firstOk(urls, ms) {
  var i = 0;
  function next(err) { if (i >= urls.length) return Promise.reject(err || new Error("geen bron")); return fetchJson(urls[i++], ms).catch(next); }
  return next();
}
function vibrate(p) {
  if (NATIVE && PL.Haptics) { try { PL.Haptics.vibrate({ duration: 300 }); return; } catch (e) {} }
  if (navigator.vibrate) navigator.vibrate(p || [200, 80, 200]);
}

/* ---------- iconen ---------- */
var ICON = {
  volOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>',
  volOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  cam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="8" width="13" height="9" rx="2"/><path d="M16 11l5-2v7l-5-2"/><circle cx="9.5" cy="12.5" r="2.2"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>'
};
var MODANG = { "straight": 0, "slight right": 40, "right": 90, "sharp right": 135, "slight left": -40, "left": -90, "sharp left": -135 };
function head(x, y, a) { /* pijlpunt in richting a (graden, 0 = omhoog) */
  var r = a * Math.PI / 180, L = 9, s = 0.62;
  var x1 = x - L * Math.sin(r - s), y1 = y + L * Math.cos(r - s), x2 = x - L * Math.sin(r + s), y2 = y + L * Math.cos(r + s);
  return '<path d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + "L" + x + " " + y + "L" + x2.toFixed(1) + " " + y2.toFixed(1) + '"/>';
}
function maneuverSVG(ic) {
  var o = '<svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">';
  ic = ic || { kind: "turn", mod: "straight" };
  if (ic.kind === "arrive") return o + '<path d="M20 56V10"/><path d="M20 12h24l-5 8 5 8H20" fill="#fff" stroke-width="4"/></svg>';
  if (ic.kind === "uturn") return o + '<path d="M40 56V26a10 10 0 00-20 0v12"/>' + head(20, 40, 180) + "</svg>";
  if (ic.kind === "roundabout") {
    var a = MODANG[ic.mod] == null ? 0 : MODANG[ic.mod], r = a * Math.PI / 180;
    var sx = 32 + 11 * Math.sin(r), sy = 28 - 11 * Math.cos(r), ex = 32 + 25 * Math.sin(r), ey = 28 - 25 * Math.cos(r);
    return o + '<circle cx="32" cy="28" r="11" stroke-width="5" opacity=".75"/><path d="M32 58V39"/><path d="M' + sx.toFixed(1) + " " + sy.toFixed(1) + "L" + ex.toFixed(1) + " " + ey.toFixed(1) + '"/>' + head(+ex.toFixed(1), +ey.toFixed(1), a) +
      '<text x="32" y="33" fill="#fff" stroke="none" font-size="13" font-weight="800" text-anchor="middle" font-family="system-ui">' + (ic.exit || "") + "</text></svg>";
  }
  var ang = MODANG[ic.mod] == null ? 0 : MODANG[ic.mod], rr = ang * Math.PI / 180;
  var bx = 32 - 8 * Math.sin(rr), ex2 = bx + 22 * Math.sin(rr), ey2 = 30 - 22 * Math.cos(rr);
  return o + '<path d="M' + bx.toFixed(1) + " 58V30L" + ex2.toFixed(1) + " " + ey2.toFixed(1) + '"/>' + head(+ex2.toFixed(1), +ey2.toFixed(1), ang) + "</svg>";
}

/* ---------- stem ---------- */
var webVoice = null;
function pickVoice() {
  if (!window.speechSynthesis) return;
  var v = speechSynthesis.getVoices().filter(function (x) { return /^nl/i.test(x.lang); });
  webVoice = v.filter(function (x) { return /nl-NL/i.test(x.lang); })[0] || v[0] || null;
}
if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function say(text, force) {
  if (!text || (!S.voice && !force)) return;
  if (NATIVE && PL.TextToSpeech) {
    try { PL.TextToSpeech.speak({ text: text, lang: "nl-NL", rate: 1.0, pitch: 1.0, volume: 1.0, category: "playback", queueStrategy: 1 }).catch(function () {}); } catch (e) {}
    return;
  }
  if (window.speechSynthesis) {
    var u = new SpeechSynthesisUtterance(text); u.lang = "nl-NL"; if (webVoice) u.voice = webVoice; u.rate = 1.02;
    speechSynthesis.speak(u);
  }
}
function setMuteIcons() {
  [$("mute"), $("navmute")].forEach(function (b) { b.innerHTML = S.voice ? ICON.volOn : ICON.volOff; });
  $("s-voice").checked = S.voice;
}

/* ---------- scherm wakker houden ---------- */
var wakeLock = null;
function keepAwake(on) {
  if (NATIVE && PL.KeepAwake) { try { (on ? PL.KeepAwake.keepAwake() : PL.KeepAwake.allowSleep()).catch(function () {}); } catch (e) {} return; }
  if (on && navigator.wakeLock) navigator.wakeLock.request("screen").then(function (l) { wakeLock = l; }).catch(function () {});
  if (!on && wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
}

/* ---------- kaart ---------- */
var map = null, mapReady = false, meMarker = null, destMarker = null;
function initMap() {
  if (!window.maplibregl) { toast("Kaart kon niet laden. Is er internet?", true, 6000); return; }
  var last = load("lastpos", null);
  map = new maplibregl.Map({
    container: "map", style: CFG.mapStyle, attributionControl: false,
    center: last ? [last.lon, last.lat] : [5.29, 52.13], zoom: last ? 14 : 7, pitchWithRotate: true, maxPitch: 70
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
  map.on("load", function () { mapReady = true; styleMap(); addLayers(); setFlowLayer(); drawAll(); });
  map.on("error", function (e) { if (!mapReady && e && e.error && /style|fetch/i.test(String(e.error.message))) toast("Kaartstijl niet bereikbaar.", true); });
  ["dragstart", "pitchstart", "rotatestart"].forEach(function (ev) {
    map.on(ev, function (e) { if (e.originalEvent && st.follow) { st.follow = false; $("recenter").hidden = !st.nav && !st.pos; } });
  });
  map.on("zoomstart", function (e) { if (e.originalEvent && st.nav) { st.follow = false; $("recenter").hidden = false; } });
  /* lang drukken op de kaart = daarheen */
  var lpT = null, lpStart = null;
  map.on("touchstart", function (e) {
    if (st.nav || !e.originalEvent.touches || e.originalEvent.touches.length !== 1) return;
    lpStart = e.point; var ll = e.lngLat;
    lpT = setTimeout(function () { vibrate(30); chooseDest({ lat: ll.lat, lon: ll.lng, name: "Gekozen punt", sub: ll.lat.toFixed(5) + ", " + ll.lng.toFixed(5) }); }, 650);
  });
  map.on("touchmove", function (e) { if (lpT && lpStart && (Math.abs(e.point.x - lpStart.x) > 10 || Math.abs(e.point.y - lpStart.y) > 10)) { clearTimeout(lpT); lpT = null; } });
  map.on("touchend", function () { clearTimeout(lpT); lpT = null; });
  map.on("contextmenu", function (e) { if (!st.nav) chooseDest({ lat: e.lngLat.lat, lon: e.lngLat.lng, name: "Gekozen punt", sub: e.lngLat.lat.toFixed(5) + ", " + e.lngLat.lng.toFixed(5) }); });

  var el = document.createElement("div"); el.className = "me nofix";
  el.innerHTML = '<svg viewBox="0 0 40 40"><defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b5cff"/><stop offset="1" stop-color="#ff4fa3"/></linearGradient></defs><path d="M20 4l11 29-11-6-11 6z" fill="url(#mg)" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  meMarker = new maplibregl.Marker({ element: el, rotationAlignment: "map", pitchAlignment: "map" }).setLngLat(last ? [last.lon, last.lat] : [5.29, 52.13]);
  if (last) meMarker.addTo(map);
}
var EMPTY = { type: "FeatureCollection", features: [] };
var CAMCOL = { vast: "#2f9bff", mobiel: "#ff4f8b", traject: "#14c3a8", roodlicht: "#ef3c5a", overig: "#7b5cff" };
var TRAF = {
  afsluiting: { l: "Afsluiting", c: "#e0314f", pen: 360 }, ongeval: { l: "Ongeval", c: "#ff3d6e", pen: 300 },
  file: { l: "File", c: "#ff7a00", pen: 240 }, pech: { l: "Pechgeval", c: "#ff9a00", pen: 90 },
  obstakel: { l: "Obstakel op de weg", c: "#ffb300", pen: 90 }, rijstrook: { l: "Rijstrook dicht", c: "#ff8a1f", pen: 60 }, werk: { l: "Wegwerkzaamheden", c: "#d98a00", pen: 120 },
  snelheid: { l: "Snelheidsmaatregel", c: "#2f7bff", pen: 0 }, weer: { l: "Weersomstandigheden", c: "#4a90c2", pen: 0 },
  evenement: { l: "Evenement", c: "#8e6bff", pen: 0 }, overig: { l: "Verkeersmelding", c: "#7b80a0", pen: 0 }
};
function addLayers() {
  map.addSource("alts", { type: "geojson", data: EMPTY });
  map.addSource("route", { type: "geojson", data: EMPTY, lineMetrics: true });
  map.addSource("cams", { type: "geojson", data: EMPTY });
  map.addSource("traffic", { type: "geojson", data: EMPTY });
  var before = map.getLayer("road_label") ? "road_label" : undefined;
  map.addLayer({ id: "alts-case", type: "line", source: "alts", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 7, 16, 16], "line-opacity": .9 } }, before);
  map.addLayer({ id: "alts-line", type: "line", source: "alts", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#b9a6ff", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 4, 16, 10], "line-opacity": .85 } }, before);
  map.addLayer({ id: "route-glow", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#c24dff", "line-opacity": .35, "line-blur": 8, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 14, 16, 34] } }, before);
  map.addLayer({ id: "route-case", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 8, 16, 18] } }, before);
  map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#7b5cff", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 5, 16, 12],
    "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#7b5cff", 0.45, "#c24dff", 0.8, "#ff4fa3", 1, "#ff9a3c"] } }, before);
  map.addLayer({ id: "traffic-glow", type: "circle", source: "traffic", minzoom: 8, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 10, 15, 24], "circle-color": ["get", "c"], "circle-opacity": 0.35, "circle-blur": 0.8 } });
  map.addLayer({ id: "cams-glow", type: "circle", source: "cams", minzoom: 9, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 10, 15, 26], "circle-color": ["get", "c"], "circle-opacity": 0.35, "circle-blur": 0.8 } });
  map.addLayer({ id: "traffic-c", type: "circle", source: "traffic", minzoom: 8, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 15, 9], "circle-color": ["get", "c"], "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
  map.addLayer({ id: "cams-c", type: "circle", source: "cams", minzoom: 9, paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 4, 15, 10], "circle-color": ["get", "c"], "circle-stroke-color": "#fff", "circle-stroke-width": 2.5 } });
  map.on("click", "alts-line", function (e) { var f = e.features && e.features[0]; if (f && !st.nav) selectRoute(f.properties.i); });
  map.on("click", "cams-c", function (e) { var p = e.features[0].properties; toast(camLabel(p.type) + (p.max ? " · " + p.max + " km/u" : "") + (p.own ? " · jouw melding" : p.community ? " · gemeld" : "")); });
  map.on("click", "traffic-c", function (e) { var p = e.features[0].properties; toast((TRAF[p.t] || TRAF.overig).l); });
}
/* gebouwen: hoe hoger, hoe blauwer (roze → paars → blauw) */
var BUILD_COL = ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], ["get", "h"], 8], 0, "#ffc4e6", 15, "#e0b8ff", 35, "#a9a4ff", 70, "#6fb6ff"];
/* kaart in de kleuren van de app: zachte pastels, 3D-gebouwen en een lucht aan de horizon */
function styleMap() {
  var layers = (map.getStyle() && map.getStyle().layers) || [], has3d = false;
  function paint(id, k, v) { try { map.setPaintProperty(id, k, v); } catch (e) {} }
  layers.forEach(function (l) {
    var id = l.id.toLowerCase(), t = l.type;
    if (t === "background") paint(l.id, "background-color", "#efe8ff");
    else if (t === "fill" && /water|ocean|lake|sea/.test(id)) { paint(l.id, "fill-color", "#49bfff"); paint(l.id, "fill-opacity", 0.9); }
    else if (t === "line" && /waterway|river|canal/.test(id)) paint(l.id, "line-color", "#49bfff");
    else if (t === "fill" && /wood|forest/.test(id)) paint(l.id, "fill-color", "#52d98a");
    else if (t === "fill" && /park|grass|meadow|landcover|scrub|green|garden|pitch/.test(id)) paint(l.id, "fill-color", "#7ee6a8");
    else if (t === "fill-extrusion" && /building/.test(id)) { has3d = true; paint(l.id, "fill-extrusion-color", BUILD_COL); paint(l.id, "fill-extrusion-opacity", 0.88); }
    else if (t === "fill" && /building/.test(id)) paint(l.id, "fill-color", "#f1d4ff");
    else if (t === "fill" && /commercial|retail/.test(id)) paint(l.id, "fill-color", "#ffe0c7");
    else if (t === "fill" && /industrial/.test(id)) paint(l.id, "fill-color", "#e2dcff");
    else if (t === "fill" && /residential|landuse/.test(id)) paint(l.id, "fill-color", "#fbe3f4");
    else if (t === "line" && /motorway|trunk/.test(id) && !/casing|tunnel/.test(id)) paint(l.id, "line-color", "#ffa45c");
    else if (t === "line" && /motorway|trunk/.test(id) && /casing/.test(id)) paint(l.id, "line-color", "#ff6f91");
    else if (t === "line" && /primary/.test(id) && !/casing|tunnel/.test(id)) paint(l.id, "line-color", "#ffd166");
    else if (t === "line" && /secondary|tertiary/.test(id) && !/casing|tunnel/.test(id)) paint(l.id, "line-color", "#fff0a8");
    else if (t === "line" && /casing/.test(id)) paint(l.id, "line-color", "#d9cdf5");
  });
  var src = map.getSource("openmaptiles") ? "openmaptiles" : null;
  if (!has3d && src) {
    try {
      map.addLayer({ id: "mw-3d", type: "fill-extrusion", source: src, "source-layer": "building", minzoom: 14,
        paint: { "fill-extrusion-color": BUILD_COL, "fill-extrusion-opacity": 0.88,
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0] } });
    } catch (e) {}
  }
  if (typeof map.setSky === "function") {
    try { map.setSky({ "sky-color": "#8f7bff", "horizon-color": "#ffb3dd", "fog-color": "#efe8ff", "sky-horizon-blend": 0.7, "horizon-fog-blend": 0.6, "fog-ground-blend": 0.35 }); } catch (e) {}
  }
}
function setData(id, fc) { if (mapReady && map.getSource(id)) map.getSource(id).setData(fc); }
function drawAll() { drawCams(); drawTraffic(); drawRoutes(); }

/* ---------- toestand ---------- */
var st = {
  pos: null, speed: 0, heading: null, acc: null,
  dest: null, routes: [], sel: 0, route: null,
  nav: false, follow: true, hint: 0, offCount: 0, lastReroute: 0, rerouting: false,
  said: {}, warned: {}, routeCams: [], routeTraf: [], arrived: false, sim: null
};

/* ---------- GPS ---------- */
var gpsStop = null, gotFix = false;
function startGps() {
  if (gpsStop) return;
  function onErr(code) {
    if (code === 1) toast("Geen toegang tot je locatie. Zet locatie aan voor deze app.", true, 6000);
  }
  var BG = NATIVE && PL.BackgroundGeolocation;
  if (BG) {
    var stopped = false;
    var idP = Promise.resolve(BG.addWatcher({ backgroundTitle: "MoesWeasley Maps", backgroundMessage: "Navigeert en waarschuwt voor flitsers.", requestPermissions: true, stale: false, distanceFilter: 0 }, function (loc, err) {
      if (stopped) return;
      if (err) { onErr(err.code === "NOT_AUTHORIZED" ? 1 : 2); return; }
      if (loc) onPos({ lat: loc.latitude, lon: loc.longitude, acc: loc.accuracy, speed: loc.speed, heading: loc.bearing, t: loc.time || Date.now() });
    })).catch(function () { stopped = true; gpsStop = null; webGps(onErr); return null; });
    gpsStop = function () { stopped = true; idP.then(function (id) { if (id != null) BG.removeWatcher({ id: id }).catch(function () {}); }); };
    return;
  }
  webGps(onErr);
}
function webGps(onErr) {
  if (!navigator.geolocation) { toast("Dit toestel heeft geen GPS.", true); return; }
  var id = navigator.geolocation.watchPosition(function (p) {
    var c = p.coords; onPos({ lat: c.latitude, lon: c.longitude, acc: c.accuracy, speed: c.speed, heading: c.heading, t: p.timestamp });
  }, function (e) { onErr(e.code); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
  gpsStop = function () { navigator.geolocation.clearWatch(id); };
}

var prevFix = null;
function onPos(p, simulated) {
  if (st.sim && !simulated) return; /* tijdens simulatie echte GPS negeren */
  /* snelheid en richting zelf uitrekenen als het toestel ze niet geeft */
  if (prevFix && (p.speed == null || isNaN(p.speed) || p.heading == null || isNaN(p.heading))) {
    var dt = (p.t - prevFix.t) / 1000, d = N.distM(prevFix.lat, prevFix.lon, p.lat, p.lon);
    if (dt > 0.2) {
      if (p.speed == null || isNaN(p.speed)) p.speed = d / dt;
      if ((p.heading == null || isNaN(p.heading)) && d > 3) p.heading = N.bearing(prevFix.lat, prevFix.lon, p.lat, p.lon);
    }
  }
  prevFix = p;
  st.pos = { lat: p.lat, lon: p.lon }; st.acc = p.acc;
  st.speed = Math.max(0, p.speed || 0);
  if (p.heading != null && !isNaN(p.heading) && st.speed > 1.5) st.heading = p.heading;
  store("lastpos", st.pos);
  $("spd").textContent = Math.round(st.speed * 3.6);

  var show = { lat: p.lat, lon: p.lon }, camBearing = st.heading;
  if (st.nav && st.route && !st.rerouting) {
    var loc = N.locate(st.route, p.lat, p.lon, st.hint);
    var tol = Math.max(35, Math.min(80, (p.acc || 10) * 1.3));
    if (loc.off > tol) st.offCount++; else { st.offCount = 0; st.hint = loc.idx; }
    /* op de route: pijl op de weg en in de richting van de weg (rustiger dan het GPS-kompas) */
    if (loc.off < 25) { show = { lat: loc.lat, lon: loc.lon }; camBearing = loc.segBearing; }
    if (st.offCount >= 3 && Date.now() - st.lastReroute > 8000) reroute();
    else if (st.offCount === 0) navUpdate(loc.along);
  }
  if (map && meMarker) {
    if (!meMarker._map) meMarker.addTo(map);
    meMarker.getElement().classList.toggle("nofix", false);
  }
  if (!gotFix) { gotFix = true; if (map && !st.dest) map.jumpTo({ center: [p.lon, p.lat], zoom: 15 }); }
  animTo(show.lat, show.lon, camBearing);
  checkWarnings();
}

/* ---------- vloeiende beweging ----------
   GPS geeft ongeveer 1 positie per seconde. Pijl en kaart glijden elk beeldje (60 per seconde)
   van de vorige naar de nieuwe positie, in de tijd tussen twee posities. */
var anim = { cur: null, from: null, to: null, rot: 0, rotFrom: 0, rotTo: 0, t0: 0, dur: 1000, last: 0, running: false, zoom: null, pitch: 0 };
function angLerp(a, b, t) { var d = ((b - a + 540) % 360) - 180; return (a + d * t + 360) % 360; }
function animTo(lat, lon, rot) {
  var now = performance.now(), gap = anim.last ? now - anim.last : 1000;
  anim.last = now;
  anim.from = anim.cur || { lat: lat, lon: lon };
  if (anim.cur && N.distM(anim.cur.lat, anim.cur.lon, lat, lon) > 400) anim.from = { lat: lat, lon: lon }; /* grote sprong: direct */
  anim.to = { lat: lat, lon: lon };
  anim.rotFrom = anim.rot; anim.rotTo = rot == null ? anim.rot : rot;
  anim.t0 = now; anim.dur = Math.max(200, Math.min(1500, gap * 1.08));
  if (!anim.running) { anim.running = true; requestAnimationFrame(frame); }
}
function frame(now) {
  if (!anim.to || !map) { anim.running = false; return; }
  var t = Math.min(1, (now - anim.t0) / anim.dur);
  anim.cur = { lat: anim.from.lat + (anim.to.lat - anim.from.lat) * t, lon: anim.from.lon + (anim.to.lon - anim.from.lon) * t };
  anim.rot = angLerp(anim.rotFrom, anim.rotTo, t);
  var following = st.follow && (st.nav || st.freeFollow);
  /* tijdens navigeren staat de pijl vast op het scherm en draait de kaart eronder: geen trilling */
  var fixed = following && st.nav;
  $("navarrow").hidden = !fixed;
  if (meMarker) {
    meMarker.getElement().style.visibility = fixed ? "hidden" : "";
    if (!fixed) { meMarker.setLngLat([anim.cur.lon, anim.cur.lat]); meMarker.setRotation(anim.rot); }
  }
  if (following) {
    var cam = { center: [anim.cur.lon, anim.cur.lat] };
    if (st.nav) {
      var zt = st.speed > 25 ? 14.6 : st.speed > 14 ? 15.6 : 16.6;
      anim.zoom = anim.zoom == null ? map.getZoom() : anim.zoom + (zt - anim.zoom) * 0.04;
      anim.pitch = anim.pitch + (55 - anim.pitch) * 0.06;
      cam.bearing = anim.rot; cam.zoom = anim.zoom; cam.pitch = anim.pitch;
      cam.padding = { top: window.innerHeight * 0.42, bottom: 0, left: 0, right: 0 };
    }
    map.jumpTo(cam);
  } else { anim.zoom = null; anim.pitch = map.getPitch ? map.getPitch() : 0; }
  /* blijven lopen zolang we nog onderweg zijn naar de laatste positie, of tijdens navigeren */
  if (t < 1 || (st.nav && following)) requestAnimationFrame(frame); else anim.running = false;
}

/* ---------- zoeken ---------- */
var qT = null, qSeq = 0;
function recents() { return load("recent", []); }
function addRecent(d) {
  var r = recents().filter(function (x) { return Math.abs(x.lat - d.lat) > 1e-4 || Math.abs(x.lon - d.lon) > 1e-4; });
  r.unshift({ lat: d.lat, lon: d.lon, name: d.name, sub: d.sub || "" }); store("recent", r.slice(0, 8));
}
function showResults(list, head) {
  var box = $("results");
  if (!list.length) { box.hidden = true; return; }
  box.innerHTML = (head ? '<div class="reshead">' + esc(head) + "</div>" : "") + list.map(function (r, i) {
    return '<button class="res" data-i="' + i + '"><span class="pin' + (r.recent ? " recent" : "") + '">' + (r.recent ? ICON.clock : ICON.pin) + "</span><span><b>" + esc(r.name) + "</b><small>" + esc(r.sub || "") + (r.dist != null ? " · " + N.fmtDist(r.dist) : "") + "</small></span></button>";
  }).join("");
  box.hidden = false;
  Array.prototype.forEach.call(box.querySelectorAll(".res"), function (b) {
    b.onclick = function () { var r = list[+b.dataset.i]; $("q").blur(); box.hidden = true; $("q").value = r.name; $("qclear").hidden = false; chooseDest(r); };
  });
}
function photonLabel(f) {
  var p = f.properties || {};
  var street = p.street ? p.street + (p.housenumber ? " " + p.housenumber : "") : "";
  var name = p.name || street || p.city || "Onbekend";
  var parts = [];
  if (p.name && street) parts.push(street);
  if (p.city && p.city !== name) parts.push(p.city); else if (p.county && p.county !== name) parts.push(p.county);
  if (p.country && p.countrycode !== "NL") parts.push(p.country);
  return { name: name, sub: parts.join(", ") };
}
function search(q) {
  var seq = ++qSeq, here = st.pos || (map ? { lat: map.getCenter().lat, lon: map.getCenter().lng } : null);
  var pu = CFG.photon + "?limit=8&q=" + encodeURIComponent(q) + (here ? "&lat=" + here.lat.toFixed(4) + "&lon=" + here.lon.toFixed(4) : "");
  fetchJson(pu, 8000).then(function (d) {
    return (d.features || []).map(function (f) {
      var l = photonLabel(f), c = f.geometry.coordinates;
      return { lat: c[1], lon: c[0], name: l.name, sub: l.sub };
    });
  }).catch(function () {
    var nu = CFG.nominatim + "?format=jsonv2&limit=8&accept-language=nl&countrycodes=nl,be,de,lu,fr&q=" + encodeURIComponent(q);
    return fetchJson(nu, 8000).then(function (d) {
      return d.map(function (x) { var parts = x.display_name.split(", "); return { lat: +x.lat, lon: +x.lon, name: x.name || parts[0], sub: parts.slice(1, 3).join(", ") }; });
    });
  }).then(function (list) {
    if (seq !== qSeq) return;
    if (here) list.forEach(function (r) { r.dist = N.distM(here.lat, here.lon, r.lat, r.lon); });
    if (!list.length) { $("results").innerHTML = '<div class="reshead">Niets gevonden voor "' + esc(q) + '"</div>'; $("results").hidden = false; return; }
    showResults(list);
  }).catch(function () { if (seq === qSeq) toast("Zoeken lukt niet. Is er internet?", true); });
}
function wireSearch() {
  var q = $("q");
  q.addEventListener("input", function () {
    $("qclear").hidden = !q.value; clearTimeout(qT);
    var v = q.value.trim();
    if (v.length < 2) { showRecents(); return; }
    qT = setTimeout(function () { search(v); }, 320);
  });
  q.addEventListener("focus", function () { if (!q.value.trim()) showRecents(); });
  q.addEventListener("keydown", function (e) { if (e.key === "Enter" && q.value.trim()) { clearTimeout(qT); search(q.value.trim()); } });
  $("qclear").onclick = function () { q.value = ""; $("qclear").hidden = true; $("results").hidden = true; if (st.dest) cancelRoute(); };
  document.addEventListener("pointerdown", function (e) { if (!$("top").contains(e.target)) $("results").hidden = true; });
}
function showRecents() {
  var r = recents().map(function (x) { return Object.assign({ recent: true }, x); });
  if (r.length) showResults(r, "Recent"); else $("results").hidden = true;
}

/* ---------- route ---------- */
function origin() {
  if (st.pos) return st.pos;
  if (map) { var c = map.getCenter(); return { lat: c.lat, lon: c.lng, guess: true }; }
  return null;
}
function fetchRoutes(from, to, heading) {
  var path = from.lon.toFixed(6) + "," + from.lat.toFixed(6) + ";" + to.lon.toFixed(6) + "," + to.lat.toFixed(6);
  var qs = "?overview=full&geometries=geojson&steps=true&alternatives=3&continue_straight=true";
  if (heading != null && st.speed > 3) qs += "&bearings=" + Math.round(heading) + ",60;&radiuses=60;unlimited";
  return firstOk((CFG.routers || []).map(function (b) { return b + path + qs; }), 15000).then(function (d) {
    if (d.code !== "Ok" || !d.routes || !d.routes.length) throw new Error(d.message || "geen route");
    return d.routes.map(N.buildRoute);
  });
}
function scoreRoutes(routes) {
  var traf = activeTraffic();
  routes.forEach(function (r) {
    r.traf = S.traffic ? firstPerIncident(N.pointsOnRoute(r, traf, 35)) : [];
    r.blocking = r.traf.filter(function (o) { return (TRAF[o.p.t] || {}).pen > 0 || o.p.delay > 60; });
    r.delay = r.blocking.reduce(function (a, o) { return a + (o.p.delay || 0); }, 0);
    r.penalty = r.blocking.reduce(function (a, o) { return a + (o.p.delay != null ? Math.min(1800, o.p.delay) : (TRAF[o.p.t] || TRAF.overig).pen); }, 0);
    r.score = r.duration + (S.avoid ? r.penalty : 0);
  });
  var fastest = 0, best = 0;
  routes.forEach(function (r, i) { if (r.duration < routes[fastest].duration) fastest = i; if (r.score < routes[best].score) best = i; });
  routes.forEach(function (r, i) { r.fastest = i === fastest; r.calm = i === best && best !== fastest; });
  return best;
}
function chooseDest(d) {
  if (st.nav) return;
  st.dest = d; addRecent(d);
  $("destname").textContent = d.name; $("destsub").textContent = d.sub || "";
  $("alts").innerHTML = '<div class="alt sel"><div class="t">…</div><div class="d">Route berekenen</div></div>';
  $("routewarn").hidden = true;
  openSheet("routesheet");
  if (!destMarker && window.maplibregl) {
    var el = document.createElement("div"); el.className = "destpin";
    el.innerHTML = '<svg viewBox="0 0 34 44"><defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4fa3"/><stop offset="1" stop-color="#ff9a3c"/></linearGradient></defs><path d="M17 1C8 1 1 8 1 17c0 12 16 26 16 26s16-14 16-26C33 8 26 1 17 1z" fill="url(#dg)" stroke="#fff" stroke-width="2"/><circle cx="17" cy="17" r="6" fill="#fff"/></svg>';
    destMarker = new maplibregl.Marker({ element: el, anchor: "bottom" });
  }
  if (destMarker && map) destMarker.setLngLat([d.lon, d.lat]).addTo(map);
  var from = origin();
  if (!from) return;
  if (from.guess) toast("Nog geen GPS: route vanaf het midden van de kaart.", false, 4000);
  st.follow = false; st.freeFollow = false;
  fetchRoutes(from, d, null).then(function (routes) {
    if (st.dest !== d) return;
    st.routes = routes; st.sel = scoreRoutes(routes);
    renderAlts(); drawRoutes(); fitRoutes();
    fetchLive(routesBox(routes), true).then(function (changed) {
      if (!changed || st.dest !== d || st.nav) return;
      st.sel = scoreRoutes(st.routes); renderAlts(); drawRoutes();
    });
  }).catch(function (e) {
    $("alts").innerHTML = '<div class="alt"><div class="t">Geen route</div><div class="d">' + esc(/abort/i.test(String(e)) ? "De routeplanner reageert niet." : "Probeer het opnieuw of kies een ander punt.") + "</div></div>";
  });
}
function renderAlts() {
  $("alts").innerHTML = st.routes.map(function (r, i) {
    var tags = "";
    if (r.fastest) tags += '<span class="tag">Snelst</span> ';
    if (r.calm) tags += '<span class="tag">Minder drukte</span> ';
    if (r.blocking.length) tags += '<span class="tag bad">' + r.blocking.length + (r.blocking.length === 1 ? " melding" : " meldingen") + (r.delay >= 60 ? " · +" + Math.round(r.delay / 60) + " min" : "") + "</span>";
    return '<button class="alt' + (i === st.sel ? " sel" : "") + '" data-i="' + i + '"><div class="t">' + N.fmtDur(r.duration) + '</div><div class="d">' + N.fmtDist(r.distance) + " · aankomst " + hhmm(new Date(Date.now() + r.duration * 1000)) + "</div>" + tags + "</button>";
  }).join("");
  Array.prototype.forEach.call($("alts").querySelectorAll(".alt"), function (b) { b.onclick = function () { selectRoute(+b.dataset.i); }; });
  var r = st.routes[st.sel], w = $("routewarn");
  if (r && r.blocking.length) {
    var kinds = {}; r.blocking.forEach(function (o) { var l = TRAF[o.p.t].l.toLowerCase(); kinds[l] = (kinds[l] || 0) + 1; });
    w.textContent = "Op deze route: " + Object.keys(kinds).map(function (k) { return kinds[k] + "× " + k; }).join(", ") + ".";
    w.hidden = false;
  } else w.hidden = true;
}
function selectRoute(i) { st.sel = i; renderAlts(); drawRoutes(); }
function drawRoutes() {
  var alts = [], main = EMPTY;
  if (st.nav && st.route) main = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: st.route.coords } }] };
  else st.routes.forEach(function (r, i) {
    var f = { type: "Feature", properties: { i: i }, geometry: { type: "LineString", coordinates: r.coords } };
    if (i === st.sel) main = { type: "FeatureCollection", features: [f] }; else alts.push(f);
  });
  setData("alts", { type: "FeatureCollection", features: alts });
  setData("route", main);
}
function fitRoutes() {
  if (!map || !st.routes.length) return;
  var b = new maplibregl.LngLatBounds();
  st.routes.forEach(function (r) { r.coords.forEach(function (c) { b.extend(c); }); });
  var sh = $("routesheet").offsetHeight || 260;
  map.fitBounds(b, { padding: { top: 90, bottom: sh + 30, left: 40, right: 40 }, bearing: 0, pitch: 0, duration: 700, maxZoom: 16 });
}
function cancelRoute() {
  st.dest = null; st.routes = []; closeSheets();
  if (destMarker) destMarker.remove();
  drawRoutes(); $("q").value = ""; $("qclear").hidden = true;
}

/* ---------- navigeren ---------- */
function startNav() {
  var r = st.routes[st.sel]; if (!r) return;
  st.route = r; st.nav = true; st.follow = true; st.hint = 0; st.offCount = 0; st.said = {}; st.warned = {}; st.arrived = false;
  prepRouteWarnings();
  closeSheets(); document.body.classList.add("nav");
  $("top").hidden = true; $("banner").hidden = false; $("navbar").hidden = false; $("mute").hidden = true;
  drawRoutes(); keepAwake(true);
  var first = r.steps[1];
  say("De route is gestart." + (first && !first.silent ? " " + (first.startDist > 200 ? "Over " + N.sayDist(first.startDist) + ", " + lc(first.voice) : first.voice) + "." : ""));
  if (first) st.said[1 + "p"] = true;
  if (st.pos) onPos({ lat: st.pos.lat, lon: st.pos.lon, acc: st.acc, speed: st.speed, heading: st.heading, t: Date.now() }, !!st.sim);
  else navUpdate(0);
}
function stopNav(silent) {
  st.nav = false; st.route = null; stopSim();
  document.body.classList.remove("nav");
  $("top").hidden = false; $("banner").hidden = true; $("navbar").hidden = true; $("then").hidden = true; $("recenter").hidden = true; $("mute").hidden = false;
  hideAlert(); keepAwake(false);
  $("navarrow").hidden = true; $("street").hidden = true; if (meMarker) { meMarker.getElement().style.visibility = ""; if (anim.cur) { meMarker.setLngLat([anim.cur.lon, anim.cur.lat]); meMarker.setRotation(anim.rot); } }
  if (map) map.easeTo({ pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
  if (!silent) cancelRoute(); else { st.routes = []; drawRoutes(); if (destMarker) destMarker.remove(); }
}
function lc(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
function navUpdate(along) {
  var r = st.route; if (!r) return;
  st.along = along;
  var remD = Math.max(0, r.distance - along), remT = N.remainingTime(r, along);
  $("eta").textContent = hhmm(new Date(Date.now() + remT * 1000));
  $("remt").textContent = N.fmtDur(remT); $("remd").textContent = N.fmtDist(remD);
  if (remD < 30 && !st.arrived) { arrive(); return; }
  var i = N.nextStepIndex(r, along), s = r.steps[i], dist = Math.max(0, s.startDist - along);
  $("bicon").innerHTML = maneuverSVG(s.icon);
  $("bdist").textContent = N.fmtDist(dist);
  $("btext").textContent = s.type === "arrive" ? s.text : s.text.replace(/ naar .*$/, "").replace(/ richting .*$/, "");
  var extra = (s.text.match(/ (richting .*)$/) || [])[1];
  $("broad").textContent = s.road || (extra ? extra : "");
  var cur = r.steps[i - 1] && r.steps[i - 1].road; $("street").textContent = cur || ""; $("street").hidden = !cur;
  var nx = r.steps[i + 1], close = nx && nx.startDist - s.startDist < 160 && !nx.silent;
  $("then").hidden = !close;
  if (close) $("thenic").innerHTML = maneuverSVG(nx.icon);

  /* hardop */
  if (s.silent || st.rerouting) return;
  var th = N.thresholds(st.speed), gap = s.startDist - (r.steps[i - 1] ? r.steps[i - 1].startDist : 0);
  var then = close ? ", daarna " + lc(nx.voice) : "";
  if (s.type === "arrive") {
    if (!st.said[i + "p"] && dist <= th.prep && dist > 60) { st.said[i + "p"] = true; say("Over " + N.sayDist(dist) + " " + lc(s.voice)); }
    return;
  }
  if (dist <= th.now) {
    if (!st.said[i + "n"]) { st.said[i + "n"] = st.said[i + "p"] = st.said[i + "f"] = true; say(s.voice + then); }
  } else if (dist <= th.prep) {
    if (!st.said[i + "p"] && dist > th.now + 25) { st.said[i + "p"] = st.said[i + "f"] = true; say("Over " + N.sayDist(dist) + ", " + lc(s.voice) + then); }
  } else if (th.far && dist <= th.far && gap > th.far * 1.2) {
    if (!st.said[i + "f"] && dist > th.prep + 150) { st.said[i + "f"] = true; say("Over " + N.sayDist(dist) + ", " + lc(s.voice)); }
  }
}
function arrive() {
  st.arrived = true;
  var last = st.route.steps[st.route.steps.length - 1];
  say(last ? last.voice : "Je bent op je bestemming");
  $("bdist").textContent = "Je bent er!"; $("btext").textContent = last ? last.text : ""; $("broad").textContent = st.dest ? st.dest.name : "";
  $("bicon").innerHTML = maneuverSVG({ kind: "arrive" });
  setTimeout(function () { if (st.arrived) stopNav(false); }, 6000);
}
function reroute() {
  if (st.rerouting || !st.dest || !st.pos) return;
  st.rerouting = true; st.lastReroute = Date.now();
  $("btext").textContent = "Nieuwe route berekenen…"; $("bdist").textContent = "↻"; $("broad").textContent = "";
  say("Route wordt herberekend");
  fetchRoutes(st.pos, st.dest, st.heading).then(function (routes) {
    if (!st.nav) return;
    var best = scoreRoutes(routes);
    st.route = routes[best]; st.routes = routes; st.sel = best; st.hint = 0; st.offCount = 0; st.said = {};
    prepRouteWarnings(); drawRoutes();
  }).catch(function () { toast("Geen nieuwe route gevonden, ik probeer het zo weer.", true); })
    .then(function () { st.rerouting = false; });
}

/* ---------- simulatie ---------- */
function startSim() {
  var r = st.nav ? st.route : st.routes[st.sel];
  if (!r) { toast("Kies eerst een bestemming."); return; }
  closeSheets();
  var along = 0, step = 0.5;
  st.sim = setInterval(function () {
    var si = 0; for (var k = 0; k < r.steps.length; k++) if (r.steps[k].startDist <= along) si = k;
    var s = r.steps[si], v = s && s.dur > 0 ? Math.min(36, Math.max(8, s.dist / s.dur)) : 14;
    along += v * step;
    if (along >= r.distance) { along = r.distance; }
    var c = r.coords, cum = r.cum, i = 0; while (i < cum.length - 2 && cum[i + 1] < along) i++;
    var seg = cum[i + 1] - cum[i], t = seg ? (along - cum[i]) / seg : 0;
    var lon = c[i][0] + (c[i + 1][0] - c[i][0]) * t, lat = c[i][1] + (c[i + 1][1] - c[i][1]) * t;
    onPos({ lat: lat, lon: lon, acc: 5, speed: v, heading: N.bearing(c[i][1], c[i][0], c[i + 1][1], c[i + 1][0]), t: Date.now() }, true);
    if (along >= r.distance) stopSim();
  }, step * 1000);
  if (!st.nav) startNav();
  toast("Simulatie gestart");
}
function stopSim() { if (st.sim) { clearInterval(st.sim); st.sim = null; } }

/* ---------- flitsers ---------- */
var natData = load("flitsers", null), mine = load("mine", []), community = [];
var REPORT_TTL = 3 * 3600 * 1000;
function camLabel(t) { return { vast: "Flitspaal", mobiel: "Mobiele flitser", traject: "Trajectcontrole", roodlicht: "Roodlichtcamera", overig: "Controle" }[t] || "Flitser"; }
function allCams() {
  var a = [], now = Date.now();
  if (natData) {
    (natData.cams || []).forEach(function (c) { a.push(c); });
    (natData.trajects || []).forEach(function (t) { a.push({ id: t.id + "s", lat: t.from[0], lon: t.from[1], type: "traject", max: t.max || null, start: true }); });
  }
  mine.forEach(function (c) { if (c.when + REPORT_TTL > now) a.push(Object.assign({ own: true }, c)); });
  community.forEach(function (c) { if (c.expires > now) a.push(c); });
  return a;
}
function drawCams() {
  if (!S.flits) { setData("cams", EMPTY); return; }
  setData("cams", { type: "FeatureCollection", features: allCams().map(function (c) {
    return { type: "Feature", properties: { type: c.type, max: c.max || 0, own: !!c.own, community: !!c.community, c: CAMCOL[c.type] || CAMCOL.overig }, geometry: { type: "Point", coordinates: [c.lon, c.lat] } };
  }) });
}
function setFlitsInfo() {
  var n = natData ? (natData.cams || []).length + (natData.trajects || []).length : 0;
  $("flitsinfo").textContent = natData ? n + " flitsers en trajectcontroles. Bijgewerkt " + new Date(natData.updated * 1000).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) + "." : "Flitspalen, trajectcontroles en meldingen. Nog niet geladen.";
  var m = mine.filter(function (c) { return c.when + REPORT_TTL > Date.now(); }).length;
  $("myinfo").textContent = m ? (m === 1 ? "1 actieve melding" : m + " actieve meldingen") : "Nog geen meldingen.";
}
function loadFlitsers() {
  var stamp = new Date().toISOString().slice(0, 13);
  firstOk((CFG.dataBases || []).map(function (b) { return b + "flitsers.json?d=" + stamp; }), 20000).then(function (d) {
    if (!d || !(d.cams || d.trajects)) return;
    natData = d; store("flitsers", d); setFlitsInfo(); drawCams(); if (st.nav) prepRouteWarnings();
  }).catch(function () { setFlitsInfo(); });
}
function report(type) {
  closeSheets();
  if (!st.pos) { toast("Nog geen GPS-positie, melden kan nog niet.", true); return; }
  var c = { id: "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), lat: +st.pos.lat.toFixed(6), lon: +st.pos.lon.toFixed(6), type: type, h: st.heading != null && st.speed > 3 ? Math.round(st.heading) : null, when: Date.now() };
  mine.push(c); mine = mine.filter(function (x) { return x.when + REPORT_TTL > Date.now(); }); store("mine", mine);
  fbReport(c); drawCams(); setFlitsInfo(); vibrate(40);
  toast("Bedankt! " + camLabel(type) + " gemeld" + (fb.ready ? " en gedeeld." : "."));
  if (st.nav) prepRouteWarnings();
}

/* ---------- verkeer (NDW) ---------- */
var traffic = load("verkeer", null);
function activeTraffic() {
  if (!S.traffic) return [];
  var now = Date.now();
  var a = ((traffic && traffic.items) || []).concat(live.items);
  return a.filter(function (x) { return !x.until || Date.parse(x.until) > now; });
}
function drawTraffic() {
  setData("traffic", { type: "FeatureCollection", features: activeTraffic().filter(function (x) { return !x.tail; }).map(function (x) {
    return { type: "Feature", properties: { t: x.t, c: (TRAF[x.t] || TRAF.overig).c }, geometry: { type: "Point", coordinates: [x.lon, x.lat] } };
  }) });
}
function setTrafInfo() {
  $("trafinfo").textContent = "Files, ongevallen en afsluitingen van het NDW" + (KEYS.tomtom ? ", TomTom" : "") + (KEYS.here ? ", HERE" : "") + "." + (traffic ? " NDW bijgewerkt " + hhmm(new Date(traffic.updated * 1000)) + "." : "");
  var ls = [];
  if (KEYS.tomtom) ls.push("TomTom " + (live.ok.tomtom === false ? "werkt niet (sleutel?)" : live.ok.tomtom ? "verbonden" : "klaar"));
  if (KEYS.here) ls.push("HERE " + (live.ok.here === false ? "werkt niet (sleutel?)" : live.ok.here ? "verbonden" : "klaar"));
  $("liveinfo").textContent = ls.length ? ls.join(" · ") + (live.when ? " · bijgewerkt " + hhmm(new Date(live.when)) : "") + "." : "Vul een gratis sleutel in voor live files, ongevallen en drukte op de kaart.";
}
function loadTraffic() {
  var stamp = new Date().toISOString().slice(0, 15);
  firstOk((CFG.dataBases || []).map(function (b) { return b + "verkeer.json?d=" + stamp; }), 20000).then(function (d) {
    if (!d || !d.items) return;
    /* nieuwste van de bronnen gebruiken */
    if (traffic && traffic.updated > d.updated) return;
    traffic = d; store("verkeer", d); setTrafInfo(); drawTraffic(); if (st.nav) prepRouteWarnings();
  }).catch(function () { setTrafInfo(); });
}

/* ---------- live verkeer: TomTom en HERE (gratis sleutels) ---------- */
var KEYS = { tomtom: load("key_tomtom", CFG.tomtomKey || ""), here: load("key_here", CFG.hereKey || "") };
var live = { items: [], when: 0, box: null, ok: {} };
var TT_CAT = { 1: "ongeval", 2: "weer", 3: "obstakel", 4: "weer", 5: "weer", 6: "file", 7: "rijstrook", 8: "afsluiting", 9: "werk", 10: "weer", 11: "weer", 14: "pech" };
var HERE_T = { accident: "ongeval", congestion: "file", construction: "werk", disabledVehicle: "pech", roadClosure: "afsluiting",
  laneRestriction: "rijstrook", roadHazard: "obstakel", weather: "weer", plannedEvent: "evenement" };
/* lange files als reeks punten (elke 250 m), zodat ze op de route gevonden worden */
function samplePts(coords, base) {
  var out = [], acc = 0;
  coords.forEach(function (c, i) {
    if (i) acc += N.distM(coords[i - 1][1], coords[i - 1][0], c[1], c[0]);
    if (i === 0 || acc >= 250 || i === coords.length - 1) { out.push(Object.assign({}, base, { lat: c[1], lon: c[0], tail: out.length > 0 })); acc = 0; }
  });
  return out;
}
function firstPerIncident(list) { var seen = {}; return list.filter(function (o) { if (seen[o.p.id]) return false; seen[o.p.id] = 1; return true; }); }
function routesBox(routes) {
  var b = { w: 180, s: 90, e: -180, n: -90 };
  routes.forEach(function (r) { r.coords.forEach(function (c) { b.w = Math.min(b.w, c[0]); b.e = Math.max(b.e, c[0]); b.s = Math.min(b.s, c[1]); b.n = Math.max(b.n, c[1]); }); });
  return { w: b.w - 0.02, s: b.s - 0.02, e: b.e + 0.02, n: b.n + 0.02 };
}
/* grote gebieden opdelen in vakken van maximaal 1 x 1 graad (beide diensten hebben een maximum) */
function boxCells(b) {
  var cells = [];
  for (var x = b.w; x < b.e; x += 1) for (var y = b.s; y < b.n; y += 1) cells.push({ w: x, s: y, e: Math.min(b.e, x + 1), n: Math.min(b.n, y + 1) });
  return cells.slice(0, 8);
}
function ttFetch(c) {
  var fields = "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description},endTime,from,to,delay,roadNumbers}}}";
  var u = "https://api.tomtom.com/traffic/services/5/incidentDetails?key=" + encodeURIComponent(KEYS.tomtom) + "&bbox=" + [c.w, c.s, c.e, c.n].map(function (v) { return v.toFixed(4); }).join(",") +
    "&fields=" + encodeURIComponent(fields) + "&language=nl-NL&timeValidityFilter=present";
  return fetchJson(u, 15000).then(function (d) {
    var out = [];
    (d.incidents || []).forEach(function (f) {
      var p = f.properties || {}, g = f.geometry || {};
      var coords = g.type === "Point" ? [g.coordinates] : (g.coordinates || []);
      if (!coords.length) return;
      var base = { id: "tt" + p.id, t: TT_CAT[p.iconCategory] || "overig", src: "TomTom", delay: p.delay || null, until: p.endTime || null,
        desc: ((p.events || [])[0] || {}).description || "", road: (p.roadNumbers || []).join(", ") };
      out = out.concat(samplePts(coords, base));
    });
    return out;
  });
}
function hereFetch(c) {
  var u = "https://data.traffic.hereapi.com/v7/incidents?in=bbox:" + [c.w, c.s, c.e, c.n].map(function (v) { return v.toFixed(4); }).join(",") +
    "&locationReferencing=shape&lang=nl-NL&apiKey=" + encodeURIComponent(KEYS.here);
  return fetchJson(u, 15000).then(function (d) {
    var out = [];
    (d.results || []).forEach(function (r) {
      var det = r.incidentDetails || {}, coords = [];
      (((r.location || {}).shape || {}).links || []).forEach(function (l) { (l.points || []).forEach(function (pt) { coords.push([pt.lng, pt.lat]); }); });
      if (!coords.length) return;
      var t = det.roadClosed ? "afsluiting" : (HERE_T[det.type] || "overig");
      out = out.concat(samplePts(coords, { id: "here" + det.id, t: t, src: "HERE", until: det.endTime || null, desc: (det.description || {}).value || "" }));
    });
    return out;
  });
}
/* haalt live meldingen op voor een gebied; geeft true als er iets veranderd is */
function fetchLive(box, force) {
  if (!S.traffic || (!KEYS.tomtom && !KEYS.here) || !box) return Promise.resolve(false);
  if (!force && Date.now() - live.when < 3 * 60 * 1000) return Promise.resolve(false);
  var cells = boxCells(box), jobs = [];
  function run(name, fn) {
    jobs.push(Promise.all(cells.map(fn)).then(function (parts) { live.ok[name] = true; return [].concat.apply([], parts); })
      .catch(function () { live.ok[name] = false; return []; }));
  }
  if (KEYS.tomtom) run("tomtom", ttFetch);
  if (KEYS.here) run("here", hereFetch);
  return Promise.all(jobs).then(function (lists) {
    var tt = lists[0] || [], hr = KEYS.tomtom ? (lists[1] || []) : lists[0] || [];
    if (!KEYS.tomtom) tt = [];
    /* dubbele meldingen (zelfde soort binnen 150 m) van HERE weglaten als TomTom hem al heeft */
    var heads = tt.filter(function (x) { return !x.tail; });
    var dupIds = {};
    hr.forEach(function (x) { if (!x.tail && heads.some(function (y) { return y.t === x.t && N.distM(x.lat, x.lon, y.lat, y.lon) < 150; })) dupIds[x.id] = 1; });
    live.items = tt.concat(hr.filter(function (x) { return !dupIds[x.id]; }));
    live.when = Date.now(); live.box = box;
    drawTraffic(); setTrafInfo(); if (st.nav) prepRouteWarnings();
    return true;
  });
}

/* drukte op de kaart: TomTom-verkeerstegels (groen/oranje/rood) */
function setFlowLayer() {
  if (!mapReady) return;
  try { if (map.getLayer("flow")) map.removeLayer("flow"); if (map.getSource("flow")) map.removeSource("flow"); } catch (e) {}
  if (!S.flow || !S.traffic) return;
  var tiles = KEYS.tomtom ? ["https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?tileSize=256&thickness=10&key=" + encodeURIComponent(KEYS.tomtom)]
    : KEYS.here ? ["https://traffic.maps.hereapi.com/v3/flow/mc/{z}/{x}/{y}/png?apiKey=" + encodeURIComponent(KEYS.here)] : null;
  if (!tiles) return;
  map.addSource("flow", { type: "raster", tiles: tiles, tileSize: 256, minzoom: 6, maxzoom: 18, attribution: KEYS.tomtom ? "Verkeer © TomTom" : "Verkeer © HERE" });
  map.addLayer({ id: "flow", type: "raster", source: "flow", minzoom: 9, paint: { "raster-opacity": 0.85 } }, map.getLayer("alts-case") ? "alts-case" : undefined);
}

/* ---------- waarschuwingen ---------- */
function prepRouteWarnings() {
  if (!st.route) return;
  st.routeCams = S.flits ? N.pointsOnRoute(st.route, allCams(), 30) : [];
  st.routeTraf = S.traffic ? firstPerIncident(N.pointsOnRoute(st.route, activeTraffic().filter(function (x) { return (TRAF[x.t] || {}).pen > 0 || x.delay > 60; }), 35)) : [];
}
var alertFor = null;
function showAlert(kind, title, text, icon, pulse) {
  var a = $("alert"); a.className = kind === "traffic" ? "traffic" : ""; if (pulse) a.classList.add("pulse");
  $("atitle").textContent = title; $("atext").textContent = text; $("aicon").innerHTML = icon; a.hidden = false;
}
function hideAlert() { $("alert").hidden = true; alertFor = null; $("limit").hidden = true; $("speed").classList.remove("over"); }
function checkWarnings() {
  var kmh = st.speed * 3.6, camHit = null, trafHit = null;
  var camRange = Math.max(400, st.speed * 22), trafRange = st.speed > 22 ? 2000 : st.speed > 14 ? 1200 : 600;
  if (st.nav && st.route && st.along != null) {
    var al = st.along;
    for (var i = 0; i < st.routeCams.length; i++) {
      var o = st.routeCams[i], d = o.along - al;
      if (d < -15) continue; if (d > camRange) break; camHit = { p: o.p, d: Math.max(0, d) }; break;
    }
    for (var j = 0; j < st.routeTraf.length; j++) {
      var t = st.routeTraf[j], dt = t.along - al;
      if (dt < -20) continue; if (dt > trafRange) break; trafHit = { p: t.p, d: Math.max(0, dt) }; break;
    }
  } else if (S.flits && st.pos && st.heading != null && st.speed > 5) {
    camHit = N.aheadFree(st.pos.lat, st.pos.lon, st.heading, allCams(), camRange, 25);
  }
  if (!S.flits) camHit = null;
  if (camHit) {
    var c = camHit.p, key = "c" + c.id;
    var txt = N.fmtDist(camHit.d) + " · " + camLabel(c.type) + (c.max ? " · " + c.max + " km/u" : "") + (c.own ? " · jouw melding" : c.community ? " · gemeld" : "");
    var over = c.max && kmh > c.max + 2;
    showAlert("cam", c.type === "traject" ? "Let op trajectcontrole" : "Let op flitser", txt, ICON.cam, over);
    alertFor = key;
    $("limit").hidden = !c.max; $("limit").textContent = c.max || "";
    $("speed").classList.toggle("over", !!over);
    if (!st.warned[key]) {
      st.warned[key] = true; vibrate();
      say((c.type === "traject" ? "Let op, trajectcontrole" : "Let op, " + lc(camLabel(c.type))) + " over " + N.sayDist(camHit.d) + (c.max ? ", maximaal " + c.max : ""));
    }
    return;
  }
  if (trafHit) {
    var tp = trafHit.p, tk = "t" + tp.id, tl = (TRAF[tp.t] || TRAF.overig).l;
    var extra = tp.delay >= 60 ? " · +" + Math.round(tp.delay / 60) + " min" : "";
    showAlert("traffic", tl, "Over " + N.fmtDist(trafHit.d) + " op je route" + extra + (tp.desc && tp.desc.toLowerCase() !== tl.toLowerCase() ? " · " + tp.desc : ""), ICON.warn, false);
    alertFor = tk; $("limit").hidden = true; $("speed").classList.remove("over");
    if (!st.warned[tk]) { st.warned[tk] = true; say("Let op, " + lc(tl) + " over " + N.sayDist(trafHit.d) + (tp.delay >= 120 ? ", ongeveer " + Math.round(tp.delay / 60) + " minuten vertraging" : "")); }
    return;
  }
  if (alertFor) hideAlert();
}

/* ---------- Firebase (gedeelde meldingen, zelfde opslag als sprintje) ---------- */
var fb = { ready: false, uid: null, db: null };
function loadScript(src) { return new Promise(function (res, rej) { var el = document.createElement("script"); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el); }); }
function fbInit() {
  if (!CFG.firebase) return;
  var base = "https://cdn.jsdelivr.net/npm/firebase@10.14.1/";
  loadScript(base + "firebase-app-compat.js").then(function () { return loadScript(base + "firebase-auth-compat.js"); })
    .then(function () { return loadScript(base + "firebase-firestore-compat.js"); }).then(function () {
      firebase.initializeApp(CFG.firebase);
      fb.db = firebase.firestore();
      firebase.auth().onAuthStateChanged(function (u) {
        if (!u) { firebase.auth().signInAnonymously().catch(function () {}); return; }
        fb.uid = u.uid; fb.ready = true;
        fb.db.collection("reports").where("expires", ">", Date.now()).onSnapshot(function (snap) {
          var a = []; snap.forEach(function (d) { var r = d.data(); if (r.uid === fb.uid) return; a.push({ id: "c" + d.id, lat: r.lat, lon: r.lon, h: r.h == null ? null : r.h, type: r.type || "mobiel", when: r.when, expires: r.expires, community: true }); });
          community = a; drawCams(); if (st.nav) prepRouteWarnings();
        }, function () {});
      });
    }).catch(function () {});
}
function fbReport(c) {
  if (!fb.ready) return;
  fb.db.collection("reports").doc(c.id).set({ uid: fb.uid, lat: c.lat, lon: c.lon, h: c.h, type: c.type, when: c.when, expires: c.when + REPORT_TTL }).catch(function () {});
}

/* ---------- bladen ---------- */
function openSheet(id) {
  ["routesheet", "reportsheet", "settings"].forEach(function (s) { $(s).hidden = s !== id; });
  $("scrim").hidden = id === "routesheet"; document.body.classList.add("sheet-open");
}
function closeSheets() {
  ["routesheet", "reportsheet", "settings"].forEach(function (s) { $(s).hidden = true; });
  $("scrim").hidden = true; document.body.classList.remove("sheet-open");
}

/* ---------- bediening ---------- */
function wire() {
  wireSearch(); setMuteIcons();
  $("mute").onclick = $("navmute").onclick = function () { S.voice = !S.voice; saveS(); setMuteIcons(); if (!S.voice && window.speechSynthesis) speechSynthesis.cancel(); };
  $("locate").onclick = function () {
    startGps();
    if (st.pos && map) { st.freeFollow = true; st.follow = true; map.easeTo({ center: [st.pos.lon, st.pos.lat], zoom: Math.max(15, map.getZoom()), duration: 600 }); }
    else toast("Locatie zoeken…");
  };
  $("recenter").onclick = function () { st.follow = true; $("recenter").hidden = true; if (st.pos) onPos({ lat: st.pos.lat, lon: st.pos.lon, acc: st.acc, speed: st.speed, heading: st.heading, t: Date.now() }, true); };
  $("report").onclick = function () { openSheet("reportsheet"); };
  Array.prototype.forEach.call(document.querySelectorAll(".type"), function (b) { b.onclick = function () { report(b.dataset.type); }; });
  $("cancelreport").onclick = closeSheets;
  $("cancelroute").onclick = cancelRoute;
  $("startnav").onclick = function () { if (!st.pos && !st.sim) toast("Nog geen GPS. Navigeren start zodra je locatie bekend is.", false, 4000); startGps(); startNav(); };
  $("stopnav").onclick = function () { stopNav(false); };
  $("opensettings").onclick = function () { setFlitsInfo(); setTrafInfo(); openSheet("settings"); };
  $("closesettings").onclick = closeSheets;
  $("scrim").onclick = closeSheets;
  $("testvoice").onclick = function () { say("Over 300 meter, sla rechtsaf.", true); };
  $("s-voice").onchange = function () { S.voice = this.checked; saveS(); setMuteIcons(); };
  $("s-flits").checked = S.flits; $("s-flits").onchange = function () { S.flits = this.checked; saveS(); drawCams(); prepRouteWarnings(); if (!S.flits) hideAlert(); };
  $("s-traffic").checked = S.traffic; $("s-traffic").onchange = function () { S.traffic = this.checked; saveS(); drawTraffic(); prepRouteWarnings(); };
  $("s-flow").checked = S.flow; $("s-flow").onchange = function () { S.flow = this.checked; saveS(); setFlowLayer(); };
  $("k-tomtom").value = KEYS.tomtom; $("k-here").value = KEYS.here;
  $("savekeys").onclick = function () {
    KEYS.tomtom = $("k-tomtom").value.trim(); KEYS.here = $("k-here").value.trim();
    store("key_tomtom", KEYS.tomtom); store("key_here", KEYS.here); live.ok = {}; live.items = [];
    setFlowLayer(); setTrafInfo();
    var box = st.routes.length ? routesBox(st.routes) : (map ? (function () { var b = map.getBounds(); return { w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() }; })() : null);
    fetchLive(box, true).then(function () { setTrafInfo(); toast(live.ok.tomtom === false || live.ok.here === false ? "Een sleutel werkt niet. Controleer hem." : "Opgeslagen."); });
  };
  $("s-avoid").checked = S.avoid; $("s-avoid").onchange = function () { S.avoid = this.checked; saveS(); if (st.routes.length && !st.nav) { st.sel = scoreRoutes(st.routes); renderAlts(); drawRoutes(); } };
  $("clearmine").onclick = function () { mine = []; store("mine", mine); drawCams(); setFlitsInfo(); toast("Je meldingen zijn gewist."); };
  $("simulate").onclick = startSim;

  /* Android-terugknop */
  if (NATIVE && PL.App) PL.App.addListener("backButton", function () {
    if (!$("settings").hidden || !$("reportsheet").hidden) closeSheets();
    else if (st.nav) { if (confirmStop()) stopNav(false); }
    else if (st.dest) cancelRoute();
    else PL.App.minimizeApp ? PL.App.minimizeApp() : PL.App.exitApp();
  });
  if (NATIVE && PL.StatusBar) { try { PL.StatusBar.setOverlaysWebView({ overlay: true }); PL.StatusBar.setStyle({ style: "LIGHT" }); } catch (e) {} }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && st.nav) keepAwake(true); });
}
var stopAsk = 0;
function confirmStop() { if (Date.now() - stopAsk < 2500) return true; stopAsk = Date.now(); toast("Nog een keer terug om te stoppen"); return false; }

/* ---------- start ---------- */
wire(); initMap(); setFlitsInfo(); setTrafInfo();
loadFlitsers(); loadTraffic(); fbInit(); startGps();
setInterval(loadTraffic, 10 * 60 * 1000);
setInterval(function () { if (st.nav && st.route) fetchLive(routesBox([st.route]), false); }, 5 * 60 * 1000);
setInterval(function () { if (!st.nav) drawCams(); }, 5 * 60 * 1000); /* verlopen meldingen weghalen */

/* voor tests */
window.__mn = { st: st, map: function () { return map; }, ready: function () { return mapReady; }, chooseDest: chooseDest, startSim: startSim, onPos: onPos, maneuverSVG: maneuverSVG };
})();
