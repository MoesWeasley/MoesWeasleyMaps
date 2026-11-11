/* Moes – de assistent van MoesWeasley Maps: een zittend wezeltje in een glazen bubbel.
   Standen: idle, point (wijst de afslag aan), shock (flitser), fast (te hard), worried (verkeer),
   happy (aangekomen), sleepy (lang stilstaan).
   Alle gezichtjes zitten tegelijk in de tekening en vloeien in elkaar over; armen, hoofd en lijf
   bewegen met verende overgangen, zodat het lijkt alsof hij leeft. */
(function () {
  "use strict";
  var INK = "#3b2a7a";
  var SVG =
    '<svg viewBox="0 0 100 116" aria-hidden="true">' +
    '<defs>' +
    '<linearGradient id="mfur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdb9ff"/><stop offset="1" stop-color="#8a6bff"/></linearGradient>' +
    '<linearGradient id="mfur2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b9a1ff"/><stop offset="1" stop-color="#7656f0"/></linearGradient>' +
    '<radialGradient id="mbelly" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#fffafd"/><stop offset="1" stop-color="#f6e6ff"/></radialGradient>' +
    '</defs>' +
    '<g class="m-live"><g class="m-all">' +
      /* staart achter het lijf */
      '<g class="m-tail"><path d="M66 98c14 2 24-6 24-18c0-9-6-15-12-15c-5 0-8 4-6 8c2 3 6 2 7 6c1 6-6 10-15 9z" fill="url(#mfur2)"/>' +
      '<path d="M84 70c-3-1-6 1-6 4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".45"/></g>' +
      /* lijf */
      '<g class="m-body"><ellipse cx="50" cy="88" rx="22" ry="20" fill="url(#mfur)"/><ellipse cx="50" cy="91" rx="13.5" ry="13" fill="url(#mbelly)"/></g>' +
      /* voetjes */
      '<g class="m-feet"><ellipse class="m-footL" cx="39" cy="107" rx="7.5" ry="4.6" fill="#a58cff"/><ellipse class="m-footR" cx="61" cy="107" rx="7.5" ry="4.6" fill="#a58cff"/>' +
      '<g fill="#ffc6e1"><circle cx="36.5" cy="106.5" r="1.3"/><circle cx="39" cy="105.6" r="1.3"/><circle cx="41.5" cy="106.5" r="1.3"/><circle cx="58.5" cy="106.5" r="1.3"/><circle cx="61" cy="105.6" r="1.3"/><circle cx="63.5" cy="106.5" r="1.3"/></g></g>' +
      /* hoofd */
      '<g class="m-head">' +
        '<g class="m-earL"><circle cx="28" cy="20" r="9.5" fill="url(#mfur)"/><circle cx="28" cy="21" r="4.8" fill="#ffc6e1"/></g>' +
        '<g class="m-earR"><circle cx="72" cy="20" r="9.5" fill="url(#mfur)"/><circle cx="72" cy="21" r="4.8" fill="#ffc6e1"/></g>' +
        '<ellipse cx="50" cy="44" rx="31" ry="27" fill="url(#mfur)"/>' +
        '<ellipse cx="50" cy="53" rx="19.5" ry="14.5" fill="url(#mbelly)"/>' +
        '<ellipse cx="50" cy="48" rx="3.8" ry="2.7" fill="#ff6f9a"/>' +
        '<g stroke="#8a6bff" stroke-width="1.2" stroke-linecap="round" opacity=".65"><path d="M34 51l-10-2M34 55l-10 1M66 51l10-2M66 55l10 1"/></g>' +
        /* ogen per stand */
        '<g class="mf f-idle"><g class="m-blink"><ellipse cx="39" cy="38" rx="4.6" ry="5.8" fill="#1d1b3a"/><ellipse cx="61" cy="38" rx="4.6" ry="5.8" fill="#1d1b3a"/><circle cx="40.6" cy="35.8" r="1.8" fill="#fff"/><circle cx="62.6" cy="35.8" r="1.8" fill="#fff"/></g></g>' +
        '<g class="mf f-shock"><path d="M31 27q7-6 14-1M55 26q7-5 14 1" stroke="' + INK + '" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="39" cy="38" r="7" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/><circle cx="61" cy="38" r="7" fill="#fff" stroke="' + INK + '" stroke-width="1.2"/><circle cx="39" cy="38.5" r="2.5" fill="#1d1b3a"/><circle cx="61" cy="38.5" r="2.5" fill="#1d1b3a"/></g>' +
        '<g class="mf f-worried"><path d="M32 31l10-3.5M68 31l-10-3.5" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/><g class="m-blink"><ellipse cx="39" cy="39" rx="4" ry="5" fill="#1d1b3a"/><ellipse cx="61" cy="39" rx="4" ry="5" fill="#1d1b3a"/><circle cx="40.2" cy="37" r="1.5" fill="#fff"/><circle cx="62.2" cy="37" r="1.5" fill="#fff"/></g></g>' +
        '<g class="mf f-happy" fill="none" stroke="#1d1b3a" stroke-width="2.8" stroke-linecap="round"><path d="M33 40q6-8 12 0M55 40q6-8 12 0"/></g>' +
        '<g class="mf f-sleepy" fill="none" stroke="#1d1b3a" stroke-width="2.4" stroke-linecap="round"><path d="M33 39q6 4 12 0M55 39q6 4 12 0"/></g>' +
        /* mondjes per stand */
        '<g class="mm m-idle"><path d="M45 54q5 4.5 10 0" stroke="' + INK + '" stroke-width="2" fill="none" stroke-linecap="round"/></g>' +
        '<g class="mm m-point"><path d="M44 53q6 7 12 0z" fill="' + INK + '"/><path d="M47 56.5q3 2 6 0" fill="#ff7aa5"/></g>' +
        '<g class="mm m-shock"><ellipse cx="50" cy="57" rx="4.6" ry="6" fill="' + INK + '"/><ellipse cx="50" cy="59.5" rx="2.8" ry="2.4" fill="#ff7aa5"/></g>' +
        '<g class="mm m-worried"><path d="M45 58q5-4.5 10 0" stroke="' + INK + '" stroke-width="2" fill="none" stroke-linecap="round"/></g>' +
        '<g class="mm m-happy"><path d="M42 52q8 12 16 0z" fill="' + INK + '"/><path d="M46 57q4 3 8 0" fill="#ff7aa5"/></g>' +
        '<g class="mm m-sleepy"><ellipse cx="50" cy="56" rx="2.4" ry="1.9" fill="' + INK + '"/></g>' +
        '<g class="m-blush" fill="#ff9cc6" opacity=".5"><ellipse cx="30" cy="48" rx="4" ry="2.4"/><ellipse cx="70" cy="48" rx="4" ry="2.4"/></g>' +
      '</g>' +
      /* armen (getekend naar beneden vanaf de schouder; draaien om de schouder) */
      '<g class="m-armL"><path d="M34 74v15" stroke="#7656f0" stroke-width="9.5" stroke-linecap="round"/><path d="M34 74v15" stroke="url(#mfur)" stroke-width="7" stroke-linecap="round"/>' +
        '<g class="m-fingerL"><path d="M34 93v8" stroke="#8a6bff" stroke-width="5.4" stroke-linecap="round"/><path d="M34 93v8" stroke="#fff4fb" stroke-width="3.4" stroke-linecap="round"/></g>' +
        '<circle cx="34" cy="91" r="5.2" fill="#fff4fb" stroke="#8a6bff" stroke-width="1.4"/></g>' +
      '<g class="m-armR"><path d="M66 74v15" stroke="#7656f0" stroke-width="9.5" stroke-linecap="round"/><path d="M66 74v15" stroke="url(#mfur)" stroke-width="7" stroke-linecap="round"/>' +
        '<g class="m-fingerR"><path d="M66 93v8" stroke="#8a6bff" stroke-width="5.4" stroke-linecap="round"/><path d="M66 93v8" stroke="#fff4fb" stroke-width="3.4" stroke-linecap="round"/></g>' +
        '<circle cx="66" cy="91" r="5.2" fill="#fff4fb" stroke="#8a6bff" stroke-width="1.4"/></g>' +
      /* extraatjes */
      '<g class="mx x-sweat"><path d="M80 30q4.5 7 0 10.5q-4.5-3.5 0-10.5z" fill="#7fd3ff" stroke="#fff" stroke-width="1"/></g>' +
      '<g class="mx x-alarm"><text x="80" y="16" font-size="16" font-weight="900" fill="#ff3d6e" font-family="system-ui" stroke="#fff" stroke-width="2.6" paint-order="stroke">!!</text></g>' +
      '<g class="mx x-sparks"><path d="M10 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd166"/><path d="M88 10l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#ff8fd0"/><circle cx="90" cy="40" r="2.3" fill="#7ee6a8"/><circle cx="8" cy="52" r="1.8" fill="#8fd0ff"/></g>' +
      '<g class="mx x-zz"><text class="zz" x="76" y="18" font-size="13" font-weight="800" fill="#7b5cff" font-family="system-ui">z</text><text class="zz z2" x="85" y="9" font-size="10" font-weight="800" fill="#7b5cff" font-family="system-ui">z</text></g>' +
    '</g></g></svg>';

  /* hoeken: 0 = arm naar beneden; linkerarm positief = naar buiten, rechterarm negatief = naar buiten */
  var DIR = { "straight": 0, "slight right": 40, "right": 85, "sharp right": 120, "slight left": -40, "left": -85, "sharp left": -120, "uturn": -150 };
  var POSE = {
    idle:    { L: 14, R: -14, head: 0, lean: 0, y: 0 },
    shock:   { L: 150, R: -150, head: -4, lean: 0, y: -5 },
    fast:    { L: 150, R: -150, head: 4, lean: 0, y: -5 },
    worried: { L: 128, R: -128, head: 6, lean: 0, y: 0 },
    happy:   { L: 160, R: -160, head: 0, lean: 0, y: -2 },
    sleepy:  { L: -8, R: 8, head: 13, lean: 3, y: 2 }
  };

  function Mascot(el) {
    this.el = el; this.state = null; this.dir = undefined;
    el.innerHTML = SVG;
    var q = function (c) { return el.querySelector(c); };
    this.p = { all: q(".m-all"), head: q(".m-head"), L: q(".m-armL"), R: q(".m-armR"), fL: q(".m-fingerL"), fR: q(".m-fingerR") };
  }
  Mascot.prototype.set = function (state, dir) {
    var d = state === "point" ? (DIR[dir] == null ? 0 : DIR[dir]) : null;
    if (state === this.state && d === this.dir) return;
    var changed = state !== this.state;
    this.state = state; this.dir = d;
    this.el.setAttribute("data-s", state);
    var pose;
    if (state === "point") {
      /* wijzende arm: 180 + richting (0 = omhoog); andere hand in de zij */
      /* rechterarm: d - 180 (−180 = omhoog, −90 = rechts); linkerarm: 180 + d. Nooit recht omhoog (achter het hoofd) */
      var useLeft = d < 0, a = useLeft ? Math.min(155, 180 + d) : Math.max(-155, d - 180);
      pose = { L: useLeft ? a : 34, R: useLeft ? -34 : a, head: d * 0.1, lean: d * 0.06, y: -1, finger: useLeft ? "L" : "R" };
    } else pose = POSE[state] || POSE.idle;
    var p = this.p;
    p.L.style.transform = "rotate(" + pose.L + "deg)";
    p.R.style.transform = "rotate(" + pose.R + "deg)";
    p.head.style.transform = "rotate(" + pose.head + "deg)";
    p.all.style.transform = "translateY(" + pose.y + "px) rotate(" + pose.lean + "deg)";
    p.fL.style.opacity = pose.finger === "L" ? "1" : "0";
    p.fR.style.opacity = pose.finger === "R" ? "1" : "0";
    /* bij een nieuwe stand: even indeuken en terugveren, alsof hij reageert */
    if (changed) { var el = this.el; el.classList.remove("m-react"); void el.offsetWidth; el.classList.add("m-react"); }
  };
  window.Mascot = Mascot;
})();
