class Label extends Object {
    constructor(label,x,y) {
        super(x,y);
        this.label=label;
        pn.l.push(this);
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle="black";
        ctx.font ="14px arial";
        ctx.textAlign = "center";
        ctx.textBaseline = 'middle';
        if (pn.highlighted==this) ctx.fillStyle="blue";
        ctx.fillText(this.label,this.x,this.y);
    }

    cursored(cursor) {
        if (Math.abs(this.x-cursor.x)<20 && Math.abs(this.y-cursor.y)<10)
            return true;
        else 
            return false;
    }

}
