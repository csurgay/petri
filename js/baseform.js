class BaseForm extends Form {
    constructor(title, x, y, w, h) {
        super("BASEFORM", title, x, y, w, h);
        this.visible = true;
        this.closable = false;
        this.paleArrow = null; // Potential new dashed Flow arrow
    }
    draw() {
        // Draw PetriNet
        g.save();
        super.draw();
        g.clip();
        g.translate(pn.cx, pn.cy);
        g.scale(pn.zoom, pn.zoom);
        g.translate(pn.vpx, pn.vpy);
        // Grid
        let grid=fp.gridSize.value;
        if (fp.gridShown.value && grid>3) {
            g.beginPath();
            g.strokeStyle(COLOR_GRAY);
            for(var i=-10000; i<10000; i+=grid) {
                g.moveTo(i,-10000);
                g.lineTo(i,10000);
                g.moveTo(-10000,i);
                g.lineTo(10000,i);
            }
            g.stroke();
        }
        // Draw potential new Flow
        if (this.paleArrow && state.is("DRAWARROW")) {
            drawArrow(this.paleArrow[0].x, this.paleArrow[0].y,
                this.paleArrow[1].x, this.paleArrow[1].y);
        }
        sel.preview = state.is("SELECT") ? sel.inRect(this.mouseDownCoord, tcursor) : [];
        sel.draw();
        pn.f.forEach(item => { item.draw(); })
        pn.t.forEach(item => { item.draw(); })
        pn.p.forEach(item => { item.draw(); })
        pn.l.forEach(item => { item.draw(); })
        // Select frame
        g.beginPath();
        g.lineWidth(1);
        g.dashed();
        g.strokeStyle(COLOR_INK);
        if (state.is("SELECT")) {
            g.rect(this.mouseDownCoord.x,this.mouseDownCoord.y,
                tcursor.x-this.mouseDownCoord.x,tcursor.y-this.mouseDownCoord.y);
        }
        g.stroke();
        g.restore();
        // Static Status and Buttons
        if (state.DEBUG) {
            pn.s.forEach(item => item.draw());
        }
    }
    processFormEvent(evt) {
        if (!this.hover()) return;
        super.processFormEvent(evt);
        this.hovered=pn.getCursoredObject(evt);
        const delta=-Math.sign(evt.deltaY);
        // IDLE or running state (PLAY/RUN/FLY)
        if (state.is("IDLE") || bar.running()) {
            // Ctrl+wheel or trackpad pinch: zoom at the cursor
            if (evt.type == "mw" && SCA(evt, ".C.")) {
                const d=Math.max(-60, Math.min(60, evt.deltaY));
                zoomAt(ccursor.x, ccursor.y, Math.exp(-d*0.004));
            }
            // Add/remove Tokens
            if (evt.type == "mw" && SCA(evt, "sca") && 
                this.hovered && this.hovered.type=="PLACE") 
            {
                this.hovered.changeTokens(delta);
                pn.needTimedUndo="AFTER_IDLETIME";
            }
            // Add/remove tokens with arrows
            if (evt.type === "kd" && SCA(evt, "sca") &&
                this.hovered && this.hovered.type=="PLACE" &&
                (sel.size==0 || bar.running()))
            {
                const k = evt.key;
                if (k === "ArrowUp") this.hovered.changeTokens(1);
                if (k === "ArrowDown") this.hovered.changeTokens(-1);

                pn.needTimedUndo="AFTER_IDLETIME";
            }
        }
        // IDLE STATE
        if (state.is("IDLE")) {
            if (evt.type == "kd") {
                // Debug mode: Ctrl+Alt+D
                if (evt.keyCode == 68 && SCA(evt,".CA")) { // keyCode: AltGr-safe
                    state.DEBUG = 1 - state.DEBUG;
                }
                // Delete hovered highlighted object
                else if ((evt.key == 'Delete' || evt.key == 'Backspace') &&
                    SCA(evt,"sca") && (sel.size>0 || this.hovered))
                {
                    if (sel.size>0) sel.deleteAll();
                    else this.hovered.delete();
                    pn.highlighted=null;
                    pn.newUndo();
                }
                // Esc: clear selection
                else if (evt.key == 'Escape') {
                    if (sel.size>0) sel.clear();
                    else setTool("SELECT");
                }
                // Arrows nudge the selection (Shift: 5 steps)
                else if (evt.key.startsWith("Arrow") && sel.size>0 && SCA(evt,".ca")) {
                    const st=(grid>3?grid:5)*(SCA(evt,"S..")?5:1);
                    const k=evt.key;
                    sel.nudge(k=="ArrowLeft"?-st:k=="ArrowRight"?st:0,
                              k=="ArrowUp"?-st:k=="ArrowDown"?st:0);
                }
                // Left/Right without selection: step back / forward
                else if ((evt.key=="ArrowLeft" || evt.key=="ArrowRight") && SCA(evt,"sca")) {
                    if (evt.key=="ArrowLeft") pn.stepBackward(); else pn.stepForward();
                }
                // Record mode (developer feature, debug mode only)
                else if (evt.keyCode == 82 && SCA(evt,".CA") && state.DEBUG && state.PLAYBACK == 0) {
                    state.RECORD = 1 - state.RECORD;
                    if (state.RECORD == 1) events.rec = [];
                }
                // Load macro (debug mode only)
                else if (evt.keyCode == 76 && SCA(evt,".CA") && state.DEBUG) {
                    pn.macroLoad("macro/nemtudom.rec");
                }
                // Playback mode (debug mode only)
                else if (evt.keyCode == 80 && SCA(evt,".CA") && state.DEBUG) {
                    state.PLAYBACK = 1 - state.PLAYBACK;
                    if (state.PLAYBACK == 1) state.RECORD = 0;
                }
                // Label size number key
                else if (evt.key >= '0' && evt.key <= '5' && SCA(evt,"s..")) {
                    if (this.hovered && this.hovered.type == "LABEL") {
                        this.hovered.size = sizes[evt.keyCode - 48];
                    }
                }
                // Tool palette keys: S P T F I R M L H
                else if (SCA(evt,"sca") && TOOL_KEYS[evt.key.toLowerCase()]) {
                    setTool(TOOL_KEYS[evt.key.toLowerCase()]);
                }
            }
            // Move to highlight Object
            else if (evt.type == "mm") {
                pn.highlighted = this.hovered;
            }
            // Double-click / double-tap: edit a value (name, tokens, weight)
            else if (evt.type == "mdc") {
                editAction(this.hovered);
            }
            // Space+drag or the Pan tool: pan
            else if (this.leftClick(evt) && (events.spaceDown || tool=="PAN")) {
                state.set("PAN");
            }
            // Arc tools: drag from a place/transition draws an arc
            else if (["FLOW","INHIBITOR","RESET"].includes(tool) && this.leftClick(evt) &&
                SCA(evt,"..a") && this.hovered &&
                (this.hovered.type=="PLACE" || this.hovered.type=="TRANSITION"))
            {
                pn.highlighted=this.hovered;
                this.paleArrow=null;
                state.set("DRAWARROW");
            }
            // Marking tool: click a place = +1 token (Shift+click = -1),
            // click a transition = fire it
            else if (tool=="MARKING" && this.leftClick(evt) && SCA(evt,".ca") && this.hovered &&
                (this.hovered.type=="PLACE" || this.hovered.type=="TRANSITION"))
            {
                const o=this.hovered;
                if (o.type=="PLACE") {
                    if (SCA(evt,"S..")) { if (o.tokens>0) { o.changeTokens(-1); pn.newUndo(); } }
                    else primaryMarking(o);
                }
                else if (o.enabled()) pn.fireOne(o);
                else showToast(o.label.text+" is not enabled");
            }
            // Empty canvas: new object (click) or rubber band (drag)
            else if (this.leftClick(evt) && SCA(evt, "...") && 
                !this.hovered) 
            {
                this.wasSelected=false;
                state.set("LEFTDOWN");
            }
            // Object click, Drag
            else if (this.leftClick(evt) && SCA(evt, "sc.") && 
                this.hovered &&
                this.hovered.type != "FLOW") 
            {
                this.dragged = this.hovered;
                this.wasSelected = sel.has(this.hovered);
                if (!this.wasSelected && this.hovered.type!="MIDPOINT")
                    sel.set([this.hovered]);
                state.set("LEFTDOWN")
            }
            // Shift: click toggles selection, drag moves selection or subnet
            else if (this.leftClick(evt) && SCA(evt,"Sc.") &&
                this.hovered) 
            {
                this.shiftTarget=this.hovered;
                pn.connected.length=0;
                if (sel.has(this.hovered)) this.dragged=this.hovered;
                else pn.getConnectedAll(this.hovered);
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
                this.wasSelected = sel.has(this.hovered) && sel.size==1;
                state.set("MULTISEGMENT");
            }
            // Right-click / long-press: the tool's remove action, else the menu
            else if (this.rightClick(evt)) {
                if (!secondaryAction(this.hovered))
                    ctxMenu.openFor(this.hovered, {x:tcursor.x, y:tcursor.y},
                        evt.clientX, evt.clientY);
            }
            // Rotate Transition - fine
            else if (evt.type == "mw" && SCA(evt, "sca") && 
                this.hovered && this.hovered.type=="TRANSITION") 
            {
                this.hovered.rotate(delta);
                pn.needTimedUndo="AFTER_IDLETIME";
            }
/*            // Rotate Transition - course
           else if (evt.type == "mw" && SCA(evt, "Sca") && 
               this.hovered && this.hovered.type=="TRANSITION") 
           {
               this.hovered.rotate(delta, true);
               pn.needTimedUndo=true;
           }
 */            // Adjust Flow weight
            else if (evt.type == "mw" && SCA(evt, "sca") &&
                this.hovered && this.hovered.type=="FLOW" &&
                this.hovered.subtype!="RESET") 
            {
                this.hovered.weight+=delta;
                if (this.hovered.weight<1) this.hovered.weight=1;
                pn.needTimedUndo="AFTER_IDLETIME";
            }
            // Adjust Label size
            else if (evt.type == "mw" && SCA(evt, "sca") &&
                this.hovered && this.hovered.type=="LABEL") 
            {
                this.hovered.size+=2*delta;
                if (this.hovered.size<8) this.hovered.size=8;
                pn.needTimedUndo="AFTER_IDLETIME";
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
                    if (sel.has(this.hovered)) sel.colorLike(this.hovered);
                    pn.needTimedUndo="AFTER_WHEEL";
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
                pn.needTimedUndo="AFTER_WHEEL";
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
              if (sel.has(this.hovered) && sel.size>1) {
                sel.rotateAround(this.hovered, delta);
                pn.needTimedUndo="AFTER_WHEEL";
              } else {
                pn.connected.length=0;
                if (["PLACE","TRANSITION"].includes(this.hovered.type))
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
                pn.needTimedUndo="AFTER_WHEEL";
              }
            }
        }
        // Esc cancels any gesture in progress (drag, new arc, pan, zoom...)
        else if (evt.type == "kd" && evt.key == "Escape" && !bar.running()) {
            if (state.is("DRAG") || state.is("DRAGALL") || state.is("MULTISEGMENT")) {
                // restore the last committed state (taken before the drag)
                if (undoPtr>=0) rawLoad(undo[undoPtr]);
                pn.needUndo=false;
                this.dragged=null;
                events.refreshHover();
            }
            this.paleArrow=null;
            if (state.is("DRAWARROW")) pn.highlighted=null;
            state.set("IDLE");
        }
        // LEFTDOWN STATE
        else if (state.is("LEFTDOWN")) {
            // New Place
            if (evt.type == "mu" && !this.hovered && SCA(evt, "sca")
                && closeEnough(this.mouseDownCoord, tcursor)
                && (tool=="SELECT" || tool=="MARKING" || tool=="PAN" ||
                    ["FLOW","INHIBITOR","RESET"].includes(tool))) 
            {
                sel.clear();
                state.set("IDLE");
            }
            // click on empty canvas: create with the current tool
            else if (evt.type == "mu" && !this.hovered &&
                (SCA(evt, "sca") || (tool!="SELECT" && SCA(evt,"Sca")))
                && closeEnough(this.mouseDownCoord, tcursor)) 
            {
                sel.clear();
                const o=createByTool(scursor, SCA(evt,"S.."));
                if (o) {
                    pn.highlighted = o;
                    pn.newUndo();
                    // open the editor after this click is fully handled
                    // (otherwise the same mouse-up would close it at once)
                    if (o.type=="LABEL") setTimeout(()=>editName(o),0);
                }
                state.set("IDLE");
            }
            // New Transition - horizontal
            else if (evt.type == "mu" && !this.hovered && SCA(evt,"sCa") 
                && closeEnough(this.mouseDownCoord, tcursor)) 
            {
                sel.clear();
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
                sel.clear();
                const newTrans = new Transition(scursor.x, scursor.y, 0);
                pn.addTransition(newTrans);
                pn.highlighted = newTrans;
                pn.newUndo();
                state.set("IDLE");
            }
            // New Label
            else if (evt.type == "mu" && SCA(evt, "scA") 
                && !this.hovered && 
                closeEnough(this.mouseDownCoord, tcursor)) 
            {
                const newLabel = new Label("-",scursor.x,scursor.y);
                pn.addLabel(newLabel);
                pn.highlighted=newLabel;
                pn.newUndo();
                state.set("IDLE");
            }
            // Init Drag
            else if (evt.type == "mm" && SCA(evt, "sca") && pn.highlighted &&
                !closeEnough(this.mouseDownCoord, tcursor)) 
            {
                state.set("DRAG");
            }
            // Init rubber band selection
            else if (evt.type == "mm" && SCA(evt, "..a") && !pn.highlighted &&
                !closeEnough(this.mouseDownCoord, tcursor)) 
            {
                this.selAdditive = !SCA(evt,"sca");
                state.set("SELECT");
            }
        }
        // DRAG STATE
        else if (state.is("DRAG")) {
            // Do Drag
            if (evt.type == "mm" && this.dragged) {
                const dx=scursor.x - this.mouseDownCoord.x,
                      dy=scursor.y - this.mouseDownCoord.y;
                if (sel.has(this.dragged)) sel.moveBy(dx,dy);
                else this.dragged.dragTo(dx,dy);
                this.mouseDownCoord.moveTo(scursor);
                pn.needUndo = true;
            }
            if (evt.type == "mu") {
                state.set("IDLE");
            }
        }
        // SELECT STATE (rubber band)
        else if (state.is("SELECT")) {
            if (evt.type == "mu") {
                const found=sel.inRect(this.mouseDownCoord, tcursor);
                if (this.selAdditive) sel.add(found); else sel.set(found);
                sel.preview=[];
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
                const from=pn.highlighted, to=this.hovered;
                if (tool=="INHIBITOR" || tool=="RESET") {
                    const okDir = tool=="INHIBITOR" ? (from.type=="PLACE" && to.type=="TRANSITION")
                                                    : (from.type=="TRANSITION" && to.type=="PLACE");
                    if (okDir) {
                        const f=new Flow(from,to);
                        f.subtype=tool;
                        pn.addFlow(f);
                        pn.newUndo();
                    }
                    else showToast(tool=="INHIBITOR" ? "An inhibitor arc goes from a place to a transition"
                                                     : "A reset arc goes from a transition to a place", 3000);
                }
                else {
                    pn.addFlows(from, to);
                    pn.newUndo();
                }
                pn.highlighted = to;
                state.set("IDLE");
            }
        }
        // MULTISEGMENT STATE
        else if (state.is("MULTISEGMENT")) {
            // Toggle Flow Enabler/Inhiboitor
            if (evt.type == "mu") {
                sel.set([this.dragged]);
                state.set("IDLE");
            }
            else if (evt.type == "mu") {
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
            // Drag: move the selection (if the object is selected) or its subnet
            if (evt.type == "mm" && !closeEnough(this.mouseDownCoord, tcursor)) {
                state.set(sel.has(this.shiftTarget) ? "DRAG" : "DRAGALL");
            }
            // Click: add to / remove from the selection
            else if (evt.type == "mu") {
                sel.toggle(this.shiftTarget);
                pn.connected.length=0;
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
            // Right-click while running: context menu (Stop, tokens)
            if (this.rightClick(evt)) {
                ctxMenu.openFor(this.hovered, {x:tcursor.x, y:tcursor.y},
                    evt.clientX, evt.clientY);
            }
        }
        else if (state.is("MIDDLE")) {
            // Middle-button drag: pan
            if (evt.type == "mm" && !closeEnough(this.mouseDownCoord, tcursor)) {
                state.set("PAN");
            }
            // Init Zoom
            else if (evt.type == "mw") {
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
            // Undo after Mouse-up (for drag/dragall events)
            if (pn.needTimedUndo=="AFTER_DRAG") {
                pn.newUndo();
                pn.needTimedUndo="NO_NEED";
            }
            pn.dragged=null;
            fb.paleArrow=null;
            if (state.is("PLAY")||state.is("RUN")||state.is("FLY")) {
            }
            else {
                state.set("IDLE");
            }
        }
        // Wheel timeout administration
        if (SCA(evt,"sca")) {
            // Undo after idle time (for multi-wheel events)
            if (pn.needTimedUndo=="AFTER_IDLETIME") {
                pn.newUndo();
                pn.needTimedUndo="NO_NEED";
            }
        }
        // Shift-up administration
        if (SCA(evt,"sca")) {
            // Undo after Shift-up (for shifted multi-wheel events)
            if (pn.needTimedUndo=="AFTER_WHEEL") {
                pn.newUndo();
                pn.needTimedUndo="NO_NEED";
            }
        }
        // Single undo after all events processed
        if (pn.needUndo && !state.is("DRAG") && !state.is("DRAGALL")) {
            pn.needUndo=false;
            pn.newUndo();
        }
    }
}
