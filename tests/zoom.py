import sys
from playwright.sync_api import sync_playwright
from harness import App
from PIL import Image
tag=sys.argv[1]
with sync_playwright() as p:
    a=App(p); pg=a.pg
    pg.evaluate("document.querySelector('#moes').style.transform='scale(4)';document.querySelector('#moes').style.transformOrigin='0 100%';document.querySelector('#moes').style.zIndex=50")
    pg.wait_for_timeout(2500); pg.evaluate("(()=>{var m=window.__mn.moes();m._set=m.set;m.set=function(){};})()")
    fs=[]
    for js in ["m._set('idle')","m._set('point','right')","m._set('shock')","m._set('idle');m.play('yawn',true)","m._set('idle');m.play('wave',true)"]:
        pg.evaluate("(()=>{var m=window.__mn.moes();m.endAct(true);"+js+"})()"); pg.wait_for_timeout(1000)
        r=a.rect('#moes svg'); f='/tmp/z%d.png'%len(fs); pg.screenshot(path=f,clip={'x':r[0]-30,'y':r[1]-20,'width':r[2]-r[0]+60,'height':r[3]-r[1]+30}); fs.append(f)
    ims=[Image.open(f) for f in fs]; out=Image.new('RGB',(sum(i.width for i in ims),max(i.height for i in ims)),'white'); x=0
    for i in ims: out.paste(i,(x,0)); x+=i.width
    out.thumbnail((2400,700)); out.save('/home/claude/tests/zoom-%s.png'%tag); print(a.errs)
    a.close()
