// One gesture vocabulary for mouse and touch:
//   primary   = click / tap                 -> the tool's main action
//   secondary = right-click / long-press    -> remove with the tool, else menu
//   edit      = double-click / double-tap   -> type a value (name, tokens, weight)
//   drag      = drag                        -> move / draw an arc / select box
//   view      = Space+drag, Ctrl+wheel / two fingers -> pan and zoom
// Touch input is turned into the same mouse events the editor already uses.

const gcv=document.getElementById("petrinetCanvas");   // (main.js defines "canvas" later)
// "mouse" or "touch": adapts hints and editors. Starts from the device type
// (a phone or tablet shows touch hints before the first touch), then follows
// the pointer actually used (touch laptops can switch).
var lastPointer=(window.matchMedia && matchMedia("(hover: none) and (pointer: coarse)").matches)
    ? "touch" : "mouse";
var lastTouchMs=0;
window.addEventListener("pointerdown", e=>{
    lastPointer=(e.pointerType=="touch"?"touch":"mouse");
    if (e.pointerType=="touch") lastTouchMs=Date.now();
}, true);
window.addEventListener("pointerup", e=>{ if (e.pointerType=="touch") lastTouchMs=Date.now(); }, true);
function isTouch() { return lastPointer=="touch"; }
// mouse events the browser derives from touches (they would act twice)
function touchEcho(e) {
    if (!e || !e.isTrusted) return false;          // our own synthesized events
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return true;
    return Date.now()-lastTouchMs<800;
}

// ---- double-click (mouse) ---------------------------------------------------
window.addEventListener("dblclick", e=>{
    if (e.target!==gcv || touchEcho(e)) return;   // touch double-taps are recognized below
    events.rcvEvent("mdc", e);
});

// ---- touch recognizer ------------------------------------------------------
const LONG_PRESS_MS=500, TAP_SLOP=10, DOUBLE_TAP_MS=320, DOUBLE_TAP_SLOP=30;
const touch={
    pts:new Map(),        // pointerId -> {x,y}
    phase:"idle",         // idle | pending | dragging | long | pinch | done
    start:null, timer:null,
    lastTap:null,         // {x,y,t} for double tap
    pinch:null            // {dist, mx, my}
};
function fakeMouse(x,y,button=0) {
    return { clientX:x, clientY:y, button:button, deltaY:0,
             shiftKey:false, ctrlKey:false, altKey:false, metaKey:false };
}
function sendMove(x,y)      { events.mousemoveevent(fakeMouse(x,y)); }
function sendDown(x,y,b=0)  { events.mousedownevent(fakeMouse(x,y,b)); }
function sendUp(x,y,b=0)    { events.mouseupevent(fakeMouse(x,y,b)); }

gcv.style.touchAction="none";          // the page handles all touch gestures
gcv.addEventListener("pointerdown", e=>{
    if (e.pointerType!="touch") return;
    e.preventDefault();                   // no emulated mouse events
    gcv.setPointerCapture(e.pointerId);
    touch.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if (touch.pts.size==1) {
        touch.phase="pending";
        touch.start={x:e.clientX, y:e.clientY, t:Date.now()};
        clearTimeout(touch.timer);
        touch.timer=setTimeout(onLongPress, LONG_PRESS_MS);
        sendMove(e.clientX, e.clientY);    // hover: what is under the finger
    }
    else if (touch.pts.size==2) {
        clearTimeout(touch.timer);
        if (touch.phase=="dragging") {
            // second finger during a drag: cancel the drag, switch to pan/zoom
            events.keydownevent({key:"Escape", keyCode:27, repeat:false,
                shiftKey:false, ctrlKey:false, altKey:false, metaKey:false, preventDefault(){}});
            sendUp(touch.start.x, touch.start.y);
        }
        touch.phase="pinch";
        touch.pinch=pinchState();
    }
}, {passive:false});

gcv.addEventListener("pointermove", e=>{
    if (e.pointerType!="touch" || !touch.pts.has(e.pointerId)) return;
    e.preventDefault();
    touch.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if (touch.phase=="pending") {
        if (Math.hypot(e.clientX-touch.start.x, e.clientY-touch.start.y)>TAP_SLOP) {
            clearTimeout(touch.timer);
            touch.phase="dragging";
            sendDown(touch.start.x, touch.start.y);
            sendMove(e.clientX, e.clientY);
        }
    }
    else if (touch.phase=="dragging") sendMove(e.clientX, e.clientY);
    else if (touch.phase=="pinch" && touch.pts.size>=2) {
        const p=pinchState(), q=touch.pinch;
        pn.vpx+=(p.mx-q.mx)/pn.zoom;
        pn.vpy+=(p.my-q.my)/pn.zoom;
        if (q.dist>0) zoomAt(p.mx, p.my, p.dist/q.dist);
        touch.pinch=p;
    }
}, {passive:false});

function endTouch(e) {
    if (e.pointerType!="touch" || !touch.pts.has(e.pointerId)) return;
    e.preventDefault();
    const pos=touch.pts.get(e.pointerId);
    touch.pts.delete(e.pointerId);
    clearTimeout(touch.timer);
    if (e.type=="pointercancel") {
        if (touch.phase=="dragging") sendUp(pos.x,pos.y);
        touch.phase=touch.pts.size?"done":"idle";
        return;
    }
    if (touch.phase=="pending") {               // a tap
        sendDown(pos.x,pos.y);
        sendUp(pos.x,pos.y);
        const now=Date.now(), lt=touch.lastTap;
        if (lt && now-lt.t<DOUBLE_TAP_MS && Math.hypot(pos.x-lt.x,pos.y-lt.y)<DOUBLE_TAP_SLOP) {
            events.rcvEvent("mdc", fakeMouse(pos.x,pos.y));
            touch.lastTap=null;
        }
        else touch.lastTap={x:pos.x, y:pos.y, t:now};
    }
    else if (touch.phase=="dragging") sendUp(pos.x,pos.y);
    if (touch.pts.size==0) touch.phase="idle";
    else if (touch.phase=="pinch") touch.phase="done";   // one finger left: ignore it
}
gcv.addEventListener("pointerup", endTouch, {passive:false});
gcv.addEventListener("pointercancel", endTouch, {passive:false});

function onLongPress() {
    if (touch.phase!="pending") return;
    touch.phase="long";
    const s=touch.start;
    if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) {
        try { navigator.vibrate(12); } catch(e) {}
    }
    sendDown(s.x, s.y, RIGHTBUTTON);
    sendUp(s.x, s.y, RIGHTBUTTON);
}
function pinchState() {
    const [a,b]=[...touch.pts.values()];
    return { dist:Math.hypot(a.x-b.x,a.y-b.y), mx:(a.x+b.x)/2, my:(a.y+b.y)/2 };
}

// ---- tool semantics shared by mouse and touch -------------------------------

// secondary action (right-click / long-press); returns true if handled
function secondaryAction(o) {
    if (!o) return false;
    const done=()=>{ sel.clear(); pn.highlighted=null; pn.newUndo(); events.refreshHover(); return true; };
    switch (tool) {
        case "MARKING":
            if (o.type=="PLACE") {
                if (o.tokens>0) { o.changeTokens(-1); pn.newUndo(); }
                return true;
            }
            return false;
        case "PLACE":      if (o.type=="PLACE")      { o.delete(); return done(); } return false;
        case "TRANSITION": if (o.type=="TRANSITION") { o.delete(); return done(); } return false;
        case "LABEL":
            if (o.type=="LABEL" && !o.objectsLabel()) { o.delete(); return done(); }
            return false;
        case "FLOW": case "INHIBITOR": case "RESET":
            if (o.type=="FLOW")     { o.delete(); return done(); }
            if (o.type=="MIDPOINT") { o.delete(); return done(); }
            return false;
    }
    return false;
}

// Select tool: a click fires an enabled transition, but only once it is clear
// that it is not the first half of a double-click (which renames instead)
const FIRE_DELAY_MS=280;
let pendingFire=null;
function scheduleFire(t) {
    cancelFire();
    pendingFire=setTimeout(()=>{
        pendingFire=null;
        if (pn.t.includes(t) && t.enabled() && (state.is("IDLE") || bar.running())) pn.fireOne(t);
    }, FIRE_DELAY_MS);
}
function cancelFire() { clearTimeout(pendingFire); pendingFire=null; }

// edit action (double-click / double-tap)
const markClicks={ obj:null, before:0, t:0 };   // to undo the two clicks of a double-click
function primaryMarking(p) {
    const now=Date.now();
    if (markClicks.obj!==p || now-markClicks.t>600) { markClicks.obj=p; markClicks.before=p.tokens; }
    markClicks.t=now;
    p.changeTokens(1);
    pn.newUndo();
}
function editAction(o) {
    cancelFire();
    if (!o) return;
    if (tool=="MARKING" && o.type=="PLACE") {
        if (markClicks.obj===o) o.tokens=markClicks.before;   // the double-click's own +2
        markClicks.obj=null;
        askValue("Tokens in "+o.label.text, o.tokens, "number", v=>{
            const n=Math.max(0, Math.floor(+v||0));
            o.tokens=n; pn.clearMarkings(); pn.newUndo();
        });
        return;
    }
    if (o.type=="FLOW") {
        if (o.subtype=="RESET") { showToast("A reset arc has no weight"); return; }
        askValue("Weight of arc "+o.o1.label.text+" → "+o.o2.label.text, o.weight, "number", v=>{
            o.weight=Math.max(1, Math.floor(+v||1)); pn.newUndo();
        });
        return;
    }
    if (o.type=="PLACE" || o.type=="TRANSITION") { editName(o.label); return; }
    if (o.type=="LABEL") { editName(o); return; }
}
// rename: inline editor with a keyboard, a dialog on touch screens
function editName(lbl) {
    if (isTouch()) {
        askValue("Text", lbl.text, "text", v=>{ lbl.text=(v===""?"-":v); pn.newUndo(); });
    }
    else lbl.clicked();
}

// hint texts for touch screens: same grammar, touch words, no keyboard parts
function touchHint(s) {
    if (!isTouch()) return s;
    const view=/two fingers|pinch/.test(s);
    const out=s.split("  ·  ")
        .filter(p=>!/wheel|Ctrl|Shift|Alt|Space|Esc|Del\b|Arrows|←|→|↑↓|Enter|Hover|0–5|\bS:|middle|Middle|Tools:|pinch|two fingers/.test(p))
        .map(p=>p.replace(/Right-click/g,"Long-press").replace(/right-click/g,"long-press")
                 .replace(/Double-click/g,"Double-tap").replace(/double-click/g,"double-tap")
                 .replace(/Click/g,"Tap").replace(/click/g,"tap"))
        .join("  ·  ");
    return view ? (out ? out+"  ·  " : "")+"Two fingers: pan & zoom" : out;
}
