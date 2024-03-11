class BaseForm extends Form {
    constructor(title,x,y,w,h) {
        super("BASEFORM",title,x,y,w,h);        
        this.active=true;
        this.visible=true;
        this.paleArrow=null; // Potential new Flow
    }
    draw() {
        // Title line
        g.standard(1);
        g.setupText("16px arial","right","middle");
        g.fillStyle(COLOR_INK);
        g.fillText(getFormattedDate(),this.w-25,30);
        // Draw PetriNet
        g.save();
        super.draw();
        g.clip();
        g.translate(pn.cx,pn.cy);
        g.scale(pn.zoom,pn.zoom);
        g.translate(pn.vpx,pn.vpy);
        // Draw potential new Flow
        if (this.paleArrow && state.is("DRAWARROW")) {
            const o=this.paleArrow[0];
            const c=this.paleArrow[1];
            drawArrow(o.x,o.y,c.x,c.y);
        }
        pn.f.forEach(item => { item.draw(); })
        pn.t.forEach(item => { item.draw(); })
        pn.p.forEach(item => { item.draw(); })
        pn.l.forEach(item => { item.draw(); })
        g.restore();
        // Static Status and Buttons
        pn.s.forEach(item => item.draw());
        pn.b.forEach(item => item.draw());
    }
    mousedown(myevt) { mousedown(myevt); }
    mouseup(myevt) { mouseup(myevt); }
    mousemove(myevt) { mousemove(myevt); }
    mousewheel(myevt) { mousewheel(myevt); }
    keydown(myevt) {}
    keyup(myevt) {
        getCoord(myevt); // sets cursor (translated canvas) and ccursor (orig canvas)
        o=pn.getCursoredObject(cursor,"VIEWPORT");
        if (myevt.key=='d') state.DEBUG=1-state.DEBUG;
        else if (myevt.key=='.') {
            state.RUNNING=false;
        }
        else if (myevt.key=='p') {
            state.PLAYBACK=1-state.PLAYBACK;
            if (state.PLAYBACK==1) state.RECORD=0;
        }
        else if (myevt.key=='r' && state.PLAYBACK==0) {
            state.RECORD=1-state.RECORD;
            if (state.RECORD==1) events.rec=[];
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
