import sys
from playwright.sync_api import sync_playwright
from harness import App
with sync_playwright() as p:
    a=App(p); pg=a.pg; pg.wait_for_timeout(1500)
    a.search('centraal'); a.pick(0); pg.click('#startnav'); pg.wait_for_timeout(500)
    pg.evaluate("""()=>{window.__m={b:0,s:0,n:0};new MutationObserver(l=>window.__m.b+=l.length).observe(document.getElementById('banner'),{subtree:true,childList:true,characterData:true,attributes:true});
      new MutationObserver(l=>window.__m.n+=l.length).observe(document.getElementById('navbar'),{subtree:true,childList:true,characterData:true});
      new MutationObserver(l=>window.__m.s+=l.length).observe(document.getElementById('moes'),{subtree:true,attributes:true,attributeFilter:['style']})}""")
    a.ev("window.__mn.startSim()"); pg.wait_for_timeout(10000)
    m=a.ev("window.__m"); print(sys.argv[1], 'in 10 s: balk',m['b'],'| onderbalk',m['n'],'| Smiesh-stijlwijzigingen',m['s'])
    a.close()
