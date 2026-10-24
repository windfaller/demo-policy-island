/* ---------- 細節加料（每種 archetype 的附加零件） ---------- */
const EXTRA = {
  house(b, acc) { [-.22, .22].forEach((x, i) => { b.bx(x, .08, .375, .2, .04, .06, PAL.wood); b.ic(x - .05, .14, .38, .04, i ? PAL.p1 : PAL.pink); b.ic(x + .05, .14, .38, .04, PAL.yellow); });
    b.bx(-.47, .3, -.05, .1, .03, .3, PAL.wood); for (let i = 0; i < 4; i++) b.bx(-.51, .33, -.17 + i * .08, .01, .07, .01, '#ffffff'); b.dm(.25, .84, .12, .05, '#ffffff');
    for (let i = 0; i < 6; i++) b.bx(-.47 + i * .09, 0, .47, .025, .11, .025, '#ffffff'); b.bx(-.25, .08, .47, .47, .02, .02, '#ffffff');
    b.cy(.42, 0, .45, .02, .15, PAL.ink); b.rb(.42, .15, .45, .08, .07, .1, PAL.coral); b.bx(0, .29, .36, .22, .03, .08, PAL.coral); },
  hall(b, acc) { b.cy(.44, .08, .34, .012, .95, '#ffffff'); b.bx(.5, .88, .34, .11, .07, .01, acc); b.sp(.44, 1.04, .34, .018, PAL.yellow);
    for (let i = 0; i < 3; i++) b.bx(0, 0, .44 + i * .04, .5 - i * .06, .08 - i * .025, .05, PAL.stone);
    [-.42, .42].forEach(x => { b.cy(x, .08, .44, .055, .08, PAL.coral); b.ic(x, .21, .44, .07, PAL.p2); }); b.bx(0, .43, .31, .32, .08, .015, acc); b.gs(-.2, .6, .33, .025); b.gs(.2, .6, .33, .025);
    b.bx(-.3, .6, -.1, .2, .06, .2, PAL.p1); b.ic(-.3, .7, -.1, .06, PAL.p2); },
  kiosk(b, acc) { [[-.32, .42], [.32, .42]].forEach(([x, z]) => { b.cy(x, .05, z, .01, .3, PAL.ink); b.co(x, .32, z, .14, .07, '#ffffff'); b.cy(x, .05, z, .05, .1, PAL.wood); b.bx(x + .07, .05, z, .04, .06, .04, PAL.wood); });
    b.bx(0, .9, 0, .42, .13, .03, PAL.cream); b.bx(0, .93, .017, .3, .06, .01, acc); b.bx(.4, .05, -.32, .12, .1, .12, PAL.wood); b.bx(.4, .15, -.32, .1, .08, .1, '#d6a77f'); b.gs(-.3, .58, .4, .02); b.gs(.3, .58, .4, .02); },
  classroom(b) { b.bx(.38, .06, -.3, .14, .36, .1, PAL.wood); for (let i = 0; i < 3; i++) b.bx(.38, .12 + i * .1, -.24, .12, .06, .02, [PAL.coral, PAL.teal, PAL.yellow][i]);
    b.disc(-.3, .45, -.385, .05, .02, '#ffffff'); b.cy(-.38, .06, .38, .04, .08, PAL.coral); b.ic(-.38, .18, .38, .06, PAL.p2); b.sp(.38, .5, -.3, .04, PAL.aqua);
    b.bx(0, .61, -.42, 1.04, .04, .1, PAL.coral); b.bx(-.25, .61, -.25, .5, .02, .3, '#ffffff'); },
  clinic(b) { for (let i = 0; i < 4; i++) b.ic(-.32 + i * .1, .72, .2, .05, i % 2 ? PAL.p1 : PAL.p2); b.bx(-.2, .66, .2, .45, .04, .14, PAL.wood);
    b.rb(.2, 0, .55, .36, .18, .18, '#ffffff'); b.bx(.2, .1, .645, .36, .03, .005, PAL.coral); b.gb(.32, .1, .55, .1, .07, .17); [.08, .32].forEach(x => b.disc(x, .03, .64, .035, .03, PAL.ink));
    b.cy(.38, .66, -.25, .015, .2, PAL.ink); b.dm(.38, .86, -.25, .06, PAL.coral, .5); b.bx(-.36, 0, .45, .16, .03, .06, PAL.wood); },
  busstop(b, acc) { b.cy(.45, .04, .45, .012, .3, PAL.ink); b.disc(.45, .36, .45, .05, .01, PAL.aqua); b.cy(-.45, .04, -.1, .03, .08, PAL.green);
    b.ic(.42, .2, -.42, .1, PAL.p2); b.cy(.42, .04, -.42, .015, .1, PAL.wood); b.bx(-.25, .46, -.33, .4, .05, .02, PAL.ink); b.gb(-.25, .465, -.32, .3, .03, .01, '#ffd98a'); },
  bikerack(b, acc) { b.cy(-.42, .04, -.38, .015, .45, PAL.ink); b.cy(.32, .04, -.38, .015, .45, PAL.ink); b.bx(-.05, .49, -.15, .9, .03, .6, acc);
    b.bx(-.42, .04, .38, .02, .3, .2, PAL.ink); b.bx(-.41, .1, .38, .01, .2, .18, PAL.yellow);
    b.tor(.15, .07, .42, .06, PAL.ink, Math.PI / 2); b.tor(.38, .07, .42, .06, PAL.ink, Math.PI / 2); b.rb(.26, .1, .42, .2, .07, .06, PAL.coral); b.cy(.36, .1, .42, .01, .14, PAL.ink); },
  court(b) { for (let i = 0; i < 3; i++) b.bx(0, .04 + i * .05, .45 + i * .03, .8, .05, .04, [PAL.teal, PAL.aqua, PAL.indigo][i]);
    for (let i = 0; i < 6; i++) b.cy(-.48 + i * .19, .04, -.44, .008, .3, PAL.ink); b.bx(0, .3, -.44, .96, .01, .01, PAL.ink);
    b.cy(.44, .04, 0, .02, .45, PAL.ink); b.bx(.4, .42, 0, .02, .16, .22, '#ffffff'); b.tor(.36, .42, 0, .05, PAL.coral, 0, Math.PI / 2); personMini(b, -.1, -.1, PAL.coral); personMini(b, .2, .15, PAL.indigo); },
  farm(b, acc) { b.bx(-.3, .06, .25, .3, .16, .22, '#cfe3dd'); b.pr(-.3, .22, .25, .32, .12, .24, '#e8f2ee'); b.ic(-.3, .12, .25, .06, PAL.p1);
    b.cy(.15, .06, .33, .03, .05, PAL.teal); b.bx(.2, .09, .33, .05, .01, .01, PAL.teal); b.rb(.3, .06, .1, .1, .06, .08, PAL.wood); b.sp(.3, .14, .1, .03, '#e8603c'); b.sp(.25, .14, .1, .025, PAL.yellow); },
  river(b, acc) { for (let i = 0; i < 6; i++) b.cy(-.13 + (i % 2) * .02, .04, -.42 + i * .04, .006, .12 + (i % 3) * .03, PAL.p3); b.disc(.05, .055, -.25, .04, .005, PAL.p1, 0); b.add('cylinder', .06, .055, .3, .07, .005, .07, PAL.p1);
    b.rb(.02, .05, -.1, .1, .03, .2, '#ffffff'); b.bx(.33, .1, -.3, .2, .02, .02, PAL.wood); b.cy(.45, .04, 0, .012, .2, PAL.ink); b.gs(.45, .26, 0, .025); },
  stage(b, acc) { for (let i = 0; i < 5; i++) { b.gs(-.4 + i * .2, .78, .25, .02, [PAL.yellow, PAL.pink, '#ffffff'][i % 3]); } b.bx(-.47, .18, -.36, .02, .6, .02, PAL.ink); b.bx(.47, .18, -.36, .02, .6, .02, PAL.ink);
    b.bx(-.47, .55, -.3, .01, .18, .12, PAL.yellow); b.bx(.47, .55, -.3, .01, .18, .12, PAL.yellow);
    for (let i = 0; i < 5; i++) personMini(b, -.36 + i * .18, .45, [PAL.coral, PAL.aqua, PAL.indigo, PAL.pink, PAL.green][i]); },
  book(b) { b.bx(.05, .95, .1, .03, .25, .01, PAL.yellow); for (let i = 0; i < 3; i++) b.rb(-.32, .05 + i * .05, .25, .22, .045, .16, [PAL.teal, PAL.yellow, PAL.pink][i], i * .2);
    b.cy(.38, .5, -.2, .01, .25, PAL.ink); b.co(.38, .72, -.2, .07, .07, PAL.coral); b.gs(.38, .72, -.2, .025); },
  coin(b) { b.sp(-.3, .17, .15, .12, PAL.pink); b.sp(-.2, .2, .15, .04, PAL.pink); [[-.37, .09], [-.24, .09], [-.37, .21], [-.24, .21]].forEach(([x, z]) => b.cy(x, .05, z, .02, .05, PAL.pink)); b.bx(-.3, .28, .15, .06, .01, .015, PAL.ink);
    for (let i = 0; i < 2; i++) b.cy(.25, .05 + i * .06, -.22, .1, .05, '#f2c14e'); },
  clock(b) { b.bx(.3, .05, .2, .3, .03, .1, PAL.wood); b.bx(.3, .08, .15, .3, .1, .02, PAL.wood); b.cy(-.3, .05, .15, .06, .02, PAL.wood); b.co(-.3, .07, .15, .05, .08, '#f6e2b0'); b.co(-.3, .15, .15, .05, .08, '#f6e2b0'); b.cy(-.3, .23, .15, .06, .02, PAL.wood);
    b.gs(0, 1.22, 0, .03); },
  globe(b) { [[-.35, PAL.coral], [.35, PAL.indigo]].forEach(([x, c]) => { b.cy(x, 0, .3, .01, .4, PAL.ink); b.bx(x + .05, .33, .3, .09, .06, .005, c); });
    b.sp(.32, 1.05, -.2, .03, '#ffffff'); b.bx(.32, 1.05, -.2, .12, .005, .04, PAL.teal); b.add('torus', 0, .72, 0, 1.1, 1.1, 1.1, PAL.yellow, 0, Math.PI / 2, 0); }
};
/* 街道家具（真實尺寸，世界單位） */
const FURN = {
  mailbox(b) { b.cy(0, 0, 0, .012, .1, PAL.ink); b.rb(0, .1, 0, .06, .07, .08, PAL.coral); },
  vending(b) { b.rb(0, 0, 0, .1, .18, .08, PAL.teal); b.gb(0, .07, .041, .07, .09, .005, '#ffe9b8'); b.bx(0, .02, .041, .05, .02, .005, PAL.ink); },
  bin(b) { b.cy(-.03, 0, 0, .025, .07, PAL.green); b.cy(.03, 0, 0, .025, .07, PAL.aqua); b.cy(-.03, .07, 0, .028, .008, PAL.ink); b.cy(.03, .07, 0, .028, .008, PAL.ink); },
  hedge(b) { b.rb(0, 0, 0, .28, .08, .07, PAL.p3); b.sp(-.08, .09, 0, .015, PAL.pink); b.sp(.07, .09, 0, .015, '#ffffff'); },
  lantern(b) { b.cy(0, 0, 0, .008, .18, PAL.wood); b.bx(0, .18, 0, .04, .05, .04, PAL.eave); b.gs(0, .2, 0, .02, '#ffd98a'); },
  signpost(b) { b.cy(0, 0, 0, .008, .24, PAL.ink); b.bx(.04, .2, 0, .1, .028, .008, PAL.coral); b.bx(-.03, .16, 0, .09, .028, .008, PAL.teal, .6); },
  scooter(b) { b.tor(0, .025, -.04, .025, PAL.ink, Math.PI / 2); b.tor(0, .025, .05, .025, PAL.ink, Math.PI / 2); b.rb(0, .03, 0, .04, .04, .1, PAL.yellow); b.cy(0, .05, .05, .006, .07, PAL.ink); b.bx(0, .06, -.03, .035, .015, .05, PAL.ink); },
  umbrella(b) { b.cy(0, 0, 0, .006, .2, '#ffffff'); b.co(0, .2, 0, .11, .05, PAL.pink); b.cy(0, 0, 0, .04, .06, '#ffffff'); b.bx(-.065, 0, 0, .03, .04, .03, PAL.wood); b.bx(.065, 0, 0, .03, .04, .03, PAL.wood); },
  flowerbed(b) { b.bx(0, 0, 0, .22, .04, .09, PAL.wood); for (let i = 0; i < 4; i++) b.ic(-.08 + i * .055, .055, 0, .025, [PAL.pink, PAL.yellow, '#ffffff', PAL.coral][i]); },
  bikes(b) { [-.04, .04].forEach(x => { b.tor(x, .03, -.04, .03, PAL.ink, Math.PI / 2); b.tor(x, .03, .04, .03, PAL.ink, Math.PI / 2); b.bx(x, .045, 0, .008, .008, .08, PAL.coral); }); }
};
const FURN_KEYS = Object.keys(FURN);
/* 空格子的地面小景 */
const PATCH = {
  fountain(b) { b.cy(0, 0, 0, .45, .1, PAL.stone); b.cy(0, .02, 0, .4, .09, '#7cc3cc'); b.cy(0, .1, 0, .06, .25, PAL.cream); b.cy(0, .35, 0, .18, .04, PAL.stone); b.sp(0, .42, 0, .07, '#bfe6ea'); },
  garden(b) { b.bx(0, 0, 0, .85, .04, .85, '#a07b58'); for (let i = 0; i < 9; i++) b.ic(-.28 + (i % 3) * .28, .1, -.28 + Math.floor(i / 3) * .28, .09, [PAL.pink, PAL.p1, PAL.yellow][i % 3]); },
  cafe(b) { b.bx(0, 0, 0, .9, .015, .9, '#e9dccb'); [[-.22, -.22], [.22, .22], [.22, -.22]].forEach(([x, z], i) => { b.cy(x, 0, z, .01, .45, '#ffffff'); b.co(x, .42, z, .22, .1, [PAL.coral, PAL.aqua, PAL.yellow][i]); b.cy(x, 0, z, .08, .12, '#ffffff'); }); },
  car(b) { b.rb(0, .06, 0, .4, .16, .8, PAL.aqua); b.rb(0, .2, -.05, .36, .14, .42, '#ffffff'); b.gb(0, .22, .17, .3, .09, .01); [[-.2, -.25], [.2, -.25], [-.2, .25], [.2, .25]].forEach(([x, z]) => b.add('cylinder', x, .07, z, .14, .06, .14, PAL.ink, 0, 0, Math.PI / 2)); }
};
const PATCH_KEYS = Object.keys(PATCH);
const noop = () => { };
