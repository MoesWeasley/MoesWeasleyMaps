/* Moes – de assistent van MoesWeasley Maps: een zittend wezeltje in een glazen bubbel.
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
      '<path d="M' + x + ' 79v14" stroke="#7656f0" stroke-width="9.5" stroke-linecap="round"/>' +
      '<path d="M' + x + ' 79v14" stroke="url(#mfur)" stroke-width="7" stroke-linecap="round"/>' +
      '<g class="m-finger' + side + '"><path d="M' + x + ' 97v8" stroke="#8a6bff" stroke-width="5.4" stroke-linecap="round"/><path d="M' + x + ' 97v8" stroke="#fff4fb" stroke-width="3.4" stroke-linecap="round"/></g>' +
      '<circle cx="' + x + '" cy="95" r="5.2" fill="#fff4fb" stroke="#8a6bff" stroke-width="1.4"/>' +
      '<circle cx="' + x + '" cy="79" r="5.4" fill="url(#mfur)"/>' + /* schouder: houdt de arm vast aan het lijf */
      "</g></g>";
  }
  function eyes(rx, ry, cy) {
    return '<g class="m-look"><g class="m-blink"><ellipse cx="39" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#1d1b3a"/><ellipse cx="61" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#1d1b3a"/>' +
      '<circle cx="40.6" cy="' + (cy - 2.2) + '" r="1.8" fill="#fff"/><circle cx="62.6" cy="' + (cy - 2.2) + '" r="1.8" fill="#fff"/></g></g>';
  }
  var SVG =
    '<svg viewBox="0 0 100 116" aria-hidden="true">' +
    '<defs>' +
    '<linearGradient id="mfur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdb9ff"/><stop offset="1" stop-color="#8a6bff"/></linearGradient>' +
    '<linearGradient id="mfur2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9a1ff"/><stop offset="1" stop-color="#7656f0"/></linearGradient>' +
    '<radialGradient id="mbelly" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#fffafd"/><stop offset="1" stop-color="#f6e6ff"/></radialGradient>' +
    '</defs>' +
    '<g class="m-live"><g class="m-all">' +
      '<g class="m-tail"><path d="M66 98c14 2 24-6 24-18c0-9-6-15-12-15c-5 0-8 4-6 8c2 3 6 2 7 6c1 6-6 10-15 9z" fill="url(#mfur2)"/>' +
      '<path d="M84 70c-3-1-6 1-6 4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/></g>' +
      '<g class="m-body"><ellipse cx="50" cy="88" rx="22" ry="20" fill="url(#mfur)"/><ellipse cx="50" cy="91" rx="13.5" ry="13" fill="url(#mbelly)"/></g>' +
      '<g class="m-feet"><ellipse cx="39" cy="107" rx="7.5" ry="4.6" fill="#a58cff"/><ellipse cx="61" cy="107" rx="7.5" ry="4.6" fill="#a58cff"/>' +
      '<g fill="#ffc6e1"><circle cx="36.5" cy="106.5" r="1.3"/><circle cx="39" cy="105.6" r="1.3"/><circle cx="41.5" cy="106.5" r="1.3"/><circle cx="58.5" cy="106.5" r="1.3"/><circle cx="61" cy="105.6" r="1.3"/><circle cx="63.5" cy="106.5" r="1.3"/></g></g>' +
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
      arm("L", 37) + arm("R", 63) +
      '<g class="mx x-sweat"><path d="M80 30q4.5 7 0 10.5q-4.5-3.5 0-10.5z" fill="#7fd3ff" stroke="#fff" stroke-width="1"/></g>' +
      '<g class="mx x-alarm"><text x="80" y="16" font-size="16" font-weight="900" fill="#ff3d6e" font-family="system-ui" stroke="#fff" stroke-width="2.6" paint-order="stroke">!!</text></g>' +
      '<g class="mx x-sparks"><path d="M10 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd166"/><path d="M88 10l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#ff8fd0"/><circle cx="90" cy="40" r="2.3" fill="#7ee6a8"/><circle cx="8" cy="52" r="1.8" fill="#8fd0ff"/></g>' +
      '<g class="mx x-zz"><text class="zz" x="76" y="18" font-size="13" font-weight="800" fill="#7b5cff" font-family="system-ui">z</text><text class="zz z2" x="85" y="9" font-size="10" font-weight="800" fill="#7b5cff" font-family="system-ui">z</text></g>' +
      '<g class="mx x-heart"><path d="M84 22c-2-4-8-3-8 1c0 4 8 8 8 8s8-4 8-8c0-4-6-5-8-1z" fill="#ff5c9a" stroke="#fff" stroke-width="1.2"/></g>' +
    '</g></g></svg>';

  var DIR = { "straight": 0, "slight right": 40, "right": 85, "sharp right": 120, "slight left": -40, "left": -85, "sharp left": -120, "uturn": -150 };
  var POSE = {
    idle:    { L: 14, R: -14, head: 0, lean: 0, y: 0, look: [0, 0] },
    shock:   { L: 150, R: -150, head: -4, lean: 0, y: -5, look: [0, -1.2] },
    fast:    { L: 150, R: -150, head: 4, lean: 0, y: -5, look: [0, 0] },
    worried: { L: 158, R: -158, head: 6, lean: 0, y: 0, look: [1.4, 0.6] },
    happy:   { L: 160, R: -160, head: 0, lean: 0, y: -2, look: [0, 0] },
    sleepy:  { L: -8, R: 8, head: 13, lean: 3, y: 2, look: [0, 0] }
  };
  /* kleine acties die hij uit zichzelf of na een tik doet: tijdelijke houding + gezichtje + duur */
  var ACTS = {
    wave:    { pose: { L: 14, R: -150, head: -5, lean: -2, y: -1, look: [1.4, -0.6] }, cls: "a-wave", ms: 1900, face: "point" },
    scratch: { pose: { L: 172, R: -16, head: 8, lean: 2, y: 0, look: [-1.2, -1] }, cls: "a-scratch", ms: 1800, face: "idle" },
    yawn:    { pose: { L: 168, R: -168, head: -6, lean: 0, y: -3, look: [0, 0] }, cls: "a-yawn", ms: 1700, face: "sleepy" },
    look:    { pose: null, cls: "a-look", ms: 2600, face: null },
    giggle:  { pose: { L: 120, R: -120, head: 0, lean: 0, y: -3, look: [0, 0] }, cls: "a-giggle", ms: 1500, face: "happy" },
    heart:   { pose: { L: 128, R: -128, head: -6, lean: 0, y: -2, look: [0, 0] }, cls: "a-heart", ms: 1700, face: "happy" }
  };

  function Mascot(el) {
    this.el = el; this.state = null; this.dir = undefined; this.act = null; this.actT = null;
    el.innerHTML = SVG + '<div class="moes-say" hidden></div>';
    var q = function (c) { return el.querySelector(c); };
    this.p = { all: q(".m-all"), head: q(".m-head"), L: q(".m-armL"), R: q(".m-armR"), fL: q(".m-fingerL"), fR: q(".m-fingerR"), earL: q(".m-earL"), earR: q(".m-earR") };
    this.looks = el.querySelectorAll(".m-look");
    this.bubble = q(".moes-say");
    /* veren: huidige waarde + snelheid per onderdeel */
    this.tgt = { L: 14, R: -14, head: 0, lean: 0, y: 0 };
    this.cur = { L: 14, R: -14, head: 0, lean: 0, y: 0, ear: 0 };
    this.vel = { L: 0, R: 0, head: 0, lean: 0, y: 0, ear: 0 };
    this.inert = { lean: 0, y: 0 }; this.kmh = 0; this.lookBase = [0, 0]; this.sacc = [0, 0]; this.nextSacc = 0; this.flick = 0; this.nextFlick = 2;
    this.seed = Math.random() * 100; this.last = 0;
    var self = this; requestAnimationFrame(function (t) { self.tick(t); });
  }
  /* elk beeldje: veren naar de doelhouding + doorlopende kleine bewegingen + traagheid van de auto */
  Mascot.prototype.tick = function (now) {
    var self = this;
    requestAnimationFrame(function (t) { self.tick(t); });
    if (document.hidden || this.el.hidden) { this.last = now; return; }
    var dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016; this.last = now;
    var t = now / 1000 + this.seed, st = this.state, calm = st === "sleepy" ? 0.35 : st === "point" ? 0.45 : st === "shock" || st === "fast" ? 0.2 : 1;
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
    for (var k in goal) {
      var a = K * (goal[k] - this.cur[k]) - C * this.vel[k];
      this.vel[k] += a * dt; this.cur[k] += this.vel[k] * dt;
    }
    /* oortjes: naar achteren bij hard rijden, af en toe een trillertje */
    if (t > this.nextFlick) { this.flick = 1; this.nextFlick = t + 2.5 + Math.random() * 5; }
    this.flick *= Math.exp(-dt * 6);
    var earGoal = -Math.max(0, Math.min(1, (this.kmh - 70) / 50)) * 24 + this.flick * 14 * Math.sin(t * 40);
    var ea = K * (earGoal - this.cur.ear) - C * this.vel.ear; this.vel.ear += ea * dt; this.cur.ear += this.vel.ear * dt;
    /* oogjes: kleine kijkbewegingen */
    if (t > this.nextSacc && st !== "sleepy" && st !== "happy") {
      this.sacc = st === "idle" ? [(Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 1.2] : [(Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.5];
      this.nextSacc = t + 0.8 + Math.random() * 2.4;
    }
    var lx = this.lookBase[0] + this.sacc[0], ly = this.lookBase[1] + this.sacc[1];
    for (var i = 0; i < this.looks.length; i++) this.looks[i].style.transform = "translate(" + lx.toFixed(2) + "px," + ly.toFixed(2) + "px)";
    var p = this.p, c = this.cur;
    p.L.style.transform = "rotate(" + c.L.toFixed(2) + "deg)";
    p.R.style.transform = "rotate(" + c.R.toFixed(2) + "deg)";
    p.head.style.transform = "rotate(" + c.head.toFixed(2) + "deg)";
    p.all.style.transform = "translateY(" + c.y.toFixed(2) + "px) rotate(" + c.lean.toFixed(2) + "deg)";
    p.earL.style.transform = "rotate(" + c.ear.toFixed(2) + "deg)";
    p.earR.style.transform = "rotate(" + (-c.ear).toFixed(2) + "deg)";
    /* traagheid dooft vanzelf uit */
    this.inert.lean *= Math.exp(-dt * 1.5); this.inert.y *= Math.exp(-dt * 2);
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
    for (var i = 0; i < this.looks.length; i++) this.looks[i].style.transform = "translate(" + dx + "px," + dy + "px)";
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
  /* snelheid: oortjes naar achteren bij hard rijden */
  Mascot.prototype.speed = function (kmh) { this.kmh = kmh || 0; };
  window.Mascot = Mascot;
})();
