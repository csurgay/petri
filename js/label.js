class Label extends Object {
    constructor(label,x,y) {
        super(x,y);
        this.type=LABEL;
        this.id="L"+nextId(this.type);
        this.label=label;
        this.width;
        this.size=14;
        pn.addLabel(this);
    }

    draw() {
        if (this.visible) {
            g.beginPath();
            ctx.fillStyle=this.color;
            if (pn.highlighted==this && COLOR_HIGHLIGHT!="black")
                ctx.fillStyle=COLOR_HIGHLIGHT;
            ctx.font=""+this.size+"px arial"; 
            ctx.textAlign = "center";
            ctx.textBaseline = 'middle';
            this.width=ctx.measureText(this.label).width;
            g.fillText(this.label,this.x,this.y);
            if (pn.highlighted==this) {
                g.beginPath();
                g.standard(1);
                g.dashed();
                g.rect(this.x-this.width/2-1,this.y-this.size/2-2,this.width+2,this.size);
                ctx.stroke();
            }
        }
    }

    cursored(cursor) {
        if (Math.abs(this.x-cursor.x)<this.width/2+2 && Math.abs(this.y-cursor.y)<this.size/2+2)
            return true;
        else 
            return false;
    }

    clicked(cursor) {
        stateChange(TEXTBOX);
        textbox.registerCallbackObject(this);
        textbox.x=this.x-this.width/2-6;
        textbox.y=this.y-this.size/2-5;
        textbox.size=this.size;
        textbox.defaulText=this.label;
        textbox.text=this.label;
        textbox.w = textbox.size * textbox.text.length;
        textbox.ptrCursor=this.label.length;
        textbox.visible=true;
        this.visible=false;
    }

    objectsLabel() { // label belongs to a Place/Trans
        for (var i=pn.p.length-1; i>=0; i--) {
            if (pn.p[i].label==this) return true;
        }
        for (var i=pn.t.length-1; i>=0; i--) {
            if (pn.t[i].label==this) return true;
        }
        return false;
    }

    delete() {
        if (!this.objectsLabel()) pn.l.splice(pn.l.indexOf(this),1);
    }

}
