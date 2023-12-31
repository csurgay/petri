class Flow {
    constructor(o1,o2) {
        this.type=FLOW;
        this.subtype="ENABLER"; // "INHIBITOR"
        this.o1=o1;
        this.o2=o2;
        this.weight=1;
        this.delta=new Coord(0,0);
        this.newo2=new Coord(o2.x,o2.y);
    }

    draw() {
        this.newo2.x=this.o2.x+this.delta.x;
        this.newo2.y=this.o2.y+this.delta.y;
        const midx=(5*this.o1.x+4*this.newo2.x)/9, midy=(5*this.o1.y+4*this.newo2.y)/9;
        const x=this.newo2.x-this.o1.x,y=this.newo2.y-this.o1.y;
        var l = Math.hypot(x,y);
        l=this.o2.type==PLACE?(l-this.o2.r)/l:(l-this.o2.w/2)/l;
        drawArrow(this.o1.x,this.o1.y,this.o1.x+l*x,this.o1.y+l*y,2,
            pn.highlighted==this,this.subtype);
        // Flow weight circle
        if (this.weight!=1) {
            ctx.beginPath();
            ctx.strokeStyle="black";
            ctx.fillStyle="rgb(250, 230, 190)";
            ctx.arc(midx,midy,7,0,2*Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.font ="11px arial";
            ctx.fillStyle="black";
            ctx.textAlign = "center";
            ctx.textBaseline = 'middle';
            ctx.fillText(this.weight,midx,midy+1);
        }
    }

    cursored(cursor) {
        if (distancePointAndSection(cursor,this.o1,this.newo2) <= 3)
            return true;
        else 
            return false;
    }

    dragTo(x,y) {
        this.delta.x+=x;
        this.delta.y+=y;
    }

    delete() {
        pn.f.splice(pn.f.indexOf(this),1);
    }
}
