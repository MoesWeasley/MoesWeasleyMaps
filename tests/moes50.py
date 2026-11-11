from playwright.sync_api import sync_playwright
from harness import App
with sync_playwright() as p:
    a=App(p); pg=a.pg
    a.search('centraal'); a.pick(0); pg.click('#startnav'); pg.wait_for_timeout(300); a.ev("window.__mn.startSim()")
    pts=[];acts=set()
    for i in range(800):
        pg.wait_for_timeout(250)
        r=a.ev("(()=>{var m=window.__mn.moes(),t=window.__mn.st;return [m.state,m.act,t.nextMan?Math.round(t.nextMan.dist):null,t.arrived,t.drive]})()")
        if r[0]=='point': pts.append(r[2])
        if r[1]: acts.add(r[1])
        if r[4]: break
    print('wijzen bij afstanden:',sorted(set(pts)))
    print('acties onderweg:',acts)
    print('ERR',a.errs)
    a.close()
