// Animated build: PREF -> "Animated build  Run ▶"
//
// Rebuilds the loaded net in front of the viewer through the editor's own
// mouse path: a visible pointer moves slowly, picks tools on the palette,
// clicks places and transitions onto the canvas, drags the arcs, bends them,
// and clicks the tokens in. Every click shows a black-and-white ripple.
// Text (names, labels) and numbers (arc weights, large token counts) cannot be
// given with a mouse, so they are typed into the editor's own text box / dialog.
// At the end the original net is put back exactly (ids, colours, angles), and
// the undo history, file name and settings are restored too.
// Click anywhere or press Esc to stop; the original net is restored then too.

const AB={ running:false, stop:false, speed:1, pos:{x:0,y:0}, ui:null };

class AbStop extends Error {}

// ---------------------------------------------------------------- pointer ---
function abFake(x,y,button=0,m={}) {
    return { clientX:x, clientY:y, button, deltaX:0, deltaY:0, deltaMode:0,
             shiftKey:!!m.shift, ctrlKey:false, altKey:false, metaKey:false, preventDefault(){} };
}
function abFrame() { return new Promise(r=>requestAnimationFrame(()=>r())); }
async function abFrames(n=2) { for (let i=0;i<n;i++) await abFrame(); abCheck(); }
function abSleep(ms) {
    return new Promise(r=>setTimeout(r, ms/AB.speed)).then(abCheck);
}
// a step the mouse could not do (spot covered...): done directly, listed in AB.missed
function abMiss(what) { AB.missed.push(what); }
function abCheck() { if (AB.stop) throw new AbStop(); }

function abUI() {
    document.querySelectorAll(".ab-cover,.ab-cursor").forEach(e=>e.remove());
    const cover=document.createElement("div");
    cover.className="ab-cover";
    cover.innerHTML='<div class="ab-caption" hidden><b></b><span></span></div><div class="ab-key" hidden></div>'+
        '<div class="ab-pill">'+(AB.title||"Animated build")+' · '+
        (matchMedia("(pointer: coarse)").matches ? "tap to stop" : "click or Esc to stop")+'</div>';
    ["mousedown","mouseup","mousemove","wheel","contextmenu","click","pointerdown","pointerup","pointermove","dblclick"].forEach(t=>
        cover.addEventListener(t,e=>{
            e.stopPropagation(); e.preventDefault();
            if (t=="mousedown" || t=="pointerdown") AB.stop=true;
        },{passive:false}));
    const cur=document.createElement("div");
    cur.className="ab-cursor";
    cur.innerHTML='<svg width="24" height="30" viewBox="0 0 24 30"><path d="M2 2l0 21 5.5-5 4 9 3.4-1.5-4-8.6 7.6-.4z" fill="#000" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cover);
    document.body.appendChild(cur);
    const keys=e=>{ e.stopPropagation(); e.preventDefault(); if (e.type=="keydown" && e.key=="Escape") AB.stop=true; };
    window.addEventListener("keydown",keys,true);
    window.addEventListener("keyup",keys,true);
    const cap=cover.querySelector(".ab-caption"), keyEl=cover.querySelector(".ab-key");
    let keyTimer=null;
    return {
        cover, cur,
        caption(head, text) {
            cap.hidden=!head && !text;
            cap.querySelector("b").textContent=head||"";
            cap.querySelector("span").textContent=text||"";
        },
        key(text) {
            keyEl.textContent=text; keyEl.hidden=false;
            clearTimeout(keyTimer);
            keyTimer=setTimeout(()=>keyEl.hidden=true, 1100/AB.speed+300);
        },
        place(p) { cur.style.left=p.x+"px"; cur.style.top=p.y+"px"; },
        press(on) { cur.classList.toggle("down",on); },
        remove() {
            cover.remove(); cur.remove();
            window.removeEventListener("keydown",keys,true);
            window.removeEventListener("keyup",keys,true);
        }
    };
}
// black-and-white click ripple
function abRipple(p, right=false) {
    const r=document.createElement("div");
    r.className="ab-click"+(right?" right":"");
    r.style.left=p.x+"px"; r.style.top=p.y+"px";
    document.body.appendChild(r);
    setTimeout(()=>r.remove(), 700);
}
// glide the pointer to p; on the canvas the editor sees every step (hover)
async function abMove(p, canvasEvents=true, m={}) {
    const a={...AB.pos}, d=Math.hypot(p.x-a.x,p.y-a.y);
    const ms=Math.min(1300, 260+d*1.25)/AB.speed;
    const t0=performance.now();
    for (;;) {
        await abFrame(); abCheck();
        const k=Math.min(1,(performance.now()-t0)/ms);
        const e=k<0.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;          // ease in-out
        AB.pos={x:a.x+(p.x-a.x)*e, y:a.y+(p.y-a.y)*e};
        AB.ui.place(AB.pos);
        if (canvasEvents) events.mousemoveevent(abFake(AB.pos.x,AB.pos.y,0,m));
        if (k>=1) break;
    }
    await abFrames(2);
}
async function abClick(p, m={}) {
    await abMove(p, true, m);
    await abSleep(90);
    AB.ui.press(true); abRipple(p);
    events.mousedownevent(abFake(p.x,p.y,0,m)); await abFrames(2);
    await abSleep(60);
    events.mouseupevent(abFake(p.x,p.y,0,m)); AB.ui.press(false); await abFrames(2);
    await abSleep(140);
}
async function abDoubleClick(p) {
    await abMove(p);
    await abSleep(90);
    for (let i=0;i<2;i++) {
        AB.ui.press(true); abRipple(p);
        events.mousedownevent(abFake(p.x,p.y)); await abFrames(1);
        events.mouseupevent(abFake(p.x,p.y)); AB.ui.press(false); await abFrames(1);
        await abSleep(70);
    }
    events.rcvEvent("mdc", abFake(p.x,p.y)); await abFrames(3);
    await abSleep(150);
}
async function abDrag(a, b) {
    await abMove(a);
    await abSleep(90);
    AB.ui.press(true); abRipple(a);
    events.mousedownevent(abFake(a.x,a.y)); await abFrames(2);
    await abMove(b);
    // one more step at the end: the first step of a drag only starts it
    events.mousemoveevent(abFake(b.x+0.5,b.y)); await abFrames(1);
    events.mousemoveevent(abFake(b.x,b.y)); await abFrames(2);
    events.mouseupevent(abFake(b.x,b.y)); AB.ui.press(false); abRipple(b);
    await abFrames(2);
    await abSleep(140);
}
// a DOM button (palette tool, dialog OK)
async function abClickElement(el) {
    const r=el.getBoundingClientRect(), p={x:r.left+r.width/2, y:r.top+r.height/2};
    await abMove(p, false);
    await abSleep(90);
    AB.ui.press(true); abRipple(p); await abSleep(80);
    el.click(); AB.ui.press(false);
    await abFrames(2); await abSleep(140);
}
async function abTool(id) {
    if (tool==id) return;
    const b=palette.el && palette.el.querySelector('button[data-tool="'+id+'"]');
    if (b) await abClickElement(b); else setTool(id);
}
// typing into the editor's text box (names and labels)
async function abTypeIntoTextbox(text, keep=0) {
    const key=(k,code)=>({ key:k, keyCode:code, repeat:false, shiftKey:false, ctrlKey:false, altKey:false,
                           metaKey:false, target:document.body, preventDefault(){} });
    const press=async(k,code)=>{
        events.keydownevent(key(k,code)); await abFrames(1);
        events.keyupevent(key(k,code));   await abFrames(1);
    };
    textbox.ptrCursor=textbox.text.length;
    while (textbox.text.length>keep) { await press("Backspace",8); await abSleep(35); }
    for (const ch of text.slice(keep)) { await press(ch, ch==" "?32:65); await abSleep(75); }   // 65: any printable
    await abSleep(150);
    await press("Enter",13);
}
// typing into a dialog's input, then clicking its OK button
async function abAnswerDialog(value) {
    await abFrames(2);
    const inp=document.querySelector(".dlg input"), ok=document.querySelector(".dlg .ok");
    if (!inp || !ok) return false;
    inp.value="";
    for (const ch of String(value)) { inp.value+=ch; await abSleep(110); }
    await abSleep(150);
    await abClickElement(ok);
    return true;
}

// ------------------------------------------------------------- the build ---
function abScr(x,y) { return { x:(x+pn.vpx)*pn.zoom+pn.cx, y:(y+pn.vpy)*pn.zoom+pn.cy }; }
function abHovered() { return fb.hovered; }
// what would the editor find under this net point? (checked before moving there)
function abHitAt(p) {
    const ox=tcursor.x, oy=tcursor.y;
    tcursor.x=p.x; tcursor.y=p.y;
    const r=pn.getCursoredObject();
    tcursor.x=ox; tcursor.y=oy;
    return r;
}
// a free point on segment a-b where the arc f can be grabbed
function abGrabPoint(f, a, b) {
    for (const s of [0.5,0.4,0.6,0.3,0.7,0.2,0.8,0.15,0.85,0.1,0.9]) {
        const p={x:a.x+(b.x-a.x)*s, y:a.y+(b.y-a.y)*s};
        if (abHitAt(p)===f) return p;
    }
    return null;
}
function abNear(a,b) { return Math.abs(a-b)<0.6; }

// the net to build, as plain data (read through the editor's own loader)
function abReadNet(raw) {
    rawLoad(raw);
    const d={ p:[], t:[], f:[], l:[] };
    pn.p.forEach(o=>d.p.push({ id:o.id, x:o.x, y:o.y, color:o.color, tokens:o.tokens,
        text:o.label.text, lx:o.label.x, ly:o.label.y, lcolor:o.label.color, lsize:o.label.size }));
    pn.t.forEach(o=>d.t.push({ id:o.id, x:o.x, y:o.y, color:o.color, alpha:o.alpha,
        text:o.label.text, lx:o.label.x, ly:o.label.y, lcolor:o.label.color, lsize:o.label.size }));
    pn.f.forEach(f=>d.f.push({ o1:f.o1.id, o2:f.o2.id, subtype:f.subtype, weight:f.weight, color:f.color,
        mids:f.path.slice(1,-1).map(m=>({x:m.x,y:m.y})) }));
    pn.l.forEach(l=>{ if (!l.objectsLabel()) d.l.push({ text:l.text, x:l.x, y:l.y, size:l.size, color:l.color }); });
    return d;
}

async function abBuild(d) {
    const made={};                                   // original id -> new object
    // places
    if (d.p.length) await abTool("PLACE");
    for (const q of d.p) {
        const n=pn.p.length;
        await abClick(abScr(q.x,q.y));
        let o = pn.p.length>n ? pn.p[pn.p.length-1] : null;
        if (!o) { abMiss('place '+q.text); o=new Place(q.x,q.y); pn.addPlace(o); pn.newUndo(); }     // spot was covered
        o.x=q.x; o.y=q.y; o.color=q.color;
        made[q.id]=o;
    }
    // transitions (Shift+click: vertical)
    if (d.t.length) await abTool("TRANSITION");
    for (const q of d.t) {
        const a=((q.alpha%Math.PI)+Math.PI)%Math.PI;
        const vertical = a<0.2 || a>Math.PI-0.2;
        const n=pn.t.length;
        await abClick(abScr(q.x,q.y), vertical?{shift:true}:{});
        let o = pn.t.length>n ? pn.t[pn.t.length-1] : null;
        if (!o) { abMiss('transition '+q.text); o=new Transition(q.x,q.y); pn.addTransition(o); pn.newUndo(); }
        o.x=q.x; o.y=q.y; o.alpha=q.alpha; o.color=q.color;
        made[q.id]=o;
    }
    // names: double-click, type, Enter; then drag the name to its place
    const named=d.p.concat(d.t).filter(q=>q.text!==made[q.id].label.text || !abNear(q.lx,made[q.id].label.x) || !abNear(q.ly,made[q.id].label.y));
    if (named.length) await abTool("SELECT");
    for (const q of named) {
        const o=made[q.id], lbl=o.label;
        lbl.size=q.lsize; lbl.color=q.lcolor;
        if (q.text!==lbl.text) {
            if (q.text==="") lbl.text="";
            else {
                await abDoubleClick(abScr(o.x,o.y));
                if (textbox.active && textbox.referencedLabel===lbl) await abTypeIntoTextbox(q.text);
                if (textbox.active) textbox.cancel();
                if (lbl.text!==q.text) { abMiss('name '+q.text); lbl.text=q.text; pn.newUndo(); }
            }
        }
        if (q.text!=="" && (!abNear(q.lx,lbl.x) || !abNear(q.ly,lbl.y))) {
            await abMove(abScr(lbl.x,lbl.y));
            if (abHovered()===lbl) await abDrag(abScr(lbl.x,lbl.y), abScr(q.lx,q.ly));
            await abSleep(80); cancelFire();
        }
        if (q.text!=='' && (!abNear(q.lx,lbl.x) || !abNear(q.ly,lbl.y))) abMiss('name position '+q.text);   // an empty name is invisible
        lbl.x=q.lx; lbl.y=q.ly;
    }
    // arcs: drag with the Flow, Inhibitor and Reset tools
    const arcs=[];
    for (const kind of ["ENABLER","INHIBITOR","RESET"]) {
        const list=d.f.filter(q=>q.subtype==kind);
        if (!list.length) continue;
        await abTool(kind=="ENABLER"?"FLOW":kind);
        for (const q of list) {
            const a=made[q.o1], b=made[q.o2], n=pn.f.length;
            await abDrag(abScr(a.x,a.y), abScr(b.x,b.y));
            let f = pn.f.length>n ? pn.f[pn.f.length-1] : null;
            if (!f || f.o1!==a || f.o2!==b) {
                if (f && pn.f.length>n) pn.f.splice(n);               // undo anything unexpected
                abMiss('arc '+a.label.text+'→'+b.label.text);
                f=new Flow(a,b); pn.addFlow(f); pn.newUndo();
            }
            f.subtype=q.subtype; f.color=q.color;
            arcs.push([q,f]);
        }
    }
    // bends (drag a segment), weights (double-click, type, OK)
    const bent=arcs.filter(([q])=>q.mids.length), heavy=arcs.filter(([q])=>q.weight!=1 && q.subtype!="RESET");
    if (bent.length || heavy.length) await abTool("SELECT");
    for (const [q,f] of bent.slice().reverse()) {     // newest first: it wins where arcs overlap
        for (const m of q.mids) {
            const k=f.path.length;
            const p0=f.path[k-2], p1=f.conn || f.path[k-1];     // the last segment ends at the connector
            let done=false;
            const press=abGrabPoint(f, p0, p1);
            if (press) {
                await abMove(abScr(press.x,press.y));
                if (abHovered()===f) {
                    await abDrag(abScr(press.x,press.y), abScr(m.x,m.y));
                    await abSleep(60); cancelFire();
                    done = f.path.length==k+1;
                }
            }
            if (!done) { abMiss('bend'); const mp=new MidPoint(m.x,m.y); f.path.splice(f.path.length-1,0,mp); pn.m.push(mp); pn.newUndo(); }
            const mp=f.path[f.path.length-2]; mp.x=m.x; mp.y=m.y;
        }
    }
    for (const [q,f] of heavy) {
        const p0=f.path[0], p1=f.path.length>2 ? f.path[1] : (f.conn||f.path[1]);
        const p=abGrabPoint(f, p0, p1);
        if (p) await abMove(abScr(p.x,p.y));
        if (p && abHovered()===f) {
            await abDoubleClick(abScr(p.x,p.y));
            if (document.querySelector(".dlg")) await abAnswerDialog(q.weight);
        }
        cancelFire();
        if (f.weight!==q.weight) { abMiss('weight'); f.weight=q.weight; pn.newUndo(); }
    }
    // tokens: Marking tool, one click per token (a big number is typed)
    const marked=d.p.filter(q=>q.tokens>0);
    if (marked.length) await abTool("MARKING");
    for (const q of marked) {
        const o=made[q.id];
        if (q.tokens<=6) for (let i=o.tokens;i<q.tokens;i++) { await abClick(abScr(o.x,o.y)); await abSleep(60); }
        else {
            await abDoubleClick(abScr(o.x,o.y));
            if (document.querySelector(".dlg")) await abAnswerDialog(q.tokens);
        }
        if (o.tokens!==q.tokens) { abMiss('tokens '+q.text); o.tokens=q.tokens; pn.newUndo(); }
    }
    // free labels: Label tool click, type
    if (d.l.length) await abTool("LABEL");
    for (const q of d.l) {
        const n=pn.l.length;
        await abClick(abScr(q.x,q.y));
        await abSleep(60);
        let l = pn.l.length>n ? pn.l[pn.l.length-1] : null;
        if (l && textbox.active && textbox.referencedLabel===l) {
            l.size=q.size; textbox.size=q.size;
            await abTypeIntoTextbox(q.text);
        }
        if (textbox.active) textbox.cancel();
        if (!l) { abMiss('label '+q.text); l=new Label(q.text,q.x,q.y); pn.addLabel(l); }
        else if (l.text!==q.text) abMiss('label text '+q.text);
        l.text=q.text; l.size=q.size; l.color=q.color; l.x=q.x; l.y=q.y;
    }
    await abTool("SELECT");
    await abMove({x:ww-60, y:wh-80}, false);
}

// do two nets (from abReadNet) look the same? ids may differ; "" when they do
function abDiff(a,b) {
    const pos=d=>{ const m={}; d.p.concat(d.t).forEach(q=>m[q.id]=q.x+","+q.y); return m; };
    const r=v=>Math.round(v);
    const key={
        places:d=>d.p.map(q=>[q.x,q.y,q.color,q.tokens,q.text,r(q.lx),r(q.ly)].join()).sort().join("|"),
        transitions:d=>d.t.map(q=>[q.x,q.y,q.color,q.alpha.toFixed(3),q.text,r(q.lx),r(q.ly)].join()).sort().join("|"),
        arcs:d=>{ const m=pos(d); return d.f.map(q=>[m[q.o1],m[q.o2],q.subtype,q.weight,q.mids.map(x=>r(x.x)+":"+r(x.y)).join(" ")].join()).sort().join("|"); },
        labels:d=>d.l.map(q=>[q.text,r(q.x),r(q.y),q.size].join()).sort().join("|")
    };
    for (const k in key) if (key[k](a)!==key[k](b)) return k;
    return "";
}

// PREF "Animation speed": 1 = slow, as for watching; bigger = faster
function animSpeed() {
    const v=fp.animSpeed ? +fp.animSpeed.value : 1;
    return Math.max(0.25, Math.min(20, v||1));
}

// ------------------------------------------------------------------ entry ---
async function animatedBuild(speed=animSpeed(), fromSelfTest=false) {
    if (AB.running || (runSelfTest.running && !fromSelfTest)) return false;
    if (pn.p.length+pn.t.length+pn.l.length==0) { showToast("Load or draw a net first, then build it animated"); return false; }
    AB.running=true; AB.stop=false; AB.speed=speed; AB.missed=[]; AB.title="Animated build";
    const saved={
        raw: rawSave(), undo: undo.slice(), undoPtr, name: fm.name, savedBody: fm.savedBody,
        tool, view: {zoom:pn.zoom,cx:pn.cx,cy:pn.cy,vpx:pn.vpx,vpy:pn.vpy},
        snap: fp.snapToGrid.value, pointer: lastPointer, auto: null
    };
    try { saved.auto=localStorage.getItem(AUTOSAVE_KEY); } catch(e) {}
    let ok=false;
    // the view that shows the finished net
    ctxMenu.close(); closeConfirm(); if (textbox.active) textbox.cancel();
    fp.visible=fp.active=false; ff.visible=ff.active=false; fbfs.visible=fbfs.active=false; fb.active=true;
    state.set("IDLE"); cancelFire(); sel.clear(); pn.highlighted=null;
    const d=abReadNet(saved.raw);
    fitView();
    const view={zoom:pn.zoom,cx:pn.cx,cy:pn.cy,vpx:pn.vpx,vpy:pn.vpy};
    AB.ui=abUI();
    try {
        lastPointer="mouse"; events.focusMs=0; events.spaceDown=false;
        fp.snapToGrid.value=false; fp.snapToGrid.newValue();
        pn.clear(); undo.length=0; undoPtr=-1;
        pn.zoom=view.zoom; pn.cx=view.cx; pn.cy=view.cy; pn.vpx=view.vpx; pn.vpy=view.vpy;
        pn.clearMarkings(); pn.newUndo();
        setTool("SELECT");
        AB.pos={x:ww/2, y:wh/2}; AB.ui.place(AB.pos);
        await abSleep(400);
        await abBuild(d);
        await abSleep(500);
        ok=true;
    } catch(e) {
        if (!(e instanceof AbStop)) console.error(e);
    }
    // the exact original back (ids, angles, sticky ends...), with its history
    if (textbox.active) textbox.cancel();
    AB.built=abReadNet(rawSave());                    // what was built (checked by the self-test)
    closeConfirm(); cancelFire(); sel.clear(); state.set("IDLE");
    rawLoad(saved.raw);
    pn.clearMarkings();
    undo.length=0; saved.undo.forEach(u=>undo.push(u)); undoPtr=saved.undoPtr;
    fm.name=saved.name; fm.savedBody=saved.savedBody; updateFileTitle();
    pn.zoom=view.zoom; pn.cx=view.cx; pn.cy=view.cy; pn.vpx=view.vpx; pn.vpy=view.vpy;
    fp.snapToGrid.value=saved.snap; fp.snapToGrid.newValue();
    lastPointer=saved.pointer;
    try { if (saved.auto===null) localStorage.removeItem(AUTOSAVE_KEY); else localStorage.setItem(AUTOSAVE_KEY,saved.auto); } catch(e) {}
    setTool(saved.tool);
    AB.ui.remove(); AB.ui=null;
    AB.running=false;
    events.refreshHover();
    showToast(ok ? "Animated build finished" : "Animated build stopped");
    return ok;
}
