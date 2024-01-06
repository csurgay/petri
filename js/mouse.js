const LEFTBUTTON=0, MIDDLEBUTTON=1, RIGHTBUTTON=2;

var cursor=new Coord(0,0); // Viewport cursor
var ccursor=new Coord(0,0); // Canvas cursor
var o;

function shiftKeys(evt,key) {
    if (key=="NONE") return !evt.ctrlKey && !evt.shiftKey && !evt.altKey;
    else if (key=="CTRL") return evt.ctrlKey && !evt.shiftKey && !evt.altKey;
    else if (key=="SHIFT") return !evt.ctrlKey && evt.shiftKey && !evt.altKey;
    else if (key=="ALT") return !evt.ctrlKey && !evt.shiftKey && evt.altKey;
    else if (key=="ALTSHIFT") return !evt.ctrlKey && evt.shiftKey && evt.altKey;
}

function mousedown(evt) {
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

var files=[], selectedFile=-1;
function mouseup(evt) {
    getCoord(evt);
    o=pn.getCursoredObject(ccursor,"CANVAS");
    if (state==FILES) {
        if (selectedFile!=-1) {
            if (DEBUG) { 
                console.log(selectedFile);
                console.log(files[selectedFile]);
            }
            pn.load("nets/"+files[selectedFile]);
            pn.animate=true;
            stateChange(IDLE);
            animate();
        }
    }
    else if (o) {
        o.clicked();
    }
    else {
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
                pn.newUndo();
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
            pn.newUndo();
        }
        // New Place
        else if (state==LEFTDOWN && closeEnough(pn.mouseDownCoord,cursor)) {
            const newPlace = new Place(cursor.x,cursor.y);
            pn.addPlace(newPlace);
            pn.highlighted=newPlace;
            pn.newUndo();
        }
        // Delete Object
        else if (state==DELETE && closeEnough(pn.mouseDownCoord,cursor) && o) {
            o.delete();
            delete o;
            pn.highlighted=null;
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
        if (state!=RUN) stateChange(IDLE);
        pn.dragged=null;
        pn.paleArrow=null;
    }
}

function mousemove(evt) {
    getCoord(evt);
    o=pn.getCursoredObject(ccursor,"CANVAS");
    if (state==FILES) {
        clearCanvas(canvas);
        selectedFile=-1;
        for (var i=0; i<files.length; i++) {
            ctx.textAlign = "left";
            ctx.textBaseline = 'top';
            ctx.font="16px arial";
            ctx.fillStyle=COLOR_INK;
            var width=ctx.measureText(files[i]).width;
            if (cursor.x>50 && cursor.x<50+width && cursor.y>50+20*i && cursor.y<69+20*i) {
                ctx.font="bold 16px arial";
                selectedFile=i;
            }
            ctx.fillText(files[i],50,50+20*i);
        }
    }
    else if (o) {

    }
    else {
        o=pn.getCursoredObject(cursor,"VIEWPORT");
        // Init Drag
        if (state==LEFTDOWN && !closeEnough(pn.mouseDownCoord,cursor)) {
            stateChange(DRAG);
        }
        // Do Drag
        if (state==DRAG && pn.dragged) {
            pn.dragged.dragTo(cursor.x-pn.mouseDownCoord.x,cursor.y-pn.mouseDownCoord.y);
            pn.mouseDownCoord.moveTo(cursor);
            pn.needUndo=true;
        }
        // Do DragAll (SubNet)
        else if (state==DRAGALL) {
            pn.connected.forEach(da => { 
                da.dragTo(cursor.x-pn.mouseDownCoord.x,cursor.y-pn.mouseDownCoord.y); 
            });
            pn.mouseDownCoord.moveTo(cursor);
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
                pn.vpx+=cursor.x-pn.mouseDownCoord.x;
                pn.vpy+=cursor.y-pn.mouseDownCoord.y;
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
    const delta=-Math.sign(evt.deltaY);
    getCoord(evt);
    o=pn.getCursoredObject(ccursor,"VIEWPORT");
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
        if (o.type==PLACE) {
            o.changeTokens(delta);
            pn.needTimedUndo=true;
        }
        // Rotate Transition
        else if (o.type==TRANSITION) {
            o.rotate(delta);
            pn.needTimedUndo=true;
        }
        // Adjust Flow weight
        else if (o.type==FLOW) {
            o.weight+=delta;
            if (o.weight<1) o.weight=1;
            pn.needTimedUndo=true;
        }
    }
    // Color change on Object
    else if (o && shiftKeys(evt,"ALT")) {
        if (!evt.shiftKey) {
            o.nextColor(delta);
            pn.needTimedUndo=true;
        }
    }
    // Color change Shubnet
    else if (o && shiftKeys(evt,"ALTSHIFT")) {
        pn.connected.length=0;
        pn.getConnected(o);
        pn.connected.forEach(o=>o.nextColor(delta));
        pn.needTimedUndo=true;
    }
    // Rewind and Forward
    else if (shiftKeys(evt,"NONE")) {
        stateChange(IDLE);
        if (delta<0) pn.stepBackward();
        if (delta>0) pn.stepForward();
    }
    // 
    else if (o && shiftKeys(evt,"SHIFT")) {
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
    }
}
