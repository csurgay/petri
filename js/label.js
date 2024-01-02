class Label extends Object {
    constructor(label,x,y) {
        super(x,y);
        this.label=label;
        pn.addLabel(this);
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle=pn.highlighted==this?COLOR_HIGHLIGHT:this.color;
        ctx.font ="14px arial";
        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label,this.x,this.y);
    }

    cursored(cursor) {
        if (Math.abs(this.x-cursor.x)<20 && Math.abs(this.y-cursor.y)<5)
            return true;
        else 
            return false;
    }

}
