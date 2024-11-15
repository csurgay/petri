const objects=["PLACE","TRANSITION","FLOW","MIDPOINT","LABEL","BAR.BUTTON"];

class Object extends Frame {
    constructor(x,y) {
        super("ObjectFrame",x,y,10,10);
        this.type="OBJECT";
        this.id;
        this.label=null;
        this.color=COLOR_INK;
        this.visible=true;
        this.attachedLabels=[]; // the Labels attached this Object
    }
    draw() {
    }
    drawLineToLabel() {
        if (state.DEBUG && this.label) {
            g.beginPath();
            g.strokeStyle(COLOR_INK);
            g.dashed(1,1);
            g.moveTo(this.label.x,this.label.y);
            g.lineTo(this.x,this.y);
            g.stroke();
        }
    }
    setColor() {
        g.strokeStyle(this.color);
        pn.highlighted==this?g.dashed():g.solid();
        g.strokeStyle(pn.highlighted==this?COLOR_HIGHLIGHT:this.color);
    }
    nextColor(delta) {
        if (delta>0) {
            this.color=COLORS[(COLORS.indexOf(this.color)+1)%COLORS.length];
        }
        else {
            this.color=COLORS[(COLORS.indexOf(this.color)-1+COLORS.length)%COLORS.length];
        }
        if (COLOR_HIGHLIGHT!="black") pn.highlighted=null;
    }
    hover() {
    }
    clicked(pMyEvent) {
    }
    dragTo(dx,dy) {
        this.x=snap(this.x+dx);
        this.y=snap(this.y+dy);
        this.attachedLabels.forEach(o=>{
            o.dragTo(dx,dy);
        })
    }
    delete() {
    }
    attach(o) {
        this.attachedLabels.push(o);
    }
    detach(o) {
        this.attachedLabels.splice(this.attachedLabels.indexOf(o));
    }
}
