const LEFTBUTTON=0, MIDDLEBUTTON=1, RIGHTBUTTON=2;

var tcursor=new Coord(0,0); // Viewport (translated) tcursor
var scursor=new Coord(0,0); // Snapped viewport (translated) tcursor
var ccursor=new Coord(0,0); // Canvas tcursor (for toolbar, not translated)

function mousedown(evt) {
    storedEvt.store("mousedown",getFormattedDate('millisec'),evt);
    getCoord(evt);
    this.hovered=pn.getCursoredObject(ccursor,"CANVAS");
    if (this.hovered) {
        if (this.hovered.type=="BAR.BUTTON" && evt.button==LEFTBUTTON) {
            state.set("BAR.CLICK");
        }
    }
    else {
        pn.mouseDownCoord.x=tcursor.x; 
        pn.mouseDownCoord.y=tcursor.y;
        this.hovered=pn.getCursoredObject(tcursor,"VIEWPORT");
        if (evt.button==LEFTBUTTON) {
            if (this.hovered==null) {
                // New Object, Pan
                if (state.is("IDLE") && SCA(evt,"s..")) { // CTRLALTNONE
                    state.set("LEFTDOWN");
                }
            }
            else if (this.hovered) {
                // Object click, Drag
                if (this.hovered.type!="FLOW" && SCA(evt,"sc.")) { // ALTNONE
                    state.set("LEFTDOWN");
                    pn.dragged=this.hovered;
                }
                // Subnet drag
                else if (SCA(evt,"Sc.")) { // SHIFT or ALTSHIFT
                    state.set("SHIFTCLICK");
                    pn.connected.length=0;
                    pn.getConnectedAll(this.hovered);
                }
                // New potential Flow
                else if (this.hovered && (this.hovered.type=="PLACE" || this.hovered.type=="TRANSITION") && SCA(evt,"sCa")) { // CTRL
                    state.set("DRAWARROW");
                }
                // Multisegment Flow or Flow Toggle
                else if (this.hovered.type=="FLOW" && SCA(evt,"sca")) { // NONE
                    state.set("MULTISEGMENT");
                    pn.dragged=this.hovered;
                }
            }
        }
        // Right mouse button click
        else if (evt.button==RIGHTBUTTON && SCA(evt,"sca")) { // NONE
            if (this.hovered==null) {
                // Running mode
                if (state.is("IDLE")) state.set("RUN");
                else if (state.is("RUN")) state.set("IDLE");
            }
            // Delete Objets
            else {
                state.set("DELETE");
            }
        }
        // Zoom
        else if (evt.button==MIDDLEBUTTON && SCA(evt,"sca")) { // NONE
            state.set("MIDDLE");
        }
    }
}
function mouseup(evt) {
    storedEvt.store("mouseup",getFormattedDate('millisec'),evt);
    getCoord(evt); // sets tcursor (translated canvas) and ccursor (orig canvas)
    this.hovered=pn.getCursoredObject(ccursor,"CANVAS");
    if (this.hovered) {
        if (state.is("BAR.CLICK")) this.hovered.clicked(evt);
    }
    // CLicked object (Place, Trans, Midpoint, Label, Button)
    else {
        this.hovered=pn.getCursoredObject(tcursor,"VIEWPORT");
        // New Flow
        if (state.is("DRAWARROW") && this.hovered && this.hovered!=pn.highlighted &&
            (this.hovered.type=="PLACE" || this.hovered.type=="TRANSITION")) {
            pn.addFlows(pn.highlighted,this.hovered);
            pn.highlighted=this.hovered;
            pn.newUndo();
        }
        // No New Flow
        else if (state.is("DRAWARROW") && this.hovered==null) {
            pn.highlighted=null;
        }
        else if (state.is("LEFTDOWN") && this.hovered && this.hovered==pn.highlighted && 
            closeEnough(pn.mouseDownCoord,tcursor) &&
            (this.hovered.type=="PLACE" || this.hovered.type=="TRANSITION")) {
            // Toggles
            if (pn.noFlowFromHere(this.hovered)) {
                // Toggle Place to Transition
                pn.togglePlaceTransition(this.hovered);
                pn.newUndo();
            }
            // Fire a Transition
            else if(this.hovered.type=="TRANSITION") {
                if (this.hovered.enabled()) pn.fireOne(this.hovered);
            }
        }
        // Label enter edit click
        else if (state.is("LEFTDOWN") && this.hovered && this.hovered.type=="LABEL" && 
            closeEnough(pn.mouseDownCoord,tcursor)) {
            this.hovered.clicked(evt);
        }
        // Toggle Flow Enabler/Inhiboitor
        else if(state.is("MULTISEGMENT") && this.hovered && this.hoveredhis.hovered.type=="FLOW" && this.hovered.o1.type=="PLACE") {
            if (this.hovered.subtype=="ENABLER") this.hovered.subtype="INHIBITOR";
            else if (this.hovered.subtype=="INHIBITOR") this.hovered.subtype="ENABLER";
            pn.newUndo();
        }
        // New Place
        else if (state.is("LEFTDOWN") && this.hovered==null && SCA(evt,"sca") && closeEnough(pn.mouseDownCoord,this.tcursor)) {
            const newPlace = new Place(scursor.x,scursor.y);
            pn.addPlace(newPlace);
            pn.highlighted=newPlace;
            pn.newUndo();
        }
        // New Transition
        else if (state.is("LEFTDOWN") && this.hovered==null && SCA(evt,"sCa") && closeEnough(pn.mouseDownCoord,this.tcursor)) {
            const newTrans = new Transition(scursor.x,scursor.y);
            pn.addTransition(newTrans);
            pn.highlighted=newTrans;
            pn.newUndo();
        }
        // New Label
        else if (state.is("LEFTDOWN") && this.hovered==null && SCA(evt,"scA") && closeEnough(pn.mouseDownCoord,this.tcursor)) {
            const newLabel = new Label("-",scursor.x,scursor.y);
            pn.highlighted=newLabel;
            pn.newUndo();
        }
        // Delete Object
        else if (state.is("DELETE") && this.hovered && closeEnough(pn.mouseDownCoord,tcursor)) {
            this.hovered.delete();
            delete this.hovered;
            pn.highlighted=null;
            pn.newUndo();
        }
        // Copy subnet
        else if (state.is("SHIFTCLICK") && this.hovered && SCA(evt,"Sca") && closeEnough(pn.mouseDownCoord,this.tcursor)) {
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
    else {
        this.hovered=pn.getCursoredObject(tcursor,"VIEWPORT");
        // Init Drag
        if (state.is("LEFTDOWN") && !closeEnough(pn.mouseDownCoord,tcursor)) {
            state.set("DRAG");
        }
        // Do Drag
        if (state.is("DRAG") && pn.dragged) {
            pn.dragged.dragTo(scursor.x-pn.mouseDownCoord.x,scursor.y-pn.mouseDownCoord.y);
            pn.mouseDownCoord.moveTo(scursor);
            pn.needUndo=true;
        }
        // Do DragAll (SubNet)
        else if (state.is("SHIFTCLICK") || state.is("DRAGALL")) {
            state.set("DRAGALL");
            pn.connected.forEach(da => { 
                da.dragTo(scursor.x-pn.mouseDownCoord.x,scursor.y-pn.mouseDownCoord.y); 
            });
            pn.mouseDownCoord.moveTo(scursor);
            pn.needUndo=true;
        }
        // Draw potetntial new Flow
        else if (state.is("DRAWARROW")) {
            fb.paleArrow=[pn.highlighted, tcursor];
        }
        // Do Pan
        else if (state.is("DRAG") || state.is("PAN")) {
            if (!closeEnough(pn.mouseDownCoord,tcursor))
            {
                state.set("PAN");
                pn.vpx+=snap(tcursor.x-pn.mouseDownCoord.x);
                pn.vpy+=snap(tcursor.y-pn.mouseDownCoord.y);
            }
        }
        // Multisegment Flow
        else if (state.is("MULTISEGMENT")) {
            pn.highlighted=pn.dragged.addSegment(pn.mouseDownCoord);
            pn.dragged=pn.highlighted;
            state.set("DRAG");
            pn.newUndo();
        }
        // Highlight mouseovered object
        else {
            if (this.hovered) pn.highlighted = this.hovered;
            else pn.highlighted = null;
            if (pn.needTimedUndo) {
                pn.newUndo();
                pn.needTimedUndo=false;
            }
        }
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
