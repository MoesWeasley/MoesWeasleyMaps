from playwright.sync_api import sync_playwright
from harness import App
with sync_playwright() as p:
    a=App(p); pg=a.pg; pg.wait_for_timeout(33000)
    print('voor tik:',pg.evaluate("window.__mn.moes().state"))
    pg.click('#moes'); acts=set(); states=set()
    for i in range(240):
        pg.wait_for_timeout(250); r=pg.evaluate("(()=>{var m=window.__mn.moes();return [m.state,m.act,document.getElementById('moes').getAttribute('data-s')]})()")
        if r[1]: acts.add(r[1])
        states.add(r[2])
    print('60 s na tik - acties:',acts,'gezichtjes:',states)
    print('FOUT: gaapt/slaapt na tik' if ({'yawn','stretch'}&acts or 'sleepy' in states) else 'ok: niet gapen of slapen na aanraken')
    print('ERR',a.errs); a.close()
