class BaseForm extends Form {
    constructor(title,x,y,w,h) {
        super("BASEFORM",title,x,y,w,h);        
        this.active=true;
        this.visible=true;
        this.paleArrow=null; // Potential new Flow
    }
    draw() {
        super.draw();
        // Title line
        g.standard(1);
        g.setupText("16px arial","right","middle");
        g.fillStyle(COLOR_INK);
        g.fillText(getFormattedDate(),this.w-25,30);
        // Static Status and Buttons
        pn.s.forEach(item => item.draw());
        pn.b.forEach(item => item.draw());
        // Draw PetriNet
        g.save();
        g.translate(pn.cx,pn.cy);
        g.scale(pn.zoom,pn.zoom);
        g.translate(pn.vpx,pn.vpy);
        // Draw potential new Flow
        if (this.paleArrow && isState("DRAWARROW")) {
            const o=this.paleArrow[0];
            const c=this.paleArrow[1];
            drawArrow(o.x,o.y,c.x,c.y);
        }
        pn.f.forEach(item => { item.draw(); })
        pn.t.forEach(item => { item.draw(); })
        pn.p.forEach(item => { item.draw(); })
        pn.l.forEach(item => { item.draw(); })
        g.restore();
    }
    mousedown(myevt) { mousedown(myevt); }
    mouseup(myevt) { mouseup(myevt); }
    mousemove(myevt) { mousemove(myevt); }
    mousewheel(myevt) { mousewheel(myevt); }
    keydown(myevt) {}
    keyup(myevt) {
        getCoord(myevt); // sets cursor (translated canvas) and ccursor (orig canvas)
        o=pn.getCursoredObject(cursor,"VIEWPORT");
        if (myevt.key=='d') DEBUG=1-DEBUG;
        else if (myevt.key=='.') {
            RUNNING=!RUNNING;
        }
        else if (myevt.key=='p') {
            PLAYBACK=1-PLAYBACK;
            if (PLAYBACK==1) RECORD=0;
        }
        else if (myevt.key=='r' && PLAYBACK==0) {
            RECORD=1-RECORD;
            if (RECORD==1) events.rec=[];
        }
        else if (myevt.key=='l') {
            pn.macroLoad("macro/nemtudom.rec");
        }
        else if (myevt.key=='s') {
            // Toggle sticky Flow heads of this Transition
            if (o && o.type==TRANSITION) {
                pn.f.forEach(f=>{
                    if (f.o2==o) {
                        f.stickyHead=!f.stickyHead;
                    }
                })
            }
        }
        // Label size number key
        else if (myevt.key>='0' && myevt.key<='5') {
            if (o && o.type==LABEL) {
                o.size=sizes[myevt.keyCode-48];
            }
        }
    }
}
