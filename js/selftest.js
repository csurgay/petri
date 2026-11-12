// Self-test: PREF -> "Self-test  Run ▶"  (or open index.html?selftest=1)
//
// Drives the editor through the same input path a person uses (mouse, keys,
// touch, clipboard, dialogs) on a small test net, checks the results, and
// restores the user's own net, history, file name, view and settings at the end.
// Nothing is downloaded or uploaded while testing.
//
// Add a test for every feature that works, so later changes cannot quietly
// break it: ST_TESTS.push(["name", async t => { ... }]).

const ST_TESTS=[];
function stTest(name, fn) { ST_TESTS.push([name, fn]); }

// ---------------------------------------------------------------- helpers ---
const st={
    frames(n=2) { return new Promise(r=>{ let k=0; const f=()=>{ if (++k>=n) r(); else requestAnimationFrame(f); }; requestAnimationFrame(f); }); },
    sleep(ms) { return new Promise(r=>setTimeout(r,ms)); },
    scr(o) { return { x:(o.x+pn.vpx)*pn.zoom+pn.cx, y:(o.y+pn.vpy)*pn.zoom+pn.cy }; },
    net(x,y) { return st.scr({x,y}); },
    mid(f) { return st.scr({x:(f.o1.x+f.o2.x)/2, y:(f.o1.y+f.o2.y)/2}); },
    fake(x,y,button=0,m={}) {
        return { clientX:x, clientY:y, button, deltaX:0, deltaY:0, deltaMode:0,
                 shiftKey:!!m.shift, ctrlKey:!!m.ctrl, altKey:!!m.alt, metaKey:false,
                 preventDefault(){} };
    },
    async move(p,m={}) {
        events.mousemoveevent(st.fake(p.x-3,p.y-3,0,m));
        events.mousemoveevent(st.fake(p.x,p.y,0,m));
        await st.frames();
    },
    async down(p,b=0,m={}) { events.mousedownevent(st.fake(p.x,p.y,b,m)); await st.frames(); },
    async up(p,b=0,m={})   { events.mouseupevent(st.fake(p.x,p.y,b,m)); await st.frames(); },
    async click(p,m={})    { await st.move(p,m); await st.down(p,0,m); await st.up(p,0,m); },
    async rclick(p)        { await st.move(p); await st.down(p,RIGHTBUTTON); await st.up(p,RIGHTBUTTON); },
    async dbl(p) {
        await st.click(p); await st.click(p);
        events.rcvEvent("mdc", st.fake(p.x,p.y)); await st.frames();
    },
    async drag(a,b,m={},steps=6) {
        await st.move(a,m); await st.down(a,0,m);
        for (let i=1;i<=steps;i++) {
            events.mousemoveevent(st.fake(a.x+(b.x-a.x)*i/steps, a.y+(b.y-a.y)*i/steps, 0, m));
            await st.frames(1);
        }
        await st.frames();
        await st.up(b,0,m);
    },
    async wheel(p,dy,m={}) {
        const e=st.fake(p.x,p.y,0,m); e.deltaY=dy;
        events.mousewheelevent(e); await st.frames();
    },
    keyEvent(key,m={}) {
        const codes={Escape:27,Enter:13,Delete:46,Backspace:8,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40," ":32};
        const keyCode = codes[key] || key.toUpperCase().charCodeAt(0);
        return { key, keyCode, repeat:false, shiftKey:!!m.shift, ctrlKey:!!m.ctrl, altKey:!!m.alt,
                 metaKey:false, target:document.body, preventDefault(){} };
    },
    async key(key,m={}) {
        events.keydownevent(st.keyEvent(key,m)); await st.frames();
        events.keyupevent(st.keyEvent(key,m)); await st.frames();
    },
    // touch: real pointer events on the canvas (pointerType "touch")
    touchEv(type,id,p) {
        canvas.dispatchEvent(new PointerEvent(type, { pointerId:id, pointerType:"touch", isPrimary:id==1,
            clientX:p.x, clientY:p.y, bubbles:true, cancelable:true }));
    },
    async tap(p) {
        st.touchEv("pointerdown",1,p); await st.sleep(60); st.touchEv("pointerup",1,p);
        await st.frames(); await st.sleep(DOUBLE_TAP_MS+150);          // not a double tap
    },
    async doubleTap(p) {
        st.touchEv("pointerdown",1,p); await st.sleep(40); st.touchEv("pointerup",1,p); await st.sleep(90);
        st.touchEv("pointerdown",1,p); await st.sleep(40); st.touchEv("pointerup",1,p);
        await st.frames(3);
    },
    async longPress(p) {
        st.touchEv("pointerdown",1,p); await st.sleep(LONG_PRESS_MS+150); st.touchEv("pointerup",1,p);
        await st.frames(3);
    },
    async touchDrag(a,b) {
        st.touchEv("pointerdown",1,a); await st.sleep(30);
        for (let i=1;i<=6;i++) { st.touchEv("pointermove",1,{x:a.x+(b.x-a.x)*i/6, y:a.y+(b.y-a.y)*i/6}); await st.frames(1); }
        st.touchEv("pointerup",1,b); await st.frames(3);
    },
    // dialogs
    dialogOpen() { return !!document.querySelector(".dlg"); },
    async answer(v) {
        const i=document.querySelector(".dlg input"); if (i) i.value=v;
        document.querySelector(".dlg .ok").click(); await st.frames();
    },
    menuItem(text) {
        return [...document.querySelectorAll(".ctxmenu .item")].find(b=>b.textContent.includes(text));
    },
    // objects of the test net by name
    P(n) { return pn.p.find(o=>o.label.text==n); },
    T(n) { return pn.t.find(o=>o.label.text==n); },
    F(a,b) { return pn.f.find(f=>f.o1.label.text==a && f.o2.label.text==b); },
    count() { return [pn.p.length, pn.t.length, pn.f.length].join("/"); },
    marking() { return pn.p.map(p=>p.label.text+p.tokens).join(" "); }
};

// Test net:   A(1) --> T1 --> B(0) --> T2 --> A        (all on the 20 px grid)
function stBuildNet() {
    stResetUI();
    pn.clear(); undo.length=0; undoPtr=-1;
    fp.gridSize.value=20; fp.gridSize.newValue(); fp.snapToGrid.value=true; fp.snapToGrid.newValue();
    grid=20;
    const mk=(o,name)=>{ o.label.text=name; o.label.x=o.x-30; o.label.y=o.y-30; return o; };
    const A=mk(new Place(40,40),"A");   A.tokens=1; pn.addPlace(A);
    const B=mk(new Place(240,40),"B");  pn.addPlace(B);
    const T1=mk(new Transition(140,40),"T1");  pn.addTransition(T1);
    const T2=mk(new Transition(140,160),"T2"); pn.addTransition(T2);
    [[A,T1],[T1,B],[B,T2],[T2,A]].forEach(([a,b])=>pn.addFlow(new Flow(a,b)));
    // view: zoom 1, net origin just right of the palette, below the toolbar
    pn.zoom=1; pn.vpx=0; pn.vpy=0;
    pn.cx=(palette.el?90:30); pn.cy=bar.h+70;
    pn.clearMarkings();
    setFileName("selftest.pn");
    pn.newUndo();
    markSaved();
    events.refreshHover();
}
const ST_FREE1={x:40,y:240}, ST_FREE2={x:240,y:240};      // empty spots (net coords)

function stResetUI() {
    ctxMenu.close();
    closeConfirm();
    if (textbox.active) textbox.cancel();
    fp.visible=fp.active=false; ff.visible=ff.active=false; fbfs.visible=fbfs.active=false;
    fb.active=true;
    state.set("IDLE");
    cancelFire();
    sel.clear();
    setTool("SELECT");
    events.spaceDown=false; events.e.length=0; events.focusMs=0; events.swallowUp=false;
    lastPointer="mouse";
    toastText="";
    pn.highlighted=null;
}

// ------------------------------------------------------------------ tests ---
stTest("Place tool: click adds a place; Ctrl+Z undoes, Ctrl+Y redoes", async t=>{
    await st.key("p"); t.eq(tool,"PLACE","tool");
    await st.click(st.net(ST_FREE1.x,ST_FREE1.y)); t.eq(pn.p.length,3,"place added");
    await st.key("z",{ctrl:true}); t.eq(pn.p.length,2,"undo");
    await st.key("y",{ctrl:true}); t.eq(pn.p.length,3,"redo");
});
stTest("Transition tool: click adds, Shift+click adds a vertical one", async t=>{
    await st.key("t");
    await st.click(st.net(ST_FREE1.x,ST_FREE1.y)); t.eq(pn.t.length,3,"transition added");
    t.near(pn.t[2].alpha, Math.PI/2, 0.01, "horizontal");
    await st.click(st.net(ST_FREE2.x,ST_FREE2.y),{shift:true}); t.eq(pn.t.length,4,"second added");
    t.near(pn.t[3].alpha, 0, 0.01, "vertical");
});
stTest("Flow tool: drag place→transition and transition→place", async t=>{
    await st.key("f");
    await st.drag(st.scr(st.P("A")), st.scr(st.T("T2"))); t.ok(st.F("A","T2"),"A→T2 created");
    t.eq(st.F("A","T2") && st.F("A","T2").subtype,"ENABLER","normal arc");
    await st.drag(st.scr(st.T("T2")), st.scr(st.P("B"))); t.ok(st.F("T2","B"),"T2→B created");
});
stTest("Inhibitor tool: place→transition only", async t=>{
    await st.key("i");
    await st.drag(st.scr(st.P("A")), st.scr(st.T("T2")));
    t.eq(st.F("A","T2") && st.F("A","T2").subtype,"INHIBITOR","inhibitor arc");
    const n=pn.f.length;
    await st.drag(st.scr(st.T("T2")), st.scr(st.P("B")));
    t.eq(pn.f.length,n,"wrong direction refused"); t.ok(/inhibitor/i.test(toastText),"explains why");
});
stTest("Reset tool: transition→place only", async t=>{
    await st.key("r");
    await st.drag(st.scr(st.T("T2")), st.scr(st.P("B")));
    t.eq(st.F("T2","B") && st.F("T2","B").subtype,"RESET","reset arc");
    const n=pn.f.length;
    await st.drag(st.scr(st.P("A")), st.scr(st.T("T2")));
    t.eq(pn.f.length,n,"wrong direction refused");
});
stTest("Select: click on an arc switches normal ⇄ inhibitor / reset", async t=>{
    await st.click(st.mid(st.F("A","T1"))); await st.sleep(FIRE_DELAY_MS+150);
    t.eq(st.F("A","T1").subtype,"INHIBITOR","P→T becomes inhibitor");
    await st.click(st.mid(st.F("A","T1"))); await st.sleep(FIRE_DELAY_MS+150);
    t.eq(st.F("A","T1").subtype,"ENABLER","and back");
    await st.click(st.mid(st.F("T1","B"))); await st.sleep(FIRE_DELAY_MS+150);
    t.eq(st.F("T1","B").subtype,"RESET","T→P becomes reset");
});
stTest("Arc tools: click on an arc sets it to the tool's kind", async t=>{
    await st.key("r"); await st.click(st.mid(st.F("T1","B")));
    t.eq(st.F("T1","B").subtype,"RESET","R tool");
    await st.key("f"); await st.click(st.mid(st.F("T1","B")));
    t.eq(st.F("T1","B").subtype,"ENABLER","F tool");
    await st.key("i"); await st.click(st.mid(st.F("T1","B")));
    t.eq(st.F("T1","B").subtype,"ENABLER","I tool refuses T→P"); t.ok(/inhibitor/i.test(toastText),"explains why");
});
stTest("Double-click on an arc: type its weight (kind unchanged)", async t=>{
    await st.dbl(st.mid(st.F("A","T1"))); await st.sleep(FIRE_DELAY_MS+150);
    t.ok(st.dialogOpen(),"weight dialog");
    await st.answer("3");
    t.eq(st.F("A","T1").weight,3,"weight set"); t.eq(st.F("A","T1").subtype,"ENABLER","kind unchanged");
});
stTest("Marking tool: +1, right-click −1, Shift+click −1, double-click types", async t=>{
    await st.key("m");
    const B=()=>st.scr(st.P("B"));
    await st.click(B()); await st.click(B()); t.eq(st.P("B").tokens,2,"two clicks");
    await st.rclick(B()); t.eq(st.P("B").tokens,1,"right-click");
    await st.click(B(),{shift:true}); t.eq(st.P("B").tokens,0,"shift+click");
    await st.sleep(700);
    await st.dbl(B()); t.ok(st.dialogOpen(),"number dialog");
    t.eq(document.querySelector(".dlg input").value,"0","prefilled with the value before the double-click");
    await st.answer("7"); t.eq(st.P("B").tokens,7,"typed value");
});
stTest("Marking tool: click fires an enabled transition, explains a disabled one", async t=>{
    await st.key("m");
    await st.click(st.scr(st.T("T1"))); t.eq(st.marking(),"A0 B1","T1 fired at once");
    await st.click(st.scr(st.T("T1"))); t.eq(st.marking(),"A0 B1","disabled: no firing");
    t.ok(/not enabled/.test(toastText),"says why");
});
stTest("Select: one click = one firing; a double-click renames instead", async t=>{
    const m0=pn.mptr;
    await st.click(st.scr(st.T("T1"))); await st.sleep(FIRE_DELAY_MS+150);
    t.eq(pn.mptr-m0,1,"one firing"); t.eq(st.marking(),"A0 B1","marking");
    stBuildNet();
    const m1=pn.mptr;
    await st.dbl(st.scr(st.T("T1"))); await st.sleep(FIRE_DELAY_MS+150);
    t.eq(pn.mptr-m1,0,"no firing on double-click"); t.ok(textbox.active,"rename editor");
    await st.key("Escape");
});
stTest("Right-click with a tool removes its own kind of object", async t=>{
    await st.key("p"); await st.rclick(st.scr(st.P("A"))); t.eq(pn.p.length,1,"place deleted");
    await st.key("t"); await st.rclick(st.scr(st.T("T2"))); t.eq(pn.t.length,1,"transition deleted");
    await st.key("l"); await st.click(st.net(ST_FREE1.x,ST_FREE1.y)); await st.sleep(50); await st.frames();
    t.ok(textbox.active,"new label opens its editor"); await st.key("Escape");
    const n=pn.l.length;
    await st.rclick(st.net(ST_FREE1.x,ST_FREE1.y)); t.eq(pn.l.length,n-1,"label deleted");
});
stTest("Select: a click on empty canvas creates nothing and deselects", async t=>{
    await st.click(st.scr(st.P("A"))); t.eq(sel.size,1,"selected");
    await st.click(st.net(ST_FREE1.x,ST_FREE1.y)); t.eq(sel.size,0,"deselected"); t.eq(pn.p.length,2,"no new place");
});
stTest("Selection: box, Shift+click, Esc, Ctrl+A", async t=>{
    await st.drag(st.net(0,0), st.net(280,80)); t.eq(sel.size,5,"box: A, T1, B and their 2 arcs");
    await st.click(st.scr(st.T("T2")),{shift:true}); t.eq(sel.size,6,"Shift+click adds");
    await st.click(st.scr(st.T("T2")),{shift:true}); t.eq(sel.size,5,"Shift+click removes");
    await st.key("Escape"); t.eq(sel.size,0,"Esc clears");
    await st.key("a",{ctrl:true}); t.eq(sel.size,8,"Ctrl+A: everything");
});
stTest("Dragging moves the whole selection; Esc cancels a drag", async t=>{
    await st.key("a",{ctrl:true});
    await st.drag(st.scr(st.P("A")), st.net(100,80));
    t.eq([st.P("A").x,st.P("A").y].join(),"100,80","A moved"); t.eq([st.P("B").x,st.P("B").y].join(),"300,80","B moved with it");
    await st.move(st.scr(st.P("A"))); await st.down(st.scr(st.P("A")));
    for (let i=1;i<=4;i++) { events.mousemoveevent(st.fake(st.net(100+15*i,80).x, st.net(100,80+10*i).y)); await st.frames(1); }
    await st.key("Escape"); await st.up(st.net(160,120));
    t.eq([st.P("A").x,st.P("A").y].join(),"100,80","Esc put it back");
});
stTest("Arrows nudge the selection; ←/→ without selection step the simulation", async t=>{
    await st.click(st.scr(st.P("A"))); await st.key("ArrowRight");
    t.eq(st.P("A").x,60,"nudged one grid step");
    await st.key("Escape"); await st.move(st.net(ST_FREE2.x,ST_FREE2.y));
    await st.key("ArrowRight"); t.eq(st.marking(),"A0 B1","stepped forward");
    await st.key("ArrowLeft");  t.eq(st.marking(),"A1 B0","stepped back");
});
stTest("Del deletes the selection, Ctrl+Z brings it back", async t=>{
    await st.drag(st.net(0,0), st.net(280,80));
    await st.key("Delete"); t.eq(st.count(),"0/1/0","only T2 left");
    await st.key("z",{ctrl:true}); t.eq(st.count(),"2/2/4","restored");
});
stTest("Clipboard: copy, paste, cut + paste in place, duplicate", async t=>{
    const dt=new DataTransfer(), clip=(type)=>document.dispatchEvent(
        new ClipboardEvent(type,{clipboardData:dt,bubbles:true,cancelable:true}));
    await st.key("a",{ctrl:true}); clip("copy"); await st.frames();
    t.ok(/copied/.test(toastText),"copied");
    clip("paste"); await st.frames(); t.eq(st.count(),"4/4/8","pasted a second copy");
    await st.key("z",{ctrl:true});
    await st.key("a",{ctrl:true}); clip("cut"); await st.frames(); t.eq(st.count(),"0/0/0","cut");
    clip("paste"); await st.frames(); t.eq(st.count(),"2/2/4","pasted back");
    t.eq([st.P("A").x,st.P("A").y].join(),"40,40","in the original place");
    await st.key("a",{ctrl:true}); await st.key("d",{ctrl:true}); t.eq(st.count(),"4/4/8","Ctrl+D duplicates");
});
stTest("Context menu: right-click opens it; items work; Esc and outside clicks close it", async t=>{
    await st.rclick(st.scr(st.P("A"))); t.ok(ctxMenu.isOpen(),"opened");
    const add=st.menuItem("Add token"); t.ok(add,"has 'Add token'");
    add.click(); t.ok(ctxMenu.isOpen(),"a click right after opening is ignored (long-press safety)");
    await st.sleep(500); st.menuItem("Add token").click(); await st.frames();
    t.eq(st.P("A").tokens,2,"Add token");
    await st.rclick(st.scr(st.P("A"))); await st.key("Escape"); t.ok(!ctxMenu.isOpen(),"Esc closes");
    await st.rclick(st.scr(st.P("A"))); await st.click(st.net(ST_FREE1.x,ST_FREE1.y));
    t.ok(!ctxMenu.isOpen(),"outside click closes"); t.eq(pn.p.length,2,"and does nothing else");
});
stTest("Context menu on empty canvas: 'Paste here'", async t=>{
    const dt=new DataTransfer();
    await st.key("a",{ctrl:true});
    document.dispatchEvent(new ClipboardEvent("copy",{clipboardData:dt,bubbles:true,cancelable:true}));
    await st.key("Escape");
    const at={x:ST_FREE2.x, y:ST_FREE2.y+60};           // (inside a phone screen too)
    await st.rclick(st.net(at.x,at.y)); await st.sleep(500);
    t.ok(st.menuItem("Paste here"),"menu has 'Paste here'");
    st.menuItem("Paste here").click(); await st.frames();
    t.eq(pn.p.length,4,"pasted");
    const xs=sel.items().filter(o=>o.type=="PLACE").map(o=>o.x);
    t.near((Math.min(...xs)+Math.max(...xs))/2, at.x, 30, "around the clicked point");
});
stTest("Tool keys S P T F I R M L H", async t=>{
    // (the app defines its own class Object, so no Object.entries here)
    const want=[["p","PLACE"],["t","TRANSITION"],["f","FLOW"],["i","INHIBITOR"],["r","RESET"],
                ["m","MARKING"],["l","LABEL"],["h","PAN"],["s","SELECT"]];
    for (const [k,v] of want) { await st.key(k); t.eq(tool,v,"key "+k.toUpperCase()); }
    const nb=bar.b.find(b=>b.button=="HELP");
    await st.move({x:nb.x,y:nb.y}); await st.key("t");
    t.eq(tool,"TRANSITION","tool keys also work with the mouse over the toolbar");
    await st.key("p"); await st.key("Escape"); t.eq(tool,"SELECT","Esc returns to Select");
});
stTest("View: Pan tool, Ctrl+wheel zooms at the cursor, Ctrl+0 fits", async t=>{
    await st.key("h"); const vx=pn.vpx;
    await st.drag(st.net(ST_FREE1.x,ST_FREE1.y), st.net(ST_FREE1.x+60,ST_FREE1.y+40));
    t.ok(pn.vpx>vx,"Pan tool drag moved the view");
    await st.key("s");
    const p=st.scr(st.P("A")), z=pn.zoom;
    await st.wheel(p,-200,{ctrl:true});
    t.ok(pn.zoom>z,"zoomed in");
    t.near((p.x-pn.cx)/pn.zoom-pn.vpx, st.P("A").x, 1, "the point under the cursor stays");
    await st.key("0",{ctrl:true});
    const inside=pn.p.concat(pn.t).every(o=>{ const s=st.scr(o); return s.x>0 && s.x<ww && s.y>bar.h && s.y<wh-HINT_H; });
    t.ok(inside,"Ctrl+0: everything visible");
});
stTest("Save (Ctrl+S) downloads the net and clears the unsaved mark", async t=>{
    await st.key("p"); await st.click(st.net(ST_FREE1.x,ST_FREE1.y));
    t.ok(isDirty(),"unsaved after an edit");
    await st.key("s",{ctrl:true}); await st.sleep(50);
    const d=stDownloads[stDownloads.length-1];
    t.ok(d && /\.pn$/.test(d.name),"a .pn file was offered"); t.ok(d && /Places:/.test(d.text),"with the net in it");
    t.ok(!isDirty(),"unsaved mark cleared");
});
stTest("Open: a .pn text loads, anything else is refused", async t=>{
    const raw=rawSave();
    t.ok(loadNetText(raw,"other.pn"),"loads"); t.eq(fm.name,"other.pn","file name");
    t.ok(!loadNetText("hello","notes.txt"),"refused"); t.ok(/Not a PetriNet/.test(toastText),"says why");
    t.eq(st.count(),"2/2/4","net unchanged");
});
stTest("Unsaved changes: NEW asks first (Esc keeps, Enter discards)", async t=>{
    await st.key("p"); await st.click(st.net(ST_FREE1.x,ST_FREE1.y));
    const nb=bar.b.find(b=>b.button=="CLEAR");
    await st.click({x:nb.x,y:nb.y}); t.ok(st.dialogOpen(),"asks");
    await st.key("Escape"); t.eq(pn.p.length,3,"Esc keeps the net");
    await st.click({x:nb.x,y:nb.y}); await st.key("Enter"); t.eq(pn.p.length,0,"Enter: new empty net");
});
stTest("Autosave keeps the net in the browser", async t=>{
    await st.key("p"); await st.click(st.net(ST_FREE1.x,ST_FREE1.y));
    let a=null; try { a=JSON.parse(localStorage.getItem(AUTOSAVE_KEY)); } catch(e) {}
    t.ok(a && /Places:/.test(a.data),"saved"); t.eq(a && a.name,"selftest.pn","with the file name");
});
stTest("Touch: tap adds, long-press removes, double-tap types, pinch zooms", async t=>{
    await st.key("p");
    await st.tap(st.net(ST_FREE1.x,ST_FREE1.y)); t.eq(pn.p.length,3,"tap: place added");
    t.eq(lastPointer,"touch","touch noticed");
    await st.longPress(st.net(ST_FREE1.x,ST_FREE1.y)); t.eq(pn.p.length,2,"long-press: removed");
    await st.key("m");
    await st.tap(st.scr(st.P("B"))); t.eq(st.P("B").tokens,1,"tap: +1");
    await st.longPress(st.scr(st.P("B"))); t.eq(st.P("B").tokens,0,"long-press: −1");
    await st.sleep(700);
    await st.doubleTap(st.scr(st.P("B"))); t.ok(st.dialogOpen(),"double-tap: number dialog");
    await st.answer("4"); t.eq(st.P("B").tokens,4,"typed");
    await st.key("s");
    await st.sleep(DOUBLE_TAP_MS+100);
    await st.longPress(st.net(ST_FREE2.x,ST_FREE2.y)); t.ok(ctxMenu.isOpen(),"long-press on empty: menu");
    await st.key("Escape");
    await st.touchDrag(st.net(-20,-20), st.net(280,80)); t.eq(sel.size,5,"drag: selection box");
    const z=pn.zoom, c=st.net(140,100);
    st.touchEv("pointerdown",1,{x:c.x-40,y:c.y}); st.touchEv("pointerdown",2,{x:c.x+40,y:c.y});
    for (let i=1;i<=5;i++) { st.touchEv("pointermove",1,{x:c.x-40-8*i,y:c.y}); st.touchEv("pointermove",2,{x:c.x+40+8*i,y:c.y}); await st.frames(1); }
    st.touchEv("pointerup",1,{x:c.x-80,y:c.y}); st.touchEv("pointerup",2,{x:c.x+80,y:c.y}); await st.frames();
    t.ok(pn.zoom>z*1.2,"pinch zoomed in");
});
stTest("Status bar: file name, and desktop or touch wording", async t=>{
    ccursor.x=st.net(ST_FREE2.x,ST_FREE2.y).x; ccursor.y=st.net(ST_FREE2.x,ST_FREE2.y).y; pn.highlighted=null;
    lastPointer="mouse"; const d=currentHint();
    t.ok(/Right-click/.test(d) && !/Long-press|Tap|two fingers/i.test(d),"desktop: mouse words only");
    lastPointer="touch"; const m=currentHint();
    t.ok(/Long-press/.test(m) && !/Ctrl|Right-click|Space/.test(m),"touch: touch words only");
    lastPointer="mouse";
    t.eq(fm.name,"selftest.pn","file name known to the status bar");
});
stTest("Toolbar wraps on a narrow (phone) screen", async t=>{
    bar.layout(390);
    t.ok(bar.b.every(b=>b.x+b.w/2<=390),"all buttons inside 390 px"); t.ok(bar.h>40,"several rows");
    bar.layout(ww);
});
stTest("Preferences: a value is clickable where it is drawn", async t=>{
    const c=fp.gridShown;
    ccursor.x=fp.x+c.x+3; ccursor.y=fp.y+c.y;
    t.ok(c.hover(),"hit test matches the drawing");
});
stTest("Labels measure with their alignment (no canvas warnings)", async t=>{
    const l=new Label("abc",0,0);
    t.eq(l.align,"center","alignment set"); t.ok(l.width>0,"width measured");
});
stTest("A click that only focuses the window does nothing", async t=>{
    await st.key("p");
    events.focusevent(); await st.click(st.net(ST_FREE1.x,ST_FREE1.y)); t.eq(pn.p.length,2,"swallowed");
    await st.sleep(FOCUS_CLICK_MS+80); await st.click(st.net(ST_FREE1.x,ST_FREE1.y)); t.eq(pn.p.length,3,"next click works");
});
stTest("Alt+wheel colours an object (modifiers read from the mouse event)", async t=>{
    const c=st.P("A").color;
    await st.wheel(st.scr(st.P("A")),-100,{alt:true});
    t.ok(st.P("A").color!=c,"colour changed"); t.eq(st.P("A").tokens,1,"tokens unchanged");
});
stTest("Reachability graph", async t=>{
    bfsSteps=3; fbfs.runFrom();
    t.eq(fbfs.nodes.size,2,"two markings: A1 B0 and A0 B1");
});
stTest("Trash button (DEL) deletes the selection", async t=>{
    t.ok(palette.del && palette.del.textContent.includes("DEL"),"trash button with DEL under the tools");
    const n=pn.p.length;
    palette.del.click(); await st.frames();
    t.eq(pn.p.length,n,"nothing selected: nothing deleted"); t.ok(/select/i.test(toastText),"says why");
    await st.click(st.scr(st.P("B"))); t.eq(sel.size,1,"B selected");
    t.ok(!palette.del.classList.contains("off"),"button active");
    palette.del.click(); await st.frames();
    t.ok(!st.P("B"),"B deleted"); t.eq(pn.f.length,2,"its arcs too");
    await st.key("z",{ctrl:true}); t.ok(st.P("B"),"undo brings it back");
});
stTest("Animated build rebuilds the net with the mouse, then restores it", async t=>{
    t.eq(fp.animBuild && fp.animBuild.controlType,"ACTION","PREF has Animated build");
    // a bend, a weight, two tokens and a free label, too
    const f=st.F("T2","A"); const mp=new MidPoint(40,160); f.path.splice(1,0,mp); pn.m.push(mp);
    st.F("A","T1").weight=2; st.P("A").tokens=2;
    const l=new Label("Hello",240,160); pn.addLabel(l);
    pn.newUndo();
    const before=rawSave(), want=abReadNet(before), undoLen=undo.length;
    const ok=await animatedBuild(25, true);
    t.ok(ok,"finished");
    t.eq(AB.missed.join(", "),"","every step done with the mouse / editor");
    t.eq(abDiff(AB.built,want),"","built net equals the original");
    t.eq(rawSave().split("\n").slice(1,-7).join("\n"), before.split("\n").slice(1,-7).join("\n"),"original restored exactly");
    t.eq(undo.length,undoLen,"undo history restored");
    t.ok(!document.querySelector(".ab-cover,.ab-cursor"),"pointer and cover removed");
});
stTest("Help page is available", async t=>{
    const r=await fetch("doc/help.html",{cache:"no-cache"});
    const s=r.ok ? await r.text() : "";
    t.ok(r.ok,"loads"); t.ok(s.includes("id:'gestures'"),"has the gestures chapter");
});

// ----------------------------------------------------------------- runner ---
let stDownloads=[];
async function runSelfTest(only=null) {
    if (runSelfTest.running) return;
    runSelfTest.running=true;
    // remember the user's work and settings
    const saved={
        raw: rawSave(), undo: undo.slice(), undoPtr, name: fm.name, savedBody: fm.savedBody,
        tool, view: {zoom:pn.zoom,cx:pn.cx,cy:pn.cy,vpx:pn.vpx,vpy:pn.vpy},
        clip: sel.clipboard, pasteCount: sel.pasteCount, auto: localStorage.getItem(AUTOSAVE_KEY),
        grid: fp.gridSize.value, snap: fp.snapToGrid.value, bfs: bfsSteps, pointer: lastPointer
    };
    // no real downloads while testing
    const realClick=HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click=function() {
        if (this.download) {
            const name=this.download;
            fetch(this.href).then(r=>r.text()).then(text=>stDownloads.push({name,text}));
            stDownloads.push({name, text:""});
            const i=stDownloads.length-1;
            fetch(this.href).then(r=>r.text()).then(text=>{ stDownloads[i].text=text; });
            return;
        }
        return realClick.call(this);
    };
    stDownloads=[];
    const ui=stPanel();
    const results=[];
    const tests=only ? ST_TESTS.filter(([n])=>n.includes(only)) : ST_TESTS;
    for (const [name, fn] of tests) {
        const r={name, fails:[], checks:0, ms:0};
        const t={
            ok(c,msg){ r.checks++; if (!c) r.fails.push(msg); },
            eq(a,b,msg){ r.checks++; if (a!==b) r.fails.push(msg+": got "+JSON.stringify(a)+", expected "+JSON.stringify(b)); },
            near(a,b,tol,msg){ r.checks++; if (!(Math.abs(a-b)<=tol)) r.fails.push(msg+": got "+(+a).toFixed(2)+", expected "+b); }
        };
        const t0=performance.now();
        ui.start(name);
        try { stBuildNet(); await st.frames(); await fn(t); await st.sleep(30); }
        catch(e) { r.fails.push("error: "+(e && e.message || e)); console.error(e); }
        stResetUI();
        r.ms=Math.round(performance.now()-t0);
        results.push(r);
        ui.done(r);
    }
    // give the user's work back
    HTMLAnchorElement.prototype.click=realClick;
    stResetUI();
    rawLoad(saved.raw);
    pn.clearMarkings();
    undo.length=0; saved.undo.forEach(u=>undo.push(u)); undoPtr=saved.undoPtr;
    fm.name=saved.name; fm.savedBody=saved.savedBody;
    Object.assign; // (the app has its own class Object; assign fields one by one)
    pn.zoom=saved.view.zoom; pn.cx=saved.view.cx; pn.cy=saved.view.cy; pn.vpx=saved.view.vpx; pn.vpy=saved.view.vpy;
    sel.clipboard=saved.clip; sel.pasteCount=saved.pasteCount;
    try { if (saved.auto===null) localStorage.removeItem(AUTOSAVE_KEY); else localStorage.setItem(AUTOSAVE_KEY,saved.auto); } catch(e) {}
    fp.gridSize.value=saved.grid; fp.gridSize.newValue(); fp.snapToGrid.value=saved.snap; fp.snapToGrid.newValue();
    bfsSteps=saved.bfs; lastPointer=saved.pointer;
    setTool(saved.tool);
    bar.layout(ww);
    events.refreshHover();
    ui.summary(results);
    window.selfTestResults=results;
    console.log("Self-test:", results.filter(r=>!r.fails.length).length+"/"+results.length+" passed", results);
    runSelfTest.running=false;
    return results;
}

// results panel (right side; a transparent cover keeps real input away meanwhile)
function stPanel() {
    document.querySelectorAll(".st-cover").forEach(e=>e.remove());
    const cover=document.createElement("div");
    cover.className="st-cover";
    ["mousedown","mouseup","mousemove","wheel","contextmenu","click","pointerdown"].forEach(t=>
        cover.addEventListener(t,e=>{ e.stopPropagation(); if (t=="wheel"||t=="contextmenu") e.preventDefault(); },{passive:false}));
    cover.innerHTML='<div class="st-panel"><h3>Self-test</h3><p class="st-sum">Running… please do not use the editor meanwhile.</p><ol class="st-list"></ol><div class="btns"><button class="ok" disabled>Close</button></div></div>';
    document.body.appendChild(cover);
    const list=cover.querySelector(".st-list"), sum=cover.querySelector(".st-sum"), btn=cover.querySelector("button");
    btn.addEventListener("click",()=>cover.remove());
    let li=null;
    return {
        start(name) { li=document.createElement("li"); li.className="run"; li.textContent=name; list.appendChild(li); li.scrollIntoView({block:"nearest"}); },
        done(r) {
            li.className=r.fails.length?"fail":"pass";
            li.innerHTML=(r.fails.length?"✗ ":"✓ ")+r.name.replace(/</g,"&lt;")+' <small>'+r.ms+' ms</small>';
            if (r.fails.length) { const u=document.createElement("ul"); r.fails.forEach(f=>{ const x=document.createElement("li"); x.textContent=f; u.appendChild(x); }); li.appendChild(u); }
        },
        summary(results) {
            const bad=results.filter(r=>r.fails.length).length;
            sum.textContent = bad ? (bad+" of "+results.length+" tests FAILED") : ("All "+results.length+" tests passed");
            sum.className="st-sum "+(bad?"bad":"good");
            btn.disabled=false; btn.focus();
        }
    };
}
