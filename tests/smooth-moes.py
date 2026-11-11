"""Hoe soepel is Smiesh op een 'trage telefoon' (CPU 6x vertraagd)? Meet beeldtijden en hoeveel tijd zijn eigen werk kost."""
import sys, json
from playwright.sync_api import sync_playwright
from harness import App
with sync_playwright() as p:
    a=App(p); pg=a.pg; pg.wait_for_timeout(2000)
    cdp=a.ctx.new_cdp_session(pg); cdp.send('Emulation.setCPUThrottlingRate',{'rate':6})
    r=pg.evaluate("""()=>new Promise(res=>{var m=window.__mn.moes(),tk=m.tick.bind(m),cost=[],fr=[],last=0,t0=performance.now();
      m.tick=function(t){var s=performance.now();tk(t);cost.push(performance.now()-s)};
      m.play('wave',true);setTimeout(()=>m.play('eat',true),2500);
      (function f(t){if(last)fr.push(t-last);last=t;if(performance.now()-t0<6000)requestAnimationFrame(f);else{
        fr.sort((a,b)=>a-b);cost.sort((a,b)=>a-b);var q=(a,x)=>a[Math.floor(a.length*x)];
        res({frames:fr.length,p50:q(fr,.5).toFixed(1),p95:q(fr,.95).toFixed(1),jank:fr.filter(x=>x>34).length,tick_p50:q(cost,.5).toFixed(2),tick_p95:q(cost,.95).toFixed(2)})}})(0)})""")
    print(sys.argv[1] if len(sys.argv)>1 else '', json.dumps(r))
    a.close()
