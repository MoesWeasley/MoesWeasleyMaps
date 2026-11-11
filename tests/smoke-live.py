import json, sys
from playwright.sync_api import sync_playwright
ROOT='/home/claude/moesweasleymaps'
A=[4.9,52.37];B=[4.9,52.379];C=[4.9073,52.379];D=[4.912,52.379]
def osrm(alt):
    off=0.0005*alt
    pts=lambda p:[p[0]+off,p[1]]
    return {"distance":1820+alt*100,"duration":200+alt*30,"legs":[{"steps":[
     {"maneuver":{"type":"depart","modifier":"straight","location":A},"name":"Damrak","distance":1000,"duration":100,"geometry":{"coordinates":[A,[4.9,52.3745],B]}},
     {"maneuver":{"type":"turn","modifier":"right","location":B},"name":"Prins Hendrikkade","distance":500,"duration":60,"geometry":{"coordinates":[B,C]}},
     {"maneuver":{"type":"roundabout","modifier":"straight","exit":2,"location":C},"name":"","ref":"s100","distance":320,"duration":40,"geometry":{"coordinates":[C,D]}},
     {"maneuver":{"type":"arrive","modifier":"left","location":D},"name":"","distance":0,"duration":0,"geometry":{"coordinates":[D,D]}}]}]}
errs=[];bad=[];hits=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':400,'height':820},device_scale_factor=2,geolocation={'latitude':52.37,'longitude':4.9},permissions=['geolocation'],has_touch=True)
    pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    def route(r):
        u=r.request.url
        if u.startswith('http://app/'):
            f=u[len('http://app/'):].split('?')[0] or 'index.html'
            if f=='lib/maplibre-gl.js': return r.fulfill(path='/home/claude/tests/stub-maplibre.js',content_type='text/javascript')
            if f=='lib/maplibre-gl.css': return r.fulfill(body='',content_type='text/css')
            ct='text/html' if f.endswith('html') else 'text/javascript'
            return r.fulfill(path=ROOT+'/'+f,content_type=ct)
        if 'route/v1' in u:
            import re as _re
            ann=_re.search(r'annotations=([^&]*)',u)
            if ann and any(x not in ('true','false','duration','nodes','distance','speed','weight','datasources') for x in ann.group(1).split(',')):
                bad.append(u); return r.fulfill(status=400,json={"code":"InvalidOptions","message":"annotations"})
            return r.fulfill(json={"code":"Ok","routes":[osrm(0),osrm(1)]})
        if 'photon' in u: return r.fulfill(json={"features":[{"geometry":{"coordinates":D},"properties":{"name":"Centraal Station","city":"Amsterdam","countrycode":"NL"}}]})
        if 'interpreter' in u: return r.fulfill(json={"elements":[]})
        if 'flitsers.json' in u: return r.fulfill(json={"updated":1794370277,"cams":[{"id":"x1","lat":52.3791,"lon":4.9029,"type":"vast","max":50}]})
        if 'verkeer.json' in u: return r.fulfill(json={"updated":1794338184,"items":[{"id":"t1","t":"ongeval","lat":52.3770,"lon":4.9001}]})
        if 'api.tomtom.com/traffic/services' in u:
            hits.append('tomtom')
            return r.fulfill(json={"incidents":[{"type":"Feature","properties":{"id":"abc","iconCategory":6,"delay":480,"events":[{"description":"Stilstaand verkeer"}]},"geometry":{"type":"LineString","coordinates":[[4.9,52.3760],[4.9,52.3775],[4.9,52.3785]]}}]})
        if 'data.traffic.hereapi.com' in u:
            hits.append('here')
            return r.fulfill(json={"results":[{"location":{"shape":{"links":[{"points":[{"lat":52.3761,"lng":4.9001}]}]}},"incidentDetails":{"id":"h1","type":"congestion","description":{"value":"File"}}},
                                              {"location":{"shape":{"links":[{"points":[{"lat":52.379,"lng":4.9040},{"lat":52.379,"lng":4.9050}]}]}},"incidentDetails":{"id":"h2","type":"construction","roadClosed":False,"description":{"value":"Werk in uitvoering"}}}]})
        return r.fulfill(status=404,body='')
    pg.route('**/*',route)
    pg.add_init_script("localStorage.setItem('mn_key_tomtom','\"TT\"');localStorage.setItem('mn_key_here','\"HK\"')")
    pg.goto('http://app/index.html'); pg.wait_for_timeout(800)
    pg.screenshot(path='/home/claude/tests/1-home.png')
    pg.fill('#q','centraal'); pg.wait_for_timeout(700); pg.screenshot(path='/home/claude/tests/2-search.png')
    pg.click('.res'); pg.wait_for_timeout(600); pg.screenshot(path='/home/claude/tests/3-route.png')
    pg.wait_for_timeout(800)
    print('live:',pg.evaluate("JSON.stringify(window.__mn.st.routes.map(r=>[r.blocking.length,r.delay]))"))
    print('alts:',pg.inner_text('#alts').replace('\n',' | '),'| warn:',pg.inner_text('#routewarn'))
    pg.evaluate('window.__mn.startSim()'); pg.wait_for_timeout(2500)
    pg.screenshot(path='/home/claude/tests/4-nav.png')
    print('banner:',pg.inner_text('#banner').replace('\n',' | '),'alert:',pg.is_visible('#alert') and pg.inner_text('#alert').replace('\n',' '))
    pg.wait_for_timeout(9000); pg.screenshot(path='/home/claude/tests/5-nav2.png')
    print('banner:',pg.inner_text('#banner').replace('\n',' | '),'alert:',pg.is_visible('#alert') and pg.inner_text('#alert').replace('\n',' '))
    print(pg.evaluate("JSON.stringify({rt:window.__mn.st.routeTraf.length, rc:window.__mn.st.routeCams.length, al:window.__mn.st.along, sp:window.__mn.st.speed})"))
    pg.wait_for_timeout(16000)
    pg.screenshot(path='/home/claude/tests/6-alert.png'); print('after alert:', pg.is_visible('#alert') and pg.inner_text('#alert').replace('\n',' '))
    b.close()
print('FOUTE OSRM-VERZOEKEN:',len(bad));print('ERRORS:',errs,'calls:',hits)
