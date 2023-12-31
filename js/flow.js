class Flow {
    constructor(o1,o2) {
        this.type=FLOW;
        this.subtype="ENABLER"; // "INHIBITOR"
        this.o1=o1;
        this.o2=o2;
        this.weight=1;
        this.delta=new Coord(0,0);
        this.newo2=new Coord(o2.x,o2.y);
        this.path=[o1,this.newo2];
    }

    draw() {
        this.newo2.x=this.o2.x+this.delta.x;
        this.newo2.y=this.o2.y+this.delta.y;
        const lastPoint=this.path[this.path.length-2];
        const midx=(5*lastPoint.x+4*this.newo2.x)/9, 
              midy=(5*lastPoint.y+4*this.newo2.y)/9;
        const x=this.newo2.x-lastPoint.x,
              y=this.newo2.y-lastPoint.y;
        var l = Math.hypot(x,y);
        l=this.o2.type==PLACE?(l-this.o2.r)/l:(l-this.o2.w/2)/l;
        // Draw multisegment path
        ctx.beginPath();
        ctx.strokeStyle=pn.highlighted==this?"blue":"black"; 
        ctx.lineWidth=2;
        ctx.moveTo(this.path[0].x,this.path[0].y);
        for(var i=1; i<this.path.length-1; i++) {
            ctx.lineTo(this.path[i].x,this.path[i].y);
        }
        ctx.stroke();
        drawArrow(lastPoint.x,lastPoint.y,lastPoint.x+l*x,lastPoint.y+l*y,2,
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
        for (var i=1; i<this.path.length-1; i++) {
            if (pn.highlighted==this) this.path[i].draw("black");
            else this.path[i].draw("highlighted");
        }
    }

    cursored(cursor) {
        for (var i=0; i<this.path.length-1; i++) {
            if (distancePointAndSection(cursor,this.path[i],this.path[i+1]) <= 3)
                return true;
        }
        return false;
    }

    cursoredMidPoint(cursor) {
        for (var i=1; i<this.path.length-1; i++) {
            if (this.path[i].cursored(cursor)) {
                return this.path[i];
            }
        }
        return false;
    }

    drag(point) {
        for (var i=1; i<this.path.length-2; i++) {
            if (Math.hypot(this.path[i].x,this.path[i].y,point.x,point.y)<3) {
                this.path[i].x=point.x;
                this.path[i].y=point.y;
            }
        }
    }

    dragTo(x,y) {
        this.delta.x+=x;
        this.delta.y+=y;
    }

    addSegment(point) {
        var index, distance, minDistance=1000000;
        for (var i=0; i<this.path.length-1; i++) {
            distance=distancePointAndSection(point,this.path[i],this.path[i+1]);
            if (distance<minDistance) {
                minDistance=distance;
                index=i;
            }
        }
        const newMidPoint = new MidPoint(point.x,point.y);
        this.path.splice(index+1,0,newMidPoint);
        return newMidPoint;
    }

    delete() {
        pn.f.splice(pn.f.indexOf(this),1);
    }
}

class MidPoint extends Object {
    constructor(x,y) {
        super(x,y);
    }
    
    draw(color) {
        if (color=="black" || pn.highlighted==this) {
            ctx.beginPath();
            ctx.strokeStyle=color=="black"?"black":"blue";
            ctx.lineWidth=2;
            ctx.arc(this.x,this.y,6,0,2*Math.PI);
            ctx.stroke();
        }
    }

    cursored(cursor) {
        return Math.hypot(this.x-cursor.x,this.y-cursor.y)<=7;
    }

    delete() {
        pn.f.forEach(f=>{
            if (f.path.indexOf(this)>=0) {
                f.path.splice(f.path.indexOf(this),1);
            }
        });
    }
}
