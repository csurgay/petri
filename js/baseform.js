class BaseForm extends Form {
    constructor(title, x, y, w, h) {
        super("BASEFORM", title, x, y, w, h);
        this.visible = true;
        this.closable = false;
        this.paleArrow = null; // Potential new dashed Flow arrow
    }
    draw() {
        // Title line
        g.standard(1);
        g.setupText("16px arial", "right", "middle");
        g.fillStyle(COLOR_INK);
        g.fillText(getFormattedDate(), this.w - 25, 30);
        // Draw PetriNet
        g.save();
        super.draw();
        g.clip();
        g.translate(pn.cx, pn.cy);
        g.scale(pn.zoom, pn.zoom);
        g.translate(pn.vpx, pn.vpy);
        // Draw potential new Flow
        if (this.paleArrow && state.is("DRAWARROW")) {
            drawArrow(this.paleArrow[0].x, this.paleArrow[0].y,
                this.paleArrow[1].x, this.paleArrow[1].y);
        }
        pn.f.forEach(item => { item.draw(); })
        pn.t.forEach(item => { item.draw(); })
        pn.p.forEach(item => { item.draw(); })
        pn.l.forEach(item => { item.draw(); })
        g.restore();
        // Static Status and Buttons
        pn.s.forEach(item => item.draw());
    }
    leftClick(evt) {
        return evt.type=="md" && evt.button==LEFTBUTTON;
    }
    rightClick(evt) {
        return evt.type=="md" && evt.button==RIGHTBUTTON;
    }
    middleClick(evt) {
        return evt.type=="md" && evt.button==MIDDLEBUTTON;
    }
    processFormEvent(evt) {
        if (!this.hover()) return;
        super.processFormEvent(evt);
        const delta=-Math.sign(evt.deltaY);
        // IDLE or running state (PLAY/RUN/FLY)
        if (state.is("IDLE") || bar.running()) {
            // Add/remove Tokens
            if (evt.type == "mw" && SCA(evt, "sca") && 
                this.hovered && this.hovered.type=="PLACE") 
            {
                this.hovered.changeTokens(delta);
                pn.needTimedUndo=true;
            }
        }
        // IDLE STATE
        if (state.is("IDLE")) {
            if (evt.type == "ku") {
                // Debug mode
                if (evt.key == "d") {
                    state.DEBUG = 1 - state.DEBUG;
                }
                // Record mode
                else if (evt.key == 'r' && state.PLAYBACK == 0) {
                    state.RECORD = 1 - state.RECORD;
                    if (state.RECORD == 1) events.rec = [];
                }
                // Load macro
                else if (evt.key == 'l') {
                    pn.macroLoad("macro/nemtudom.rec");
                }
                // Playback mode
                else if (evt.key == 'p') {
                    state.PLAYBACK = 1 - state.PLAYBACK;
                    if (state.PLAYBACK == 1) state.RECORD = 0;
                }
                // Label size number key
                else if (evt.key >= '0' && evt.key <= '5') {
                    if (this.hovered && this.hovered.type == "LABEL") {
                        this.hovered.size = sizes[evt.keyCode - 48];
                    }
                }
                // Sticky Flow heads
                else if (evt.key == 's') {
                    // Toggle sticky Flow heads of this Transition
                    if (this.hovered && this.hovered.type == "TRANSITION") {
                        pn.f.forEach(f => {
                            if (f.o2 == this.hovered) {
                                f.stickyHead = !f.stickyHead;
                            }
                        })
                    }
                }
            }
            // Move to highlight Object
            else if (evt.type == "mm") {
                pn.highlighted = this.hovered;
            }
            // New Object, Pan
            else if (this.leftClick(evt) && SCA(evt, "...") && 
                !this.hovered) 
            {
                state.set("LEFTDOWN");
            }
            // Object click, Drag
            else if (this.leftClick(evt) && SCA(evt, "sc.") && 
                this.hovered &&
                this.hovered.type != "FLOW") 
            {
                this.dragged = this.hovered;
                state.set("LEFTDOWN")
            }
            // Subnet drag
            else if (this.leftClick(evt) && SCA(evt,"Sc.") &&
                this.hovered) 
            {
                pn.connected.length=0;
                pn.getConnectedAll(this.hovered);
                state.set("SHIFTCLICK");
            }
            // New potential Flow drawarrow
            else if (this.leftClick(evt) && SCA(evt, "sCa") && 
                this.hovered &&
                (this.hovered.type == "PLACE" ||
                this.hovered.type == "TRANSITION")) 
            {    
                this.paleArrow = null;
                state.set("DRAWARROW");
            }
            // Multisegment Flow or Flow Toggle
            else if (this.leftClick(evt) && SCA(evt, "sca") && 
                this.hovered.type == "FLOW" ) 
            {
                this.dragged = this.hovered;
                state.set("MULTISEGMENT");
            }
            // RUNNING mode
            else if (this.rightClick(evt) && SCA(evt,"sca") &&
                !this.hovered) 
            {
                state.set("RUN");
            }
            // Delete objects
            else if (this.rightClick(evt) && SCA(evt,"sca") &&
                this.hovered) 
            {
                state.set("DELETE");
            }
            // Rotate Transition - fine
            else if (evt.type == "mw" && SCA(evt, "sca") && 
                this.hovered && this.hovered.type=="TRANSITION") 
            {
                this.hovered.rotate(delta);
                pn.needTimedUndo=true;
            }
            // Rotate Transition - course
            else if (evt.type == "mw" && SCA(evt, "Sca") && 
                this.hovered && this.hovered.type=="TRANSITION") 
            {
                this.hovered.rotate(delta, true);
                pn.needTimedUndo=true;
            }
            // Adjust Flow weight
            else if (evt.type == "mw" && SCA(evt, "sca") &&
                this.hovered && this.hovered.type=="FLOW" &&
                this.hovered.subtype!="RESET") 
            {
                this.hovered.weight+=delta;
                if (this.hovered.weight<1) this.hovered.weight=1;
                pn.needTimedUndo=true;
            }
            // Adjust Label size
            else if (evt.type == "mw" && SCA(evt, "sca") &&
                this.hovered && this.hovered.type=="LABEL") 
            {
                this.hovered.size+=2*delta;
                if (this.hovered.size<8) this.hovered.size=8;
                pn.needTimedUndo=true;
            }
            // Zoom
            else if (this.middleClick(evt) && SCA(evt,"sca")) {
                state.set("MIDDLE");
            }
            // Color change on Object
            else if (evt.type == "mw" && SCA(evt,"scA") &&
                this.hovered) 
            {
                if (!evt.shiftKey) {
                    this.hovered.nextColor(delta);
                    pn.needTimedUndo=true;
                }
            }
            // Color change Shubnet
            else if (evt.type == "mw" && SCA(evt,"ScA") &&
                this.hovered) 
            {
                this.hovered.nextColor(delta);
                pn.connected.length=0;
                pn.getConnected(this.hovered);
                pn.connected.forEach(o=>o.color=this.hovered.color);
                pn.needTimedUndo=true;
            }
            // Rewind and Forward
            else if (evt.type == "mw" && SCA(evt,"sca") &&
                !this.hovered) 
            {
                if (delta<0) pn.stepBackward();
                if (delta>0) pn.stepForward();
            }
            // Rotate subnet
            else if (evt.type == "mw" && SCA(evt,"Sca") &&
                this.hovered) 
            {
                pn.connected.length=0;
                pn.getConnectedAll(this.hovered);
                pn.connected.forEach(r=>{
                    const rot=rotate(this.hovered.x,this.hovered.y,r.x,r.y,delta*Math.PI/32);
                    r.x=rot[0]; r.y=rot[1];
                    if (r.type=="TRANSITION") {
                        r.alpha+=delta*Math.PI/32;
                    }
                    if (r.label) {
                        const rot=rotate(this.hovered.x,this.hovered.y,r.label.x,r.label.y,delta*Math.PI/32);
                        r.label.x=rot[0]; r.label.y=rot[1];
                    }
                    r.attachedLabels.forEach(l=>{
                        l.rotate(this.hovered.x,this.hovered.y,delta*Math.PI/32);
                    })
                });
                pn.needTimedUndo=true;
            }
        }
        // LEFTDOWN STATE
        else if (state.is("LEFTDOWN")) {
            // New Place
            if (evt.type == "mu" && !this.hovered && SCA(evt, "sca")
                && closeEnough(this.mouseDownCoord, tcursor)) 
            {
                const newPlace = new Place(scursor.x, scursor.y);
                pn.addPlace(newPlace);
                pn.highlighted = newPlace;
                pn.newUndo();
                state.set("IDLE");
            }
            // New Transition - horizontal
            else if (evt.type == "mu" && !this.hovered && SCA(evt,"sCa") 
                && closeEnough(this.mouseDownCoord, tcursor)) 
            {
                const newTrans = new Transition(scursor.x, scursor.y);
                pn.addTransition(newTrans);
                pn.highlighted = newTrans;
                pn.newUndo();
                state.set("IDLE");
            }
            // New Transition - vertical
            else if (evt.type == "mu" && !this.hovered && SCA(evt,"SCa") 
                && closeEnough(this.mouseDownCoord, tcursor)) 
            {
                const newTrans = new Transition(scursor.x, scursor.y, 0);
                pn.addTransition(newTrans);
                pn.highlighted = newTrans;
                pn.newUndo();
                state.set("IDLE");
            }
            // Toggle Place <=> Transition
            else if (evt.type == "mu" && this.hovered
                && this.hovered == pn.highlighted
                && closeEnough(this.mouseDownCoord, tcursor) &&
                (this.hovered.type == "PLACE" ||
                this.hovered.type == "TRANSITION") &&
                pn.noFlowFromHere(this.hovered)) 
            {
                pn.togglePlaceTransition(this.hovered);
                pn.newUndo();
                state.set("IDLE");
            }
            // New Label
            else if (evt.type == "mu" && SCA(evt, "scA") 
                && !this.hovered && 
                closeEnough(this.mouseDownCoord, tcursor)) 
            {
                const newLabel = new Label("-",scursor.x,scursor.y);
                pn.highlighted=newLabel;
                pn.newUndo();
                state.set("IDLE");
            }
            // Fire a Transition
            else if (evt.type == "mu" && SCA(evt, "sca") && this.hovered
                && this.hovered == pn.highlighted &&
                closeEnough(this.mouseDownCoord, tcursor) &&
                this.hovered.type == "TRANSITION" &&
                this.hovered.enabled())
            {
                pn.fireOne(this.hovered);
                state.set("IDLE");
            }
            // Init Drag
            else if (evt.type == "mm" && pn.highlighted &&
                !closeEnough(this.mouseDownCoord, tcursor)) 
            {
                state.set("DRAG");
            }
            // Init Pan
            else if (evt.type == "mm" && !pn.highlighted &&
                !closeEnough(this.mouseDownCoord, tcursor)) 
            {
                state.set("PAN");
            }
            // Label edit
            else if (evt.type == "mu" && this.hovered && 
                this.hovered.type=="LABEL" && 
                closeEnough(this.mouseDownCoord, tcursor)) 
            {
                this.hovered.clicked(evt);
            }
        }
        // DRAG STATE
        else if (state.is("DRAG")) {
            // Do Drag
            if (evt.type == "mm" && this.dragged) {
                this.dragged.dragTo(scursor.x - this.mouseDownCoord.x,
                    scursor.y - this.mouseDownCoord.y);
                this.mouseDownCoord.moveTo(scursor);
                pn.needUndo = true;
            }
            if (evt.type == "mu") {
                state.set("IDLE");
            }
        }
        // PAN STATE
        else if (state.is("PAN")) {
            // Do Pan
            if (evt.type == "mm" && !closeEnough(this.mouseDownCoord, tcursor)) {
                pn.vpx += snap(tcursor.x - this.mouseDownCoord.x);
                pn.vpy += snap(tcursor.y - this.mouseDownCoord.y);
            }
            else if (evt.type == "mu") {
                state.set("IDLE");
            }
        }
        // DRAWARROW STATE
        else if (state.is("DRAWARROW")) {
            // Draw potetntial new Flow
            if (evt.type == "mm") {
                fb.paleArrow = [pn.highlighted, tcursor];
            }
            // No new Flow
            else if (evt.type == "mu" && (!this.hovered ||
                this.hovered == pn.highlighted ||
                (this.hovered.type != "PLACE" &&
                    this.hovered.type != "TRANSITION"))) {
                pn.highlighted = null;
                state.set("IDLE");
            }
            // New Flow
            else if (evt.type == "mu" && this.hovered &&
                this.hovered != pn.highlighted &&
                (this.hovered.type == "PLACE" ||
                    this.hovered.type == "TRANSITION")) {
                pn.addFlows(pn.highlighted, this.hovered);
                pn.highlighted = this.hovered;
                pn.newUndo();
                state.set("IDLE");
            }
        }
        // MULTISEGMENT STATE
        else if (state.is("MULTISEGMENT")) {
            // Toggle Flow Enabler/Inhiboitor
            if (evt.type == "mu") {
                if (this.hovered && this.hovered.type == "FLOW") { 
                    if (this.hovered.o1.type == "PLACE") {
                        this.hovered.subtype = this.hovered.subtype == "INHIBITOR" ?
                        "ENABLER" : "INHIBITOR";
                        pn.newUndo();
                    }
                    else if (this.hovered.o1.type == "TRANSITION") {
                        this.hovered.subtype = this.hovered.subtype == "RESET" ?
                        "ENABLER" : "RESET";
                        pn.newUndo();
                    }
                }
                state.set("IDLE");
            }
            else if (evt.type=="mm") {
                // Multisegment Flow
                pn.highlighted=this.dragged.addSegment(this.mouseDownCoord);
                this.dragged = pn.highlighted;
                state.set("DRAG");
                pn.newUndo();
            }
        }
        // SHIFTCLICK state
        else if (state.is("SHIFTCLICK")) {
            // Init DragAll
            if (evt.type == "mm") {
                state.set("DRAGALL");
            }
            // Copy Subnet
            else if (evt.type == "mu" && SCA(evt, "Sca") && 
                this.hovered && 
                closeEnough(this.mouseDownCoord, tcursor))
            {
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
                state.set("IDLE");
            }
        }
        // DRAGALL state
        else if (state.is("DRAGALL")) {
            // Do DragAll (SubNet)
            if (evt.type == "mm") {
                pn.connected.forEach(da => { 
                    da.dragTo(scursor.x-this.mouseDownCoord.x,
                        scursor.y-this.mouseDownCoord.y); 
                });
                this.mouseDownCoord.moveTo(scursor);
                pn.needUndo=true;
                state.set("DRAGALL");
            }
            else if (evt.type == "mu") {
                state.set("IDLE");
            }
        }
        // RUNNING states
        else if (bar.running()) {
            // RUNNING mode
            if (this.rightClick(evt) && SCA(evt,"sca") &&
                !this.hovered) 
            {
                state.set("IDLE");
            }
        }
        // DELETE state
        else if (state.is("DELETE")) {
            // Delete Object
            if (evt.type == "mu" && this.hovered &&
                closeEnough(this.mouseDownCoord, tcursor)) 
            {
                this.hovered.delete();
                delete this.hovered;
                pn.highlighted=null;
                pn.newUndo();
                state.set("IDLE");
            }
            // Cancel Delete
            if (evt.type == "mu" && 
            !closeEnough(this.mouseDownCoord, tcursor))
            {
                state.set("IDLE");
            }
        }
        else if (state.is("MIDDLE")) {
            // Init Zoom
            if (evt.type == "mw") {
                var curDeltaX=ccursor.x-pn.cx;
                var curDeltaY=ccursor.y-pn.cy;
                pn.cx=ccursor.x; pn.cy=ccursor.y;
                pn.vpx-=curDeltaX/pn.zoom; pn.vpy-=curDeltaY/pn.zoom;
                state.set("ZOOM");
            }
            // Clear Place Tokens
            else if (evt.type == "mu" && this.hovered && 
                this.hovered.type=="PLACE") 
            {
                this.hovered.changeTokens(-this.hovered.tokens);
                pn.newUndo();
                state.set("IDLE");
            }
            // Clear All Tokens
            else if (evt.type == "mu" && !this.hovered) {
                pn.p.forEach(p => p.changeTokens(-p.tokens));
                pn.newUndo();
                state.set("IDLE");
            }
        }
        // ZOOM state
        else if (state.is("ZOOM")) {
            // Do Zoom
            if (evt.type == "mw") {
                pn.zoom+=delta/10;
                pn.zoom=Math.round(10*pn.zoom)/10;
                if (pn.zoom<0.3) pn.zoom=0.3;
                if (pn.zoom>3) pn.zoom=3;
            }
            else if (evt.type == "mu") {
                state.set("IDLE");
            }
        }
        // Mouse-up administration
        if (evt.type == "mu") {
            // Undo after mouse-up (for multi-wheel events)
            if (pn.needTimedUndo) {
                pn.newUndo();
                pn.needTimedUndo=false;
            }
            pn.dragged=null;
            fb.paleArrow=null;
            if (state.is("PLAY")||state.is("RUN")||state.is("FLY")) {
            }
            else {
                state.set("IDLE");
            }
        }
        // Single undo after all events processed
        if (pn.needUndo) {
            pn.needUndo=false;
            pn.newUndo();
        }
    }
}
