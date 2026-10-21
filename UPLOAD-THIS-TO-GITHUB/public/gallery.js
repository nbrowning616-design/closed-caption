/* ═══════════════════════════════════════════════════════════
   Closed Caption — THE GALLERY (gallery.js)
   The live "your caption just got hung in a museum" moment.
   Self-contained. No images, no libraries; one optional Google
   Fonts stylesheet (Libre Caslon Text, falls back to Georgia).

   window.Gallery = {
     hang({ caption, author, isReal, image, framers, frames, month, mine, onPrint })
                         -> ms until the framed piece has settled
     close()             -> fades out and removes the overlay
     miniHtml(entry, i?) -> small framed thumbnail card (gal- classes); with i, a button that zooms
     archiveHtml(list)   -> "The Gallery" wall for a bottom sheet (tap a thumbnail: it zooms)
     zoom(entry, list?, i?) / zoomAt(i) -> one framed caption, big; tap, the X, Esc or a swipe down
                         goes back, a sideways swipe pages; zoomClose(), isZoomed()
   }

   Uses host globals when present: tone(), noise(), buzz(), soundEnabled().
   Everything is try/catch guarded; nothing here throws.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SERIF = "'Libre Caslon Text',Georgia,'Times New Roman',serif";
  var SANS = "'Nunito',-apple-system,system-ui,sans-serif";
  var FONT_HREF = 'https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap';

  /* Moulding profile across a stick, outside edge -> inside edge (percent of thickness) */
  var PROFILE = '#3f2a06 0%,#6b4b10 4%,#f7e19a 10%,#e4c167 17%,#b08328 25%,#5c3e0b 29%,#8f6820 31%,#a67c2c 46%,#8f6820 61%,#5c3e0b 64%,#f3d989 71%,#d4a94a 79%,#a07422 86%,#5a3d0a 93%,#2e1f05 100%';
  var BEAD = 'radial-gradient(circle at 42% 38%,#fff6c8 0 12%,#e8c870 26%,#b58a33 48%,#6e4d10 64%,rgba(0,0,0,0) 72%)';

  var CSS = [
    '.gal-ov,.gal-ov *,.gal-arch,.gal-arch *,.gal-mini,.gal-mini *{box-sizing:border-box;}',
    /* ── overlay ── */
    '.gal-ov{position:fixed;inset:0;z-index:900;overflow:hidden;color:#F3E6C8;font-family:' + SERIF + ';-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;}',
    '.gal-ov .gal-wall{position:absolute;inset:0;background-color:#4A1A1E;background-image:radial-gradient(ellipse 85% 60% at 50% 42%,rgba(132,52,50,.55) 0%,rgba(74,26,30,0) 62%),radial-gradient(ellipse 120% 90% at 50% 45%,rgba(0,0,0,0) 45%,rgba(12,3,4,.78) 100%);}',
    '.gal-ov .gal-plaster{position:absolute;inset:0;opacity:.55;mix-blend-mode:overlay;background-size:260px 260px;}',
    '.gal-ov .gal-floor{position:absolute;left:0;right:0;bottom:0;height:9%;background:linear-gradient(to bottom,rgba(0,0,0,.0),rgba(0,0,0,.35) 30%,rgba(10,3,3,.7));border-top:1px solid rgba(255,220,170,.06);}',
    /* #48: the light beam was a 560px layer under a 7px blur; now a soft-edged gradient cone, no filter, sized to the screen */
    '.gal-ov .gal-beam{position:absolute;left:50%;top:-4%;width:min(560px,130vw);height:78%;transform:translateX(-50%);pointer-events:none;opacity:0;background:radial-gradient(ellipse 34% 100% at 50% 0%,rgba(255,236,196,.42),rgba(255,226,170,.16) 55%,rgba(255,220,160,0) 100%);mix-blend-mode:screen;}',
    '.gal-ov .gal-pool{position:absolute;left:50%;top:9%;width:min(760px,150vw);height:66%;transform:translateX(-50%);pointer-events:none;opacity:0;background:radial-gradient(ellipse 50% 50% at 50% 50%,rgba(255,214,150,.30),rgba(255,190,120,.10) 50%,rgba(255,190,120,0) 72%);mix-blend-mode:screen;}',
    '.gal-ov .gal-lamp{position:absolute;left:50%;top:0;width:86px;height:10px;margin-left:-43px;border-radius:0 0 8px 8px;background:linear-gradient(#3a2a12,#c9a14a 40%,#6d5020);box-shadow:0 2px 12px rgba(255,220,150,.5);opacity:0;}',
    '.gal-ov .gal-stage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(14px + env(safe-area-inset-bottom,0px));overflow:hidden;}',
    '.gal-ov .gal-head{text-align:center;min-height:68px;flex:none;margin-top:auto;}',
    '.gal-ov .gal-eyebrow{margin:0;font-style:italic;font-size:15px;letter-spacing:.02em;color:rgba(243,230,200,.82);}',
    '.gal-ov .gal-title{margin:4px 0 0;font-weight:400;font-style:italic;font-size:34px;line-height:1.05;letter-spacing:-.01em;color:#F6E7C4;opacity:0;text-shadow:0 2px 18px rgba(0,0,0,.5);}',
    '.gal-ov.gal-mine .gal-title{font-size:35px;background:linear-gradient(100deg,#b8862b 0%,#f9e6a6 28%,#fffbe8 40%,#e2b955 56%,#a8761e 80%,#f1d27c 100%);background-size:240% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 2px 10px rgba(0,0,0,.55));}',
    '.gal-ov .gal-space{position:relative;flex:none;margin-top:10px;}',
    '.gal-ov .gal-nail{position:absolute;left:50%;top:-3px;width:11px;height:11px;margin-left:-5.5px;border-radius:50%;z-index:3;background:radial-gradient(circle at 35% 32%,#fff2c4 0 14%,#c9a14a 40%,#5a3e10 100%);box-shadow:0 2px 3px rgba(0,0,0,.6);opacity:0;}',
    '.gal-ov .gal-hang{position:relative;transform-origin:50% 0;will-change:transform;}',
    '.gal-ov .gal-wire{display:block;width:100%;height:28px;overflow:visible;opacity:0;}',
    '.gal-ov .gal-piece{position:relative;}',
    '.gal-ov .gal-art{position:absolute;z-index:0;background:#fff;overflow:hidden;will-change:transform;}',
    '.gal-ov .gal-art img{display:block;width:100%;height:100%;object-fit:contain;-webkit-user-drag:none;}',
    '.gal-ov .gal-shell{position:relative;z-index:1;will-change:transform;}',
    /* ── the gilded frame: four mitred moulding sticks ── */
    '.gal-frame{position:relative;--t:22px;padding:var(--t);}',
    '.gal-frame .gal-st{position:absolute;pointer-events:none;background-repeat:no-repeat;}',
    '.gal-frame .gal-st-t{left:0;top:0;width:100%;height:var(--t);clip-path:polygon(0 0,100% 0,calc(100% - var(--t)) 100%,var(--t) 100%);background-image:linear-gradient(rgba(255,250,225,.16),rgba(255,250,225,.16)),' + BEAD + ',linear-gradient(to bottom,' + PROFILE + ');background-size:100% 100%,calc(var(--t)*.31) calc(var(--t)*.31),100% 100%;background-repeat:no-repeat,repeat-x,no-repeat;background-position:0 0,0 46%,0 0;}',
    '.gal-frame .gal-st-b{left:0;bottom:0;width:100%;height:var(--t);clip-path:polygon(var(--t) 0,calc(100% - var(--t)) 0,100% 100%,0 100%);background-image:linear-gradient(rgba(20,8,0,.30),rgba(20,8,0,.30)),' + BEAD + ',linear-gradient(to top,' + PROFILE + ');background-size:100% 100%,calc(var(--t)*.31) calc(var(--t)*.31),100% 100%;background-repeat:no-repeat,repeat-x,no-repeat;background-position:0 0,0 54%,0 0;}',
    '.gal-frame .gal-st-l{left:0;top:0;width:var(--t);height:100%;clip-path:polygon(0 0,100% var(--t),100% calc(100% - var(--t)),0 100%);background-image:linear-gradient(rgba(255,250,225,.06),rgba(255,250,225,.06)),' + BEAD + ',linear-gradient(to right,' + PROFILE + ');background-size:100% 100%,calc(var(--t)*.31) calc(var(--t)*.31),100% 100%;background-repeat:no-repeat,repeat-y,no-repeat;background-position:0 0,46% 0,0 0;}',
    '.gal-frame .gal-st-r{right:0;top:0;width:var(--t);height:100%;clip-path:polygon(0 var(--t),100% 0,100% 100%,0 calc(100% - var(--t)));background-image:linear-gradient(rgba(20,8,0,.16),rgba(20,8,0,.16)),' + BEAD + ',linear-gradient(to left,' + PROFILE + ');background-size:100% 100%,calc(var(--t)*.31) calc(var(--t)*.31),100% 100%;background-repeat:no-repeat,repeat-y,no-repeat;background-position:0 0,54% 0,0 0;}',
    '.gal-frame .gal-orn{position:absolute;width:calc(var(--t)*2.1);height:calc(var(--t)*2.1);pointer-events:none;filter:drop-shadow(0 1px 1px rgba(40,20,0,.55));}',
    '.gal-frame .gal-orn svg{display:block;width:100%;height:100%;}',
    '.gal-frame .gal-o-tl{left:calc(var(--t)*-.18);top:calc(var(--t)*-.18);}',
    '.gal-frame .gal-o-tr{right:calc(var(--t)*-.18);top:calc(var(--t)*-.18);transform:scaleX(-1);}',
    '.gal-frame .gal-o-bl{left:calc(var(--t)*-.18);bottom:calc(var(--t)*-.18);transform:scaleY(-1);}',
    '.gal-frame .gal-o-br{right:calc(var(--t)*-.18);bottom:calc(var(--t)*-.18);transform:scale(-1,-1);}',
    '.gal-frame .gal-liner{position:relative;border:5px solid #E7DDC6;box-shadow:inset 0 0 0 1px rgba(120,90,40,.35),0 0 0 1px rgba(40,25,5,.6);}',
    '.gal-frame .gal-mat{position:relative;overflow:hidden;isolation:isolate;padding:14px 14px 13px;}',
    '.gal-frame .gal-mat::after{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;box-shadow:inset 0 3px 6px rgba(60,40,10,.28),inset 0 -1px 2px rgba(60,40,10,.12);}',
    '.gal-frame .gal-win{position:relative;z-index:0;margin:0 auto;box-shadow:inset 0 0 0 1px rgba(255,255,255,.9),inset 1px 2px 0 1px rgba(150,130,100,.35),inset 0 0 6px rgba(0,0,0,.10),0 0 0 2px #F3EEE2,0 0 0 2000px #FBF8F0;}',
    '.gal-ov .gal-cap{position:relative;z-index:1;margin:13px 2px 0;text-align:center;font-style:italic;color:#221B16;line-height:1.32;text-wrap:balance;overflow-wrap:anywhere;hyphens:auto;opacity:0;}',
    '.gal-ov .gal-shine{position:absolute;inset:0;z-index:3;pointer-events:none;opacity:0;background:linear-gradient(105deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.55) 48%,rgba(255,240,200,.0) 60%);transform:translateX(-100%);}',
    '.gal-ov .gal-shell-shadow{position:absolute;inset:0;z-index:0;pointer-events:none;box-shadow:0 22px 36px -8px rgba(0,0,0,.7),0 6px 12px rgba(0,0,0,.45);}',
    /* ── rosette ── */
    '.gal-ov .gal-ros{position:absolute;right:-16px;bottom:-26px;width:74px;height:96px;z-index:4;opacity:0;transform-origin:50% 38%;filter:drop-shadow(0 4px 5px rgba(0,0,0,.5));}',
    '.gal-ov .gal-ros svg{display:block;width:100%;height:100%;}',
    /* ── plaque ── */
    '.gal-ov .gal-plaque{position:relative;flex:none;margin-top:20px;padding:11px 18px 10px;text-align:center;color:#2E2108;opacity:0;border-radius:3px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,rgba(0,0,0,0) 1px 3px),linear-gradient(180deg,#F2DC98 0%,#D7B25E 38%,#BF953F 62%,#D9BA6C 100%);box-shadow:0 10px 20px rgba(0,0,0,.55),0 2px 3px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,250,220,.75),inset 0 -1px 0 rgba(70,45,5,.45),inset 0 0 0 1px rgba(110,75,15,.35);text-shadow:0 1px 0 rgba(255,244,205,.55);}',
    '.gal-ov .gal-scr{position:absolute;width:6px;height:6px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c2,#a77d2c 60%,#5c3f0c);box-shadow:inset 0 0 0 .5px rgba(60,40,5,.6);}',
    '.gal-ov .gal-scr::after{content:"";position:absolute;left:1px;right:1px;top:2.5px;height:1px;background:rgba(60,40,5,.7);transform:rotate(35deg);}',
    '.gal-ov .gal-p-who{margin:0;font-weight:700;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;text-wrap:balance;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;}',
    '.gal-ov .gal-p-who span{white-space:nowrap;font-weight:400;letter-spacing:.04em;text-transform:none;font-size:12.5px;}',
    '.gal-ov .gal-p-cap{margin:4px 0 0;font-style:italic;font-size:13px;line-height:1.3;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;overflow-wrap:anywhere;}',
    '.gal-ov .gal-p-by{margin:4px 0 0;font-size:11.5px;line-height:1.3;color:#4A3710;overflow-wrap:anywhere;}',
    '.gal-ov .gal-p-rule{width:44px;height:1px;margin:7px auto 5px;background:rgba(70,45,5,.45);box-shadow:0 1px 0 rgba(255,244,205,.5);}',
    '.gal-ov .gal-p-now{margin:0;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#4A3710;}',
    /* ── buttons ── */
    '.gal-ov .gal-btns{flex:none;display:flex;gap:10px;width:100%;max-width:340px;margin-top:auto;padding-top:14px;opacity:0;visibility:hidden;}',
    '.gal-ov .gal-btn{flex:1;min-height:46px;padding:10px 12px;border-radius:999px;font-family:' + SANS + ';font-weight:800;font-size:15px;cursor:pointer;-webkit-appearance:none;appearance:none;transition:transform .12s;}',
    '.gal-ov .gal-btn:active{transform:scale(.97);}',
    '.gal-ov .gal-print{border:1px solid #F7E3A0;color:#2A1C04;background:linear-gradient(180deg,#F8E3A1,#D9AE4E 55%,#C4943A);box-shadow:0 6px 16px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.6);}',
    '.gal-ov .gal-back{border:1px solid rgba(243,230,200,.45);color:#F3E6C8;background:rgba(20,6,6,.25);}',
    '.gal-ov .gal-btns.gal-one .gal-back{flex:0 1 220px;margin:0 auto;}',
    '.gal-ov .gal-fx{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5;}',
    '.gal-ov .gal-p{position:absolute;left:0;top:0;border-radius:50%;will-change:transform,opacity;}',
    '.gal-ov .gal-leaf{position:absolute;left:0;top:0;will-change:transform,opacity;background:linear-gradient(135deg,#fff3c0,#e1b955 40%,#a8761e 70%,#f4d88a);clip-path:polygon(8% 20%,45% 0,92% 14%,100% 60%,70% 100%,20% 88%,0 55%);}',
    /* ── mini frames + archive ── */
    '.gal-mini{position:relative;width:100%;max-width:156px;margin:0 auto;padding-top:14px;font-family:' + SERIF + ';text-align:center;}',
    '.gal-mini .gal-mwire{position:absolute;left:0;right:0;top:0;height:16px;width:100%;overflow:visible;}',
    '.gal-mini .gal-mnail{position:absolute;left:50%;top:-2px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c4,#b8902f 50%,#4a3208);box-shadow:0 1px 2px rgba(0,0,0,.6);}',
    '.gal-mini .gal-frame{--t:10px;box-shadow:0 8px 14px -4px rgba(0,0,0,.65),0 2px 4px rgba(0,0,0,.4);}',
    '.gal-mini .gal-liner{border-width:3px;}',
    '.gal-mini .gal-mat{padding:7px;background:#FBF8F0;}',
    '.gal-mini .gal-mimg{display:block;width:100%;height:96px;object-fit:contain;background:#fff;box-shadow:0 0 0 1px rgba(150,130,100,.35);}',
    '.gal-mini .gal-mlabel{margin-top:10px;padding:7px 8px 6px;background:#FBF8F0;border-radius:2px;box-shadow:0 2px 5px rgba(0,0,0,.4);color:#221B16;}',
    '.gal-mini .gal-mcap{margin:0;font-style:italic;font-size:12px;line-height:1.3;overflow-wrap:break-word;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:5;overflow:hidden;}',
    '.gal-mini .gal-mwho{display:block;margin:5px 0 0;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#6B5A43;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.gal-mini .gal-mwho b{font-weight:700;color:#3a2c1c;}\n.gal-mini .gal-mmo{display:block;margin:1px 0 0;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#7d6c55;}',
    '.gal-mini .gal-mfr{display:inline-block;margin-top:4px;font-size:9.5px;letter-spacing:.06em;color:#8E1B22;font-style:italic;}',
    '.gal-arch{position:relative;overflow:hidden;border-radius:18px;padding:22px 14px 22px;font-family:' + SERIF + ';color:#F3E6C8;background-color:#4A1A1E;background-image:radial-gradient(ellipse 90% 40% at 50% 0%,rgba(255,214,150,.22),rgba(255,214,150,0) 70%),radial-gradient(ellipse 120% 100% at 50% 30%,rgba(0,0,0,0) 50%,rgba(12,3,4,.6) 100%);box-shadow:inset 0 0 0 1px rgba(0,0,0,.4);}',
    '.gal-arch .gal-plaster{position:absolute;inset:0;opacity:.5;mix-blend-mode:overlay;pointer-events:none;background-size:260px 260px;}',
    '.gal-arch .gal-ahead{position:relative;text-align:center;margin-bottom:18px;}',
    '.gal-arch .gal-atitle{margin:0;font-weight:400;font-style:italic;font-size:31px;line-height:1.05;color:#F6E7C4;}',
    '.gal-arch .gal-asub{margin:6px 0 0;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:rgba(243,230,200,.72);}',
    '.gal-arch .gal-arule{width:54px;height:1px;margin:10px auto 0;background:linear-gradient(90deg,rgba(230,190,110,0),#d9b25e,rgba(230,190,110,0));}',
    '.gal-arch .gal-grid{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:22px 14px;align-items:start;}',
    '.gal-arch .gal-empty{position:relative;text-align:center;padding:4px 10px 6px;}',
    '.gal-arch .gal-eframe{width:116px;height:136px;margin:4px auto 18px;border:2px dashed rgba(230,195,120,.5);border-radius:3px;position:relative;}',
    '.gal-arch .gal-eframe::before{content:"";position:absolute;left:50%;top:-18px;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c4,#b8902f 50%,#4a3208);}',
    '.gal-arch .gal-etext{margin:0 auto;max-width:280px;font-style:italic;font-size:15px;line-height:1.45;color:rgba(243,230,200,.9);}',
    /* ── tap a thumbnail: it zooms to a big, readable framed card (zoom / zoomAt) ── */
    'button.gal-mini{display:block;border:0;background:none;color:inherit;cursor:zoom-in;-webkit-appearance:none;appearance:none;font:inherit;font-family:' + SERIF + ';-webkit-tap-highlight-color:transparent;transition:transform .14s;}',
    'button.gal-mini:active{transform:scale(.96);}',
    'button.gal-mini:focus-visible{outline:2px solid #E9C46A;outline-offset:4px;border-radius:4px;}',
    '.gal-mini .gal-frame,.gal-mini .gal-liner,.gal-mini .gal-mat,.gal-mini .gal-mlabel{display:block;}',
    '.gal-zm{z-index:950;touch-action:none;cursor:zoom-out;}',
    '.gal-zm .gal-zstage{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(58px + env(safe-area-inset-top,0px)) 16px calc(18px + env(safe-area-inset-bottom,0px));}',
    '.gal-zm .gal-zpiece{position:relative;flex:none;will-change:transform;transform-origin:50% 50%;}',
    '.gal-zm .gal-zshadow{position:absolute;inset:0;pointer-events:none;box-shadow:0 26px 40px -10px rgba(0,0,0,.75),0 6px 14px rgba(0,0,0,.45);}',
    '.gal-zm .gal-mat{padding:12px 12px 14px;background:#FBF8F0;}',
    '.gal-zm .gal-zimg{display:block;margin:0 auto;max-width:100%;width:auto;height:auto;max-height:calc(100dvh - 380px);min-height:120px;object-fit:contain;background:#fff;box-shadow:0 0 0 1px rgba(150,130,100,.35);}',
    '.gal-zm .gal-zcap{margin:12px 4px 0;text-align:center;font-style:italic;color:#221B16;line-height:1.3;text-wrap:balance;overflow-wrap:anywhere;hyphens:auto;}',
    '.gal-zm .gal-zplaque{position:relative;flex:none;margin-top:16px;padding:9px 18px 8px;max-width:calc(100% - 30px);text-align:center;color:#2E2108;border-radius:3px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,rgba(0,0,0,0) 1px 3px),linear-gradient(180deg,#F2DC98 0%,#D7B25E 38%,#BF953F 62%,#D9BA6C 100%);box-shadow:0 10px 20px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,250,220,.75),inset 0 -1px 0 rgba(70,45,5,.45);text-shadow:0 1px 0 rgba(255,244,205,.55);}',
    '.gal-zm .gal-zwho{margin:0;font-weight:700;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;overflow-wrap:anywhere;}',
    '.gal-zm .gal-zwho span{font-weight:400;letter-spacing:.04em;text-transform:none;}',
    '.gal-zm .gal-zby{margin:3px 0 0;font-size:11.5px;line-height:1.3;color:#4A3710;overflow-wrap:anywhere;}',
    '.gal-zm .gal-zbest{display:inline-block;margin-top:5px;padding:1px 8px;border-radius:2px;background:#8E1B22;color:#F6E7C4;font-size:10px;letter-spacing:.14em;text-transform:uppercase;text-shadow:none;}',
    '.gal-zm .gal-zx{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));right:12px;z-index:3;width:44px;height:44px;border-radius:50%;border:1px solid rgba(243,230,200,.4);background:rgba(20,6,6,.35);color:#F3E6C8;font:400 20px/1 ' + SANS + ';cursor:pointer;}',
    '.gal-zm .gal-zcount{position:absolute;top:calc(24px + env(safe-area-inset-top,0px));left:0;right:0;margin:0;text-align:center;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;color:rgba(243,230,200,.66);pointer-events:none;}',
    '.gal-zm .gal-znav{position:absolute;top:50%;z-index:3;width:40px;height:64px;margin-top:-32px;border:0;background:none;color:rgba(243,230,200,.75);font:400 34px/1 ' + SERIF + ';cursor:pointer;}',
    '.gal-zm .gal-zprev{left:0;}.gal-zm .gal-znext{right:0;}',
    '.gal-zm .gal-znav[disabled]{opacity:0;pointer-events:none;}',
    '.gal-zm .gal-zhint{flex:none;margin:12px 0 0;font-style:italic;font-size:12.5px;color:rgba(243,230,200,.6);}',
    '@media (prefers-reduced-motion: reduce){.gal-ov .gal-btn,button.gal-mini{transition:none;}}'
  ].join('\n');

  /* Plaster: fractal noise as an inline SVG, used as a background tile */
  var PLASTER = "url(\"data:image/svg+xml;utf8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .42  0 0 0 0 .36  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
  ) + "\")";

  function injectCss() {
    try {
      if (document.getElementById('gal-style')) return;
      var s = document.createElement('style');
      s.id = 'gal-style';
      s.textContent = CSS + '\n.gal-ov .gal-plaster,.gal-arch .gal-plaster{background-image:' + PLASTER + ';}';
      (document.head || document.documentElement).appendChild(s);
    } catch (e) {}
    try {
      var links = document.querySelectorAll('link[rel="stylesheet"]'), have = false;
      for (var i = 0; i < links.length; i++) if (/Libre\+Caslon\+Text/.test(links[i].href || '')) have = true;
      if (!have) {
        var l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = FONT_HREF; l.setAttribute('data-gal-font', '1');
        (document.head || document.documentElement).appendChild(l);
      }
    } catch (e) {}
  }

  /* ── text helpers ── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function smarten(s) {
    s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    s = s.replace(/^["“”„]+\s*/, '').replace(/\s*["“”]+$/, '');
    s = s.replace(/(^|[\s(\[—-])'/g, '$1‘').replace(/'/g, '’');
    s = s.replace(/(^|[\s(\[—-])"/g, '$1“').replace(/"/g, '”');
    return s.replace(/\.\.\./g, '…').replace(/ -- /g, ' — ');
  }
  function imgUrl(src) {
    src = String(src || '');
    if (!src) return '';
    if (/^(https?:|data:|blob:)/i.test(src) || src.indexOf('/') >= 0) return src;
    return '/images/' + src;
  }
  function nameList(arr) {
    var a = (Array.isArray(arr) ? arr : []).map(function (x) { return String(x == null ? '' : x).trim(); }).filter(Boolean);
    if (!a.length) return '';
    if (a.length > 5) { var more = a.length - 4; a = a.slice(0, 4); return a.join(', ') + ' and ' + more + ' others'; }
    if (a.length === 1) return a[0];
    return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  }
  function shortMonth(m) {
    m = String(m || '');
    var x = m.match(/^([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
    return x ? x[1] + ' ' + x[2] : m;
  }

  /* ── timers & animation helpers ── */
  var gen = 0, timers = [];
  function later(ms, fn) {
    var g = gen;
    timers.push(setTimeout(function () { if (g !== gen) return; try { fn(); } catch (e) {} }, Math.max(0, ms)));
  }
  function clearTimers() { timers.forEach(function (t) { clearTimeout(t); }); timers = []; }
  function anim(el, frames, opts) {
    try {
      if (!el || typeof el.animate !== 'function') {
        var last = frames[frames.length - 1];
        if (el && last) for (var k in last) if (k !== 'offset' && k !== 'easing') el.style[k] = last[k];
        return null;
      }
      var o = {}; for (var k2 in opts) o[k2] = opts[k2];
      if (!o.fill) o.fill = 'both';
      return el.animate(frames, o);
    } catch (e) { return null; }
  }
  function el(tag, cls, parent, css, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) e.style.cssText = css;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function reduced() { if (window.ccReducedMotion) return window.ccReducedMotion(); try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }

  /* ── sound & haptics (host globals, guarded) ── */
  function soundOn() { try { return typeof window.soundEnabled === 'function' ? !!window.soundEnabled() : false; } catch (e) { return false; } }
  function T(f, d, delay, type, vol, glide) {
    try { if (typeof window.tone === 'function') window.tone(f, d, delay || 0, type || 'sine', vol == null ? 0.06 : vol, glide || null); } catch (e) {}
  }
  function N(d, delay, vol, ff, type) {
    try { if (typeof window.noise === 'function') window.noise(d, delay || 0, vol == null ? 0.1 : vol, ff || 2500, type || 'bandpass'); } catch (e) {}
  }
  function vib(p) {
    try { if (typeof window.buzz === 'function') { window.buzz(p); return; } } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {}
  }
  // The framing moment is a big moment: only the table's speaker phone plays it (see moments.js)
  function snd(fn) { if (!soundOn() || !(!window.ccBigSound || window.ccBigSound())) return; try { fn(); } catch (e) {} }

  var S = {
    hush: function () {                       // the room goes quiet: a shush, then room tone
      N(0.9, 0, 0.05, 5200, 'highpass');
      N(1.6, 120, 0.06, 240, 'lowpass');
      T(55, 1.9, 60, 'sine', 0.05); T(82.4, 1.9, 60, 'sine', 0.025);
    },
    lamp: function () {                       // a picture light clicks on
      N(0.018, 0, 0.3, 3200, 'highpass'); T(2400, 0.03, 0, 'square', 0.015);
      T(120, 0.5, 20, 'sine', 0.02); N(0.25, 30, 0.02, 1800, 'bandpass');
    },
    swish: function () { N(0.32, 0, 0.12, 1700, 'bandpass'); T(520, 0.28, 0, 'sine', 0.03, 170); },
    drop: function () { N(0.3, 0, 0.12, 700, 'bandpass'); T(260, 0.3, 0, 'sine', 0.035, 80); },
    impact: function (big) {                  // thud + gilt clang + rattle
      N(0.55, 0, big ? 0.6 : 0.5, 320, 'lowpass');
      T(92, 0.6, 0, 'sine', big ? 0.5 : 0.42, 36);
      T(46, 0.7, 0, 'sine', 0.25);
      N(0.09, 0, 0.22, 4200, 'highpass');
      [[587, 1.3, 0.05], [1381, 1.0, 0.035], [2213, 0.8, 0.025], [3167, 0.6, 0.018], [4049, 0.45, 0.012]].forEach(function (p) { T(p[0], p[1], 6, 'triangle', p[2]); T(p[0] * 1.006, p[1] * 0.8, 6, 'sine', p[2] * 0.6); });
      N(0.05, 130, 0.08, 2600, 'bandpass'); T(1900, 0.18, 130, 'sine', 0.015);
      N(0.04, 210, 0.05, 2600, 'bandpass');
    },
    ink: function () { [784, 988, 1175, 1568, 1976].forEach(function (f, i) { T(f, 0.6, i * 55, 'sine', 0.022); }); N(0.4, 0, 0.025, 7000, 'highpass'); },
    lift: function () { N(0.22, 0, 0.04, 1200, 'bandpass'); T(1500, 0.08, 120, 'sine', 0.015); },
    creak: function (v) { T(170, 0.26, 0, 'sawtooth', 0.012 * v, 235); T(340, 0.2, 30, 'triangle', 0.012 * v, 410); N(0.2, 0, 0.03 * v, 1000, 'bandpass'); },
    plaque: function () { N(0.12, 0, 0.05, 1400, 'bandpass'); T(2637, 0.3, 140, 'sine', 0.035); T(3951, 0.18, 140, 'sine', 0.018); N(0.025, 140, 0.08, 5200, 'highpass'); },
    rosette: function () { N(0.08, 0, 0.18, 600, 'lowpass'); T(150, 0.16, 0, 'sine', 0.16, 70); },
    chord: function (mine) {                  // a warm swell under the applause
      var f = mine ? [261.6, 329.6, 392, 493.9, 587.3] : [261.6, 329.6, 392, 523.3];
      f.forEach(function (x, i) { T(x, 2.2, i * 30, 'sine', 0.026); T(x * 2, 1.6, 40 + i * 30, 'sine', 0.008); });
      T(1568, 1.2, 260, 'sine', 0.018); if (mine) T(2093, 1.4, 420, 'sine', 0.014);
    }
  };
  // Gallery applause: a couple of polite claps, then the room joins in, then it tails off
  function applause(t0, mine) {
    var claps = [], i, t;
    [0, 260, 520, 690, 900].forEach(function (x) { claps.push([t0 + x + rnd(-20, 20), 0.55]); });
    for (t = t0 + 900; t < t0 + 2700; ) {
      var p = (t - t0 - 900) / 1800, rate = 14 + 52 * Math.min(1, p * 1.4);
      claps.push([t, 0.6 + 0.4 * Math.min(1, p * 1.6)]);
      t += 1000 / rate * rnd(0.5, 1.5);
    }
    for (t = t0 + 2700; t < t0 + 4100; ) {
      var q = (t - t0 - 2700) / 1400;
      claps.push([t, 1 - q * 0.85]);
      t += 1000 / (60 - 50 * q) * rnd(0.6, 1.6);
    }
    var gain = mine ? 1.15 : 1;
    // schedule in 200ms chunks so close() can cut them off
    var chunks = {};
    claps.forEach(function (c) { var k = Math.floor(c[0] / 200); (chunks[k] = chunks[k] || []).push(c); });
    Object.keys(chunks).forEach(function (k) {
      var base = k * 200;
      later(base, function () {
        snd(function () {
          chunks[k].forEach(function (c) {
            var d = c[0] - base, v = 0.11 * c[1] * gain;
            N(rnd(0.022, 0.045), d, v * rnd(0.6, 1), rnd(900, 2600), 'bandpass');
            N(0.02, d, v * 0.35, 5000, 'highpass');
          });
        });
      });
    });
  }

  /* ── frame parts ── */
  function ornament() {
    // a gilt corner cartouche: shell fan, boss, two volutes running along the sides
    return '<svg viewBox="0 0 48 48" aria-hidden="true">' +
      '<path d="M4 4 L30 6 C28 11 25 14 19 15 C17 21 14 25 6 30 Z" fill="#7a5512"/>' +
      '<path d="M3 3 L29 5 C27 10 24 13 18 14 C16 20 13 24 5 29 Z" fill="#E2BE63"/>' +
      '<path d="M3 3 L29 5 C27 8 25 10 21 11 M3 3 L5 29 C8 27 10 25 11 21" fill="none" stroke="#FFF1B8" stroke-width="1.2" stroke-linecap="round"/>' +
      '<g stroke="#8a6216" stroke-width="1" fill="none" stroke-linecap="round"><path d="M6 6 L25 8"/><path d="M6 6 L21 12"/><path d="M6 6 L16 16"/><path d="M6 6 L12 21"/><path d="M6 6 L8 25"/></g>' +
      '<path d="M29 5 C35 3 40 6 39 11 C38 15 33 15 33 12 C33 10 36 10 36 11.5" fill="none" stroke="#5c3e0b" stroke-width="3.2" stroke-linecap="round"/>' +
      '<path d="M29 5 C35 3 40 6 39 11 C38 15 33 15 33 12 C33 10 36 10 36 11.5" fill="none" stroke="#F0D27C" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M5 29 C3 35 6 40 11 39 C15 38 15 33 12 33 C10 33 10 36 11.5 36" fill="none" stroke="#5c3e0b" stroke-width="3.2" stroke-linecap="round"/>' +
      '<path d="M5 29 C3 35 6 40 11 39 C15 38 15 33 12 33 C10 33 10 36 11.5 36" fill="none" stroke="#F0D27C" stroke-width="1.8" stroke-linecap="round"/>' +
      '<circle cx="9" cy="9" r="5.2" fill="#6e4d10"/><circle cx="8.6" cy="8.6" r="4.4" fill="#D9B25A"/><circle cx="7.6" cy="7.4" r="1.7" fill="#FFF6CF"/>' +
      '</svg>';
  }
  function sticksHtml(withOrn) {
    var h = '<i class="gal-st gal-st-t"></i><i class="gal-st gal-st-b"></i><i class="gal-st gal-st-l"></i><i class="gal-st gal-st-r"></i>';
    if (withOrn) { var o = ornament(); h += '<i class="gal-orn gal-o-tl">' + o + '</i><i class="gal-orn gal-o-tr">' + o + '</i><i class="gal-orn gal-o-bl">' + o + '</i><i class="gal-orn gal-o-br">' + o + '</i>'; }
    return h;
  }
  function rosette(n) {
    var pts = [], i, R = 30, r = 26.5, cx = 37, cy = 36, N2 = 36;
    for (i = 0; i < N2 * 2; i++) { var a = Math.PI * i / N2, rr = i % 2 ? r : R; pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); }
    var big = String(n).length > 2 ? 15 : 22;
    return '<svg viewBox="0 0 74 96" aria-hidden="true">' +
      '<path d="M22 52 L12 92 L22 84 L30 94 L36 58 Z" fill="#6E1218"/><path d="M52 52 L62 92 L52 84 L44 94 L38 58 Z" fill="#7E161D"/>' +
      '<path d="M22 52 L14 86 M52 52 L60 86" stroke="#D9B25A" stroke-width="1" opacity=".7"/>' +
      '<polygon points="' + pts.join(' ') + '" fill="#8E1B22" stroke="#5A0E13" stroke-width="1"/>' +
      '<circle cx="37" cy="36" r="22.5" fill="none" stroke="#B83039" stroke-width="2.4" stroke-dasharray="1.6 2.2"/>' +
      '<circle cx="37" cy="36" r="18" fill="#C99A3E"/><circle cx="37" cy="36" r="16.6" fill="#F0D687"/><circle cx="37" cy="36" r="16.6" fill="none" stroke="#9c7426" stroke-width=".8"/>' +
      '<text x="37" y="' + (big > 20 ? 40 : 38.5) + '" text-anchor="middle" font-family="Libre Caslon Text,Georgia,serif" font-weight="700" font-size="' + big + '" fill="#4a1a10">' + esc(n) + '</text>' +
      '<text x="37" y="47.4" text-anchor="middle" font-family="Libre Caslon Text,Georgia,serif" font-size="4.6" letter-spacing=".6" fill="#4a1a10">' + (n === 1 ? 'FRAME' : 'FRAMES') + '</text>' +
      '</svg>';
  }

  /* ── the moment ── */
  var cur = null;

  function teardown(now) {
    gen++; clearTimers();
    var c = cur; cur = null;
    if (!c) return;
    try { document.removeEventListener('keydown', c.onKey, true); } catch (e) {}
    try {
      if (now) { c.root.remove(); return; }
      var a = anim(c.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in' });
      var rm = function () { try { c.root.remove(); } catch (e) {} };
      if (a) { a.onfinish = rm; setTimeout(rm, 600); } else rm();
    } catch (e) { try { c.root.remove(); } catch (e2) {} }
  }

  function close() { try { teardown(false); } catch (e) {} }

  function hang(opts) {
    try {
      opts = opts || {};
      injectCss();
      teardown(true);
      var myGen = gen;
      var isReal = !!opts.isReal;
      var mine = !!opts.mine && !isReal;
      var caption = smarten(opts.caption) || '…';
      var author = isReal ? null : (String(opts.author || '').trim() || 'Anonymous');
      var month = String(opts.month || '').trim();
      var framers = nameList(opts.framers);
      var frames = Math.max(1, parseInt(opts.frames, 10) || (Array.isArray(opts.framers) ? opts.framers.length : 0) || 1);
      var onPrint = typeof opts.onPrint === 'function' ? opts.onPrint : null;
      var src = imgUrl(opts.image);
      var RM = reduced();
      var t0 = Date.now();

      var VW = window.innerWidth || 390, VH = window.innerHeight || 844;
      var W = Math.round(Math.min(VW - 54, 320));
      var TH = W >= 290 ? 22 : 18;                 // moulding thickness
      var inner = W - 2 * TH - 10 - 28;            // window max width (liner 5x2, mat 14x2)
      var len = caption.length;
      var capFs = len <= 60 ? 18.5 : len <= 110 ? 16.5 : len <= 150 ? 15 : 14;

      var root = el('div', 'gal-ov' + (mine ? ' gal-mine' : '') + (RM ? ' gal-reduce' : ''), null);
      root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
      root.setAttribute('aria-label', 'Framed: ' + caption);

      var title = mine ? 'You’ve been framed.' : isReal ? 'The original, framed.' : 'Framed.';
      var who = isReal ? 'The original caption' : esc(author);
      var plaqueBy = framers ? 'Framed by ' + esc(framers) : 'Framed by the table';
      var now = opts.now ? String(opts.now) : isReal ? 'The classics hold up.' : mine ? 'You beat the real one. Hanging in The Gallery for good.' : 'Better than the real one. Now hanging in The Gallery.';   // #39: the server picks the line

      root.innerHTML =
        '<div class="gal-wall"></div><div class="gal-plaster"></div><div class="gal-floor"></div>' +
        '<div class="gal-pool"></div><div class="gal-beam"></div><div class="gal-lamp"></div>' +
        '<div class="gal-stage">' +
          '<div class="gal-head"><p class="gal-eyebrow">' + (mine ? 'You beat the real caption.' : isReal ? 'The table voted for the real one.' : 'Better than the real caption.') + '</p><h2 class="gal-title">' + esc(title) + '</h2></div>' +
          '<div class="gal-space" style="width:' + W + 'px">' +
            '<div class="gal-nail"></div>' +
            '<div class="gal-hang">' +
              '<svg class="gal-wire" viewBox="0 0 ' + W + ' 28" preserveAspectRatio="none" aria-hidden="true"><path d="M' + Math.round(W * 0.2) + ' 29 L' + (W / 2) + ' 1 L' + Math.round(W * 0.8) + ' 29" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="2.4" transform="translate(1.5 2)"/><path d="M' + Math.round(W * 0.2) + ' 29 L' + (W / 2) + ' 1 L' + Math.round(W * 0.8) + ' 29" fill="none" stroke="#B9AE9C" stroke-width="1.3"/></svg>' +
              '<div class="gal-piece">' +
                '<div class="gal-art">' + (src ? '<img alt="" draggable="false">' : '') + '</div>' +
                '<div class="gal-shell"><div class="gal-shell-shadow"></div>' +
                  '<div class="gal-frame" style="--t:' + TH + 'px">' + sticksHtml(true) +
                    '<div class="gal-liner"><div class="gal-mat"><div class="gal-win"></div>' +
                      '<p class="gal-cap" style="font-size:' + capFs + 'px">“' + esc(caption) + '”</p>' +
                      '<div class="gal-shine"></div>' +
                    '</div></div>' +
                  '</div>' +
                '</div>' +
                '<div class="gal-ros">' + rosette(frames) + '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="gal-plaque" style="width:' + Math.round(W - 26) + 'px">' +
            '<i class="gal-scr" style="left:6px;top:6px"></i><i class="gal-scr" style="right:6px;top:6px"></i><i class="gal-scr" style="left:6px;bottom:6px"></i><i class="gal-scr" style="right:6px;bottom:6px"></i>' +
            '<p class="gal-p-who">' + who + (month ? ', <span>' + esc(month) + '</span>' : '') + '</p>' +
            '<p class="gal-p-cap">“' + esc(caption) + '”</p>' +
            '<p class="gal-p-by">' + plaqueBy + '&nbsp;·&nbsp;' + frames + (frames === 1 ? '&nbsp;frame' : '&nbsp;frames') + '</p>' +
            '<div class="gal-p-rule"></div><p class="gal-p-now">' + esc(now) + '</p>' +
          '</div>' +
          '<div class="gal-btns' + (onPrint ? '' : ' gal-one') + '">' +
            (onPrint ? '<button type="button" class="gal-btn gal-print">Get the print</button>' : '') +
            '<button type="button" class="gal-btn gal-back">Back to the table</button>' +
          '</div>' +
        '</div>' +
        '<div class="gal-fx"></div>';

      (document.body || document.documentElement).appendChild(root);

      var q = function (s) { return root.querySelector(s); };
      var stage = q('.gal-stage'), hangEl = q('.gal-hang'), piece = q('.gal-piece'), art = q('.gal-art'), img = q('.gal-art img'),
          shell = q('.gal-shell'), win = q('.gal-win'), cap = q('.gal-cap'), wire = q('.gal-wire'), nail = q('.gal-nail'),
          plaque = q('.gal-plaque'), btns = q('.gal-btns'), ros = q('.gal-ros'), titleEl = q('.gal-title'),
          eyebrow = q('.gal-eyebrow'), fx = q('.gal-fx'), shine = q('.gal-shine');

      var settled = false;
      var c = { root: root, onKey: null };
      cur = c;

      /* buttons + dismissal */
      try {
        var pb = q('.gal-print');
        if (pb) pb.addEventListener('click', function (e) { try { e.stopPropagation(); } catch (x) {} try { onPrint(); } catch (x) { try { console.warn('[gallery] onPrint failed', x); } catch (y) {} } });
        q('.gal-back').addEventListener('click', function (e) { try { e.stopPropagation(); } catch (x) {} close(); });
        root.addEventListener('click', function (e) {
          if (!settled) return;
          try { if (e.target.closest('.gal-piece,.gal-plaque,.gal-btns')) return; } catch (x) {}
          close();
        });
        c.onKey = function (e) { if (e.key === 'Escape' && cur === c) close(); };
        document.addEventListener('keydown', c.onKey, true);
      } catch (e) {}

      /* size the art window to the cartoon and the phone */
      var aspect = 1;
      function layout() {
        var maxH = Math.min(inner * 1.15, VH * 0.36);
        var w = inner, h = w / aspect;
        if (h > maxH) { h = maxH; w = h * aspect; }
        var apply = function () {
          win.style.width = Math.round(w) + 'px'; win.style.height = Math.round(h) + 'px';
        };
        apply();
        // shrink the art until the whole composition fits the stage
        for (var i = 0; i < 6; i++) {
          var over = stage.scrollHeight - stage.clientHeight;
          if (over <= 0) break;
          var nh = Math.max(110, h - over - 2);
          if (nh >= h) break;
          w = w * nh / h; h = nh; apply();
        }
        var pr = piece.getBoundingClientRect(), wr = win.getBoundingClientRect();
        art.style.left = (wr.left - pr.left) + 'px'; art.style.top = (wr.top - pr.top) + 'px';
        art.style.width = wr.width + 'px'; art.style.height = wr.height + 'px';
      }

      var ready = false;
      function start() {
        if (ready || myGen !== gen) return;
        ready = true;
        try { layout(); } catch (e) {}
        run();
      }
      if (img) {
        img.onload = function () { try { if (img.naturalWidth && img.naturalHeight) aspect = img.naturalWidth / img.naturalHeight; } catch (e) {} start(); };
        img.onerror = function () { start(); };
        img.src = src;
        if (img.complete && img.naturalWidth) { aspect = img.naturalWidth / img.naturalHeight; }
      }
      // initial hidden states (before first paint)
      var hidden = [art, shell, wire, nail, plaque, ros, cap];
      hidden.forEach(function (x) { if (x) x.style.opacity = '0'; });
      if (!img || (img.complete && img.naturalWidth)) start();
      else setTimeout(function () { start(); }, RM ? 300 : 620);   // the hush covers the load

      /* ── choreography ── */
      var SETTLE = RM ? 1400 : 4400;

      function wallIn() {
        anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: RM ? 300 : 520, easing: 'ease-out' });
        anim(eyebrow, [{ opacity: 0, transform: 'translateY(6px)', letterSpacing: '.12em' }, { opacity: 1, transform: 'none', letterSpacing: '.02em' }], { duration: RM ? 300 : 900, delay: RM ? 0 : 150, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
      function lightsOn(at) {
        var beam = q('.gal-beam'), pool = q('.gal-pool'), lamp = q('.gal-lamp');
        if (RM) { [beam, pool, lamp].forEach(function (x) { anim(x, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: at }); }); return; }
        later(at, function () { snd(S.lamp); });
        anim(lamp, [{ opacity: 0 }, { opacity: 1 }], { duration: 80, delay: at });
        // the lamp catches with one soft stutter (photosensitivity: a single dip, not a rapid flicker)
        anim(beam, [{ opacity: 0 }, { opacity: 0.75, offset: 0.25 }, { opacity: 0.5, offset: 0.5 }, { opacity: 1, offset: 0.85 }, { opacity: 1 }], { duration: 520, delay: at });
        anim(pool, [{ opacity: 0 }, { opacity: 0.65, offset: 0.25 }, { opacity: 0.45, offset: 0.5 }, { opacity: 1 }], { duration: 560, delay: at });
      }

      wallIn();
      later(0, function () { snd(S.hush); });
      lightsOn(RM ? 0 : 430);

      function run() {
        if (myGen !== gen) return;
        if (RM) return runReduced();

        var lag = Math.min(650, Math.max(0, Date.now() - t0));   // the hush already ran while the cartoon loaded
        var T_ART = 700 - lag, T_DROP = 1240 - lag, DROP = 380, IMPACT = T_DROP + Math.round(DROP * 0.78);
        var T_CAP = IMPACT + 260, T_LIFT = IMPACT + 760, T_SWING = T_LIFT + 400, T_PLAQ = T_SWING + 380, T_ROS = T_PLAQ + 420;

        // 1. the cartoon arrives on its own, into the light
        later(T_ART, function () { snd(S.swish); });
        anim(art, [
          { opacity: 0, transform: 'translate(-30px,' + Math.round(VH * 0.5) + 'px) rotate(-9deg) scale(.72)' },
          { opacity: 1, offset: 0.35 },
          { opacity: 1, transform: 'translate(0,-6px) rotate(.8deg) scale(1.01)', offset: 0.8 },
          { opacity: 1, transform: 'none' }
        ], { duration: 560, delay: T_ART, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim(art, [{ boxShadow: '0 30px 40px rgba(0,0,0,.6)' }, { boxShadow: '0 4px 10px rgba(0,0,0,.35)' }], { duration: 900, delay: T_ART, easing: 'ease-out', composite: 'replace' });

        // 2. the frame slams down around it
        later(T_DROP, function () { snd(S.drop); });
        anim(shell, [
          { opacity: 1, transform: 'translateY(' + (-Math.round(VH * 0.9)) + 'px) scale(1.16) rotate(-2.5deg)', easing: 'cubic-bezier(.55,0,1,.6)' },
          { opacity: 1, transform: 'translateY(0) scale(1) rotate(0)', offset: 0.78, easing: 'cubic-bezier(.2,.8,.3,1)' },
          { opacity: 1, transform: 'translateY(5px) scale(1.012,.982)', offset: 0.86 },
          { opacity: 1, transform: 'none' }
        ], { duration: DROP, delay: T_DROP });

        later(IMPACT, function () {
          snd(function () { S.impact(mine); });
          try { if (window.ccFlash) window.ccFlash(0.6); if (window.ccBeat) window.ccBeat('frame:impact'); } catch (e) {}   // lands on a silent phone too
          vib(mine ? [150, 50, 90, 50, 220] : [90, 40, 70]);
          anim(stage, [
            { transform: 'translate(0,0)' }, { transform: 'translate(-7px,6px)' }, { transform: 'translate(6px,-4px)' },
            { transform: 'translate(-4px,3px)' }, { transform: 'translate(3px,-2px)' }, { transform: 'translate(-1px,1px)' }, { transform: 'none' }
          ], { duration: 420, easing: 'ease-out', fill: 'none' });
          anim(art, [{ transform: 'scale(.985)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out', fill: 'none' });
          anim(q('.gal-pool'), [{ opacity: 1, filter: 'brightness(1.8)' }, { opacity: 1, filter: 'brightness(1)' }], { duration: 500, easing: 'ease-out', fill: 'none' });
          dust();
          anim(titleEl, [{ opacity: 0, transform: 'scale(1.25)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 520, delay: 120, easing: 'cubic-bezier(.16,1,.3,1)' });
          anim(eyebrow, [{ opacity: 1 }, { opacity: 0.6 }], { duration: 600, delay: 120 });
          if (mine) anim(titleEl, [{ backgroundPosition: '100% 0' }, { backgroundPosition: '0% 0' }], { duration: 1600, delay: 300, easing: 'ease-in-out', composite: 'replace' });
        });

        // the new caption is set on the mat: this is the moment it becomes the cartoon's caption
        later(T_CAP, function () { snd(S.ink); });
        anim(cap, [
          { opacity: 0, filter: 'blur(7px)', transform: 'translateY(4px) scale(1.04)', letterSpacing: '.06em' },
          { opacity: 1, filter: 'blur(0)', transform: 'none', letterSpacing: '0em' }
        ], { duration: 820, delay: T_CAP, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim(shine, [{ opacity: 1, transform: 'translateX(-100%)' }, { opacity: 1, transform: 'translateX(100%)' }], { duration: 900, delay: T_CAP + 380, easing: 'ease-in-out' });

        // 3. lifted onto the nail; it swings and settles
        later(T_LIFT, function () { snd(S.lift); });
        anim(nail, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: T_LIFT - 120, easing: 'ease-out' });
        anim(wire, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: T_LIFT });
        anim(hangEl, [
          { transform: 'translateY(22px)' },
          { transform: 'translateY(-3px)', offset: 0.75 },
          { transform: 'translateY(0)' }
        ], { duration: 420, delay: T_LIFT, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' });
        var sw = [5.2, -3.6, 2.3, -1.4, 0.8, -0.4, 0.15, 0];
        var swingFrames = [{ transform: 'rotate(0deg)' }];
        sw.forEach(function (d, i) { swingFrames.push({ transform: 'rotate(' + d + 'deg)', offset: Math.min(1, (i + 1) / sw.length) }); });
        anim(hangEl, swingFrames, { duration: 1700, delay: T_SWING, easing: 'cubic-bezier(.37,0,.63,1)', fill: 'forwards', composite: 'add' });
        later(T_SWING + 160, function () { snd(function () { S.creak(1); }); });
        later(T_SWING + 520, function () { snd(function () { S.creak(0.6); }); });
        later(T_SWING + 900, function () { snd(function () { S.creak(0.3); }); });

        // the brass plaque, then the rosette, applause and gold leaf
        later(T_PLAQ, function () { snd(S.plaque); });
        anim(plaque, [{ opacity: 0, transform: 'translateY(44px)' }, { opacity: 1, transform: 'translateY(-3px)', offset: 0.8 }, { opacity: 1, transform: 'none' }], { duration: 560, delay: T_PLAQ, easing: 'cubic-bezier(.16,1,.3,1)' });
        later(T_PLAQ + 100, function () { snd(function () { S.chord(mine); }); });
        applause(T_PLAQ + 60, mine);
        later(T_ROS, function () { snd(S.rosette); vib(mine ? [40, 40, 40] : [25]); });
        anim(ros, [
          { opacity: 0, transform: 'scale(2.2) rotate(-40deg)' },
          { opacity: 1, transform: 'scale(.92) rotate(-6deg)', offset: 0.65 },
          { opacity: 1, transform: 'scale(1) rotate(-8deg)' }
        ], { duration: 420, delay: T_ROS, easing: 'cubic-bezier(.3,1.2,.5,1)' });
        later(T_PLAQ + 200, function () { goldLeaf(mine ? 64 : 38, mine ? 2400 : 1800); });

        later(SETTLE - lag - 400, showButtons);
        later(SETTLE - lag, function () { settled = true; });
        later(16000 - lag, close);
      }

      function runReduced() {
        hangEl.style.transform = 'none';
        [art, shell, wire, nail, cap].forEach(function (x) { anim(x, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 250, easing: 'ease-out' }); });
        anim(titleEl, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 300 });
        anim(plaque, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 600 });
        anim(ros, [{ opacity: 0, transform: 'rotate(-8deg)' }, { opacity: 1, transform: 'rotate(-8deg)' }], { duration: 400, delay: 800 });
        later(250, function () { snd(function () { S.chord(mine); }); vib(mine ? [80, 40, 80] : [40]); });
        applause(600, mine);
        later(SETTLE - 400, showButtons);
        later(SETTLE, function () { settled = true; });
        later(16000, close);
      }

      function showButtons() {
        btns.style.visibility = 'visible';
        anim(btns, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: RM ? 250 : 420, easing: 'ease-out' });
      }

      /* gold dust + plaster puff at the impact */
      function dust() {
        try {
          var fr = piece.getBoundingClientRect(), rr = root.getBoundingClientRect();   // untransformed resting place of the frame
          var L = fr.left - rr.left, R = fr.right - rr.left, Tp = fr.top - rr.top, B = Tp + (shell.offsetHeight || fr.height);
          var n = mine ? 46 : 34, i;
          for (i = 0; i < n; i++) {
            var side = i % 4, x, y, vx, vy;
            if (side === 0) { x = rnd(L, R); y = B; vx = rnd(-60, 60); vy = rnd(-60, -10); }
            else if (side === 1) { x = L; y = rnd(Tp + 20, B); vx = rnd(-90, -20); vy = rnd(-50, 10); }
            else if (side === 2) { x = R; y = rnd(Tp + 20, B); vx = rnd(20, 90); vy = rnd(-50, 10); }
            else { x = rnd(L, R); y = B; vx = (x < (L + R) / 2 ? -1 : 1) * rnd(40, 120); vy = rnd(-30, 0); }
            var s = rnd(1.6, 4.2);
            var p = el('i', 'gal-p', fx, 'width:' + s + 'px;height:' + s + 'px;background:' + (Math.random() < 0.7 ? 'radial-gradient(circle,#fff6c8,#e0b552 60%,rgba(200,150,50,0))' : '#f6e3a8') + ';');
            var fall = rnd(40, 120), d = rnd(700, 1300);
            anim(p, [
              { transform: 'translate(' + x + 'px,' + y + 'px)', opacity: 1 },
              { transform: 'translate(' + (x + vx) + 'px,' + (y + vy) + 'px)', opacity: 1, offset: 0.35 },
              { transform: 'translate(' + (x + vx * 1.3) + 'px,' + (y + vy + fall) + 'px)', opacity: 0 }
            ], { duration: d, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
          }
          for (i = 0; i < 9; i++) {
            var px = rnd(L - 10, R + 10), sz = rnd(26, 54);
            var puff = el('i', 'gal-p', fx, 'width:' + sz + 'px;height:' + sz + 'px;background:radial-gradient(circle,rgba(240,225,200,.32),rgba(240,225,200,0) 70%);');
            anim(puff, [
              { transform: 'translate(' + (px - sz / 2) + 'px,' + (B - sz / 2) + 'px) scale(.4)', opacity: 0.9 },
              { transform: 'translate(' + (px - sz / 2 + rnd(-30, 30)) + 'px,' + (B - sz / 2 - rnd(6, 26)) + 'px) scale(1.6)', opacity: 0 }
            ], { duration: rnd(700, 1100), easing: 'ease-out', fill: 'forwards' });
          }
        } catch (e) {}
      }

      /* tasteful gold leaf, drifting down through the spotlight */
      function goldLeaf(n, spread) {
        try {
          var w = root.clientWidth || VW, h = root.clientHeight || VH;
          for (var i = 0; i < n; i++) {
            (function (i) {
              later(rnd(0, spread), function () {
                var s = rnd(6, 13), x0 = w * 0.5 + rnd(-w * 0.45, w * 0.45), drift = rnd(-60, 60), d = rnd(3200, 5200);
                var leaf = el('i', 'gal-leaf', fx, 'width:' + s + 'px;height:' + (s * rnd(0.6, 0.9)) + 'px;');
                var r0 = rnd(0, 360), flips = rnd(2, 5) * 360;
                anim(leaf, [
                  { transform: 'translate(' + x0 + 'px,-20px) rotate(' + r0 + 'deg) rotateX(0deg)', opacity: 0 },
                  { opacity: 1, offset: 0.08 },
                  { transform: 'translate(' + (x0 + drift * 0.6 + 18) + 'px,' + (h * 0.5) + 'px) rotate(' + (r0 + 140) + 'deg) rotateX(' + flips / 2 + 'deg)', opacity: 1, offset: 0.55 },
                  { transform: 'translate(' + (x0 + drift) + 'px,' + (h + 20) + 'px) rotate(' + (r0 + 260) + 'deg) rotateX(' + flips + 'deg)', opacity: 0.2 }
                ], { duration: d, easing: 'linear', fill: 'forwards' });
                later(d + 50, function () { try { leaf.remove(); } catch (e) {} });
              });
            })(i);
          }
        } catch (e) {}
      }

      return SETTLE;
    } catch (e) {
      try { console.warn('[gallery] hang failed', e); } catch (e2) {}
      try { teardown(true); } catch (e3) {}
      return 0;
    }
  }

  /* ── thumbnails & the archive wall ── */
  // idx: make it a button that zooms (call: the function it calls with idx, default Gallery.zoomAt)
  function miniHtml(entry, idx, call) {
    try {
      var tap = typeof idx === 'number';
      injectCss();
      entry = entry || {};
      var cap = smarten(entry.caption);
      var isReal = !!entry.isReal || !entry.author;
      var who = isReal ? 'The original' : String(entry.author);
      var month = shortMonth(entry.month);
      var n = parseInt(entry.frames != null ? entry.frames : entry.flags, 10) || 0;
      var src = imgUrl(entry.image);
      var open = tap ? '<button type="button" class="gal-mini" onclick="' + (/^[\w.]+$/.test(call || '') ? call : 'Gallery.zoomAt') + '(' + idx + ')" aria-label="' + esc('“' + cap + '”, ' + who + (month ? ', ' + month : '') + '. Tap to see it big.') + '">' : '<figure class="gal-mini" style="margin:0">';
      var B = tap ? 'span' : 'div', P = tap ? 'span' : 'p', L = tap ? 'span' : 'figcaption';
      return open +
        '<svg class="gal-mwire" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true"><path d="M22 17 L50 1 L78 17" fill="none" stroke="#B9AE9C" stroke-width="1" vector-effect="non-scaling-stroke"/></svg><i class="gal-mnail"></i>' +
        '<' + B + ' class="gal-frame">' + sticksHtml(false) +
          '<' + B + ' class="gal-liner"><' + B + ' class="gal-mat">' + (src ? '<img class="gal-mimg" src="' + esc(src) + '" alt="" loading="lazy" draggable="false">' : '<' + B + ' class="gal-mimg"></' + B + '>') + '</' + B + '></' + B + '>' +
        '</' + B + '>' +
        '<' + L + ' class="gal-mlabel"><' + P + ' class="gal-mcap">“' + esc(cap) + '”</' + P + '>' +
          '<' + P + ' class="gal-mwho" title="' + esc(who) + '"><b>' + esc(who) + '</b></' + P + '>' + (month ? '<' + P + ' class="gal-mmo">' + esc(month) + '</' + P + '>' : '') +
          (n > 0 ? '<span class="gal-mfr">' + n + (n === 1 ? ' frame' : ' frames') + '</span>' : '') +
          (entry.best ? '<span class="gal-mfr" style="background:#D7261E;color:#fff;border-color:#8a1410;">🏅 ' + esc(entry.best) + '</span>' : '') +
        '</' + L + '>' + (tap ? '</button>' : '</figure>');
    } catch (e) { return ''; }
  }

  function archiveHtml(entries) {
    try {
      injectCss();
      var list = (Array.isArray(entries) ? entries : []).filter(function (x) { return x && x.caption; });
      // newest first: trust the caller's order, but sort by timestamp when one is provided
      if (list.length > 1 && list.every(function (x) { return typeof x.at === 'number'; })) list = list.slice().sort(function (a, b) { return b.at - a.at; });
      var n = list.length;
      var head = '<div class="gal-ahead"><h3 class="gal-atitle">The Gallery</h3><p class="gal-asub">' + (n + (n === 1 ? ' framed caption' : ' framed captions')) + (n ? ' · tap one' : '') + '</p><div class="gal-arule"></div></div>';
      wall = list;   // what zoomAt(i) opens, and what a swipe pages through
      var body = n
        ? '<div class="gal-grid">' + list.map(function (e, i) { return miniHtml(e, i); }).join('') + '</div>'
        : '<div class="gal-empty"><div class="gal-eframe"></div><p class="gal-etext">Nothing on the walls yet. When enough of the table frames a caption, it’s hung here — and becomes the real caption in Gallery games.</p></div>';
      return '<section class="gal-arch" aria-label="The Gallery"><div class="gal-plaster"></div>' + head + body + '</section>';
    } catch (e) { return ''; }
  }

  /* ── zoom: one framed caption, big and readable. It grows out of the thumbnail that was tapped (a plain fade
     with Reduce Motion). Tap anywhere, the X, Escape or a swipe down goes back; a sideways swipe (or the arrows)
     pages through the wall. No sound: it's a quiet look, not a moment. ── */
  var wall = [], zm = null;
  function zoomPieceHtml(entry) {
    var cap = smarten(entry.caption) || '…';
    var isReal = !!entry.isReal || !entry.author;
    var who = isReal ? 'The original caption' : String(entry.author);
    var month = String(entry.month || '').trim();
    var framers = nameList(entry.framers || entry.flaggers);
    var n = parseInt(entry.frames != null ? entry.frames : entry.flags, 10) || 0;
    var src = imgUrl(entry.image), len = cap.length;
    var VW = window.innerWidth || 390;
    var W = Math.round(Math.min(VW - 48, 440));
    var TH = W >= 300 ? 18 : 15;
    var fs = len <= 50 ? 21 : len <= 90 ? 19 : len <= 140 ? 17 : 15.5;
    var by = framers ? 'Framed by ' + esc(framers) : (n ? 'Framed by the table' : '');
    if (n) by += (by ? '&nbsp;·&nbsp;' : '') + n + (n === 1 ? '&nbsp;frame' : '&nbsp;frames');
    return '<div class="gal-zpiece" style="width:' + W + 'px"><div class="gal-zshadow"></div>' +
        '<div class="gal-frame" style="--t:' + TH + 'px">' + sticksHtml(true) +
          '<div class="gal-liner"><div class="gal-mat">' +
            (src ? '<img class="gal-zimg" src="' + esc(src) + '" alt="The cartoon" draggable="false">' : '') +
            '<p class="gal-zcap" style="font-size:' + fs + 'px">“' + esc(cap) + '”</p>' +
          '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="gal-zplaque"><p class="gal-zwho">' + esc(who) + (month ? ', <span>' + esc(month) + '</span>' : '') + '</p>' +
        (by ? '<p class="gal-zby">' + by + '</p>' : '') +
        (entry.best ? '<span class="gal-zbest">' + esc(entry.best) + '</span>' : '') + '</div>';
  }
  // The tapped thumbnail's frame on screen (the zoom grows out of it and shrinks back into it)
  function thumbRect(i, sel) {
    try {
      var b = document.querySelectorAll(sel || 'button.gal-mini')[i];
      var f = b && (b.querySelector('.gal-frame,[data-zoom-from]') || b);
      var r = f && f.getBoundingClientRect();
      return r && r.width > 4 && r.bottom > 0 && r.top < (window.innerHeight || 844) ? r : null;
    } catch (e) { return null; }
  }
  function flipFrom(piece, r) {
    var p = piece.getBoundingClientRect();
    if (!r || !p.width) return null;
    return 'translate(' + Math.round(r.left + r.width / 2 - (p.left + p.width / 2)) + 'px,' + Math.round(r.top + r.height / 2 - (p.top + p.height / 2)) + 'px) scale(' + (r.width / p.width).toFixed(3) + ')';
  }
  function zoomShow(i, dir) {
    if (!zm) return;
    var list = zm.list, e = list[i];
    if (!e) return;
    zm.i = i;
    var stage = zm.root.querySelector('.gal-zstage');
    stage.innerHTML = zoomPieceHtml(e) + '<p class="gal-zhint">' + (list.length > 1 ? 'Swipe for the next one · tap to go back' : 'Tap to go back') + '</p>';
    var cnt = zm.root.querySelector('.gal-zcount');
    if (cnt) cnt.textContent = list.length > 1 ? (i + 1) + ' of ' + list.length : 'The Gallery';
    var pv = zm.root.querySelector('.gal-zprev'), nx = zm.root.querySelector('.gal-znext');
    if (pv) pv.disabled = i <= 0;
    if (nx) nx.disabled = i >= list.length - 1;
    zm.root.setAttribute('aria-label', 'Framed caption: ' + smarten(e.caption));
    if (dir) [stage.querySelector('.gal-zpiece'), stage.querySelector('.gal-zplaque')].forEach(function (k, j) {
      if (k) anim(k, zm.rm ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateX(' + (dir * 46) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: zm.rm ? 160 : 300, delay: j * 30, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
  }
  // opts.from: a CSS selector for the thumbnails the zoom grows out of (default: the wall's), nth = i
  function zoom(entry, list, i, opts) {
    try {
      injectCss();
      zoomClose(true);
      list = Array.isArray(list) && list.length ? list : [entry];
      i = Math.max(0, Math.min(list.length - 1, typeof i === 'number' ? i : list.indexOf(entry)));
      if (!list[i]) return;
      var RM = reduced();
      var root = el('div', 'gal-ov gal-zm', null);
      root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
      root.innerHTML = '<div class="gal-wall"></div><div class="gal-plaster"></div>' +
        '<p class="gal-zcount"></p><button type="button" class="gal-zx" aria-label="Back to The Gallery">✕</button>' +
        (list.length > 1 ? '<button type="button" class="gal-znav gal-zprev" aria-label="Previous caption">‹</button><button type="button" class="gal-znav gal-znext" aria-label="Next caption">›</button>' : '') +
        '<div class="gal-zstage"></div>';
      document.body.appendChild(root);
      zm = { root: root, list: list, i: i, rm: RM, sel: (opts && opts.from) || null };
      zoomShow(i, 0);
      anim(root.querySelector('.gal-wall'), [{ opacity: 0 }, { opacity: 1 }], { duration: RM ? 140 : 280, easing: 'ease-out', fill: 'backwards' });
      anim(root.querySelector('.gal-plaster'), [{ opacity: 0 }, { opacity: 0.55 }], { duration: RM ? 140 : 280, easing: 'ease-out', fill: 'backwards' });
      var piece = root.querySelector('.gal-zpiece'), plaque = root.querySelector('.gal-zplaque'), hint = root.querySelector('.gal-zhint');
      var from = !RM && piece ? flipFrom(piece, thumbRect(i, zm.sel)) : null;
      if (from) anim(piece, [{ transform: from, opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      else if (piece) anim(piece, [{ opacity: 0 }, { opacity: 1 }], { duration: RM ? 140 : 240, fill: 'backwards' });
      [plaque, hint].forEach(function (k, j) { if (k) anim(k, RM ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: RM ? 140 : 300, delay: RM ? 0 : 200 + j * 60, easing: 'ease-out', fill: 'backwards' }); });
      // Gestures: a tap goes back, a sideways swipe pages, a swipe down goes back
      var sx = 0, sy = 0, down = false, moved = false;
      root.addEventListener('pointerdown', function (ev) { down = true; moved = false; sx = ev.clientX; sy = ev.clientY; });
      root.addEventListener('pointermove', function (ev) {
        if (!down || !zm) return;
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
        var p = root.querySelector('.gal-zpiece');
        if (p && moved && !zm.rm) p.style.transform = Math.abs(dx) > Math.abs(dy) ? 'translateX(' + Math.round(dx * 0.6) + 'px) rotate(' + (dx * 0.012).toFixed(2) + 'deg)' : dy > 0 ? 'translateY(' + Math.round(dy * 0.6) + 'px) scale(' + Math.max(0.9, 1 - dy / 2000).toFixed(3) + ')' : '';
      });
      var end = function (ev) {
        if (!down || !zm) return;
        down = false;
        var dx = ev.clientX - sx, dy = ev.clientY - sy, p = root.querySelector('.gal-zpiece');
        var onBtn = ev.target && ev.target.closest && ev.target.closest('button');
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          var j = zm.i + (dx < 0 ? 1 : -1);
          if (j >= 0 && j < zm.list.length) { zoomShow(j, dx < 0 ? 1 : -1); return; }
        } else if (dy > 70 && dy > Math.abs(dx)) { zoomClose(false); return; }
        if (p && p.style.transform) { p.style.transition = 'transform .2s'; p.style.transform = ''; setTimeout(function () { p.style.transition = ''; }, 220); }
        if (!moved && !onBtn && ev.type === 'pointerup') zoomClose(false);
      };
      root.addEventListener('pointerup', end);
      root.addEventListener('pointercancel', end);
      root.querySelector('.gal-zx').addEventListener('click', function () { zoomClose(false); });
      var pv = root.querySelector('.gal-zprev'), nx = root.querySelector('.gal-znext');
      if (pv) pv.addEventListener('click', function () { if (zm && zm.i > 0) zoomShow(zm.i - 1, -1); });
      if (nx) nx.addEventListener('click', function () { if (zm && zm.i < zm.list.length - 1) zoomShow(zm.i + 1, 1); });
      zm.onKey = function (ev) {
        if (!zm) return;
        if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); zoomClose(false); }
        else if (ev.key === 'ArrowRight' && zm.i < zm.list.length - 1) zoomShow(zm.i + 1, 1);
        else if (ev.key === 'ArrowLeft' && zm.i > 0) zoomShow(zm.i - 1, -1);
      };
      document.addEventListener('keydown', zm.onKey, true);
      try { root.querySelector('.gal-zx').focus({ preventScroll: true }); } catch (e) {}
    } catch (e) { try { console.warn('[gallery] zoom failed', e); } catch (e2) {} zoomClose(true); }
  }
  function zoomAt(i) { zoom(wall[i], wall, i, { from: '.gal-arch button.gal-mini' }); }
  function zoomClose(now) {
    var z = zm; zm = null;
    if (!z) return;
    try { document.removeEventListener('keydown', z.onKey, true); } catch (e) {}
    var rm = function () { try { z.root.remove(); } catch (e) {} };
    if (now) { rm(); return; }
    try {
      z.root.style.pointerEvents = 'none';
      var piece = z.root.querySelector('.gal-zpiece');
      if (piece) piece.style.transform = '';
      var to = !z.rm && piece ? flipFrom(piece, thumbRect(z.i, z.sel)) : null;
      if (piece) anim(piece, to ? [{ transform: 'none', opacity: 1 }, { transform: to, opacity: 0.4 }] : [{ opacity: 1 }, { opacity: 0 }], { duration: to ? 300 : 160, easing: 'cubic-bezier(.4,0,.7,.2)' });
      var a = anim(z.root, [{ opacity: 1 }, { opacity: 0 }], { duration: z.rm ? 160 : 300, delay: to ? 60 : 0, easing: 'ease-in' });
      if (a) { a.onfinish = rm; setTimeout(rm, 700); } else rm();
      var b = document.querySelectorAll(z.sel || 'button.gal-mini')[z.i];   // focus back where it came from
      if (b) try { b.focus({ preventScroll: true }); } catch (e) {}
    } catch (e) { rm(); }
  }

  window.Gallery = { hang: hang, close: close, miniHtml: miniHtml, archiveHtml: archiveHtml, zoom: zoom, zoomAt: zoomAt, zoomClose: function () { zoomClose(false); }, isZoomed: function () { return !!zm; } };

  /* #60: fetch the Gallery serif (Libre Caslon Text) early — a moment after the page has loaded, so it never
     competes with the first screen — instead of at the first framing, where it swapped in mid-ceremony.
     A stylesheet alone only declares the font; document.fonts.load() is what actually downloads the faces. */
  function preloadFont() {
    try {
      var go = function () { try { if (document.fonts && document.fonts.load) ['italic 400', '400', '700'].forEach(function (f) { document.fonts.load(f + ' 32px "Libre Caslon Text"', 'Aa“”').catch(function () {}); }); } catch (e) {} };
      var links = document.querySelectorAll('link[rel="stylesheet"]'), have = null;
      for (var i = 0; i < links.length; i++) if (/Libre\+Caslon\+Text/.test(links[i].href || '')) have = links[i];
      if (have) { if (have.sheet) go(); else have.addEventListener('load', go); return; }
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = FONT_HREF; l.setAttribute('data-gal-font', '1'); l.onload = go;
      (document.head || document.documentElement).appendChild(l);
    } catch (e) {}
  }
  try {
    var fontSoon = function () { setTimeout(preloadFont, 1200); };
    if (document.readyState === 'complete') fontSoon(); else window.addEventListener('load', fontSoon);
  } catch (e) {}
})();
