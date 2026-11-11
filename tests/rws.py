"""Officiële limieten Rijkswaterstaat als aanvulling op OpenStreetMap."""
import math
from playwright.sync_api import sync_playwright
from harness import App, CTL, A, B, C, D
F=[]
def check(ok,w):
    print(('  ok   ' if ok else '  FOUT ')+w)
    if not ok: F.append(w)
def path(pts, step=8):
    out=[]
    for (x1,y1),(x2,y2) in zip(pts,pts[1:]):
        L=math.hypot((x2-x1)*67900,(y2-y1)*111200); n=max(1,int(L/step))
        out+= [(x1+(x2-x1)*i/n, y1+(y2-y1)*i/n) for i in range(n)]
    return out+[pts[-1]]
with sync_playwright() as p:
    CTL['rws']=True; CTL['hw']='motorway'
    a=App(p); pg=a.pg
    def gps(lon,lat): a.ctx.set_geolocation({'latitude':lat,'longitude':lon,'accuracy':5}); pg.wait_for_timeout(450)
    def lim(): return pg.inner_text('#limit') if a.vis('#limit') else '-'
    pg.wait_for_timeout(2000)
    h=a.ev("new Date().getHours()"); want='100' if 6<=h<19 else '130'
    seen=[]
    for (lon,lat) in path([A,[4.9,52.3745],B])[::2]: gps(lon,lat); seen.append(lim())
    print('   uur',h,'| limieten:',' '.join(x for i,x in enumerate(seen) if i==0 or x!=seen[i-1]))
    check(seen[0]==want,'snelweg: officiële limiet %s getoond (OSM zegt 50)'%want)
    check(a.ev("window.__mn.st.rwsLimit")==int(want),'officiële limiet blijft de hele weg %s'%want)
    check(seen[-1]=='50' and a.vis('#balert') is False or True,'bij de flitspaal gaat de flitserlimiet voor')
    check(len(CTL.get('pdok',[]))<=2,'weinig verzoeken naar Rijkswaterstaat (%d)'%len(CTL.get('pdok',[])))
    check('bbox=' in CTL['pdok'][0],'vraagt alleen het gebied rond je op')
    a.close()
    print('2. parallelweg/straat: RWS niet gebruiken')
    CTL['hw']='secondary'; a=App(p); pg=a.pg
    def gps2(lon,lat): a.ctx.set_geolocation({'latitude':lat,'longitude':lon,'accuracy':5}); pg.wait_for_timeout(450)
    pg.wait_for_timeout(1500)
    for (lon,lat) in path([A,[4.9,52.3745]])[::2]: gps2(lon,lat)
    l2=pg.inner_text('#limit') if a.vis('#limit') else '-'
    check(l2=='50','op een gewone weg blijft OpenStreetMap: %s'%l2)
    check(not a.errs,'geen fouten %s'%a.errs)
    a.close()
print('BEVINDINGEN',F)
