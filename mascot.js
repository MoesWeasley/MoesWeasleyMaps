/* Smiesh (voorheen Moes) – de assistent van MoesWeasley Maps: een zittend wezeltje in een glazen bubbel.
   Standen: idle, point (wijst de afslag aan), shock (flitser), fast (te hard), worried (verkeer),
   happy (aangekomen), sleepy (lang stilstaan).
   Extra: kijkt rond, praat mee met de stem, doet uit zichzelf dingen (zwaaien, krabben, gapen,
   uitrekken), reageert op tikken en zegt korte dingen in een tekstballonnetje. */
(function () {
  "use strict";
  var INK = "#3b2a7a";
  function arm(side, x) {
    /* arm hangt vanaf de schouder naar beneden; de buitenste groep krijgt de houding, de binnenste de beweging (zwaaien) */
    return '<g class="m-arm' + side + '"><g class="m-arm' + side + 'i">' +
      /* arm als één gladde, taps toelopende vorm in de kleur van het lijf; alleen naar het pootje toe een zachte rand */
      '<path d="' + limb(x, 1) + '" fill="url(#marmEdge)"/>' +
      '<path d="' + limb(x, 0) + '" fill="url(#marm)"/>' +
      '<g class="m-finger' + side + '"><path d="M' + x + ' 97v8" stroke="#8a6bff" stroke-width="5.4" stroke-linecap="round"/><path d="M' + x + ' 97v8" stroke="#fff4fb" stroke-width="3.4" stroke-linecap="round"/></g>' +
      '<circle cx="' + x + '" cy="95" r="5.2" fill="#fff4fb" stroke="#8a6bff" stroke-width="1.4"/>' +
      "</g></g>";
  }
  function limb(x, g) { /* g = hoeveel groter (voor de rand) */
    var t = 4.4 + g, b = 3.4 + g, y1 = 79, y2 = 93;
    return "M" + (x - t) + " " + y1 + "L" + (x - b) + " " + y2 + "A" + b + " " + b + " 0 0 0 " + (x + b) + " " + y2 + "L" + (x + t) + " " + y1 + "A" + t + " " + t + " 0 0 0 " + (x - t) + " " + y1 + "Z";
  }
  function foot(side, x) {
    return '<g class="m-foot' + side + '"><ellipse cx="' + x + '" cy="107" rx="7.5" ry="4.6" fill="#a58cff"/>' +
      '<g fill="#ffc6e1"><circle cx="' + (x - 2.5) + '" cy="106.5" r="1.3"/><circle cx="' + x + '" cy="105.6" r="1.3"/><circle cx="' + (x + 2.5) + '" cy="106.5" r="1.3"/></g></g>';
  }
  function eyes(rx, ry, cy) {
    return '<g class="m-look"><g class="m-blink"><ellipse cx="39" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#1d1b3a"/><ellipse cx="61" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#1d1b3a"/>' +
      '<circle cx="40.6" cy="' + (cy - 2.2) + '" r="1.8" fill="#fff"/><circle cx="62.6" cy="' + (cy - 2.2) + '" r="1.8" fill="#fff"/></g></g>';
  }
  /* spulletjes voor de acties: hamburger, drinkbeker, eigen spelcomputertje */
  var PROPS =
    '<g class="px p-burger"><g transform="translate(50 64) scale(1.25) translate(-50 -64)"><g class="p-bob"><g class="p-bite">' +
      '<path d="M40 62a10 7 0 0120 0z" fill="#f2a64b"/><g fill="#fff3d6"><ellipse cx="45" cy="58" rx=".9" ry=".5"/><ellipse cx="50" cy="56.6" rx=".9" ry=".5"/><ellipse cx="55" cy="58" rx=".9" ry=".5"/></g>' +
      '<path d="M39 62.5h22l-1.5 1.8-2-1-2 1.2-2.2-1.2-2 1.2-2.2-1.2-2 1.2-2.2-1.2-2 1.2z" fill="#7ee36f"/>' +
      '<rect x="40" y="63.6" width="20" height="3" rx="1.4" fill="#8a4b2e"/><path d="M40.5 66.6h19l-2 1.6h-15z" fill="#ffd23f"/>' +
      '<path d="M40 68h20a2 2 0 01-2 3.2H42a2 2 0 01-2-3.2z" fill="#e8973e"/></g></g></g>' +
      '<g class="p-crumbs" fill="#f2a64b"><circle cx="44" cy="74" r=".9"/><circle cx="57" cy="76" r=".7"/><circle cx="51" cy="78" r=".8"/></g></g>' +
    '<g class="px p-drink"><g transform="translate(8 1)"><path d="M43 54.5l11 5" stroke="#ff5c9a" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M50 59h11l-1.4 13a2 2 0 01-2 1.8h-4.2a2 2 0 01-2-1.8z" fill="#ffffff" fill-opacity=".75" stroke="#b9a6ff" stroke-width="1"/>' +
      '<clipPath id="mcup"><path d="M50.3 59.5h10.4l-1.4 12.8a1.6 1.6 0 01-1.6 1.4h-4.4a1.6 1.6 0 01-1.6-1.4z"/></clipPath>' +
      '<g clip-path="url(#mcup)"><rect class="p-juice" x="49" y="61" width="13" height="14" fill="#ff8a3d"/></g>' +
      '<path d="M50 59h11" stroke="#7b5cff" stroke-width="1.4" stroke-linecap="round"/></g></g>' +
    '<g class="px p-game"><g transform="translate(0 8)"><rect x="26" y="82" width="48" height="18" rx="6" fill="#2fd3b5" stroke="#1a9c86" stroke-width="1"/>' +
      '<rect x="39.5" y="83.6" width="21" height="14" rx="2" fill="#1d1b3a"/><rect class="p-scr" x="41" y="85" width="18" height="11" rx="1.2" fill="#7ee6a8"/>' +
      '<g class="p-pix"><rect x="43" y="91.5" width="2" height="2" fill="#1d1b3a"/><rect x="45" y="91.5" width="2" height="2" fill="#1d1b3a"/><rect x="47" y="91.5" width="2" height="2" fill="#1d1b3a"/></g>' +
      '<rect class="p-dot" x="54" y="87" width="2" height="2" fill="#ff4f8b"/>' +
      '<path d="M29.5 91h5M32 88.5v5" stroke="#1d1b3a" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle cx="67" cy="89.6" r="1.6" fill="#ff4f8b"/><circle cx="70.4" cy="92.4" r="1.6" fill="#ffd166"/></g></g>';
  var SVG =
    '<svg viewBox="0 0 100 116" aria-hidden="true">' +
    '<defs>' +
    '<linearGradient id="mfur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdb9ff"/><stop offset="1" stop-color="#8a6bff"/></linearGradient>' +
    '<linearGradient id="mfur2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9a1ff"/><stop offset="1" stop-color="#7656f0"/></linearGradient>' +
    '<linearGradient id="mfurB" gradientUnits="userSpaceOnUse" x1="0" y1="68" x2="0" y2="108"><stop offset="0" stop-color="#cdb9ff"/><stop offset="1" stop-color="#8a6bff"/></linearGradient>' +
    '<linearGradient id="marm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bba4ff"/><stop offset="1" stop-color="#a083ff"/></linearGradient>' +
    '<linearGradient id="marmEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f62f2" stop-opacity="0"/><stop offset=".45" stop-color="#7f62f2" stop-opacity="0"/><stop offset="1" stop-color="#7f62f2" stop-opacity=".85"/></linearGradient>' +
    '<radialGradient id="mshould"><stop offset="0" stop-color="#bca6ff"/><stop offset=".6" stop-color="#bca6ff"/><stop offset="1" stop-color="#bca6ff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="mbelly" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#fffafd"/><stop offset="1" stop-color="#f6e6ff"/></radialGradient>' +
    '</defs>' +
    '<g class="m-live"><g class="m-all">' +
      '<g class="m-tail"><path d="M66 98c14 2 24-6 24-18c0-9-6-15-12-15c-5 0-8 4-6 8c2 3 6 2 7 6c1 6-6 10-15 9z" fill="url(#mfur2)"/>' +
      '<path d="M84 70c-3-1-6 1-6 4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/></g>' +
      '<g class="m-body"><ellipse cx="50" cy="88" rx="22" ry="20" fill="url(#mfurB)"/><ellipse cx="50" cy="91" rx="13.5" ry="13" fill="url(#mbelly)"/></g>' +
      '<g class="m-feet">' + foot("L", 39) + foot("R", 61) + '</g>' +
      '<g class="m-head">' +
        '<g class="m-earL"><circle cx="28" cy="20" r="9.5" fill="url(#mfur)"/><circle cx="28" cy="21" r="4.8" fill="#ffc6e1"/></g>' +
        '<g class="m-earR"><circle cx="72" cy="20" r="9.5" fill="url(#mfur)"/><circle cx="72" cy="21" r="4.8" fill="#ffc6e1"/></g>' +
        '<ellipse cx="50" cy="44" rx="31" ry="27" fill="url(#mfur)"/>' +
        '<ellipse cx="50" cy="53" rx="19.5" ry="14.5" fill="url(#mbelly)"/>' +
        '<ellipse cx="50" cy="48" rx="3.8" ry="2.7" fill="#ff6f9a"/>' +
        '<g stroke="#8a6bff" stroke-width="1.2" stroke-linecap="round" opacity=".65"><path d="M34 51l-10-2M34 55l-10 1M66 51l10-2M66 55l10 1"/></g>' +
        '<g class="mf f-idle">' + eyes(4.6, 5.8, 38) + '</g>' +
        '<g class="mf f-shock"><path d="M31 27q7-6 14-1M55 26q7-5 14 1" stroke="' + INK + '" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="39" cy="38" r="7" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/><circle cx="61" cy="38" r="7" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/><g class="m-look"><circle cx="39" cy="38.5" r="2.5" fill="#1d1b3a"/><circle cx="61" cy="38.5" r="2.5" fill="#1d1b3a"/></g></g>' +
        '<g class="mf f-worried"><path d="M32 31l10-3.5M68 31l-10-3.5" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' + eyes(4, 5, 39) + '</g>' +
        '<g class="mf f-happy" fill="none" stroke="#1d1b3a" stroke-width="2.8" stroke-linecap="round"><path d="M33 40q6-8 12 0M55 40q6-8 12 0"/></g>' +
        '<g class="mf f-sleepy" fill="none" stroke="#1d1b3a" stroke-width="2.4" stroke-linecap="round"><path d="M33 39q6 4 12 0M55 39q6 4 12 0"/></g>' +
        '<g class="mm m-idle"><path d="M45 54q5 4.5 10 0" stroke="' + INK + '" stroke-width="2" fill="none" stroke-linecap="round"/></g>' +
        '<g class="mm m-point"><path d="M44 53q6 7 12 0z" fill="' + INK + '"/><path d="M47 56.5q3 2 6 0" fill="#ff7aa5"/></g>' +
        '<g class="mm m-shock"><ellipse cx="50" cy="57" rx="4.6" ry="6" fill="' + INK + '"/><ellipse cx="50" cy="59.5" rx="2.8" ry="2.4" fill="#ff7aa5"/></g>' +
        '<g class="mm m-worried"><path d="M45 58q5-4.5 10 0" stroke="' + INK + '" stroke-width="2" fill="none" stroke-linecap="round"/></g>' +
        '<g class="mm m-happy"><path d="M42 52q8 12 16 0z" fill="' + INK + '"/><path d="M46 57q4 3 8 0" fill="#ff7aa5"/></g>' +
        '<g class="mm m-sleepy"><ellipse cx="50" cy="56" rx="2.4" ry="1.9" fill="' + INK + '"/></g>' +
        '<g class="mm m-talk"><ellipse class="m-talkmouth" cx="50" cy="56" rx="4.2" ry="4.4" fill="' + INK + '"/></g>' +
        '<g class="m-blush" fill="#ff9cc6" opacity=".5"><ellipse cx="30" cy="48" rx="4" ry="2.4"/><ellipse cx="70" cy="48" rx="4" ry="2.4"/></g>' +
      '</g>' +
      PROPS +
      arm("L", 37) + arm("R", 63) +
      '<g class="m-shoulders" fill="url(#mshould)"><circle cx="37.6" cy="79.6" r="6.2"/><circle cx="62.4" cy="79.6" r="6.2"/></g>' +
      '<g class="mx x-sweat"><path d="M80 30q4.5 7 0 10.5q-4.5-3.5 0-10.5z" fill="#7fd3ff" stroke="#fff" stroke-width="1"/></g>' +
      '<g class="mx x-alarm"><text x="80" y="16" font-size="16" font-weight="900" fill="#ff3d6e" font-family="system-ui" stroke="#fff" stroke-width="2.6" paint-order="stroke">!!</text></g>' +
      '<g class="mx x-sparks"><path d="M10 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd166"/><path d="M88 10l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#ff8fd0"/><circle cx="90" cy="40" r="2.3" fill="#7ee6a8"/><circle cx="8" cy="52" r="1.8" fill="#8fd0ff"/></g>' +
      '<g class="mx x-zz"><text class="zz" x="76" y="18" font-size="13" font-weight="800" fill="#7b5cff" font-family="system-ui">z</text><text class="zz z2" x="85" y="9" font-size="10" font-weight="800" fill="#7b5cff" font-family="system-ui">z</text></g>' +
      '<g class="mx x-listen" fill="none" stroke="#2f9bff" stroke-width="2.4" stroke-linecap="round"><path class="w1" d="M86 30q4 6 0 12"/><path class="w2" d="M91 26q6 10 0 20"/></g>' +
      '<g class="mx x-think" fill="#c24dff"><circle class="d1" cx="76" cy="12" r="2.6"/><circle class="d2" cx="84" cy="8" r="2.6"/><circle class="d3" cx="92" cy="4" r="2.6"/></g>' +
      '<g class="mx x-heart"><path d="M84 22c-2-4-8-3-8 1c0 4 8 8 8 8s8-4 8-8c0-4-6-5-8-1z" fill="#ff5c9a" stroke="#fff" stroke-width="1.2"/></g>' +
    '</g></g></svg>';

  var DIR = { "straight": 0, "slight right": 40, "right": 85, "sharp right": 120, "slight left": -40, "left": -85, "sharp left": -120, "uturn": -150 };
  var POSE = {
    idle:    { L: 14, R: -14, head: 0, lean: 0, y: 0, look: [0, 0] },
    shock:   { L: 150, R: -150, head: -4, lean: 0, y: -5, look: [0, -1.2] },
    fast:    { L: 150, R: -150, head: 4, lean: 0, y: -5, look: [0, 0] },
    worried: { L: 158, R: -158, head: 6, lean: 0, y: 0, look: [1.4, 0.6] },
    happy:   { L: 160, R: -160, head: 0, lean: 0, y: -2, look: [0, 0] },
    sleepy:  { L: -8, R: 8, head: 13, lean: 3, y: 2, look: [0, 0] },
    listen:  { L: 14, R: -168, head: 9, lean: 2.5, y: -1, look: [1.3, -0.6] },  /* pootje bij het oor */
    think:   { L: -150, R: -16, head: -7, lean: -1.5, y: 0, look: [-1.1, -1.5] } /* pootje onder de kin, omhoog kijken */
  };
  /* kleine acties die hij uit zichzelf of na een tik doet: tijdelijke houding + gezichtje + duur */
  var ACTS = {
    wave:    { pose: { L: 14, R: -150, head: -5, lean: -2, y: -1, look: [1.4, -0.6] }, cls: "a-wave", ms: 1900, face: "point" },
    scratch: { pose: { L: 172, R: -16, head: 8, lean: 2, y: 0, look: [-1.2, -1] }, cls: "a-scratch", ms: 1800, face: "idle" },
    yawn:    { pose: { L: 168, R: -168, head: -6, lean: 0, y: -3, look: [0, 0] }, cls: "a-yawn", ms: 1700, face: "yawn" },
    look:    { pose: null, cls: "a-look", ms: 2600, face: null },
    giggle:  { pose: { L: 120, R: -120, head: 0, lean: 0, y: -3, look: [0, 0] }, cls: "a-giggle", ms: 1500, face: "happy" },
    wake:    { pose: { L: 158, R: -158, head: -7, lean: 0, y: -9, look: [0, -1.4] }, cls: "a-wake", ms: 1300, face: "shock" },
    stretch: { pose: { L: 172, R: -172, head: -4, lean: 0, y: -4, look: [0, 0] }, cls: "a-stretch", ms: 2200, face: "rest" },
    sneeze:  { pose: { L: 40, R: -40, head: 10, lean: 3, y: 1, look: [0, 0] }, cls: "a-sneeze", ms: 1500, face: "rest" },
    hop:     { pose: { L: 150, R: -150, head: -3, lean: 0, y: -3, look: [0, -0.8] }, cls: "a-hop", ms: 1300, face: "happy", feet: "kick" },
    tickle:  { pose: { L: 110, R: -110, head: 0, lean: 0, y: -2, look: [0, 0] }, cls: "a-giggle", ms: 2200, face: "happy", feet: "kick" },
    eat:     { pose: { L: -168, R: 168, head: 2, lean: 0, y: 0, look: [0, 1] }, cls: "a-eat", ms: 4600, face: "yum", hold: true },
    drink:   { pose: { L: 18, R: 148, head: -3, lean: -1, y: 0, look: [0.4, 0.8] }, cls: "a-drink", ms: 3600, face: "yum", hold: true },
    game:    { pose: { L: 9, R: -9, head: 7, lean: 0, y: 0, look: [0, 1.6] }, cls: "a-game", ms: 6000, face: "idle", hold: true },
    heart:   { pose: { L: 128, R: -128, head: -6, lean: 0, y: -2, look: [0, 0] }, cls: "a-heart", ms: 1700, face: "happy" }
  };

  function Mascot(el) {
    this.el = el; this.state = null; this.dir = undefined; this.act = null; this.actT = null;
    el.innerHTML = SVG + '<div class="moes-say" hidden></div>';
    var q = function (c) { return el.querySelector(c); };
    this.p = { all: q(".m-all"), footL: q(".m-footL"), footR: q(".m-footR"), head: q(".m-head"), L: q(".m-armL"), R: q(".m-armR"), fL: q(".m-fingerL"), fR: q(".m-fingerR"), earL: q(".m-earL"), earR: q(".m-earR") };
    this.looks = el.querySelectorAll(".m-look");
    this.bubble = q(".moes-say");
    /* veren: huidige waarde + snelheid per onderdeel */
    this.tgt = { L: 14, R: -14, head: 0, lean: 0, y: 0 };
    this.cur = { L: 14, R: -14, head: 0, lean: 0, y: 0, ear: 0, fL: 0, fR: 0, rL: 0, rR: 0 };
    this.vel = { L: 0, R: 0, head: 0, lean: 0, y: 0, ear: 0, fL: 0, fR: 0, rL: 0, rR: 0 };
    this.footAct = null; this.nextFoot = 4 + Math.random() * 5; this.gaze = null;
    this.inert = { lean: 0, y: 0 }; this.kmh = 0; this.lookBase = [0, 0]; this.sacc = [0, 0]; this.nextSacc = 0; this.flick = 0; this.nextFlick = 2;
    this.seed = Math.random() * 100; this.last = 0;
    var self = this; requestAnimationFrame(function (t) { self.tick(t); });
  }
  /* elk beeldje: veren naar de doelhouding + doorlopende kleine bewegingen + traagheid van de auto */
  Mascot.prototype.tick = function (now) {
    var self = this;
    requestAnimationFrame(function (t) { self.tick(t); });
    if (document.hidden || this.el.hidden) { this.last = now; return; }
    /* spaarstand: maar ~12 keer per seconde bijwerken */
    if (document.body.classList.contains("saver") && this.last && now - this.last < 32) return; /* spaarstand: 30 beeldjes per seconde */
    var dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0.016; this.last = now;
    var steps = Math.max(1, Math.ceil(dt / 0.008)), h = dt / steps; /* kleine vaste stapjes: even soepel bij elke beeldsnelheid */
    var holding = this.act && ACTS[this.act].hold;
    var t = now / 1000 + this.seed, st = this.state, calm = holding ? 0.18 : st === "sleepy" ? 0.35 : st === "point" ? 0.45 : st === "shock" || st === "fast" ? 0.2 : 1;
    /* doorlopende levendigheid: verschillende ritmes per onderdeel */
    var n = {
      L: calm * (5 * Math.sin(t * 1.3) + 2 * Math.sin(t * 3.1 + 1)),
      R: calm * (5 * Math.sin(t * 1.17 + 2) + 2 * Math.sin(t * 2.7)),
      head: calm * (2.6 * Math.sin(t * 0.83) + 1.1 * Math.sin(t * 2.2 + 0.5)),
      lean: calm * (1.3 * Math.sin(t * 0.61 + 1.2)),
      y: calm * (0.5 * Math.sin(t * 1.9))
    };
    /* traagheid: bocht -> andere kant op hellen; optrekken/remmen -> naar achteren/voren */
    var goal = { L: this.tgt.L + n.L, R: this.tgt.R + n.R, head: this.tgt.head + n.head - this.inert.lean * 0.4,
      lean: this.tgt.lean + n.lean + this.inert.lean, y: this.tgt.y + n.y + this.inert.y };
    var K = 70, C = 9; /* stijf genoeg om snel te reageren, slap genoeg om na te veren */
    for (var k in goal) for (var si = 0; si < steps; si++) {
      var a = K * (goal[k] - this.cur[k]) - C * this.vel[k];
      this.vel[k] += a * h; this.cur[k] += this.vel[k] * h;
    }
    /* oortjes: naar achteren bij hard rijden, af en toe een trillertje */
    if (t > this.nextFlick) { this.flick = 1; this.nextFlick = t + 2.5 + Math.random() * 5; }
    this.flick *= Math.exp(-dt * 6);
    var earGoal = -Math.max(0, Math.min(1, (this.kmh - 70) / 50)) * 24 + this.flick * 14 * Math.sin(t * 40);
    for (var se = 0; se < steps; se++) { var ea = K * (earGoal - this.cur.ear) - C * this.vel.ear; this.vel.ear += ea * h; this.cur.ear += this.vel.ear * h; }
    /* oogjes: kleine kijkbewegingen */
    if (t > this.nextSacc && st !== "sleepy" && st !== "happy" && !holding) {
      this.sacc = st === "idle" ? [(Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.2] : [(Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.5];
      this.nextSacc = t + 0.8 + Math.random() * 2.4;
    }
    var lx = this.lookBase[0] + this.sacc[0], ly = this.lookBase[1] + this.sacc[1];
    /* voetjes: af en toe tikken of wiebelen, blij = trappelen, slapen = stil */
    if (t > this.nextFoot && !this.footAct && (st === "idle" || st === "point") && (!this.act || holding)) {
      var kinds = ["tapL", "tapR", "wiggle", "swing"], kd = kinds[Math.floor(Math.random() * kinds.length)];
      this.footAct = { k: kd, t0: t, dur: kd === "swing" ? 2.2 : kd === "wiggle" ? 1.3 : 1.0 };
      this.nextFoot = t + 5 + Math.random() * 8;
    }
    var kick = st === "happy" || (this.act && ACTS[this.act].feet === "kick");
    var fg = { fL: 0, fR: 0, rL: 0, rR: 0 };
    if (kick) { fg.fL = -3.2 * Math.max(0, Math.sin(t * 13)); fg.fR = -3.2 * Math.max(0, Math.sin(t * 13 + Math.PI)); }
    else if (this.footAct) {
      var fa = this.footAct, ph = t - fa.t0;
      if (ph > fa.dur || st === "sleepy") this.footAct = null;
      else if (fa.k === "tapL" || fa.k === "tapR") { var up = -2.6 * Math.max(0, Math.sin(ph * Math.PI * 6)); if (fa.k === "tapL") { fg.fL = up; fg.rL = up * 3; } else { fg.fR = up; fg.rR = -up * 3; } }
      else if (fa.k === "wiggle") { var w = 12 * Math.sin(ph * Math.PI * 7); fg.rL = w; fg.rR = -w; }
      else if (fa.k === "swing") { fg.fL = -1.8 * Math.max(0, Math.sin(ph * Math.PI * 3)); fg.fR = -1.8 * Math.max(0, Math.sin(ph * Math.PI * 3 + Math.PI)); fg.rL = 8 * Math.sin(ph * Math.PI * 3); fg.rR = 8 * Math.sin(ph * Math.PI * 3); }
    }
    if (st === "shock") { fg.rL = -10; fg.rR = 10; }
    for (var fk in fg) for (var sf = 0; sf < steps; sf++) { var fa2 = 260 * (fg[fk] - this.cur[fk]) - 18 * this.vel[fk]; this.vel[fk] += fa2 * h; this.cur[fk] += this.vel[fk] * h; }
    /* kijken naar waar je op het scherm tikt */
    if (this.gaze && now > this.gaze.until) { this.gaze = null; }
    if (this.gaze && st !== "sleepy") { lx = this.gaze.x; ly = this.gaze.y; }
    var ek = 1 - Math.exp(-dt / 0.07); /* oogjes glijden zelf naar de nieuwe kijkrichting */
    this.eye = this.eye || [lx, ly]; this.eye[0] += (lx - this.eye[0]) * ek; this.eye[1] += (ly - this.eye[1]) * ek;
    this.w("look", "translate(" + this.eye[0].toFixed(2) + "px," + this.eye[1].toFixed(2) + "px)", this.looks);
    var p = this.p, c = this.cur;
    this.w("fL", "translateY(" + c.fL.toFixed(2) + "px) rotate(" + c.rL.toFixed(1) + "deg)", p.footL);
    this.w("fR", "translateY(" + c.fR.toFixed(2) + "px) rotate(" + c.rR.toFixed(1) + "deg)", p.footR);
    this.w("L", "rotate(" + c.L.toFixed(1) + "deg)", p.L);
    this.w("R", "rotate(" + c.R.toFixed(1) + "deg)", p.R);
    this.w("head", "rotate(" + c.head.toFixed(1) + "deg)", p.head);
    this.w("all", "translateY(" + c.y.toFixed(2) + "px) rotate(" + c.lean.toFixed(2) + "deg)", p.all);
    this.w("eL", "rotate(" + c.ear.toFixed(1) + "deg)", p.earL);
    this.w("eR", "rotate(" + (-c.ear).toFixed(1) + "deg)", p.earR);
    /* traagheid dooft vanzelf uit */
    this.inert.lean *= Math.exp(-dt * 1.5); this.inert.y *= Math.exp(-dt * 2);
  };
  /* stijl alleen bijwerken als de waarde echt anders is (minder tekenwerk) */
  Mascot.prototype.w = function (key, val, el) {
    var c = this.wc || (this.wc = {});
    if (c[key] === val) return; c[key] = val;
    if (el && el.length != null && !el.style) { for (var i = 0; i < el.length; i++) el[i].style.transform = val; } else el.style.transform = val;
  };
  /* auto-beweging doorgeven: draaisnelheid (graden/s, + = rechts) en versnelling (m/s², + = optrekken) */
  Mascot.prototype.motion = function (turnRate, accel) {
    this.inert.lean = Math.max(-11, Math.min(11, -turnRate * 0.18));
    this.inert.y = Math.max(-3, Math.min(3, accel * 0.9));
    if (Math.abs(accel) > 2.5) this.inert.lean += (accel > 0 ? 2.5 : -2.5); /* stevig optrekken: naar achteren */
  };
  Mascot.prototype.apply = function (pose, finger) {
    var p = this.p;
    this.tgt.L = pose.L; this.tgt.R = pose.R; this.tgt.head = pose.head; this.tgt.lean = pose.lean; this.tgt.y = pose.y;
    this.pointing = !!finger;
    p.fL.style.opacity = finger === "L" ? "1" : "0";
    p.fR.style.opacity = finger === "R" ? "1" : "0";
    if (pose.look) this.look(pose.look[0], pose.look[1]);
  };
  Mascot.prototype.look = function (dx, dy) {
    this.lookBase = [dx, dy];
  };
  Mascot.prototype.poseFor = function () {
    var d = this.dir;
    if (this.state === "point" && d != null) {
      /* rechterarm: d - 180 (−180 = omhoog, −90 = rechts); linkerarm: 180 + d. Nooit recht omhoog (achter het hoofd) */
      var useLeft = d < 0, a = useLeft ? Math.min(155, 180 + d) : Math.max(-155, d - 180);
      return { pose: { L: useLeft ? a : 34, R: useLeft ? -34 : a, head: d * 0.1, lean: d * 0.06, y: -1, look: [Math.max(-1.8, Math.min(1.8, d / 45)), -0.3] }, finger: useLeft ? "L" : "R" };
    }
    return { pose: POSE[this.state] || POSE.idle, finger: null };
  };
  Mascot.prototype.set = function (state, dir) {
    var d = state === "point" ? (DIR[dir] == null ? 0 : DIR[dir]) : null;
    if (state === this.state && d === this.dir) return;
    var changed = state !== this.state;
    this.state = state; this.dir = d;
    /* een belangrijke stand onderbreekt een actie; idle laat een lopende actie uitspelen */
    if (this.act && state !== "idle") this.endAct(true);
    if (this.act) return;
    this.el.setAttribute("data-s", state);
    var pf = this.poseFor(); this.apply(pf.pose, pf.finger);
    if (changed) this.pop();
  };
  Mascot.prototype.pop = function () { var el = this.el; el.classList.remove("m-react"); void el.offsetWidth; el.classList.add("m-react"); };
  /* actie spelen (alleen als hij rustig is, of geforceerd bij een tik) */
  Mascot.prototype.play = function (name, force) {
    var A = ACTS[name]; if (!A) return false;
    if (!force && this.state !== "idle" && this.state !== "sleepy") return false;
    var self = this; this.endAct(true);
    this.act = name; this.el.classList.add(A.cls);
    if (A.face) this.el.setAttribute("data-s", A.face);
    if (A.pose) this.apply(A.pose, null);
    if (name === "look") { /* rondkijken: links, rechts, terug */
      self.look(-1.8, 0); setTimeout(function () { if (self.act === "look") self.look(1.8, -0.4); }, 900);
      setTimeout(function () { if (self.act === "look") self.look(0, 0); }, 1900);
    }
    this.pop();
    this.actT = setTimeout(function () { self.endAct(); }, A.ms);
    return true;
  };
  Mascot.prototype.endAct = function (quiet) {
    clearTimeout(this.actT);
    if (!this.act) return;
    this.el.classList.remove(ACTS[this.act].cls); this.act = null;
    this.el.setAttribute("data-s", this.state || "idle");
    var pf = this.poseFor(); this.apply(pf.pose, pf.finger);
  };
  /* praten: mondje beweegt zolang de stem praat */
  Mascot.prototype.talk = function (ms) {
    var el = this.el; el.classList.add("m-talking");
    clearTimeout(this.talkT); this.talkT = setTimeout(function () { el.classList.remove("m-talking"); }, Math.min(6000, ms));
  };
  /* tekstballonnetje */
  Mascot.prototype.say = function (text, ms) {
    var b = this.bubble; b.textContent = text; b.hidden = false; b.classList.remove("out"); void b.offsetWidth; b.classList.add("in");
    clearTimeout(this.sayT); this.sayT = setTimeout(function () { b.classList.remove("in"); b.classList.add("out"); setTimeout(function () { b.hidden = true; }, 300); }, ms || 2400);
  };
  /* ogen naar een punt op het scherm laten kijken (bijv. waar je tikt) */
  Mascot.prototype.lookAt = function (x, y, ms) {
    var r = this.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.35;
    var dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
    this.gaze = { x: 2 * dx / d, y: 1.3 * dy / d, until: performance.now() + (ms || 1600) };
    if (Math.abs(dx) > 40 && Math.random() < 0.5) { var self = this; self.tgt.head += dx > 0 ? -3 : 3; setTimeout(function () { var pf = self.poseFor(); if (!self.act) self.tgt.head = pf.pose.head; }, ms || 1600); }
  };
  /* snelheid: oortjes naar achteren bij hard rijden */
  Mascot.prototype.speed = function (kmh) { this.kmh = kmh || 0; };
  window.Mascot = Mascot;
})();
