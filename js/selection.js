// Selection model (CAD style): click selects, Shift+click toggles,
// rubber band drag selects, operations act on the selection.
const SELECTABLE=["PLACE","TRANSITION","FLOW","LABEL"];
const SEL_FILL="rgba(44,86,201,0.14)";
const SEL_STROKE="rgba(44,86,201,0.85)";

class Selection {
    constructor() {
        this.s=new Set();
        this.preview=[];     // objects inside the rubber band while dragging
        this.clipboard=null;
        this.pasteCount=0;
    }

    // --- membership ---------------------------------------------------
    alive(o) {
        switch (o.type) {
            case "PLACE": return pn.p.includes(o);
            case "TRANSITION": return pn.t.includes(o);
            case "FLOW": return pn.f.includes(o);
            case "LABEL": return pn.l.includes(o) && !o.objectsLabel();
        }
        return false;
    }
    prune() { for (const o of this.s) if (!this.alive(o)) this.s.delete(o); }
    get size() { this.prune(); return this.s.size; }
    has(o) { return o!=null && this.s.has(o); }
    items() { this.prune(); return [...this.s]; }
    clear() { this.s.clear(); this.preview=[]; }
    set(arr) { this.s=new Set(arr.filter(o=>o && SELECTABLE.includes(o.type))); this.prune(); }
    add(arr) { arr.forEach(o=>{ if (o && SELECTABLE.includes(o.type)) this.s.add(o); }); this.prune(); }
    toggle(o) {
        if (!o || !SELECTABLE.includes(o.type)) return;
        if (this.s.has(o)) this.s.delete(o); else this.s.add(o);
        this.prune();
    }
    selectAll() {
        this.set([...pn.p, ...pn.t, ...pn.f, ...pn.l.filter(l=>!l.objectsLabel())]);
    }

    // objects whose centre lies inside the rectangle; flows with both ends inside
    inRect(a,b) {
        const x1=Math.min(a.x,b.x), x2=Math.max(a.x,b.x),
              y1=Math.min(a.y,b.y), y2=Math.max(a.y,b.y);
        const inside=o=>o.x>=x1 && o.x<=x2 && o.y>=y1 && o.y<=y2;
        const nodes=[...pn.p, ...pn.t].filter(inside);
        const flows=pn.f.filter(f=>nodes.includes(f.o1) && nodes.includes(f.o2));
        const labels=pn.l.filter(l=>!l.objectsLabel() && inside(l));
        return [...nodes, ...flows, ...labels];
    }

    // --- what moves together --------------------------------------------
    nodes() { return this.items().filter(o=>o.type=="PLACE"||o.type=="TRANSITION"); }
    movable() {
        const nodes=this.nodes();
        const nodeSet=new Set(nodes);
        // bend points of flows that move with both ends, or that are selected
        const mids=[];
        pn.f.forEach(f=>{
            if ((nodeSet.has(f.o1) && nodeSet.has(f.o2)) || this.s.has(f))
                for (let i=1; i<f.path.length-1; i++) mids.push(f.path[i]);
        });
        // free labels, unless they already ride along with an attached object
        const moved=new Set([...nodes, ...mids]);
        const labels=this.items().filter(o=>o.type=="LABEL");
        const labelSet=new Set(labels);
        const ridesAlong=l=>{
            let a=l.attached, guard=0;
            while (a && guard++<20) { if (moved.has(a) || labelSet.has(a)) return true; a=a.attached; }
            return false;
        };
        return { nodes, mids, labels: labels.filter(l=>!ridesAlong(l)) };
    }
    moveBy(dx,dy) {
        const m=this.movable();
        m.nodes.forEach(o=>o.dragTo(dx,dy));
        m.mids.forEach(o=>o.dragTo(dx,dy));
        m.labels.forEach(o=>o.dragTo(dx,dy));
    }
    rotateAround(pivot,delta) {
        const a=delta*Math.PI/32, cx=pivot.x, cy=pivot.y;
        const rot=o=>{ const r=rotate(cx,cy,o.x,o.y,a); o.x=r[0]; o.y=r[1]; };
        const m=this.movable();
        m.nodes.forEach(o=>{
            rot(o);
            if (o.type=="TRANSITION") o.alpha+=a;
            if (o.label) rot(o.label);
            o.attachedLabels.forEach(l=>l.rotate(cx,cy,a));
        });
        m.mids.forEach(o=>{ rot(o); o.attachedLabels.forEach(l=>l.rotate(cx,cy,a)); });
        m.labels.forEach(l=>l.rotate(cx,cy,a));
    }
    colorLike(o) { this.items().forEach(x=>x.color=o.color); }

    // --- delete ---------------------------------------------------------------
    deleteAll() {
        const items=this.items();
        items.filter(o=>o.type=="FLOW").forEach(o=>{ if (pn.f.includes(o)) o.delete(); });
        items.filter(o=>o.type=="LABEL").forEach(o=>{ if (pn.l.includes(o)) o.delete(); });
        items.filter(o=>o.type=="PLACE"||o.type=="TRANSITION").forEach(o=>{ if (this.alive(o)) o.delete(); });
        this.clear();
    }

    // --- clipboard ------------------------------------------------------------
    serialize() {
        const nodes=this.nodes();
        if (nodes.length==0 && this.items().every(o=>o.type!="LABEL")) return null;
        const nodeSet=new Set(nodes);
        const data={places:[], transitions:[], flows:[], labels:[]};
        nodes.forEach(o=>{
            const d={id:o.id, x:o.x, y:o.y, color:o.color,
                lt:o.label.text, lx:o.label.x, ly:o.label.y, lc:o.label.color, ls:o.label.size};
            if (o.type=="PLACE") { d.tokens=o.tokens; data.places.push(d); }
            else { d.alpha=o.alpha; data.transitions.push(d); }
        });
        pn.f.forEach(f=>{
            if (nodeSet.has(f.o1) && nodeSet.has(f.o2)) data.flows.push({
                o1:f.o1.id, o2:f.o2.id, color:f.color, subtype:f.subtype, weight:f.weight,
                stickyHead:f.stickyHead, stc:f.stickyTransConnector,
                mids:f.path.slice(1,-1).map(m=>[m.x,m.y])
            });
        });
        // selected free labels + free labels attached to copied objects
        const labelSet=new Set(this.items().filter(o=>o.type=="LABEL"));
        pn.l.forEach(l=>{ if (!l.objectsLabel() && l.attached && nodeSet.has(l.attached)) labelSet.add(l); });
        labelSet.forEach(l=>data.labels.push({
            id:l.id, text:l.text, x:l.x, y:l.y, color:l.color, size:l.size,
            att: l.attached ? l.attached.id : null
        }));
        return data;
    }
    paste(data=this.clipboard, steps=++this.pasteCount) {
        if (!data) return;
        const off=steps*2*(grid>3?grid:10);
        const map={}, created=[];
        data.places.forEach(d=>{
            const o=new Place(d.x+off,d.y+off);
            o.color=d.color; o.tokens=d.tokens;
            Object.assign(o.label,{text:d.lt, x:d.lx+off, y:d.ly+off, color:d.lc, size:d.ls});
            pn.addPlace(o); map[d.id]=o; created.push(o);
        });
        data.transitions.forEach(d=>{
            const o=new Transition(d.x+off,d.y+off,d.alpha);
            o.color=d.color;
            Object.assign(o.label,{text:d.lt, x:d.lx+off, y:d.ly+off, color:d.lc, size:d.ls});
            pn.addTransition(o); map[d.id]=o; created.push(o);
        });
        data.flows.forEach(d=>{
            const o=new Flow(map[d.o1],map[d.o2]);
            o.color=d.color; o.subtype=d.subtype; o.weight=d.weight;
            o.stickyHead=d.stickyHead; o.stickyTransConnector=d.stc;
            d.mids.forEach(m=>o.path.splice(o.path.length-1,0,new MidPoint(m[0]+off,m[1]+off)));
            pn.addFlow(o); created.push(o);
        });
        const lmap={};
        data.labels.forEach(d=>{
            const o=new Label(d.text,d.x+off,d.y+off);
            o.color=d.color; o.size=d.size;
            pn.addLabel(o); lmap[d.id]=o; created.push(o);
        });
        data.labels.forEach(d=>{
            const t=map[d.att]||lmap[d.att];
            if (t) { lmap[d.id].setAttached(t); t.attach(lmap[d.id]); }
        });
        this.set(created);
        pn.newUndo();
    }
    copy() {
        const d=this.serialize();
        if (d) { this.clipboard=d; this.pasteCount=0; }
    }
    cut() {
        if (this.size==0) return;
        this.copy();
        this.pasteCount=-1;   // first paste lands in the original place
        this.deleteAll();
        pn.highlighted=null;
        pn.newUndo();
    }
    duplicate() {
        const d=this.serialize();
        if (d) this.paste(d,1);
    }
    nudge(dx,dy) {
        if (this.size==0) return;
        this.moveBy(dx,dy);
        pn.newUndo();
    }

    // --- drawing (called inside the net transform) -----------------------------
    draw() {
        const list=new Set([...this.items(), ...this.preview]);
        if (list.size==0) return;
        const c=g.ctx;
        c.save();
        c.setLineDash([]);
        c.fillStyle=SEL_FILL;
        c.strokeStyle=SEL_STROKE;
        c.lineWidth=1.5;
        list.forEach(o=>{
            c.beginPath();
            if (o.type=="PLACE") {
                c.arc(o.x,o.y,PLACE_R+6,0,2*Math.PI);
                c.fill(); c.stroke();
            }
            else if (o.type=="TRANSITION") {
                c.save(); c.translate(o.x,o.y); c.rotate(o.alpha);
                c.rect(-tw/2-6,-th/2-6,tw+12,th+12);
                c.fill(); c.stroke(); c.restore();
            }
            else if (o.type=="LABEL") {
                const w=o.width||20, h=o.size||14;
                const x=o.x-(o.align=="center"?w/2:0);
                c.rect(x-5,o.y-h/2-5,w+10,h+8);
                c.fill(); c.stroke();
            }
            else if (o.type=="FLOW") {
                c.save();
                c.strokeStyle="rgba(44,86,201,0.30)";
                c.lineWidth=9; c.lineCap="round"; c.lineJoin="round";
                c.moveTo(o.path[0].x,o.path[0].y);
                for (let i=1; i<o.path.length-1; i++) c.lineTo(o.path[i].x,o.path[i].y);
                c.lineTo(o.conn.x,o.conn.y);
                c.stroke(); c.restore();
            }
        });
        c.restore();
    }
}

const sel=new Selection();
