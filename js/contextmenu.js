// Right-click context menu (HTML overlay above the canvas).
// The menu stops its own mouse events, so they never reach the canvas.

class ContextMenu {
    constructor() {
        this.el=null;
        this.items=[];
        this.active=-1;
    }
    isOpen() { return this.el!==null; }

    // target: hovered object or null; at: {x,y} net coords; cx,cy: page coords
    openFor(target, at, cx, cy) {
        this.close();
        // CAD convention: right-click on an unselected object selects it
        if (target && target.type!="MIDPOINT" && !sel.has(target)) sel.set([target]);
        if (!target && sel.size>0 && !bar.running()) sel.clear();
        this.items=menuItems(target, at);
        if (this.items.length==0) return;
        this.build(cx, cy);
    }

    build(cx, cy) {
        const m=document.createElement("div");
        m.className="ctxmenu";
        m.setAttribute("role","menu");
        ["mousedown","mouseup","mousemove","wheel","contextmenu","click"].forEach(t=>
            m.addEventListener(t, e=>{ e.stopPropagation(); if (t=="contextmenu"||t=="wheel") e.preventDefault(); },
                {passive:false}));
        this.items.forEach((it,i)=>{
            if (it.sep) {
                const s=document.createElement("div"); s.className="sep"; m.appendChild(s); return;
            }
            if (it.title) {
                const h=document.createElement("div"); h.className="title"; h.textContent=it.title; m.appendChild(h); return;
            }
            if (it.colors) {
                const row=document.createElement("div"); row.className="swatches";
                COLORS.forEach(c=>{
                    const b=document.createElement("button");
                    b.className="sw"; b.style.background=c; b.title=c;
                    if (it.current==c) b.classList.add("on");
                    b.addEventListener("click",()=>{ if (this.tooSoon()) return; this.close(); it.action(c); afterMenuAction(); });
                    row.appendChild(b);
                });
                m.appendChild(row); return;
            }
            const b=document.createElement("button");
            b.className="item"; b.setAttribute("role","menuitem");
            b.disabled=it.enabled===false;
            b.innerHTML=`<span>${it.label}</span><kbd>${it.key||""}</kbd>`;
            b.addEventListener("click",()=>{ if (b.disabled || this.tooSoon()) return; this.close(); it.action(); afterMenuAction(); });
            b.addEventListener("mouseenter",()=>this.setActive(i));
            it.btn=b;
            m.appendChild(b);
        });
        document.body.appendChild(m);
        // on touch: open beside the finger, not under it
        if (isTouch()) { cx+=16; cy-=8; }
        // keep inside the window
        const r=m.getBoundingClientRect();
        m.style.left=Math.max(4, Math.min(cx, window.innerWidth-r.width-4))+"px";
        m.style.top =Math.max(4, Math.min(cy, window.innerHeight-r.height-4))+"px";
        this.el=m;
        this.active=-1;
        this.openedAt=Date.now();
    }
    // the click that ends a long-press must not choose an item
    tooSoon() { return Date.now()-this.openedAt<450; }

    close() {
        if (this.el) { this.el.remove(); this.el=null; }
        this.items=[];
    }

    setActive(i) {
        this.items.forEach(it=>{ if (it.btn) it.btn.classList.remove("active"); });
        this.active=i;
        if (i>=0 && this.items[i].btn) this.items[i].btn.classList.add("active");
    }

    // keyboard navigation while open; returns true if the key was used
    key(e) {
        if (!this.isOpen()) return false;
        const usable=this.items.map((it,i)=>it.btn && !it.btn.disabled ? i : -1).filter(i=>i>=0);
        if (e.key=="Escape") { this.close(); }
        else if (e.key=="ArrowDown" || e.key=="ArrowUp") {
            if (usable.length) {
                let p=usable.indexOf(this.active);
                p = e.key=="ArrowDown" ? (p+1)%usable.length : (p<=0?usable.length-1:p-1);
                this.setActive(usable[p]);
            }
        }
        else if (e.key=="Enter" && this.active>=0) { this.items[this.active].btn.click(); }
        e.preventDefault();
        return true;
    }
}

const ctxMenu=new ContextMenu();
window.addEventListener("blur",()=>ctxMenu.close());
window.addEventListener("resize",()=>ctxMenu.close());

function afterMenuAction() {
    pn.highlighted=null;
    events.refreshHover();
}

// ---------------------------------------------------------------------------
// Menu contents per target
function menuItems(o, at) {
    const items=[];
    const running=bar.running();
    const multi = o && sel.has(o) && sel.size>1;

    if (running) {
        items.push({label:"Stop simulation", key:"", action:()=>state.set("IDLE")});
        if (o && o.type=="PLACE") {
            items.push({sep:true});
            items.push(...tokenItems(o));
        }
        return items;
    }

    if (multi) {
        const n=sel.size;
        items.push({title:n+" objects selected"});
        items.push({label:"Copy", key:"Ctrl+C", action:()=>{ sel.copy(); showToast(n+" objects copied"); }});
        items.push({label:"Cut", key:"Ctrl+X", action:()=>{ sel.cut(); showToast(n+" objects cut"); }});
        items.push({label:"Duplicate", key:"Ctrl+D", action:()=>sel.duplicate()});
        items.push({label:"Rotate…", key:"Shift+wheel", action:()=>askValue("Rotate the selection by (degrees, clockwise)", "90", "text", v=>{
            const d=parseFloat(String(v).replace(",","."));
            if (!isFinite(d)) { showToast("Not a number: "+v); return; }
            sel.rotateBy(d*Math.PI/180); pn.newUndo(); showToast("Rotated by "+d+"\u00b0");
        })});
        items.push({sep:true});
        items.push({colors:true, current:o.color, action:c=>{ sel.items().forEach(x=>x.color=c); pn.newUndo(); }});
        items.push({sep:true});
        items.push({label:"Delete "+n+" objects", key:"Del", action:()=>{ sel.deleteAll(); pn.newUndo(); }});
        return items;
    }

    if (!o) {
        items.push({label:"Paste here", key:"Ctrl+V", enabled:!!sel.clipboard,
            action:()=>{ sel.pasteAt(at); showToast(objectsText(countOf(sel.clipboard))+" pasted"); }});
        items.push({label:"Select all", key:"Ctrl+A", enabled:pn.p.length+pn.t.length+pn.l.length>0,
            action:()=>sel.selectAll()});
        items.push({sep:true});
        items.push({label:"New place", key:"P", action:()=>addAt("PLACE",at)});
        items.push({label:"New transition", key:"T", action:()=>addAt("TRANSITION",at)});
        items.push({label:"New label", key:"L", action:()=>addAt("LABEL",at)});
        items.push({sep:true});
        const enabled=pn.getEnabled().length>0;
        items.push({label:"Fire a random transition", enabled:enabled, action:()=>pn.stepForward()});
        items.push({label:"Run simulation", enabled:enabled, action:()=>state.set("RUN")});
        items.push({label:"Back to initial marking", enabled:pn.mptr>0, action:()=>pn.rewind()});
        return items;
    }

    if (o.type=="PLACE") {
        items.push({title:"Place "+o.label.text});
        items.push(...tokenItems(o));
        items.push({sep:true});
        items.push({label:"Set tokens…", key:"M, double-click", action:()=>{ const t=tool; tool="MARKING"; markClicks.obj=null; editAction(o); tool=t; }});
        items.push({label:"Rename…", key:"double-click", action:()=>editName(o.label)});
        items.push({label:"Convert to transition", enabled:pn.noFlowFromHere(o),
            action:()=>convert(o)});
        items.push(...commonTail(o));
    }
    else if (o.type=="TRANSITION") {
        items.push({title:"Transition "+o.label.text});
        items.push({label:"Fire", key:"M, click", enabled:o.enabled(), action:()=>pn.fireOne(o)});
        items.push({label:"Rotate 90°", key:"wheel", action:()=>{ o.alpha=(o.alpha+Math.PI/2)%(2*Math.PI); pn.newUndo(); }});
        items.push({label:"Sticky arrowheads", key:"S", action:()=>{
            pn.f.forEach(f=>{ if (f.o2==o) f.stickyHead=!f.stickyHead; }); pn.newUndo(); }});
        items.push({sep:true});
        items.push({label:"Rename…", key:"double-click", action:()=>editName(o.label)});
        items.push({label:"Convert to place", enabled:pn.noFlowFromHere(o), action:()=>convert(o)});
        items.push(...commonTail(o));
    }
    else if (o.type=="FLOW") {
        const kinds=[["ENABLER","Normal arc"]];
        if (o.o1.type=="PLACE") kinds.push(["INHIBITOR","Inhibitor arc"]);
        if (o.o1.type=="TRANSITION") kinds.push(["RESET","Reset arc"]);
        items.push({title:"Arc "+o.o1.label.text+" → "+o.o2.label.text});
        kinds.forEach(k=>items.push({label:(o.subtype==k[0]?"✓ ":"   ")+k[1], enabled:o.subtype!=k[0],
            action:()=>{ o.subtype=k[0]; pn.newUndo(); }}));
        items.push({sep:true});
        items.push({label:"Set weight…   (now "+o.weight+")", key:"double-click", enabled:o.subtype!="RESET",
            action:()=>editAction(o)});
        items.push({label:"Weight +1", key:"wheel", enabled:o.subtype!="RESET",
            action:()=>{ o.weight++; pn.newUndo(); }});
        items.push({label:"Weight −1", key:"wheel", enabled:o.subtype!="RESET" && o.weight>1,
            action:()=>{ o.weight--; pn.newUndo(); }});
        items.push({label:"Remove bend points", enabled:o.path.length>2,
            action:()=>{ o.path=[o.o1,o.o2]; pn.newUndo(); }});
        items.push(...commonTail(o));
    }
    else if (o.type=="LABEL") {
        items.push({label:"Edit text…", key:"double-click", action:()=>editName(o)});
        items.push({label:"Larger", key:"wheel", action:()=>{ o.size+=2; pn.newUndo(); }});
        items.push({label:"Smaller", key:"wheel", enabled:o.size>8, action:()=>{ o.size=Math.max(8,o.size-2); pn.newUndo(); }});
        if (o.attached) items.push({label:"Detach from object", action:()=>{
            const a=o.attached; o.setAttached(null); a.detach(o); pn.newUndo(); }});
        items.push(...commonTail(o));
    }
    else if (o.type=="MIDPOINT") {
        items.push({label:"Delete bend point", key:"Del", action:()=>{ o.delete(); pn.newUndo(); }});
    }
    return items;
}

function tokenItems(p) {
    return [
        {label:"Add token", key:"wheel ↑", action:()=>{ p.changeTokens(1); pn.newUndo(); }},
        {label:"Remove token", key:"wheel ↓", enabled:p.tokens>0, action:()=>{ p.changeTokens(-1); pn.newUndo(); }},
        {label:"Clear tokens", key:"middle click", enabled:p.tokens>0, action:()=>{ p.changeTokens(-p.tokens); pn.newUndo(); }}
    ];
}
function commonTail(o) {
    return [
        {sep:true},
        {colors:true, current:o.color, action:c=>{ o.color=c; pn.newUndo(); }},
        {sep:true},
        {label:"Copy", key:"Ctrl+C", action:()=>{ sel.set([o]); sel.copy(); showToast("Copied"); }},
        {label:"Delete", key:"Del", action:()=>{ o.delete(); sel.clear(); pn.newUndo(); }}
    ];
}
function convert(o) {
    pn.togglePlaceTransition(o);
    sel.set([pn.highlighted]);
    pn.newUndo();
}
function addAt(kind, at) {
    const x=snap(at.x), y=snap(at.y);
    let o;
    if (kind=="PLACE") { o=new Place(x,y); pn.addPlace(o); }
    else if (kind=="TRANSITION") { o=new Transition(x,y); pn.addTransition(o); }
    else { o=new Label("-",x,y); pn.addLabel(o); }
    sel.set([o]);
    pn.newUndo();
    if (kind=="LABEL") editName(o);
}
