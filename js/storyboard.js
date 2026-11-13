// Storyboards: PREF -> "Story 1/2/3  Run ▶"
//
// Three animated lessons, played with the same visible pointer as the
// Animated build (animbuild.js). Each one builds a net the way a person
// would - with slips that get corrected, deletions, tidying the layout -
// and then experiments with it: firing transitions one by one, stepping
// back and forth, random runs, and the reachability graph from several
// initial markings. A caption tells what happens and why.
// Click anywhere or press Esc to stop. The resulting net stays in the
// editor (unsaved), with its whole undo history.

const SB={ step:0, checks:[], lang:"en", title:"" };

function sbT(hu, en) { return SB.lang=="hu" ? hu : en; }
async function sbCap(hu, en, pause=1700) {
    SB.step++;
    AB.ui.caption(SB.title+"  ·  "+SB.step, sbT(hu,en));
    await abSleep(pause);
}
// expectations, checked by the self-test (and visible in the console)
function sbCheck(ok, what) {
    SB.checks.push({ ok:!!ok, what });
    if (!ok) console.warn("Storyboard check failed: "+what);
    return !!ok;
}

// ------------------------------------------------------------ lookups ---
function sbO(name) {
    return pn.p.find(o=>o.label.text===name) || pn.t.find(o=>o.label.text===name) ||
           pn.l.find(l=>!l.objectsLabel() && l.text===name) || null;
}
function sbF(a, b) { const A=sbO(a), B=sbO(b); return pn.f.find(f=>f.o1===A && f.o2===B) || null; }
function sbAt(o) { return abScr(o.x, o.y); }
function sbXY(x, y) { return abScr(x, y); }

// the view that shows this part of the net (fitView for a planned net)
function sbView(x1, y1, x2, y2) {
    const left=palette.el?60:20, top=bar.h+20, right=ww-20, bottom=wh-HINT_H-110;
    const z=Math.max(ZOOM_MIN, Math.min(1.6, (right-left)/(x2-x1), (bottom-top)/(y2-y1)));
    pn.zoom=z;
    pn.vpx=((left+right)/2-pn.cx)/z-(x1+x2)/2;
    pn.vpy=((top+bottom)/2-pn.cy)/z-(y1+y2)/2;
}

// ---------------------------------------------------- editing actions ---
async function sbRename(o, name) {
    await abDoubleClick(sbAt(o));
    const lbl = o.label || o;
    if (textbox.active && textbox.referencedLabel===lbl) {
        const cur=textbox.text;
        let k=0; while (k<cur.length && k<name.length && cur[k]===name[k]) k++;
        await abTypeIntoTextbox(name, k);
    }
    if (textbox.active) textbox.cancel();
    sbCheck(lbl.text===name, "renamed to "+name);
}
async function sbPlace(name, x, y) {
    await abTool("PLACE");
    const n=pn.p.length;
    await abClick(sbXY(x,y));
    const o = pn.p.length>n ? pn.p[pn.p.length-1] : null;
    if (!sbCheck(o, "new place "+name)) return null;
    if (name) await sbRename(o, name);
    return o;
}
async function sbTrans(name, x, y, vertical=false) {
    await abTool("TRANSITION");
    const n=pn.t.length;
    await abClick(sbXY(x,y), vertical?{shift:true}:{});
    const o = pn.t.length>n ? pn.t[pn.t.length-1] : null;
    if (!sbCheck(o, "new transition "+name)) return null;
    if (name) await sbRename(o, name);
    return o;
}
async function sbArc(a, b, kind="ENABLER") {
    await abTool(kind=="ENABLER" ? "FLOW" : kind);
    const A=sbO(a), B=sbO(b), n=pn.f.length;
    await abDrag(sbAt(A), sbAt(B));
    const f = pn.f.length>n ? pn.f[pn.f.length-1] : null;
    sbCheck(f && f.o1===A && f.o2===B && f.subtype==kind, "arc "+a+" → "+b);
    return f;
}
// bend an arc through the given points (Select tool: drag the line)
async function sbBend(a, b, pts) {
    await abTool("SELECT");
    const f=sbF(a,b);
    if (!sbCheck(f, "arc to bend "+a+" → "+b)) return;
    for (const m of pts) {
        const k=f.path.length, p0=f.path[k-2], p1=f.conn || f.path[k-1];
        const press=abGrabPoint(f, p0, p1);
        if (!sbCheck(press, "grab arc "+a+" → "+b)) return;
        await abMove(abScr(press.x,press.y));
        await abDrag(abScr(press.x,press.y), abScr(m.x,m.y));
        await abSleep(60); cancelFire();
        sbCheck(f.path.length==k+1, "bend added");
    }
}
async function sbWeight(a, b, w) {
    await abTool("SELECT");
    const f=sbF(a,b);
    const p0=f.path[0], p1=f.path.length>2 ? f.path[1] : (f.conn||f.path[1]);
    const p=abGrabPoint(f, p0, p1);
    if (!sbCheck(p, "grab arc for weight")) return;
    await abDoubleClick(abScr(p.x,p.y));
    if (document.querySelector(".dlg")) await abAnswerDialog(w);
    cancelFire();
    sbCheck(f.weight==w, "weight "+w);
}
// tokens with the Marking tool: click +1, right-click −1, many: double-click and type
async function sbTokens(name, n, typed=false) {
    await abTool("MARKING");
    const o=sbO(name);
    if (typed || Math.abs(n-o.tokens)>4) {
        await abDoubleClick(sbAt(o));
        if (document.querySelector(".dlg")) await abAnswerDialog(n);
    }
    while (o.tokens<n) { const t=o.tokens; await abClick(sbAt(o)); if (o.tokens==t) break; }
    while (o.tokens>n) { const t=o.tokens; await sbRightClick(sbAt(o)); if (o.tokens==t) break; }
    sbCheck(o.tokens==n, name+" has "+n+" tokens");
}
// fire one transition by clicking it (Select tool) or with the Marking tool
async function sbFire(name, viaMarking=false) {
    await abTool(viaMarking ? "MARKING" : "SELECT");
    const o=sbO(name), m=pn.mptr;
    if (!sbCheck(o && o.enabled(), name+" is enabled")) return;
    await abClick(sbAt(o));
    // the click fires after a short real-time delay (a double-click would rename)
    const t0=Date.now();
    while (pn.mptr==m && Date.now()-t0<FIRE_DELAY_MS+600) await abFrame();
    await abSleep(300);
    if (!sbCheck(pn.mptr==m+1, name+" fired"))
        console.warn("fire: state "+state.s+" hovered "+(fb.hovered&&fb.hovered.id)+" target "+o.id+" sel "+sel.size+" tool "+tool+" toast "+toastText);
}
async function sbRightClick(p) {
    await abMove(p);
    await abSleep(90);
    AB.ui.press(true); abRipple(p, true);
    events.mousedownevent(abFake(p.x,p.y,2)); await abFrames(2);
    events.mouseupevent(abFake(p.x,p.y,2)); AB.ui.press(false); await abFrames(2);
    await abSleep(200);
}
// right-click, then choose a menu item by (part of) its text
async function sbMenu(p, itemText) {
    await abTool("SELECT");                 // with the other tools right-click deletes / removes a token
    await sbRightClick(p);
    await abSleep(400);
    while (ctxMenu.isOpen() && ctxMenu.tooSoon()) await abFrame();   // the menu ignores a too quick click
    const it = ctxMenu.el && [...ctxMenu.el.querySelectorAll("button.item")].find(b=>b.textContent.includes(itemText) && !b.disabled);
    if (!sbCheck(it, "menu item "+itemText)) {
        console.warn("menu: "+(ctxMenu.el ? [...ctxMenu.el.querySelectorAll("button.item")].map(b=>b.textContent).join(" | ") : "not open")+
            " | state "+state.s+" hovered "+(fb.hovered&&fb.hovered.type)+" at "+Math.round(p.x)+","+Math.round(p.y));
        ctxMenu.close(); return false;
    }
    await abClickElement(it);
    return true;
}
async function sbDragTo(name, x, y) {
    await abTool("SELECT");
    const o=sbO(name);
    await abDrag(sbAt(o), sbXY(x,y));
    await abSleep(60); cancelFire();
}
async function sbDragLabel(name, x, y) {
    await abTool("SELECT");
    const o=sbO(name), l=o.label||o;
    await abMove(abScr(l.x,l.y));
    if (abHovered()===l) await abDrag(abScr(l.x,l.y), sbXY(x,y));
    await abSleep(60); cancelFire();
}
async function sbRubberBand(x1, y1, x2, y2) {
    await abTool("SELECT");
    await abDrag(sbXY(x1,y1), sbXY(x2,y2));
}
// a key press, shown on screen as a key cap
async function sbKey(label, key, m={}) {
    AB.ui.key(label);
    const e={ key, keyCode:key.length==1 ? key.toUpperCase().charCodeAt(0) : 0, repeat:false,
              shiftKey:!!m.shift, ctrlKey:!!m.ctrl, altKey:false, metaKey:false,
              target:document.body, preventDefault(){} };
    await abSleep(250);
    events.keydownevent(e); await abFrames(2);
    events.keyupevent(e); await abFrames(2);
    await abSleep(500);
}
async function sbButton(id) {
    const b=bar.b.find(x=>x.button==id);
    sbCheck(b && b.enabled(), "button "+id+" enabled");
    await abClick({x:b.x, y:b.y});
    await abSleep(150);
}
async function sbWheel(p, dy, n=1, m={}) {
    await abMove(p);
    for (let i=0;i<n;i++) {
        const e=abFake(p.x,p.y,0,m); e.deltaY=dy; e.shiftKey=!!m.shift; e.altKey=!!m.alt; e.ctrlKey=!!m.ctrl;
        events.mousewheelevent(e); await abFrames(2); await abSleep(160);
    }
}
// wait (real time) until the simulation stops by itself, or stop it
async function sbRunFor(button, ms, untilStops=false) {
    await sbButton(button);
    const t0=Date.now();
    while (bar.running() && Date.now()-t0<ms) await abSleep(200*AB.speed);
    if (bar.running()) { sbCheck(!untilStops, button+" stopped by itself"); await sbButton("STOP"); }
    await abSleep(300);
}

// --------------------------------------------------- reachability graph ---
function sbReachInfo() {
    let dead=0, frontier=0;
    if (fbfs.nodes) fbfs.nodes.forEach(n=>{ if (n.dead) dead++; if (n.frontier) frontier++; });
    return { nodes: fbfs.nodes ? fbfs.nodes.size : 0, dead, frontier, truncated: !!fbfs.truncated };
}
async function sbReachOpen() {
    if (!fbfs.visible) await sbButton("REACH");
    await abSleep(900);
    return sbReachInfo();
}
async function sbReachDepth(n) {
    while (bfsSteps<n) { await sbButton("STEPS+"); await abSleep(450); }
    while (bfsSteps>n) { await sbButton("STEPS-"); await abSleep(450); }
    return sbReachInfo();
}
// deeper until every reachable marking is shown (or the limit)
async function sbReachComplete(maxDepth=14) {
    let r=sbReachInfo();
    while (r.frontier>0 && !r.truncated && bfsSteps<maxDepth) { await sbButton("STEPS+"); await abSleep(400); r=sbReachInfo(); }
    await abSleep(700);
    return r;
}
async function sbReachPan(dx, dy) {
    const c={ x:fbfs.x+fbfs.w/2, y:fbfs.y+fbfs.h*0.62 };
    await abDrag(c, {x:c.x+dx, y:c.y+dy});
}
async function sbReachClose() {
    const b=fbfs.closeBox();
    if (!b) return;
    await abClick({x:b.x+b.w/2, y:b.y+b.h/2});
    sbCheck(!fbfs.visible, "reachability window closed with ✕");
}

// ----------------------------------------------------------- tidy labels ---
// how badly does a name at (x,y) collide with arcs, places, transitions
// and other names? (0: free)
function sbLabelScore(l, x, y) {
    const w=(l.width||40)/2+3, h=l.size/2+3;
    let s=0;
    const hitSeg=(a,b)=>{                     // segment vs. the label box (sampled)
        for (let k=0;k<=12;k++) {
            const px=a.x+(b.x-a.x)*k/12, py=a.y+(b.y-a.y)*k/12;
            if (Math.abs(px-x)<w && Math.abs(py-y)<h) return true;
        }
        return false;
    };
    pn.f.forEach(f=>{
        const pts=f.path.slice(0,-1).concat([f.conn||f.path[f.path.length-1]]);
        for (let i=0;i<pts.length-1;i++) if (hitSeg(pts[i],pts[i+1])) { s+=3; break; }
    });
    pn.p.forEach(o=>{ if (Math.abs(o.x-x)<w+20 && Math.abs(o.y-y)<h+20) s+=4; });
    pn.t.forEach(o=>{ const r=(o===l.attached)?18:26; if (Math.abs(o.x-x)<w+r && Math.abs(o.y-y)<h+r) s+=4; });
    pn.p.concat(pn.t).forEach(o=>{ const m=o.label;
        if (m!==l && m.text && Math.abs(m.x-x)<w+(m.width||40)/2 && Math.abs(m.y-y)<h+m.size/2) s+=2; });
    return s;
}
// drag the names that sit on a line or on another object to a free spot nearby
async function sbTidyLabels(max=8) {
    const todo=[];
    pn.p.concat(pn.t).forEach(o=>{
        const l=o.label;
        if (!l.text) return;
        const now=sbLabelScore(l,l.x,l.y);
        if (now==0) return;
        let best=null;
        for (const d of [34,42,52]) for (let k=0;k<16;k++) {
            const a=k*Math.PI/8, x=o.x+Math.cos(a)*(d+(l.width||40)*0.35*Math.abs(Math.cos(a))), y=o.y+Math.sin(a)*d*0.8;
            const sc=sbLabelScore(l,x,y)+d/100;
            if (!best || sc<best.sc) best={x,y,sc};
        }
        if (best && best.sc<now) todo.push({o, l, x:best.x, y:best.y, gain:now-best.sc});
    });
    todo.sort((a,b)=>b.gain-a.gain);
    await abTool("SELECT");
    for (const t of todo.slice(0,max)) {
        await abMove(abScr(t.l.x,t.l.y));
        if (abHovered()===t.l) await abDrag(abScr(t.l.x,t.l.y), abScr(t.x,t.y));
        await abSleep(60); cancelFire();
    }
    return todo.length;
}

// ---------------------------------------------------------- preferences ---
async function sbPref(control, value) {
    if (!fp.visible) { await sbButton("PREF"); await abSleep(700); }
    const c=fp[control];
    if (c.controlType=="BOOLEAN" && c.value===value) return;
    const p={ x:fp.x+c.valueLabel.x+Math.max(10,c.valueLabel.width/2), y:fp.y+c.y };
    await abClick(p);
    if (c.controlType!="BOOLEAN" && document.querySelector(".dlg")) await abAnswerDialog(value);
    await abSleep(500);
    sbCheck(c.value===value, "PREF "+c.text+" = "+value);
}
async function sbPrefClose() {
    if (!fp.visible) return;
    const b=fp.closeBox();
    await abClick({x:b.x+b.w/2, y:b.y+b.h/2});
}

// ------------------------------------------------------------- stories ---
const STORIES=[
{   file:"philosophers.pn", title:{hu:"Étkező filozófusok", en:"Dining philosophers"},
    async run() {
        sbView(-330,-350,330,300);
        await sbCap("Három filozófus ül egy kerek asztalnál, köztük három villa. Enni csak két villával lehet. Előbb egyetlen filozófust rajzolunk meg.",
                    "Three philosophers sit at a round table with three forks between them. Eating needs two forks. First we draw one philosopher only.", 2600);
        // --- one philosopher
        await sbCap("Helyek (P eszköz), dupla kattintással elnevezve: Gond1 = gondolkodik, Bal1 = a bal villa nála van, Eszik1.",
                    "Places (P tool), named by double-click: Gond1 = thinking, Bal1 = holds the left fork, Eszik1 = eating.");
        await sbPlace("Gond1", -95, -185);
        await sbPlace("Bal1", 0, -295);
        // a slip: one place too many
        await sbPlace("", -150, -300);
        await sbCap("Hoppá, egy fölösleges hely. Kijelöljük, és a paletta alján lévő kukával (DEL) töröljük.",
                    "Oops, one place too many. Select it and delete it with the trash can (DEL) at the bottom of the palette.");
        await abTool("SELECT");
        const extra=pn.p[pn.p.length-1];
        await abClick(sbAt(extra));
        await abClickElement(palette.del);
        sbCheck(!pn.p.includes(extra), "extra place deleted");
        await sbPlace("Eszik1", 75, -180);
        await sbPlace("Villa1", -200, -115);
        await sbCap("Átmenetek (T eszköz): BalFel1, JobbFel1 felveszi a villát, Lerak1 leteszi mindkettőt.",
                    "Transitions (T tool): BalFel1 and JobbFel1 pick up a fork, Lerak1 puts both down.");
        await sbTrans("BalFel1", -75, -255);
        await sbTrans("JobbFel1", 75, -255);
        await sbTrans("Lerak1", 0, -140);
        await sbCap("Élek (F eszköz): húzás a forrásból a célba.", "Arcs (F tool): drag from the source to the target.");
        await sbArc("Gond1","BalFel1"); await sbArc("BalFel1","Bal1"); await sbArc("Bal1","JobbFel1");
        await sbArc("JobbFel1","Eszik1");
        // a slip: wrong target, undone
        await sbArc("Eszik1","BalFel1");
        await sbCap("Ez rossz helyre ment: evés után a Lerak1 jön, nem a BalFel1. Visszavonás (UNDO).",
                    "That went to the wrong place: after eating comes Lerak1, not BalFel1. Undo.");
        await sbButton("UNDO");
        sbCheck(!sbF("Eszik1","BalFel1"), "wrong arc undone");
        await sbArc("Eszik1","Lerak1"); await sbArc("Lerak1","Gond1");
        await sbArc("Villa1","BalFel1"); await sbArc("Lerak1","Villa1");
        await sbCap("Tokenek (M eszköz, kattintás = +1): a filozófus gondolkodik, a villa az asztalon.",
                    "Tokens (M tool, click = +1): the philosopher is thinking, the fork lies on the table.");
        await sbTokens("Gond1",1); await sbTokens("Villa1",1);
        // --- copies
        await sbCap("A másik kettőt nem rajzoljuk újra: kijelöljük az egészet (húzás üres helyről), és jobb klikk → Copy.",
                    "The other two are not drawn again: select it all (drag on empty space), then right-click → Copy.");
        await sbRubberBand(-245,-335, 120,-80);
        sbCheck(sel.size>=15, "philosopher selected");
        await sbMenu(sbAt(sbO("Gond1")), "Copy");
        const group=["Gond1","Bal1","Eszik1","Villa1","BalFel1","JobbFel1","Lerak1"];
        for (const k of [2,3]) {
            const ang=(k-1)*2*Math.PI/3, deg=(k-1)*120;
            const g1=sbO("Gond1"), want=rotate(0,0,g1.x,g1.y,ang);
            const xs=group.map(n=>sbO(n).x), ys=group.map(n=>sbO(n).y);
            const c=rotate(0,0,(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2,ang);
            await sbCap(k==2 ? "Jobb klikk egy üres helyre → Paste here, majd a másolaton jobb klikk → Rotate… 120 fok."
                             : "Még egyszer: beillesztés, forgatás 240 fokkal.",
                        k==2 ? "Right-click an empty spot → Paste here, then right-click the copy → Rotate… by 120 degrees."
                             : "Once more: paste, rotate by 240 degrees.");
            const before=pn.p.length;
            await sbMenu(sbXY(c[0],c[1]), "Paste here");
            sbCheck(pn.p.length==before+4, "copy "+k+" pasted");
            const copyG=pn.p.slice(before).find(o=>o.label.text==="Gond1");   // the copy of Gond1
            await sbMenu(sbAt(copyG), "Rotate");
            if (document.querySelector(".dlg")) await abAnswerDialog(deg);
            // drag the copy to its place at the table
            if (Math.hypot(copyG.x-want[0], copyG.y-want[1])>6) {
                await sbCap("Odahúzzuk a helyére.", "Drag it to its place.", 900);
                await abTool("SELECT");
                await abDrag(sbAt(copyG), sbXY(want[0],want[1]));
                await abSleep(60); cancelFire();
            }
            await sbCap("A másolatok neve még ugyanaz, átnevezzük őket (dupla kattintás, javítás).",
                        "The copies still carry the same names; rename them (double-click, fix the number).", 1000);
            const copies=pn.p.slice(before,before+4).concat(pn.t.slice(-3));
            for (const o of copies) await sbRename(o, o.label.text.replace(/1$/, String(k)));
            await abClick(sbXY(0,40));                   // click on empty: deselect
        }
        // --- the shared forks
        await sbCap("Most a közös villák: mindenki a szomszédja villáját veszi fel jobb kézzel, és azt is visszateszi.",
                    "Now the shared forks: everybody picks up the neighbour's fork as the right one, and puts it back.");
        for (const i of [1,2,3]) {
            const j=i%3+1;
            await sbArc("Villa"+j, "JobbFel"+i);
            await sbArc("Lerak"+i, "Villa"+j);
        }
        // --- experiments
        await sbCap("Kísérlet: egyesével tüzelünk (kattintás az engedélyezett átmenetre). Mindhárman felveszik a bal villát…",
                    "Experiment: fire one by one (click an enabled transition). All three pick up their left fork…", 2200);
        await sbFire("BalFel1"); await sbFire("BalFel2"); await sbFire("BalFel3");
        sbCheck(pn.getEnabled().length==0, "deadlock reached");
        await sbCap("Holtpont! Minden villa foglalt, és senki sem tud enni. Egyik átmenet sem engedélyezett.",
                    "Deadlock! Every fork is taken and nobody can eat. No transition is enabled.", 2600);
        await sbCap("STEP− lép vissza a történetben, m0 a kezdő jelöléshez (M0).", "STEP− steps back in the history, m0 goes back to the initial marking M0.", 900);
        await sbButton("STEP_BWD"); await abSleep(500);
        await sbButton("STEP_BWD"); await abSleep(500);
        await sbButton("REWIND"); await abSleep(500);
        sbCheck(pn.mptr==0, "back at M0");
        await sbCap("Elérhetőségi gráf (REACH): minden jelölés, ami M0-ból elérhető. A piros keret holtpontot jelöl.",
                    "Reachability graph (REACH): every marking reachable from M0. A red box is a deadlock.");
        await sbReachOpen();
        let r=await sbReachComplete();
        sbCheck(r.dead>=1, "reachability graph shows the deadlock");
        await sbReachPan(-60, -40);
        await sbCap(r.dead+" holtpont, összesen "+r.nodes+" jelölés. Bezárás a ✕-szel.",
                    r.dead+" deadlock, "+r.nodes+" markings in all. Close it with ✕.", 2200);
        await sbReachClose();
        await sbCap("Véletlen futtatás (PLAY): másodpercenként egy tüzelés. Előbb-utóbb itt is holtpontba jut, és megáll.",
                    "Random run (PLAY): one firing per second. Sooner or later it also deadlocks, and stops.");
        await sbRunFor("PLAY", 30000, true);
        await sbButton("REWIND");
        // --- the fix
        await sbCap("A javítás: egy szemafor 2 tokennel. Egyszerre legfeljebb két filozófus nyúlhat a villákért.",
                    "The fix: a semaphore with 2 tokens. At most two philosophers may reach for the forks at a time.", 2200);
        await sbPlace("Szemafor", 0, 0);
        await sbTokens("Szemafor", 2);
        for (const i of [1,2,3]) {
            await sbArc("Szemafor", "BalFel"+i);
            await sbArc("Lerak"+i, "Szemafor");
        }
        await sbCap("Az elrendezés javítása: a vonalakra lógó neveket szabad helyre húzzuk.",
                    "Tidying the layout: names lying on lines are dragged to a free spot.", 1500);
        await sbTidyLabels(10);
        await sbCap("Újra REACH: ugyanabból a kezdő jelölésből most nincs holtpont.",
                    "REACH again: from the same initial marking there is no deadlock now.");
        await sbReachOpen();
        r=await sbReachComplete();
        sbCheck(r.dead==0 && r.frontier==0, "no deadlock with the semaphore (2)");
        await sbCap("Nincs holtpont, "+r.nodes+" elérhető jelölés.", "No deadlock, "+r.nodes+" reachable markings.", 2000);
        await sbReachClose();
        await sbCap("Mi van, ha a szemaforban 3 token van? Más M0, újra REACH.", "What if the semaphore has 3 tokens? Another M0, REACH again.");
        await sbTokens("Szemafor", 3);
        await sbReachOpen();
        r=await sbReachComplete();
        sbCheck(r.dead>=1, "3 tokens: deadlock again");
        await sbCap("3 tokennel újra lehet holtpont: a szemafor ilyenkor senkit sem tart vissza.",
                    "With 3 tokens the deadlock is back: the semaphore holds nobody back.", 2200);
        await sbReachClose();
        await sbCap("Jobb klikk (M eszköz) = −1 token: vissza 2-re, és gyors véletlen futtatás (RUN).",
                    "Right-click (M tool) = −1 token: back to 2, then a fast random run (RUN).");
        await sbTokens("Szemafor", 2);
        await sbRunFor("RUN", 7000);
        sbCheck(pn.getEnabled().length>0, "still running fine after RUN");
        await sbCap("Kész. A háló a szerkesztőben marad: kísérletezz tovább, vagy mentsd el (SAVE).",
                    "Done. The net stays in the editor: experiment further, or save it (SAVE).", 2500);
    }
},
{   file:"producer-consumer.pn", title:{hu:"Termelő–fogyasztó", en:"Producer–consumer"},
    async run() {
        sbView(-360,-230,360,250);
        await sbCap("Egy termelő árut tesz egy pufferbe, egy fogyasztó kiveszi. Mennyi áru gyűlhet össze?",
                    "A producer puts items into a buffer, a consumer takes them out. How many items can pile up?", 2400);
        await sbCap("A termelő: két hely és két átmenet egy körben.", "The producer: two places and two transitions in a cycle.");
        await sbPlace("Termel", -250, -120);
        await sbTrans("gyárt", -250, -30);
        await sbPlace("Kész", -250, 60);
        await sbTrans("betesz", -250, 150);
        await sbArc("Termel","gyárt"); await sbArc("gyárt","Kész"); await sbArc("Kész","betesz"); await sbArc("betesz","Termel");
        await sbCap("A visszafelé menő élet két töréssel szépen kivezetjük oldalra.", "The arc going back gets two bend points, out to the side.");
        await sbBend("betesz","Termel",[{x:-330,y:150},{x:-330,y:-120}]);
        await sbCap("A puffer: elsőre véletlenül átmenetet tettünk le. Jobb klikk → Convert to place.",
                    "The buffer: by mistake a transition went down first. Right-click → Convert to place.");
        await sbTrans("Puffer", 0, 150);
        await sbMenu(sbAt(sbO("Puffer")), "Convert to place");
        sbCheck(sbO("Puffer") && sbO("Puffer").type=="PLACE", "buffer converted to a place");
        await sbArc("betesz","Puffer");
        await sbCap("A fogyasztó ugyanígy, a jobb oldalon.", "The consumer the same way, on the right.");
        await sbPlace("Fogyaszt", 250, -120);
        await sbTrans("kivesz", 250, -30);
        await sbPlace("Kivett", 250, 60);
        await sbTrans("elfogyaszt", 250, 150);
        await sbArc("Fogyaszt","kivesz"); await sbArc("kivesz","Kivett"); await sbArc("Kivett","elfogyaszt"); await sbArc("elfogyaszt","Fogyaszt");
        await sbBend("elfogyaszt","Fogyaszt",[{x:330,y:150},{x:330,y:-120}]);
        // a slip: arc to the wrong transition, deleted with the menu
        await sbArc("Puffer","elfogyaszt");
        await sbCap("Hiba: a pufferből a kivesz átmenetbe kell az él, nem az elfogyasztba. Jobb klikk az élen → Delete.",
                    "Mistake: the buffer arc belongs to 'kivesz', not 'elfogyaszt'. Right-click the arc → Delete.");
        {   const f=sbF("Puffer","elfogyaszt"), p=abGrabPoint(f, f.path[0], f.conn||f.path[1]);
            await sbMenu(abScr(p.x,p.y), "Delete");
            sbCheck(!sbF("Puffer","elfogyaszt"), "wrong arc deleted"); }
        await sbArc("Puffer","kivesz");
        await sbTokens("Termel",1); await sbTokens("Fogyaszt",1);
        await sbCap("Elrendezés: a puffer jobban mutat középen, a két kör között.", "Layout: the buffer looks better in the middle, between the two cycles.", 1200);
        await sbDragTo("Puffer", 0, 60);
        // --- runs
        await sbCap("Lépésenként: STEP+ egy véletlen engedélyezett átmenetet tüzel, STEP− visszalép.",
                    "Step by step: STEP+ fires a random enabled transition, STEP− steps back.");
        for (let i=0;i<5;i++) { await sbButton("STEP_FWD"); await abSleep(450); }
        await sbButton("STEP_BWD"); await abSleep(450); await sbButton("STEP_BWD"); await abSleep(450);
        await sbCap("PLAY: véletlen futás, másodpercenként egy tüzelés. Figyeld a puffert!", "PLAY: a random run, one firing per second. Watch the buffer!");
        await sbRunFor("PLAY", 9000);
        await sbButton("REWIND");
        await sbCap("REACH: hány jelölés érhető el? Mélyítsünk a + gombbal…", "REACH: how many markings are reachable? Go deeper with +…");
        await sbReachOpen();
        let r1=await sbReachDepth(3);
        let r2=await sbReachDepth(6);
        sbCheck(r2.frontier>0 && r2.nodes>r1.nodes, "unbounded: still more beyond depth 6");
        await sbReachPan(0,-80);
        await sbCap("Mindig van tovább (szaggatott keretek): a puffer korlátlanul nőhet. A háló nem korlátos.",
                    "There is always more (dashed boxes): the buffer can grow without limit. The net is unbounded.", 2400);
        await sbReachClose();
        // --- the fix
        await sbCap("Javítás: a puffer mellé egy 'Szabad' hely, ami a szabad férőhelyeket számolja (most 2).",
                    "Fix: next to the buffer a place 'Szabad' counting the free slots (2 for now).");
        await sbPlace("Szabad", 0, -120);
        await sbTokens("Szabad", 2);
        await sbArc("Szabad","betesz"); await sbArc("kivesz","Szabad");
        await sbReachOpen();
        let r=await sbReachComplete();
        sbCheck(r.frontier==0 && r.dead==0, "bounded, no deadlock");
        await sbCap("Most a gráf teljes: "+r.nodes+" jelölés, holtpont nincs. A háló korlátos.",
                    "Now the graph is complete: "+r.nodes+" markings, no deadlock. The net is bounded.", 2200);
        await sbReachClose();
        await sbCap("Más M0: a puffer 4 helyes (dupla kattintás a helyen, és beírjuk). Hogyan nő az állapottér?",
                    "Another M0: a 4-slot buffer (double-click the place and type it). How does the state space grow?");
        await sbTokens("Szabad", 4, true);
        await sbReachOpen();
        const r4=await sbReachComplete();
        sbCheck(r4.nodes>r.nodes && r4.dead==0, "4 slots: more markings");
        await sbCap("4 hellyel "+r4.nodes+" jelölés ("+r.nodes+" helyett).", "4 slots: "+r4.nodes+" markings (instead of "+r.nodes+").", 2000);
        await sbReachClose();
        await sbCap("Kísérlet: a fogyasztó egyszerre 2 árut vigyen el. Dupla kattintás az élen → súly 2.",
                    "Experiment: the consumer takes 2 items at once. Double-click the arc → weight 2.");
        await sbWeight("Puffer","kivesz",2);
        await sbWeight("kivesz","Szabad",2);
        await sbTokens("Szabad", 1);
        await sbReachOpen();
        const rw=await sbReachComplete();
        sbCheck(rw.dead>=1, "weight 2 with 1 slot: deadlock");
        await sbCap("1 szabad hellyel a fogyasztó sosem kap 2 árut: holtpont (piros).", "With 1 slot the consumer never gets 2 items: deadlock (red).", 2400);
        await sbReachClose();
        await sbTokens("Szabad", 3);
        await sbReachOpen();
        const r3=await sbReachComplete();
        sbCheck(r3.dead==0, "3 slots: no deadlock");
        await sbCap("3 hellyel már nincs holtpont ("+r3.nodes+" jelölés).", "With 3 slots there is no deadlock ("+r3.nodes+" markings).", 2000);
        await sbReachClose();
        await sbCap("Végül gyors futás (FLY), aztán STOP.", "Finally a fast run (FLY), then STOP.");
        await sbRunFor("FLY", 4000);
        await sbCap("Kész. A háló a szerkesztőben marad, mentheted (SAVE).", "Done. The net stays in the editor, you can save it (SAVE).", 2500);
    }
},
{   file:"mutex.pn", title:{hu:"Kölcsönös kizárás", en:"Mutual exclusion"},
    async run() {
        sbView(-330,-250,330,240);
        await sbCap("Két folyamat ugyanazt az erőforrást használja. Soha nem lehetnek egyszerre a kritikus szakaszban.",
                    "Two processes use the same resource. They must never be in the critical section at the same time.", 2400);
        await sbCap("Az A folyamat: pihen → belép → kritikus → kilép.", "Process A: idle → enter → critical → exit.");
        await sbPlace("A_pihen", -170, -150);
        await sbTrans("A_be", -170, -60);
        await sbPlace("A_krit", -170, 30);
        await sbTrans("A_ki", -170, 120);
        await sbArc("A_pihen","A_be"); await sbArc("A_be","A_krit"); await sbArc("A_krit","A_ki"); await sbArc("A_ki","A_pihen");
        await sbBend("A_ki","A_pihen",[{x:-250,y:120},{x:-250,y:-150}]);
        await sbTokens("A_pihen",1);
        await sbCap("B ugyanilyen: másolat (jobb klikk → Copy, Paste here), majd átnevezés.", "B is the same: a copy (right-click → Copy, Paste here), then rename.");
        await sbRubberBand(-280,-200,-100,170);
        await sbMenu(sbAt(sbO("A_krit")), "Copy");
        const before=pn.p.length, tb=pn.t.length;
        await sbMenu(sbXY(170,-15), "Paste here");
        const copies=pn.p.slice(before).concat(pn.t.slice(tb));
        await abClick(sbXY(0,200));
        for (const o of copies) await sbRename(o, o.label.text.replace(/^A_/,"B_"));
        await sbCap("Futtatás előtt töréspont: PREF → Breakpoint be, feltétel: A_krit + B_krit > 1.",
                    "Before running, a breakpoint: PREF → Breakpoint on, condition: A_krit + B_krit > 1.");
        await sbPref("assertString", "A_krit + B_krit > 1");
        await sbPref("assertOnOff", true);
        await sbPrefClose();
        await sbCap("RUN: gyors véletlen futás. A töréspont megállítja, amint mindkettő kritikus.",
                    "RUN: a fast random run. The breakpoint stops it as soon as both are critical.");
        await sbRunFor("RUN", 15000, true);
        sbCheck(sbO("A_krit").tokens+sbO("B_krit").tokens>1, "breakpoint: both critical");
        await sbCap("Megállt: A és B egyszerre kritikus. Ez a hiba, amit keresünk.", "Stopped: A and B are critical at the same time. That is the bug we are after.", 2400);
        await sbButton("REWIND");
        await sbReachOpen();
        let r=await sbReachComplete();
        await sbCap("A REACH is mutatja: "+r.nodes+" jelölés, köztük a hibás, ahol A_krit és B_krit is 1.",
                    "REACH shows it too: "+r.nodes+" markings, among them the bad one where A_krit and B_krit are both 1.", 2200);
        await sbReachClose();
        await sbCap("Javítás: egy Mutex hely 1 tokennel. Belépéskor elvesszük, kilépéskor visszaadjuk.",
                    "Fix: a Mutex place with 1 token. Taken on entry, given back on exit.");
        await sbPlace("Mutex", 0, -15);
        await sbTokens("Mutex",1);
        await sbArc("Mutex","A_be"); await sbArc("Mutex","B_be");
        await sbArc("A_ki","Mutex"); await sbArc("B_ki","Mutex");
        await sbCap("Elrendezés: a Mutex címkéje kerüljön a hely fölé.", "Layout: the Mutex label goes above the place.", 900);
        await sbDragLabel("Mutex", 0, -50);
        await sbCap("Újra RUN 10 másodpercig: a töréspont most nem áll meg.", "RUN again for 10 seconds: the breakpoint does not stop it now.");
        await sbRunFor("RUN", 10000);
        sbCheck(sbO("A_krit").tokens+sbO("B_krit").tokens<=1, "never both critical");
        await sbButton("REWIND");
        await sbReachOpen();
        r=await sbReachComplete();
        sbCheck(r.nodes==3 && r.dead==0, "3 markings, no deadlock");
        await sbCap("REACH: már csak "+r.nodes+" jelölés, egyikben sem kritikus mindkettő. Holtpont sincs.",
                    "REACH: only "+r.nodes+" markings now, none with both critical. No deadlock either.", 2200);
        await sbReachClose();
        await sbCap("Kíváncsiságból: mi lesz, ha a Mutexben 2 token van? Más M0 → REACH.", "Out of curiosity: what if Mutex has 2 tokens? Another M0 → REACH.");
        await sbTokens("Mutex",2);
        await sbReachOpen();
        r=await sbReachComplete();
        sbCheck(r.nodes>3, "2 tokens: more markings");
        await sbCap("2 tokennel megint "+r.nodes+" jelölés: a kizárás elveszett.", "With 2 tokens there are "+r.nodes+" markings again: the exclusion is gone.", 2200);
        await sbReachClose();
        await sbTokens("Mutex",1);
        await sbCap("Végül a töréspontot kikapcsoljuk (PREF), hogy ne zavarjon később.", "Finally switch the breakpoint off (PREF) so it does not interfere later.");
        await sbPref("assertOnOff", false);
        await sbPrefClose();
        await sbCap("Kész. A háló a szerkesztőben marad, mentheted (SAVE).", "Done. The net stays in the editor, you can save it (SAVE).", 2500);
    }
}
];

// ---------------------------------------------------------------- entry ---
function runStory(i, speed=animSpeed()) {
    if (AB.running || runSelfTest.running) return;
    unlessUnsaved(()=>playStory(i, speed), "Discard and start");
}
async function playStory(i, speed=animSpeed(), fromSelfTest=false) {
    if (AB.running || (runSelfTest.running && !fromSelfTest)) return false;
    const story=STORIES[i];
    AB.running=true; AB.stop=false; AB.speed=speed;
    SB.lang=(navigator.language||"en").toLowerCase().startsWith("hu") ? "hu" : "en";
    SB.title=sbT(story.title.hu, story.title.en); SB.step=0; SB.checks=[];
    AB.title=SB.title;
    const saved={ pointer:lastPointer, assertOn:fp.assertOnOff.value, assert:fp.assertString.value, depth:bfsSteps };
    ctxMenu.close(); closeConfirm(); if (textbox.active) textbox.cancel();
    fp.visible=fp.active=false; ff.visible=ff.active=false; fbfs.visible=fbfs.active=false; fb.active=bar.active=true;
    state.set("IDLE"); cancelFire(); sel.clear(); pn.highlighted=null;
    AB.ui=abUI();
    let ok=false;
    try {
        lastPointer="mouse"; events.focusMs=0; events.spaceDown=false;
        AB.pos={x:ww/2, y:wh/2}; AB.ui.place(AB.pos);
        await sbButton("CLEAR");                 // NEW
        // unsaved changes: the person has already agreed to discard them
        if (confirmOpen()) await abClickElement(document.querySelector(".dlg .ok"));
        sbCheck(pn.p.length+pn.t.length+pn.l.length==0, "empty net to start with");
        setFileName(story.file);
        bfsSteps=3;
        setTool("SELECT");
        await story.run();
        ok=true;
    } catch(e) {
        if (!(e instanceof AbStop)) { console.error(e); sbCheck(false, "error: "+e.message); }
    }
    if (textbox.active) textbox.cancel();
    closeConfirm(); ctxMenu.close(); cancelFire();
    if (bar.running()) state.set("IDLE");
    if (fbfs.visible) { fbfs.visible=fbfs.active=false; fb.active=true; }
    if (fp.visible) { fp.visible=fp.active=false; fb.active=true; }
    state.set("IDLE");
    fp.assertOnOff.value=saved.assertOn; fp.assertOnOff.newValue();
    fp.assertString.value=saved.assert; fp.assertString.newValue();
    lastPointer=saved.pointer;
    setTool("SELECT");
    AB.ui.remove(); AB.ui=null; AB.running=false;
    events.refreshHover();
    const failed=SB.checks.filter(c=>!c.ok).length;
    showToast(ok ? (failed ? "Storyboard finished ("+failed+" step(s) did not go as planned)" : "Storyboard finished")
                 : "Storyboard stopped", 3000);
    return ok;
}
