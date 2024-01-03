const undo=[]; // complete nets
var undoPtr=-1;

class Petrinet {
    constructor() {
        this.p=[]; // Places
        this.t=[]; // Transitions
        this.f=[]; // Flows
        this.l=[]; // Labels
        this.highlighted = null;
        this.dragged=null;
        this.paleArrow=null; // Potential new Flow
        this.mouseDownCoord=null;
        this.zoom=1;
        this.cx=200; // Center of zooming (Should be mouse location)
        this.cy=200;
        this.vpx=0; // Viewport
        this.vpy=0;
        this.connected=[]; // Subnet connected to an object
        this.markings=[]; // Markings sequence
        this.mptr=-1; // marking pointer
        this.transeq=[]; // Transition sequence
    }

    draw() {
        // Draw potential new Flow
        if (this.paleArrow && state==DRAWARROW) {
            const o=this.paleArrow[0];
            const c=this.paleArrow[1];
            drawArrow(o.x,o.y,c.x,c.y);
        }
        this.f.forEach(item => { item.draw(); })
        this.t.forEach(item => { item.draw(); })
        this.p.forEach(item => { item.draw(); })
        this.l.forEach(item => { item.draw(); })
    }

    clear() {
        this.p.length=0;
        this.t.length=0;
        this.f.length=0;
        this.l.length=0;
        idPlace=0;
        idTrans=0;
        idFlow=0;
        this.highlighted=null;
        this.dragged=null;
        this.paleArrow=null;
        this.connected.length=0;
        this.mptr=-1;
        this.transeq.length=0;
        undo.length=0;
        undoPtr=-1;
    }

    addPlace(place) {
        this.p.push(place);
        this.clearMarkings();
    }

    addTransition(trans) {
        this.t.push(trans);
        this.clearMarkings();
    }

    addLabel(label) {
        this.l.push(label);
    }

    addFlow(flow) {
        this.f.push(flow);
        this.clearMarkings();
    }

    addFlows(o1,o2) {
        if (o1.type==PLACE && o2.type==PLACE) {
            const newTrans=new Transition(
                (o1.x+o2.x)/2,
                (o1.y+o2.y)/2,
                Math.asin(Math.sign(o2.x-o1.x)*(o2.y-o1.y)/Math.hypot(o2.x-o1.x,o2.y-o1.y))
            );
            if (o1.x==o2.x) newTrans.alpha=Math.PI/2;
            this.addTransition(newTrans);
            this.addFlow(new Flow(o1,newTrans));
            this.addFlow(new Flow(newTrans,o2));
        }
        else if (o1.type==TRANSITION && o2.type==TRANSITION) {
            const newPlace=new Place(
                (o1.x+o2.x)/2,
                (o1.y+o2.y)/2
            );
            this.addPlace(newPlace);
            this.addFlow(new Flow(o1,newPlace));
            this.addFlow(new Flow(newPlace,o2));
        }
        else {
            this.addFlow(new Flow(o1,o2));
        }
    }

    locate(id) {
        var ret=null;
        pn.p.forEach(o=>{
            if (o.id==id) 
                ret=o;
        });
        if (ret==null) pn.t.forEach(o=>{
            if (o.id==id) 
                ret=o;
        });
        return ret;
    }

    getCursoredObject(cursor) {
        var ret = null;
        this.f.forEach(item => { if (item.cursored(cursor)) ret=item; });
        this.p.forEach(item => { if (item.cursored(cursor)) ret=item; });
        this.t.forEach(item => { if (item.cursored(cursor)) ret=item; });
        this.l.forEach(item => { if (item.cursored(cursor)) ret=item; });
        this.f.forEach(item => {
            const aux=item.cursoredMidPoint(cursor);
            if (aux) ret=aux; 
        });
        return ret;
    }

    noFlowFromHere(o) {
        var ret=true;
        this.f.forEach(flow => {
            if (flow.o1==o || flow.o2==o) ret=false;
        })
        return ret;
    }

    getEnabled() {
        const ret=[];
        pn.t.forEach(t=>{if(t.enabled()) ret.push(t);})
        return ret;
    }

    // Connected Flows to an Object
    getConnected(o) {
        this.connected.push(o);
        pn.f.forEach(f=>{
            if (f.o1==o || f.o2==o) this.connected.push(f);
        });
    }

    // Whole Subnet connected to an Object
    getConnectedAll(o) {
        if (this.connected.includes(o)) return;
        this.connected.push(o);
        pn.f.forEach(f=>{
            if (f.o1==o) this.getConnectedAll(f.o2);
            if (f.o2==o) this.getConnectedAll(f.o1);
            if (f.o1==o || f.o2==o) for (var i=1; i<f.path.length-1; i++)
                this.getConnectedAll(f.path[i]);
        });
    }

    fireOne(trans=null) {
        const e = this.getEnabled();
        if (trans) {
            if (!e.includes(trans)) {
                console.log("not enabled, cannot fire");
            }
        }
        else {
            const r = Math.floor(Math.random() * e.length);
            if (e.length>0) trans=e[r];
        }
        if (trans) {
            trans.fire();
            this.markings.splice(this.mptr+1);
            this.markings.push(this.getMarking());
            this.transeq.splice(this.mptr);
            this.transeq.push(trans);
            this.mptr=this.markings.length-1;
        }
    }

    clearMarkings() {
        this.mptr=0;
        this.markings.length=0;
        this.markings.push(this.getMarking());
        this.transeq.length=0;
    }

    newUndo() {
        undo.push(rawSave());
    }
    
    getMarking() {
        const m=[];
        pn.p.forEach(p => {
            m.push(p.tokens);
        });
        return m;
    }

    restoreMarking(m) {
        var ptr=0;
        pn.p.forEach(p => {
            p.tokens=m[ptr++];
        });
    }

    save(filename) {
        var raw = new FormData();
        raw.append("data", rawSave());
        var xhr = (window.XMLHttpRequest) ? new XMLHttpRequest() : new activeXObject("Microsoft.XMLHTTP");
        xhr.open( 'POST', 'savefile.php?filename='+filename, true );
        xhr.send(raw);
    }

    load(filename) {
        var request = new XMLHttpRequest();
        request.onload = function() { rawLoad(request.responseText); }
        request.open("GET", filename);
        request.overrideMimeType("application/json");
        request.send();
        this.clearMarkings();
    }

    oldLoad(filename) {
        var request = new XMLHttpRequest();
        request.onload = function() { processLoad(request.responseText); }
        request.open("GET", filename);
        request.send();
        this.clearMarkings();
    }
}

function processLoad(str) {
    pn.clear();
    const jsonObject = JSON.parse(str);
    pn.zoom=jsonObject.zoom;
    pn.vpx=jsonObject.vpx; pn.vpy=jsonObject.vpy;
    jsonObject.p.forEach(p=>{
        const newPlace=new Place(p.x,p.y);
        newPlace.id=p.id;
        newPlace.tokens=p.tokens;
        newPlace.label.label=p.label.label;
        newPlace.label.x=p.label.x;
        newPlace.label.y=p.label.y;
        if (p.color) newPlace.color=p.color;
        pn.addPlace(newPlace);
    });
    jsonObject.t.forEach(t=>{
        const newTrans = new Transition(t.x,t.y);
        newTrans.id=t.id;
        newTrans.alpha=t.alpha;
        newTrans.label.label=t.label.label;
        newTrans.label.x=t.label.x;
        newTrans.label.y=t.label.y;
        if (t.color) newTrans.color=t.color;
        pn.addTransition(newTrans);
    });
    jsonObject.f.forEach(f=>{
        var o1,o2;
        pn.p.forEach(p=>{if(p.x==f.o1.x && p.y==f.o1.y) o1=p;});
        pn.p.forEach(p=>{if(p.x==f.o2.x && p.y==f.o2.y) o2=p;});
        pn.t.forEach(t=>{if(t.x==f.o1.x && t.y==f.o1.y) o1=t;});
        pn.t.forEach(t=>{if(t.x==f.o2.x && t.y==f.o2.y) o2=t;});
        const newFlow = new Flow(o1,o2);
        newFlow.subtype=f.subtype;
        newFlow.delta=new Coord(f.delta.x,f.delta.y);
        newFlow.newo2=new Coord(f.newo2.x,f.newo2.y);
        newFlow.weight=f.weight;
        if (f.color) newFlow.color=f.color;
        if (f.path) for (var i=f.path.length-2; i>0; i--) {
            newFlow.addSegment(new MidPoint(f.path[i].x,f.path[i].y));
        }
        pn.addFlow(newFlow);
    });
}
