import sys, json
from playwright.sync_api import sync_playwright
f = sys.argv[1]; shots = sys.argv[2:]  # name:w:h:query[:action]
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    for spec in shots:
        name,w,h,q,*act = spec.split(':')
        pg = b.new_page(reduced_motion='reduce' if 'rm' in act else 'no-preference', viewport={'width':int(w),'height':int(h)}, is_mobile=int(w)<800, has_touch=int(w)<800)
        errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        pg.add_init_script("try{localStorage.setItem('policyIsland.introSeen','1')}catch(e){}" if 'intro' not in act else "")
        pg.goto(f'http://localhost:8765/{f}{q}')
        try: pg.wait_for_function('window.__policyIsland && window.__policyIsland.ready', timeout=90000)
        except Exception as e: errs.append('NOT READY '+pg.evaluate('document.body.innerText.slice(0,300)'))
        pg.wait_for_timeout(2500)
        for a in act:
            if a.startswith('sel='):
                t,i = a[4:].split(','); pg.evaluate(f"window.__policyIsland.select('{t}', {i if t in ('island','walker') else repr(i)})"); pg.wait_for_timeout(1500)
            if a.startswith('click='): pg.click(a[6:]); pg.wait_for_timeout(1500)
        info = pg.evaluate("window.__policyIsland ? {dc: window.__policyIsland.drawCalls(), items: window.__policyIsland.items, walkers: window.__policyIsland.walkers} : null")
        pg.screenshot(path=f'shots/{name}.png')
        print(name, info, 'ERRORS:', errs)
        pg.close()
    b.close()
