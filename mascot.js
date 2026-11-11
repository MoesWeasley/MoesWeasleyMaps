/* Moes – de assistent van MoesWeasley Maps: een klein wezeltje in een glazen bubbel.
   Standen: idle (rustig), point (wijst de afslag aan), shock (flitser), worried (verkeer),
   happy (aangekomen), sleepy (lang stilstaan), fast (te hard). */
(function () {
  "use strict";
  var EYES = {
    idle: '<g class="eyes"><ellipse cx="38" cy="47" rx="5" ry="6.2" fill="#1d1b3a"/><ellipse cx="62" cy="47" rx="5" ry="6.2" fill="#1d1b3a"/><circle cx="39.8" cy="44.6" r="1.9" fill="#fff"/><circle cx="63.8" cy="44.6" r="1.9" fill="#fff"/></g>',
    shock: '<g><path d="M30 35q8-6 15-1M55 34q7-5 15 1" stroke="#3b2a7a" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="38" cy="47" r="7.5" fill="#fff" stroke="#3b2a7a" stroke-width="1.2"/><circle cx="62" cy="47" r="7.5" fill="#fff" stroke="#3b2a7a" stroke-width="1.2"/><circle cx="38" cy="47.5" r="2.6" fill="#1d1b3a"/><circle cx="62" cy="47.5" r="2.6" fill="#1d1b3a"/></g>',
    worried: '<g><path d="M31 40l11-4M69 40l-11-4" stroke="#3b2a7a" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="38" cy="48" rx="4.4" ry="5.2" fill="#1d1b3a"/><ellipse cx="62" cy="48" rx="4.4" ry="5.2" fill="#1d1b3a"/><circle cx="39.4" cy="46" r="1.6" fill="#fff"/><circle cx="63.4" cy="46" r="1.6" fill="#fff"/></g>',
    happy: '<g fill="none" stroke="#1d1b3a" stroke-width="3" stroke-linecap="round"><path d="M32 49q6-8 12 0M56 49q6-8 12 0"/></g>',
    sleepy: '<g fill="none" stroke="#1d1b3a" stroke-width="2.6" stroke-linecap="round"><path d="M32 48q6 4 12 0M56 48q6 4 12 0"/></g>'
  };
  EYES.point = EYES.idle; EYES.fast = EYES.shock;
  var MOUTH = {
    idle: '<path d="M44 63q6 5 12 0" stroke="#3b2a7a" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
    point: '<path d="M43 62q7 7 14 0" stroke="#3b2a7a" stroke-width="2.2" fill="#ff8fb3" stroke-linecap="round"/>',
    shock: '<ellipse cx="50" cy="66" rx="5" ry="6.5" fill="#3b2a7a"/><ellipse cx="50" cy="68.5" rx="3" ry="2.6" fill="#ff7aa5"/>',
    worried: '<path d="M44 67q6-5 12 0" stroke="#3b2a7a" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
    happy: '<path d="M41 61q9 13 18 0z" fill="#3b2a7a"/><path d="M45 66q5 4 10 0" fill="#ff7aa5"/>',
    sleepy: '<ellipse cx="50" cy="65" rx="2.6" ry="2" fill="#3b2a7a"/>'
  };
  MOUTH.fast = MOUTH.shock;
  var EXTRA = {
    shock: '<path d="M80 30q4 7 0 10q-4-3 0-10z" fill="#7fd3ff" stroke="#fff" stroke-width="1"/><text x="84" y="22" font-size="17" font-weight="900" fill="#ff3d6e" font-family="system-ui" stroke="#fff" stroke-width="2.5" paint-order="stroke">!!</text>',
    fast: '<text x="76" y="24" font-size="17" font-weight="900" fill="#ff3d6e" font-family="system-ui" stroke="#fff" stroke-width="2.5" paint-order="stroke">!!</text>',
    worried: '<path d="M80 32q4 7 0 10q-4-3 0-10z" fill="#7fd3ff" stroke="#fff" stroke-width="1"/>',
    happy: '<g class="sparks"><path d="M12 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd166"/><path d="M86 14l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#ff8fd0"/><circle cx="88" cy="40" r="2.4" fill="#7ee6a8"/></g>',
    sleepy: '<text class="zz" x="72" y="22" font-size="13" font-weight="800" fill="#7b5cff" font-family="system-ui">z</text><text class="zz z2" x="81" y="13" font-size="10" font-weight="800" fill="#7b5cff" font-family="system-ui">z</text>'
  };
  var BODY =
    '<defs><linearGradient id="moesFur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7b2ff"/><stop offset="1" stop-color="#8a6bff"/></linearGradient></defs>' +
    '<g class="moes-body">' +
    '<circle cx="27" cy="26" r="10" fill="url(#moesFur)"/><circle cx="73" cy="26" r="10" fill="url(#moesFur)"/>' +
    '<circle cx="27" cy="27" r="5" fill="#ffc6e1"/><circle cx="73" cy="27" r="5" fill="#ffc6e1"/>' +
    '<ellipse cx="50" cy="53" rx="33" ry="30" fill="url(#moesFur)"/>' +
    '<ellipse cx="50" cy="63" rx="21" ry="16" fill="#fff4fb"/>' +
    '<ellipse cx="50" cy="57.5" rx="4" ry="2.8" fill="#ff6f9a"/>' +
    '<g stroke="#8a6bff" stroke-width="1.3" stroke-linecap="round" opacity=".7"><path d="M33 60l-10-2M33 64l-10 1M67 60l10-2M67 64l10 1"/></g>' +
    '<g class="moes-face"></g></g>' +
    '<g class="moes-arm"><path d="M50 82V60" stroke="#8a6bff" stroke-width="11" stroke-linecap="round"/><path d="M50 82V60" stroke="url(#moesFur)" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M50 53V37" stroke="#8a6bff" stroke-width="7" stroke-linecap="round"/><path d="M50 53V37" stroke="#fff4fb" stroke-width="4.6" stroke-linecap="round"/>' +
    '<circle cx="50" cy="56" r="8" fill="#fff4fb" stroke="#8a6bff" stroke-width="1.6"/><path d="M45 57h7" stroke="#d9cdf5" stroke-width="1.4" stroke-linecap="round"/></g>' +
    '<g class="moes-extra"></g>';
  var ANG = { "straight": 0, "slight right": 40, "right": 80, "sharp right": 120, "slight left": -40, "left": -80, "sharp left": -120, "uturn": -150 };

  function Mascot(el) {
    this.el = el; this.state = null; this.dir = undefined;
    el.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + BODY + "</svg>";
    this.face = el.querySelector(".moes-face"); this.arm = el.querySelector(".moes-arm"); this.extra = el.querySelector(".moes-extra");
  }
  Mascot.prototype.set = function (state, dir) {
    if (state !== this.state) {
      this.state = state;
      this.face.innerHTML = EYES[state] + MOUTH[state];
      this.extra.innerHTML = EXTRA[state] || "";
      this.el.className = "moes moes-" + state;
    }
    var a = state === "point" ? (ANG[dir] == null ? 0 : ANG[dir]) : null;
    if (a !== this.dir) {
      this.dir = a;
      this.arm.style.opacity = a == null ? "0" : "1";
      /* wijzen met de arm aan de kant van de afslag (links: linkerschouder, anders rechterschouder) */
      var side = a != null && a < 0 ? -24 : 24;
      this.arm.style.transform = "translate(" + side + "px,4px) rotate(" + (a == null ? (side < 0 ? -30 : 30) : a) + "deg)";
    }
  };
  window.Mascot = Mascot;
})();
