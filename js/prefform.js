class PrefForm extends Form {
    constructor(title, x, y, w, h) {
        super("PREFFORM", title, x, y, w, h);
        this.assertOnOff=new Control("Assert On/Off",x+100,y+100,"BOOLEAN",false);
        this.assertString=new Control("Assert String",x+100,y+120,"STRING","P1>1 || P2>1 || P3>1");
        this.addChild(this.assertOnOff);
        this.addChild(this.assertString);
    }
    draw() {
        super.draw();
        this.children.forEach(child => { child.draw(); })
    }
    processFormEvent(evt) {
        if (!this.hover() && evt.type!="ku") return;
        super.processFormEvent(evt);
        this.hovered=this.getCursoredObject(evt);
        const delta=-Math.sign(evt.deltaY);
        // IDLE or running state (PLAY/RUN/FLY)
        if (state.is("IDLE")) {
            // Add/remove values
            if (evt.type == "mw" && SCA(evt, "sca") && 
                this.hovered && this.hovered.type=="CONTROL") 
            {
                if (delta>0) this.hovered.increment();
                else if (delta<0) this.hovered.decrement();
            }
        }
        // IDLE STATE
        if (state.is("IDLE")) {
            // Label edit
            if (evt.type == "mu" && this.hovered && 
                this.hovered.type=="LABEL" && 
                closeEnough(this.mouseDownCoord, tcursor)) 
            {
                this.hovered.clicked(evt);
            }
        }
    }
}
