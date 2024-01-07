class Label extends Object {
    constructor(label,x,y) {
        super(x,y);
        this.type=LABEL;
        this.label=label;
        this.width=ctx.measureText(this.label);
        pn.addLabel(this);
    }

    draw(size=14) {
        ctx.beginPath();
        ctx.fillStyle=this.color;
        if (pn.highlighted==this && COLOR_HIGHLIGHT!="black")
            ctx.fillStyle=COLOR_HIGHLIGHT;
        ctx.font=pn.highlighted==this?"bold "+size+"px arial":""+size+"px arial"; 
        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
        this.width=ctx.measureText(this.label);
        if (pn.highlighted==this) {
            ctx.fillText(this.label,this.x-2,this.y);
            ctx.fillText(this.label,this.x+1,this.y);
        }
        else {
            ctx.fillText(this.label,this.x,this.y);
        }
    }

    cursored(cursor) {
        if (Math.abs(this.x-cursor.x)<this.width.width/2 && Math.abs(this.y-cursor.y)<5)
            return true;
        else 
            return false;
    }

}
