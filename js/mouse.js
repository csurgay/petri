const LEFTBUTTON=0, MIDDLEBUTTON=1, RIGHTBUTTON=2;

var cursor=new Coord(0,0); // Viewport (translated) cursor
var scursor=new Coord(0,0); // Snapped viewport (translated) cursor
var ccursor=new Coord(0,0); // Canvas cursor (for toolbar, not translated)
var o;

function mousedown(evt) {
    storedEvt.store("mousedown",getFormattedDate('millisec'),evt);
    getCoord(evt);
    o=pn.getCursoredObject(ccursor,"CANVAS");
    if (o) {

    }
    else {
        pn.mouseDownCoord.x=cursor.x; 
        pn.mouseDownCoord.y=cursor.y;
        o=pn.getCursoredObject(cursor,"VIEWPORT");
        if (evt.button==LEFTBUTTON) {
            if (o==null) {
                // New Object, Pan
                if (state==IDLE && shiftKeys(evt,"CTRLALTNONE")) {
                    stateChange(LEFTDOWN);
                }
            }
            else if (o) {
                // Object click, Drag
                if (state!=TEXTBOX && o.type!=FLOW && shiftKeys(evt,"ALTNONE")) {
                    stateChange(LEFTDOWN);
                    pn.dragged=o;
                }
                // Subnet drag
                else if (shiftKeys(evt,"SHIFT")||shiftKeys(evt,"ALTSHIFT")) {
                    stateChange(SHIFTCLICK);
                    pn.connected.length=0;
                    pn.getConnectedAll(o);
                }
                // New potential Flow
                else if (o && (o.type==PLACE || o.type==TRANSITION) && shiftKeys(evt,"CTRL")) {
                    stateChange(DRAWARROW);
                }
                // Multisegment Flow or Flow Toggle
                else if (o.type==FLOW && shiftKeys(evt,"NONE")) {
                    stateChange(MULTISEGMENT);
                    pn.dragged=o;
                }
            }
        }
        else if (evt.button==RIGHTBUTTON && shiftKeys(evt,"NONE")) {
            if (o==null) {
                // Running mode
                if (state==IDLE) stateChange(RUN);
                else if (state==RUN) stateChange(IDLE);
            }
            // Delete
            else {
                stateChange(DELETE);
            }
        }
        // Zoom
        else if (evt.button==MIDDLEBUTTON && shiftKeys(evt,"NONE")) {
            stateChange(MIDDLE);
        }
    }
}

var files=[], directory="", selectedFile=-1;
function mouseup(evt) {
    storedEvt.store("mouseup",getFormattedDate('millisec'),evt);
    getCoord(evt); // sets cursor (translated canvas) and ccursor (orig canvas)
    o=pn.getCursoredObject(ccursor,"CANVAS");
    if (state==FILES) {
        if (selectedFile!=-1) {
            if (DEBUG) { 
                console.log(selectedFile);
                console.log(files[selectedFile]);
            }
            if (files[selectedFile]!="CANCEL") {
                pn.load(directory+"/"+files[selectedFile]);
            }
            pn.visible=true;
            stateChange(IDLE);
            animate();
        }
    }
    // CLicked object (Place, Trans, Midpoint, Label)
    else if (o) {
        o.clicked(evt);
    }
    else {
        o=pn.getCursoredObject(cursor,"VIEWPORT");
        // New Flow
        if (state==DRAWARROW && o && o!=pn.highlighted &&
            (o.type==PLACE || o.type==TRANSITION)) {
            pn.addFlows(pn.highlighted,o);
            pn.highlighted=o;
            pn.newUndo();
        }
        // No New Flow
        else if (state==DRAWARROW && o==null) {
            pn.highlighted=null;
        }
        else if (state==LEFTDOWN && o && o==pn.highlighted && 
            closeEnough(pn.mouseDownCoord,cursor) &&
            (o.type==PLACE || o.type==TRANSITION)) {
            // Toggles
            if (pn.noFlowFromHere(o)) {
                // Toggle Place to Transition
                pn.togglePlaceTransition(o);
                pn.newUndo();
            }
            // Fire a Transition
            else if(o.type==TRANSITION) {
                if (o.enabled()) pn.fireOne(o);
            }
        }
        // Label enter edit click
        else if (state==LEFTDOWN && o && o.type==LABEL && 
            closeEnough(pn.mouseDownCoord,cursor)) {
            o.clicked(evt);
        }
        // Textbox text cursor click
        else if (state==TEXTBOX && textbox.cursorIn(cursor)) {
            textbox.clicked(cursor);
        }
        // Textbox cancel click
        else if (state==TEXTBOX && !o) {
            textbox.cancel();
        }
        // Toggle Flow Enabler/Inhiboitor
        else if(state==MULTISEGMENT && o && o.type==FLOW && o.o1.type==PLACE) {
            if (o.subtype=="ENABLER") o.subtype="INHIBITOR";
            else if (o.subtype=="INHIBITOR") o.subtype="ENABLER";
            pn.newUndo();
        }
        // New Place
        else if (state==LEFTDOWN && o==null && shiftKeys(evt,"NONE") && closeEnough(pn.mouseDownCoord,cursor)) {
            const newPlace = new Place(scursor.x,scursor.y);
            pn.addPlace(newPlace);
            pn.highlighted=newPlace;
            pn.newUndo();
        }
        // New Transition
        else if (state==LEFTDOWN && o==null && shiftKeys(evt,"CTRL") && closeEnough(pn.mouseDownCoord,cursor)) {
            const newTrans = new Transition(scursor.x,scursor.y);
            pn.addTransition(newTrans);
            pn.highlighted=newTrans;
            pn.newUndo();
        }
        // New Label
        else if (state==LEFTDOWN && o==null && shiftKeys(evt,"ALT") && closeEnough(pn.mouseDownCoord,cursor)) {
            const newLabel = new Label(" ",scursor.x,scursor.y);
            pn.highlighted=newLabel;
            pn.newUndo();
        }
        // Delete Object
        else if (state==DELETE && o && closeEnough(pn.mouseDownCoord,cursor)) {
            o.delete();
            delete o;
            pn.highlighted=null;
            pn.newUndo();
        }
        // Copy subnet
        else if (state==SHIFTCLICK && o && shiftKeys(evt,"SHIFT") && closeEnough(pn.mouseDownCoord,cursor)) {
            pn.connected.forEach(o=>{
                if (o.type==PLACE) {
                    const newObject=new Place(o.x+20,o.y+20);
                    newObject.label.label=o.label.label;
                    newObject.label.x=o.label.x+20;
                    newObject.label.y=o.label.y+20;
                    newObject.color=o.color;
                    newObject.tokens=o.tokens;
                    pn.addPlace(newObject);
                }
                else if (o.type==TRANSITION) {
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
        else if (state==MIDDLE && o && o.type==PLACE) {
            o.changeTokens(-o.tokens);
            pn.newUndo();
        }
        // Clear all net Tokens
        else if (state==MIDDLE && !o) {
            pn.p.forEach(p => p.changeTokens(-p.tokens));
            pn.newUndo();
        }
        else if (pn.needUndo) {
            pn.needUndo=false;
            pn.newUndo();
        }
        if (state!=RUN && state!=TEXTBOX) stateChange(IDLE);
        pn.dragged=null;
        pn.paleArrow=null;
    }
}

function mousemove(evt) {
    storedEvt.store("mousemove",getFormattedDate('millisec'),evt);
    getCoord(evt);
    o=pn.getCursoredObject(ccursor,"CANVAS");
    if (o) pn.highlighted=o;
    if (o) {

    }
    else {
        o=pn.getCursoredObject(cursor,"VIEWPORT");
        // Init Drag
        if (state==LEFTDOWN && !closeEnough(pn.mouseDownCoord,cursor)) {
            stateChange(DRAG);
        }
        // Do Drag
        if (state==DRAG && pn.dragged) {
            pn.dragged.dragTo(scursor.x-pn.mouseDownCoord.x,scursor.y-pn.mouseDownCoord.y);
            pn.mouseDownCoord.moveTo(scursor);
            pn.needUndo=true;
        }
        // Do DragAll (SubNet)
        else if (state==SHIFTCLICK || state==DRAGALL) {
            stateChange(DRAGALL);
            pn.connected.forEach(da => { 
                da.dragTo(scursor.x-pn.mouseDownCoord.x,scursor.y-pn.mouseDownCoord.y); 
            });
            pn.mouseDownCoord.moveTo(scursor);
            pn.needUndo=true;
        }
        // Draw potetntial new Flow
        else if (state==DRAWARROW) {
            pn.paleArrow=[pn.highlighted, cursor];
        }
        // Do Pan
        else if (state==DRAG || state==PAN) {
            if (!closeEnough(pn.mouseDownCoord,cursor))
            {
                stateChange(PAN);
                pn.vpx+=snap(cursor.x-pn.mouseDownCoord.x);
                pn.vpy+=snap(cursor.y-pn.mouseDownCoord.y);
            }
        }
        // Multisegment Flow
        else if (state==MULTISEGMENT) {
            pn.highlighted=pn.dragged.addSegment(pn.mouseDownCoord);
            pn.dragged=pn.highlighted;
            stateChange(DRAG);
            pn.newUndo();
        }
        // Highlight mouseovered object
        else {
            if (o) pn.highlighted = o;
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
    o=pn.getCursoredObject(cursor,"VIEWPORT");
    // Zoom
    if (state==MIDDLE || state==ZOOM) {
        if (state==MIDDLE) {
            var deltaX=ccursor.x-pn.cx;
            var deltaY=ccursor.y-pn.cy;
            pn.cx=ccursor.x; pn.cy=ccursor.y;
            pn.vpx-=deltaX/pn.zoom; pn.vpy-=deltaY/pn.zoom;
        }
        stateChange(ZOOM);
        pn.zoom+=delta/10;
        pn.zoom=Math.round(10*pn.zoom)/10;
        if (pn.zoom<0.3) pn.zoom=0.3;
        if (pn.zoom>3) pn.zoom=3;
    }
    else if (o && shiftKeys(evt,"NONE")) {
        // Tokens add/remove
        if (state!=TEXTBOX && o.type==PLACE) {
            o.changeTokens(delta);
            pn.needTimedUndo=true;
        }
        // Rotate Transition
        else if (state!=TEXTBOX && o.type==TRANSITION) {
            o.rotate(delta);
            pn.needTimedUndo=true;
        }
        // Adjust Flow weight
        else if (state!=TEXTBOX && o.type==FLOW) {
            o.weight+=delta;
            if (o.weight<1) o.weight=1;
            pn.needTimedUndo=true;
        }
        // Adjust Label size
        else if (state!=TEXTBOX && o.type==LABEL) {
            o.size+=delta;
            if (o.size<8) o.size=8;
            pn.needTimedUndo=true;
        }
    }
    // Color change on Object
    else if (state!=TEXTBOX && o && shiftKeys(evt,"ALT")) {
        if (!evt.shiftKey) {
            o.nextColor(delta);
            pn.needTimedUndo=true;
        }
    }
    // Color change Shubnet
    else if (state!=TEXTBOX && o && shiftKeys(evt,"ALTSHIFT")) {
        pn.connected.length=0;
        pn.getConnected(o);
        pn.connected.forEach(o=>o.nextColor(delta));
        pn.needTimedUndo=true;
    }
    // Rewind and Forward
    else if (state!=TEXTBOX && shiftKeys(evt,"NONE")) {
        stateChange(IDLE);
        if (delta<0) pn.stepBackward();
        if (delta>0) pn.stepForward();
    }
    // Rotate subnet
    else if (state!=TEXTBOX && o && shiftKeys(evt,"SHIFT")) {
        pn.connected.length=0;
        pn.getConnectedAll(o);
        pn.connected.forEach(r=>{
            rot=rotate(o.x,o.y,r.x,r.y,delta*Math.PI/32);
            r.x=rot[0]; r.y=rot[1];
            if (r.type==TRANSITION) {
                r.alpha+=delta*Math.PI/32;
            }
            if (r.label) {
                rot=rotate(o.x,o.y,r.label.x,r.label.y,delta*Math.PI/32);
                r.label.x=rot[0]; r.label.y=rot[1];
            }
        });
        pn.needTimedUndo=true;
    }
}
