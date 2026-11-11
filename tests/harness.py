"""Gedeelde testomgeving: echte app (repo-map) met nep-kaart en nep-diensten."""
import json, re
from playwright.sync_api import sync_playwright
ROOT = '/home/claude/moesweasleymaps'
A = [4.9, 52.37]; B = [4.9, 52.379]; C = [4.9073, 52.379]; D = [4.912, 52.379]

def osrm(alt, frm=None):
    frm = frm or A
    off = 0.0005 * alt
    import math
    d0 = int(math.hypot((B[0]-frm[0])*67000, (B[1]-frm[1])*111000))
    return {"distance": 1820 + alt * 100, "duration": 200 + alt * 30, "legs": [{"steps": [
        {"maneuver": {"type": "depart", "modifier": "straight", "location": frm}, "name": "Damrak", "distance": d0, "duration": d0/10, "geometry": {"coordinates": ([A, [4.9, 52.3745], B] if frm == A else [frm, B])}},
        {"maneuver": {"type": "turn", "modifier": "right", "location": B}, "name": "Prins Hendrikkade", "distance": 500, "duration": 60, "geometry": {"coordinates": [B, C]}},
        {"maneuver": {"type": "roundabout", "modifier": "straight", "exit": 2, "location": C}, "name": "", "ref": "s100", "distance": 320, "duration": 40, "geometry": {"coordinates": [C, D]}},
        {"maneuver": {"type": "arrive", "modifier": "left", "location": D}, "name": "", "distance": 0, "duration": 0, "geometry": {"coordinates": [D, D]}}]}]}

CTL = {"route": "ok", "search": "ok", "calls": []}
PLACES = [{"geometry": {"coordinates": D}, "properties": {"name": "Centraal Station", "city": "Amsterdam", "countrycode": "NL"}},
          {"geometry": {"coordinates": C}, "properties": {"name": "Centrale Bibliotheek", "city": "Amsterdam", "countrycode": "NL"}}]

GEM = {"log": [], "status": None}
def gemini(r):
    import json as _j
    u = r.request.url; model = u.split('/models/')[1].split(':')[0]
    body = _j.loads(r.request.post_data or '{}'); GEM["log"].append({"model": model, "body": body, "key": r.request.headers.get('x-goog-api-key')})
    if GEM["status"]: return r.fulfill(status=GEM["status"], json={"error": {"message": "API key not valid"}})
    if model == "gemini-flash-latest": return r.fulfill(status=404, json={"error": {"message": "not found"}})
    last = body["contents"][-1]; p0 = last["parts"][0]
    def call(name, args): return r.fulfill(json={"candidates": [{"content": {"role": "model", "parts": [{"functionCall": {"name": name, "args": args}, "thoughtSignature": "SIG-" + name}]}}]})
    def text(t): return r.fulfill(json={"candidates": [{"content": {"role": "model", "parts": [{"text": t}]}}]})
    if "functionResponse" in p0:
        fr = p0["functionResponse"]; res = fr["response"]["result"]; n = fr["name"]
        if n == "rit_info": return text("Je bent er om %s, nog %s." % (res.get("aankomst", "?"), res.get("resterend", "?")) if res.get("navigatie") else "Je rijdt nu %s km per uur." % res["snelheid_kmu"])
        if n == "zoek_plek": rr = res.get("resultaten") or [{}]; return text("Dichtstbij is %s op %s. Zal ik erheen gaan?" % (rr[0].get("naam"), rr[0].get("afstand")))
        if n == "start_route": return text("Op weg naar %s!" % res.get("naar"))
        if n == "instelling": return text("Geluid staat nu uit.")
        if n == "stop_route": return text("Route gestopt.")
        return text("Klaar.")
    q = p0.get("text", "").lower()
    if "hoe laat" in q: return call("rit_info", {})
    if "tankstation" in q: return call("zoek_plek", {"soort": "tankstation", "waar": "hier"})
    if "erheen" in q: return call("start_route", {"nummer": 1})
    if "geluid uit" in q: return call("instelling", {"naam": "geluid", "aan": False})
    if "stop" in q: return call("stop_route", {})
    return text("Hoi! Ik ben **Smiesh**, je vrolijke wezeltje.")

def handler(r):
    u = r.request.url
    if u.startswith('https://app/'):
        f = u[len('https://app/'):].split('?')[0] or 'index.html'
        if f == 'lib/maplibre-gl.js': return r.fulfill(path='/home/claude/tests/stub-maplibre.js', content_type='text/javascript')
        if f.endswith('.css'): return r.fulfill(body='', content_type='text/css')
        if f.startswith('lib/') or f.startswith('data/'): return r.fulfill(status=404, body='')
        return r.fulfill(path=ROOT + '/' + f, content_type='text/html' if f.endswith('html') else 'text/javascript')
    if '/nearest/v1/' in u:
        m = re.search(r'nearest/v1/[^/]+/([\d.]+),([\d.]+)', u)
        lon, lat = float(m.group(1)), float(m.group(2))
        return r.fulfill(json={"code": "Ok", "waypoints": [{"location": [lon, lat], "distance": 2, "name": "Damrak"}]})
    if 'route/v1' in u:
        CTL["calls"].append(u)
        m = re.search(r'driving/([\d.]+),([\d.]+)', u); frm = [float(m.group(1)), float(m.group(2))] if m else A
        if abs(frm[0]-A[0]) < 1e-5 and abs(frm[1]-A[1]) < 1e-5: frm = A
        if CTL["route"] == "fail": return r.fulfill(status=500, body='')
        if CTL["route"] == "noroute": return r.fulfill(json={"code": "NoRoute", "message": "No route found"})
        return r.fulfill(json={"code": "Ok", "routes": [osrm(0, frm), osrm(1, frm)]})
    if 'photon' in u and '/reverse' in u:
        return r.fulfill(json={"features": [{"geometry": {"coordinates": [4.905, 52.375]}, "properties": {"name": "Nieuwendijk", "housenumber": "12", "street": "Nieuwendijk", "city": "Amsterdam", "countrycode": "NL"}}]})
    if 'photon' in u or 'nominatim' in u:
        if CTL["search"] == "fail": return r.abort()
        q = re.search(r'q=([^&]*)', u).group(1).lower()
        if 'nominatim' in u: return r.fulfill(json=[])
        return r.fulfill(json={"features": [p for p in PLACES if q[:3] in p["properties"]["name"].lower()]})
    if 'generativelanguage.googleapis.com' in u:
        return gemini(r)
    if 'interpreter' in u:
        CTL.setdefault("overpass", 0); CTL["overpass"] += 1
        if CTL.get("osm") == "fail": return r.abort()
        from urllib.parse import unquote
        if 'amenity=fuel' in unquote(u):
            return r.fulfill(json={"elements": [{"type": "node", "id": 9, "lat": 52.372, "lon": 4.905, "tags": {"amenity": "fuel", "name": "Shell Damrak", "addr:street": "Damrak"}},
                                                {"type": "node", "id": 8, "lat": 52.39, "lon": 4.93, "tags": {"amenity": "fuel", "brand": "Esso"}}]})
        if 'traffic_signals' in unquote(u):
            CTL.setdefault("sigq", 0); CTL["sigq"] += 1
            return r.fulfill(json={"elements": [{"type": "node", "id": 1, "lat": B[1], "lon": B[0]}, {"type": "node", "id": 2, "lat": B[1] + 0.00005, "lon": B[0]}, {"type": "node", "id": 3, "lat": C[1], "lon": C[0]}]})
        W = lambda tags, pts: {"type": "way", "tags": tags, "geometry": [{"lat": p[1], "lon": p[0]} for p in pts]}
        return r.fulfill(json={"elements": [W({"highway": "secondary", "name": "Damrak", "maxspeed": "50"}, [A, [4.9, 52.3745], B]),
            W({"highway": "residential", "name": "Prins Hendrikkade", "maxspeed": "30"}, [B, C]),
            W({"highway": "tertiary", "maxspeed": "NL:urban", "junction": "roundabout"}, [C, D, [4.918, 52.379]])]})
    if 'flitsers.json' in u: return r.fulfill(json={"updated": 1794370277, "cams": [{"id": "x1", "lat": 52.3791, "lon": 4.9029, "type": "vast", "max": 50}]})
    if 'verkeer.json' in u: return r.fulfill(json={"updated": 1794338184, "items": []})
    return r.fulfill(status=404, body='')

class App:
    def __init__(self, p, w=400, h=820, geo=True, init=""):
        self.b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        kw = dict(viewport={'width': w, 'height': h}, device_scale_factor=2, has_touch=True)
        if geo: kw.update(geolocation={'latitude': A[1], 'longitude': A[0]}, permissions=['geolocation'])
        self.ctx = self.b.new_context(**kw)
        self.errs = []
        self.pg = self.ctx.new_page()
        self.pg.on('pageerror', lambda e: self.errs.append('JS: ' + str(e)))
        self.pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and self.errs.append('console: ' + m.text))
        self.ctx.route('**/*', handler)
        # langzame diensten nabootsen: window.__slow = /regex/
        self.pg.add_init_script("""window.__q=[];var __SR=function(){var s=this;this.start=function(){setTimeout(function(){var t=window.__q.shift()||'';if(t)s.onresult({results:[[{transcript:t}]]});s.onend()},400)};this.abort=function(){}};Object.defineProperty(window,'SpeechRecognition',{value:__SR,configurable:true,writable:true});Object.defineProperty(window,'webkitSpeechRecognition',{value:__SR,configurable:true,writable:true});""")
        self.pg.add_init_script("""window.__said=[];if(window.speechSynthesis){speechSynthesis.speak=function(u){window.__said.push(u.text)}}""")
        self.pg.add_init_script("""(function(){var f=window.fetch;window.fetch=function(u,o){var s=window.__slow;if(s&&s.test(String(u)))return new Promise(function(r){setTimeout(r,window.__slowMs||3000)}).then(function(){return f(u,o)});return f(u,o)}})();""" + init)
        self.pg.goto('https://app/index.html'); self.pg.wait_for_timeout(1200)
    def ev(self, js): return self.pg.evaluate(js)
    def vis(self, sel):
        return self.pg.evaluate("s=>{var e=document.querySelector(s);if(!e||e.hidden)return false;var r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width>0&&r.height>0&&c.visibility!=='hidden'&&c.display!=='none'&&+c.opacity>0.05}", sel)
    def rect(self, sel): return self.pg.evaluate("s=>{var e=document.querySelector(s);if(!e)return null;var r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}", sel)
    def toast(self): return self.pg.inner_text('#toast') if self.vis('#toast') else ''
    def shot(self, name): self.pg.screenshot(path='/home/claude/tests/e2e-' + name + '.png')
    def search(self, q):
        self.pg.click('#q'); self.pg.fill('#q', q); self.pg.wait_for_timeout(800)
    def pick(self, i=0):
        self.pg.locator('.res').nth(i).click(); self.pg.wait_for_timeout(900)
    def close(self): self.b.close()
