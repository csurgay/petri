class BaseForm extends Form {
    constructor(title, x, y, w, h) {
        super("BASEFORM", title, x, y, w, h);
        this.active = true;
        this.visible = true;
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
    processFormEvent(evt) {
        super.processFormEvent(evt);
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
            else if (this.leftClick(evt) && SCA(evt, "s..") && 
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
        }
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
            // Toggle Place <=> Transition
            else if (evt.type == "mu" && this.hovered
                && this.hovered == pn.highlighted
                && closeEnough(this.mouseDownCoord, tcursor) &&
                (this.hovered.type == "PLACE" ||
                this.hovered.type == "TRANSITION")) 
            {
                if (pn.noFlowFromHere(this.hovered)) {
                    pn.togglePlaceTransition(this.hovered);
                    pn.newUndo();
                }
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
        }
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
        else if (state.is("MULTISEGMENT")) {
            // Toggle Flow Enabler/Inhiboitor
            if (evt.type == "mu") {
                if (this.hovered && this.hovered.type == "FLOW" && 
                    this.hovered.o1.type == "PLACE") {
                    this.hovered.subtype = this.hovered.subtype == "INHIBITOR" ?
                        "ENABLER" : "INHIBITOR";
                    pn.newUndo();
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
        else if (state.is("SHIFTCLICK") || state.is("DRAGALL")) {
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
            else {
                if (pn.needTimedUndo) {
                    pn.newUndo();
                    pn.needTimedUndo=false;
                }
            }
        }
    }
}
