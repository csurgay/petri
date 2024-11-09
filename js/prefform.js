class PrefForm extends Form {
    constructor(title, x, y, w, h) {
        super("PREFFORM", title, x, y, w, h);
    }
    draw() {
        // Title line
        g.standard(1);
        g.setupText("16px arial", "right", "middle");
        g.fillStyle(COLOR_INK);
        g.fillText(getFormattedDate(), this.w - 25, 30);
        // Draw PetriNet
        super.draw();
        pn.l.forEach(item => { item.draw(); })
    }
    leftClick(evt) {
        return evt.type=="md" && evt.button==LEFTBUTTON;
    }
    processFormEvent(evt) {
        if (!this.hover()) return;
        super.processFormEvent(evt);
        const delta=-Math.sign(evt.deltaY);
        // IDLE or running state (PLAY/RUN/FLY)
        if (state.is("IDLE")) {
            // Add/remove values
            if (evt.type == "mw" && SCA(evt, "sca") && 
                this.hovered && this.hovered.type=="LABEL") 
            {
                //this.hovered.changeValue(delta);
            }
        }
        // IDLE STATE
        if (state.is("IDLE")) {
            if (evt.type == "ku") {
                // Label size number key
                if (evt.key >= '0' && evt.key <= '5') {
                    if (this.hovered && this.hovered.type == "LABEL") {
                        this.hovered.size = sizes[evt.keyCode - 48];
                    }
                }
            }
            // Adjust Label size
            else if (evt.type == "mw" && SCA(evt, "sca") &&
                this.hovered && this.hovered.type=="LABEL") 
            {
                this.hovered.size+=2*delta;
                if (this.hovered.size<8) this.hovered.size=8;
                pn.needTimedUndo=true;
            }
            // Label edit
            else if (evt.type == "mu" && this.hovered && 
                this.hovered.type=="LABEL" && 
                closeEnough(this.mouseDownCoord, tcursor)) 
            {
                this.hovered.clicked(evt);
            }
        }
    }
}
