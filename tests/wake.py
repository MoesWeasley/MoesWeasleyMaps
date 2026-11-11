from playwright.sync_api import sync_playwright
from harness import App
with sync_playwright() as p:
    a=App(p); pg=a.pg
    pg.wait_for_timeout(32000)   # stilstaan: Moes valt in slaap
    print('voor tik:',pg.get_attribute('#moes','data-s'))
    pg.screenshot(path='/home/claude/tests/w0.png',clip={'x':0,'y':560,'width':200,'height':260})
    pg.click('#moes'); pg.wait_for_timeout(250)
    print('net getikt:',pg.get_attribute('#moes','data-s'),pg.get_attribute('#moes','class'),'|',pg.inner_text('#moes'))
    pg.screenshot(path='/home/claude/tests/w1.png',clip={'x':0,'y':480,'width':260,'height':340})
    pg.wait_for_timeout(1700); print('daarna:',pg.get_attribute('#moes','data-s'),pg.get_attribute('#moes','class'))
    pg.wait_for_timeout(35000); print('35 s later nog wakker:',pg.get_attribute('#moes','data-s'))
    pg.click('#moes'); pg.wait_for_timeout(300); print('wakker tikken:',pg.get_attribute('#moes','class'),'|',pg.inner_text('#moes'))
    print('ERR',a.errs)
    a.close()
