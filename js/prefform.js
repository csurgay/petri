let pd=20, pi=0;
class PrefForm extends Form {
    constructor(title, x, y, w, h) {
        super("PREFFORM", title, x, y, w, h);
        this.gridSize=new Control(this,"Grid Size",x+100,y+100+pd*pi++,"INTEGER",grid);
        this.gridShown=new Control(this,"Grid Shown",x+100,y+100+pd*pi++,"BOOLEAN",true);
        this.snapToGrid=new Control(this,"Snap to Grid",x+100,y+100+pd*pi++,"BOOLEAN",true);
        this.assertOnOff=new Control(this,"Breakpoint",x+100,y+100+pd*pi++,"BOOLEAN",false);
        this.assertString=new Control(this,"Assert String",x+100,y+100+pd*pi++,"STRING","P1>1 || P2>1 || P3>1");
    }
    draw() {
        super.draw();
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
