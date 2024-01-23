const undo=[]; // complete nets
var undoPtr=-1;

class Petrinet {
    constructor() {
        this.visible=true; // should pn be drawn
        this.p=[]; // Places
        this.t=[]; // Transitions
        this.f=[]; // Flows
        this.l=[]; // Labels
        this.s=[]; // Status
        this.b=[]; // Buttons
        this.highlighted = null;
        this.dragged=null;
        this.paleArrow=null; // Potential new Flow
        this.mouseDownCoord=new Coord(0,0);
        this.zoom=1;
        this.cx=200; // Center of zooming (Should be mouse location)
        this.cy=200;
        this.vpx=0; // Viewport
        this.vpy=0;
        this.connected=[]; // Subnet connected to an object
        this.markings=[]; // Markings sequence
        this.mptr=-1; // marking pointer
        this.transeq=[]; // Transition sequence
        this.needUndo=false; // need newUndo after move but not during
        this.needTimedUndo=false; // need timed newUndo after wheel
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

    snap() {
        this.f.forEach(item => { item.x=snap(item.x); item.y=snap(item.y); })
        this.f.forEach(item => { item.path.forEach(mp=> {mp.x=snap(mp.x); mp.y=snap(mp.y); })})
        this.t.forEach(item => { item.x=snap(item.x); item.y=snap(item.y); })
        this.p.forEach(item => { item.x=snap(item.x); item.y=snap(item.y); })
    }

    clear() {
        stateChange(IDLE);
        this.p.length=0;
        this.t.length=0;
        this.f.length=0;
        this.l.length=0;
        idPlace=0;
        idTrans=0;
        idFlow=0;
        idLabel=0;
        this.highlighted=null;
        this.dragged=null;
        this.paleArrow=null;
        this.connected.length=0;
        this.markings.length=0;
        this.mptr=-1;
        this.transeq.length=0;
        this.zoom=1;
        this.vpx=0;
        this.vpy=0;
    }

    addPlace(item) {
        this.p.push(item);
        this.clearMarkings();
    }

    addTransition(item) {
        this.t.push(item);
        this.clearMarkings();
    }

    addLabel(item) {
        this.l.push(item);
    }

    addStatus(item) {
        this.s.push(item);
    }

    addButton(item) {
        this.b.push(item);
    }

    addFlow(item) {
        this.f.push(item);
        this.clearMarkings();
    }

    addFlows(o1,o2) {
        if (o1.type==PLACE && o2.type==PLACE) {
            const newTrans=new Transition(
                snap((o1.x+o2.x)/2),
                snap((o1.y+o2.y)/2),
                Math.asin(Math.sign(o2.x-o1.x)*(o2.y-o1.y)/Math.hypot(o2.x-o1.x,o2.y-o1.y))
            );
            if (o1.x==o2.x) newTrans.alpha=Math.PI/2;
            this.addTransition(newTrans);
            this.addFlow(new Flow(o1,newTrans));
            this.addFlow(new Flow(newTrans,o2));
        }
        else if (o1.type==TRANSITION && o2.type==TRANSITION) {
            const newPlace=new Place(
                snap((o1.x+o2.x)/2),
                snap((o1.y+o2.y)/2)
            );
            this.addPlace(newPlace);
            this.addFlow(new Flow(o1,newPlace));
            this.addFlow(new Flow(newPlace,o2));
        }
        else {
            this.addFlow(new Flow(o1,o2));
        }
    }

    togglePlaceTransition(o) {
        if (o.type==PLACE) {
            o.delete();
            const newTrans=new Transition(o.x,o.y);
            this.addTransition(newTrans);
            this.highlighted=newTrans;
        }
        // Toggle Transition to Place
        else if (o.type==TRANSITION) {
            o.delete();
            const newPlace=new Place(o.x,o.y);
            this.addPlace(newPlace);
            this.highlighted=newPlace;
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

    getCursoredObject(cursor,scope) {
        var ret = null;
        if (scope=="VIEWPORT") {
            if (ret==null)
                this.l.forEach(item => { if (item.cursored(cursor)) ret=item; });
            if (ret==null)
                this.p.forEach(item => { if (item.cursored(cursor)) ret=item; });
            if (ret==null)
                this.t.forEach(item => { if (item.cursored(cursor)) ret=item; });
            if (ret==null)
                this.f.forEach(item => {
                    const aux=item.cursoredMidPoint(cursor);
                    if (aux) ret=aux; 
                });
            if (ret==null)
                this.f.forEach(item => { if (item.cursored(cursor)) ret=item; });
        }
        else if (scope=="CANVAS") {
            if (ret==null)
                this.b.forEach(item => { if (item.cursored(cursor)) ret=item; });
            if (ret==null)
                this.s.forEach(item => { if (item.cursored(cursor)) ret=item; });
        }
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
                error("trans not enabled, cannot fire");
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

    stepBackward() {
        if (this.mptr>0) {
            this.restoreMarking(this.markings[--this.mptr]);
        }
    }

    stepForward() {
        if (this.mptr<this.markings.length-1) {
            this.restoreMarking(this.markings[++this.mptr]);
        }
        // One random fire
        else {
            this.fireOne();
        }
    }

    rewind() {
        if (this.mptr>0) {
            this.mptr=0;
            this.restoreMarking(this.markings[this.mptr]);
        }
    }

    clearMarkings() {
        this.mptr=0;
        this.markings.length=0;
        this.markings.push(this.getMarking());
        this.transeq.length=0;
    }

    newUndo() {
        undo.splice(undoPtr+1);
        undo.push(rawSave());
        undoPtr=undo.length-1;
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
        xhr.open( 'POST', 'php/savefile.php?filename='+filename, true );
        xhr.send(raw);
    }

    load(filename) {
        undoPtr=-1; undo.length=0;
        var request = new XMLHttpRequest();
        request.onload = function() { 
            rawLoad(request.responseText); 
            pn.newUndo();
        }
        request.open("GET", filename);
        request.overrideMimeType("application/json");
        request.send();
        this.clearMarkings();
    }

    macroLoad(filename) {
        var request = new XMLHttpRequest();
        request.onload = function() {
            RECORD=0; PLAYBACK=1;
            const str=request.responseText.split("\n");
            str.forEach(l=>events.e.push(l));
        }
        request.open("GET", filename);
        request.send();
    }

    getFileNames(dir) {
        var request=new XMLHttpRequest();
        request.open('POST','php/scandir.php',true);
        request.onreadystatechange=function() {
            if (request.readyState==4 && request.status==200) {
                if (DEBUG) log(request.responseText);
                files.length=0;
                files.push(...request.responseText.split('\n'));
                files.pop();
                files.push("CANCEL");
                selectFile();
            }
        }
        request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        request.send("dir="+dir);
    }
}
