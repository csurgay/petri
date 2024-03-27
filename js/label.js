const sizes=[8,14,20,32,48,72];

class Label extends Object {
    constructor(label,x,y) {
        super(x,y);
        this.type="LABEL";
        this.id="L"+nextId(this.type);
        this.label=label;
        this.width;
        this.size=14;
        this.attached=null; // the Object that this Label is attached to
        pn.addLabel(this);
    }
    draw() {
        if (this.visible) {
            g.beginPath();
            g.fillStyle(this.color);
            if (pn.highlighted==this && COLOR_HIGHLIGHT!="black")
                g.fillStyle(COLOR_HIGHLIGHT);
            g.setupText(""+this.size+"px arial","center","middle"); 
            this.width=g.measureText(this.label).width;
            g.fillText(this.label,this.x,this.y);
            if (pn.highlighted==this) {
                g.beginPath();
                g.standard(1);
                g.dashed();
                g.rect(this.x-this.width/2-1,this.y-this.size/2-2,this.width+2,this.size);
                g.stroke();
            }
            if (state.DEBUG) if (this.attached) {
                g.beginPath();
                g.dashed(1,1);
                g.strokeStyle(COLOR_HIGHLIGHT);
                g.moveTo(this.x,this.y);
                g.lineTo(this.attached.x,this.attached.y);
                g.stroke();
            }
        }
    }
    hover() {
        if (Math.abs(this.x-tcursor.x)<this.width/2+2 && Math.abs(this.y-tcursor.y)<this.size/2+2)
            return true;
        else 
            return false;
    }
    // gives focus to the one Textbox referencing this Label
    clicked(pMyEvent) {
        textbox.referencedLabel=this;
        textbox.x=this.x-this.width/2-7;
        textbox.y=this.y-this.size/2-5;
        textbox.size=this.size;
        textbox.defaulText=this.label;
        textbox.text=this.label;
        textbox.w = this.width+30;
        textbox.h = this.size;
//        textbox.ptrCursor=this.label.length;
        textbox.visible=true;
        textbox.active=true;
        this.visible=false;
        fb.active=false;
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
        else (this.label = "-");
    }
    setAttached(o) {
        this.attached=o;
    }
    getAttached() {
        return this.attached;
    }
    rotate(x,y,delta) {
        const rot=rotate(x,y,this.x,this.y,delta);
        this.x=rot[0]; this.y=rot[1];
        this.attachedLabels.forEach(l=>l.rotate(x,y,delta));
    }
}
