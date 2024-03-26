const LEFTBUTTON=0, MIDDLEBUTTON=1, RIGHTBUTTON=2;

var tcursor=new Coord(0,0); // Viewport (translated) tcursor
var scursor=new Coord(0,0); // Snapped viewport (translated) cursor
var ccursor=new Coord(0,0); // Canvas cursor (for toolbar, not translated)

function mousedown(evt) {
    {
    }
}
function mouseup(evt) {
    // CLicked object (Place, Trans, Midpoint, Label, Button)
    {
        // Copy subnet
        if (state.is("SHIFTCLICK") && this.hovered && SCA(evt,"Sca") && closeEnough(pn.mouseDownCoord,this.tcursor)) {
            pn.connected.forEach(o=>{
                if (o.type=="PLACE") {
                    const newObject=new Place(o.x+20,o.y+20);
                    newObject.label.label=o.label.label;
                    newObject.label.x=o.label.x+20;
                    newObject.label.y=o.label.y+20;
                    newObject.color=o.color;
                    newObject.tokens=o.tokens;
                    pn.addPlace(newObject);
                }
                else if (o.type=="TRANSITION") {
                    const newObject=new Transition(o.x+20,o.y+20,o.alpha);
                    newObject.label.label=o.label.label;
                    newObject.label.x=o.label.x+20;
                    newObject.label.y=o.label.y+20;
                    newObject.color=o.color;
                    pn.addTransition(newObject);
                }
            })
            pn.f.forEach(o=>{
                var o1=null,o2=null;
                pn.p.forEach(p=>{
                    if (p.x==o.o1.x+20 && p.y==o.o1.y+20) o1=p;
                    if (p.x==o.o2.x+20 && p.y==o.o2.y+20) o2=p;
                });
                pn.t.forEach(t=>{
                    if (t.x==o.o1.x+20 && t.y==o.o1.y+20) o1=t;
                    if (t.x==o.o2.x+20 && t.y==o.o2.y+20) o2=t;
                });
                if (o1!=null && o2!=null) {
                    const newObject=new Flow(o1,o2);
                    newObject.color=o.color;
                    newObject.subtype=o.subtype;
                    newObject.weight=o.weight;
                    for (var i=1; i<o.path.length-1; i++) {
                        newObject.path.splice(i,0,new MidPoint(o.path[i].x+20,o.path[i].y+20));
                    }
                    pn.addFlow(newObject);
                }
            })
            pn.newUndo();
        }
        // Clear Place Tokens
        else if (state.is("MIDDLE") && this.hovered && this.hovered.type=="PLACE") {
            this.hovered.changeTokens(-this.hovered.tokens);
            pn.newUndo();
        }
        // Clear all net Tokens
        else if (state.is("MIDDLE") && !this.hovered) {
            pn.p.forEach(p => p.changeTokens(-p.tokens));
            pn.newUndo();
        }
        else if (pn.needUndo) {
            pn.needUndo=false;
            pn.newUndo();
        }
        if (!state.is("RUN")) state.set("IDLE");
        pn.dragged=null;
        fb.paleArrow=null;
    }
}
function mousemove(evt) {
    storedEvt.store("mousemove",getFormattedDate('millisec'),evt);
    getCoord(evt);
    this.hovered=pn.getCursoredObject(ccursor,"CANVAS");
    if (state.is("IDLE") && this.hovered) pn.highlighted=this.hovered;
    if (this.hovered) {

    }
}
function mousewheel(evt) {
    storedEvt.store("mousewheel",getFormattedDate('millisec'),evt);
    const delta=-Math.sign(evt.deltaY);
    getCoord(evt);
    this.hovered=pn.getCursoredObject(tcursor,"VIEWPORT");
    // Zoom
    if (state.is("MIDDLE") || state.is("ZOOM")) {
        if (state.is("MIDDLE")) {
            var deltaX=ccursor.x-pn.cx;
            var deltaY=ccursor.y-pn.cy;
            pn.cx=ccursor.x; pn.cy=ccursor.y;
            pn.vpx-=deltaX/pn.zoom; pn.vpy-=deltaY/pn.zoom;
        }
        state.set("ZOOM");
        pn.zoom+=delta/10;
        pn.zoom=Math.round(10*pn.zoom)/10;
        if (pn.zoom<0.3) pn.zoom=0.3;
        if (pn.zoom>3) pn.zoom=3;
    }
    else if (this.hovered && SCA(evt,"sca")) {
        // Tokens add/remove
        if (this.hovered.type=="PLACE") {
            this.hovered.changeTokens(delta);
            pn.needTimedUndo=true;
        }
        // Rotate Transition
        else if (this.hovered.type=="TRANSITION") {
            this.hovered.rotate(delta);
            pn.needTimedUndo=true;
        }
        // Adjust Flow weight
        else if (this.hovered.type=="FLOW") {
            this.hovered.weight+=delta;
            if (this.hovered.weight<1) this.hovered.weight=1;
            pn.needTimedUndo=true;
        }
        // Adjust Label size
        else if (this.hovered.type=="LABEL") {
            this.hovered.size+=2*delta;
            if (this.hovered.size<8) this.hovered.size=8;
            pn.needTimedUndo=true;
        }
    }
    // Color change on Object
     else if (this.hovered && SCA(evt,"scA")) { // ALT
        if (!evt.shiftKey) {
            this.hovered.nextColor(delta);
            pn.needTimedUndo=true;
        }
    }
    // Color change Shubnet
    else if (this.hovered && SCA(evt,"ScA")) { // ALTSHIFT
        pn.connected.length=0;
        pn.getConnected(this.hovered);
        pn.connected.forEach(o=>o.nextColor(delta));
        pn.needTimedUndo=true;
    }
    // Rewind and Forward
    else if (SCA(evt,"sca")) { // NONE
        state.set("IDLE");
        if (delta<0) pn.stepBackward();
        if (delta>0) pn.stepForward();
    }
    // Rotate subnet
    else if (this.hovered && SCA(evt,"Sca")) { // SHIFT
        pn.connected.length=0;
        pn.getConnectedAll(this.hovered);
        pn.connected.forEach(r=>{
            rot=rotate(this.hovered.x,this.hovered.y,r.x,r.y,delta*Math.PI/32);
            r.x=rot[0]; r.y=rot[1];
            if (r.type=="TRANSITION") {
                r.alpha+=delta*Math.PI/32;
            }
            if (r.label) {
                rot=rotate(this.hovered.x,this.hovered.y,r.label.x,r.label.y,delta*Math.PI/32);
                r.label.x=rot[0]; r.label.y=rot[1];
            }
            r.attachedLabels.forEach(l=>{
                l.rotate(this.hovered.x,this.hovered.y,delta*Math.PI/32);
            })
        });
        pn.needTimedUndo=true;
    }
}
