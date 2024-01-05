const LEFTBUTTON=0, MIDDLEBUTTON=1, RIGHTBUTTON=2;

var cursor=new Coord(0,0);
var o;

function shiftKeys(evt,key) {
    if (key=="NONE") return !evt.ctrlKey && !evt.shiftKey && !evt.altKey;
    else if (key=="CTRL") return evt.ctrlKey && !evt.shiftKey && !evt.altKey;
    else if (key=="SHIFT") return !evt.ctrlKey && evt.shiftKey && !evt.altKey;
    else if (key=="ALT") return !evt.ctrlKey && !evt.shiftKey && evt.altKey;
    else if (key=="ALTSHIFT") return !evt.ctrlKey && evt.shiftKey && evt.altKey;
}

function mousedown(evt) {
    getCoord(evt,"CANVAS");
    o=pn.getCursoredObject(cursor,"CANVAS");
    if (o) {

    }
    else {
        getCoord(evt,"VIEWPORT");
        pn.mouseDownCoord.x=cursor.x; 
        pn.mouseDownCoord.y=cursor.y;
        o=pn.getCursoredObject(cursor,"VIEWPORT");
        if (evt.button==LEFTBUTTON) {
            if (o==null) {
                // New Object, Pan
                if (state==IDLE && shiftKeys(evt,"NONE")) {
                    stateChange(LEFTDOWN);
                }
            }
            else if (o) {
                // Object click, Drag
                if (o.type!=FLOW && shiftKeys(evt,"NONE")) {
                    stateChange(LEFTDOWN);
                    pn.dragged=o;
                }
                // Subnet drag
                else if (shiftKeys(evt,"SHIFT")) {
                    stateChange(DRAGALL);
                    pn.connected.length=0;
                    pn.getConnectedAll(o);
                }
                // New potential Flow
                else if (shiftKeys(evt,"CTRL")) {
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

function mouseup(evt) {
    getCoord(evt,"CANVAS");
    o=pn.getCursoredObject(cursor,"CANVAS");
    if (o) {
        o.clicked();
    }
    else {
        getCoord(evt,"VIEWPORT");
        o=pn.getCursoredObject(cursor,"VIEWPORT");
            // New Flow
        if (state==DRAWARROW && o && o!=pn.highlighted) {
            pn.addFlows(pn.highlighted,o);
            pn.highlighted=o;
            pn.newUndo();
        }
        else if (state==LEFTDOWN && o && o==pn.highlighted && closeEnough(pn.mouseDownCoord,cursor)) {
            // Toggles
            if (pn.noFlowFromHere(o)) {
                // Toggle Place to Transition
                pn.togglePlaceTransition(o);
            }
            // Fire a Transition
            else if(o.type==TRANSITION) {
                if (o.enabled()) pn.fireOne(o);
            }
        }
        // Toggle Flow Enabler/Inhiboitor
        else if(o && o.type==FLOW && o.o1.type==PLACE && state==MULTISEGMENT) {
            if (o.subtype=="ENABLER") o.subtype="INHIBITOR";
            else if (o.subtype=="INHIBITOR") o.subtype="ENABLER";
        }
        // New Place
        else if (state==LEFTDOWN && closeEnough(pn.mouseDownCoord,cursor)) {
            const newPlace = new Place(cursor.x,cursor.y);
            pn.addPlace(newPlace);
            pn.highlighted=newPlace;
        }
        // Delete Object
        else if (state==DELETE && closeEnough(pn.mouseDownCoord,cursor) && o) {
            o.delete();
            delete o;
            pn.highlighted=null;
        }
        // Clear Place Tokens
        else if (state==MIDDLE && o && o.type==PLACE) {
            o.changeTokens(-o.tokens);
        }
        // Clear all net Tokens
        else if (state==MIDDLE && !o) {
            pn.p.forEach(p => p.changeTokens(-p.tokens));
        }
        if (state!=RUN) stateChange(IDLE);
        pn.dragged=null;
        pn.paleArrow=null;
    }
}

function mousemove(evt) {
    getCoord(evt,"CANVAS");
    o=pn.getCursoredObject(cursor,"CANVAS");
    if (o) {

    }
    else {
        getCoord(evt,"VIEWPORT");
        o=pn.getCursoredObject(cursor,"VIEWPORT");
        // Init Drag
        if (state==LEFTDOWN && !closeEnough(pn.mouseDownCoord,cursor)) {
            stateChange(DRAG);
        }
        // Do Drag
        if (state==DRAG && pn.dragged) {
            pn.dragged.dragTo(cursor.x-pn.mouseDownCoord.x,cursor.y-pn.mouseDownCoord.y);
            pn.mouseDownCoord.moveTo(cursor);
        }
        // Do DragAll (SubNet)
        else if (state==DRAGALL) {
            pn.connected.forEach(da => { 
                da.dragTo(cursor.x-pn.mouseDownCoord.x,cursor.y-pn.mouseDownCoord.y); 
            });
            pn.mouseDownCoord.moveTo(cursor);
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
                pn.vpx+=cursor.x-pn.mouseDownCoord.x;
                pn.vpy+=cursor.y-pn.mouseDownCoord.y;
            }
        }
        // Multisegment Flow
        else if (state==MULTISEGMENT) {
            pn.highlighted=pn.dragged.addSegment(pn.mouseDownCoord);
            pn.dragged=pn.highlighted;
            stateChange(DRAG);
        }
        // Highlight mouseovered object
        else {
            if (o) pn.highlighted = o;
            else pn.highlighted = null;
        }
    }
}

function mousewheel(evt) {
    const delta=-Math.sign(evt.deltaY);
    getCoord(evt,"VIEWPORT");
    o=pn.getCursoredObject(cursor,"VIEWPORT");
    // Zoom
    if (state==MIDDLE || state==ZOOM) {
        stateChange(ZOOM);
        pn.zoom+=delta/10;
        pn.zoom=Math.round(10*pn.zoom)/10;
        if (pn.zoom<0.3) pn.zoom=0.3;
        if (pn.zoom>3) pn.zoom=3;
    }
    else if (o && shiftKeys(evt,"NONE")) {
        // Tokens add/remove
        if (o.type==PLACE) {
            o.changeTokens(delta);
        }
        // Rotate Transition
        else if (o.type==TRANSITION) {
            o.rotate(delta);
        }
        // Adjust Flow weight
        else if (o.type==FLOW) {
            o.weight+=delta;
            if (o.weight<1) o.weight=1;
        }
    }
    // Color change on Object
    else if (o && shiftKeys(evt,"ALT")) {
        if (!evt.shiftKey) {
            o.nextColor(delta);
        }
    }
    // Color change Shubnet
    else if (o && shiftKeys(evt,"ALTSHIFT")) {
        pn.connected.length=0;
        pn.getConnected(o);
        pn.connected.forEach(o=>o.nextColor(delta));
    }
    else {
        // Rewind and Forward
        stateChange(IDLE);
        if (delta<0) pn.stepBackward();
        if (delta>0) pn.stepForward();
    }
}
