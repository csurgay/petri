class Flow extends Object {
    constructor(o1,o2) {
        super(0,0);
        this.type=FLOW;
        this.subtype="ENABLER"; // "INHIBITOR"
        this.o1=o1;
        this.o2=o2;
        this.weight=1;
        this.path=[o1,o2];
        this.conn=new Coord(0,0);
    }

    draw() {
        const lastPoint=this.path[this.path.length-2];
        // Calc end connector for this Flow
        var distance, minDistance=1000000;
        if (this.o2.type==PLACE) {
            placeConnectors.forEach(c=>{
                distance=Math.hypot(
                    this.o2.x+c.x-lastPoint.x,
                    this.o2.y+c.y-lastPoint.y);
                if (distance<minDistance) {
                    minDistance=distance;
                    this.conn.x=this.o2.x+c.x; 
                    this.conn.y=this.o2.y+c.y;
                }
            });
        }
        else if (this.o2.type==TRANSITION) {
            transConnectors.forEach(c=>{
                const rot=rotate(0,0,c[0],c[1],this.o2.alpha);
                distance=Math.hypot(
                    this.o2.x+rot[0]-lastPoint.x,
                    this.o2.y+rot[1]-lastPoint.y);
                if (distance<minDistance) {
                    minDistance=distance;
                    this.conn.x=this.o2.x+rot[0]; 
                    this.conn.y=this.o2.y+rot[1];
                }
            });
        }
        // Adjusted new end position
        const midx=(lastPoint.x+this.conn.x)/2, 
              midy=(lastPoint.y+this.conn.y)/2;
        const x=this.conn.x-lastPoint.x,
              y=this.conn.y-lastPoint.y;
        var l = Math.hypot(x,y);
        l=this.subtype=="INHIBITOR"?(l-8)/l:1;
        // Draw multisegment path
        ctx.beginPath();
        ctx.strokeStyle=pn.highlighted==this?COLOR_HIGHLIGHT:this.color; 
        ctx.lineWidth=LINEWIDTH;
        ctx.moveTo(this.path[0].x,this.path[0].y);
        for(var i=1; i<this.path.length-1; i++) {
            ctx.lineTo(this.path[i].x,this.path[i].y);
        }
        ctx.stroke();
        drawArrow(lastPoint.x,lastPoint.y,lastPoint.x+l*x,lastPoint.y+l*y,2,
            ctx.strokeStyle,this.subtype);
        // Flow weight circle
        if (this.weight!=1) {
            ctx.beginPath();
            ctx.strokeStyle=this.color;
            ctx.lineWidth=1;
            ctx.fillStyle=COLOR_CANVAS;
            ctx.arc(midx,midy,7,0,2*Math.PI);
            ctx.fill();
            ctx.stroke();
            ctx.font ="11px arial";
            ctx.fillStyle=COLOR_INK;
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
        for (var i=0; i<this.path.length-2; i++) {
            if (distancePointAndSection(cursor,this.path[i],this.path[i+1]) <= 3)
                return true;
        }
        if (distancePointAndSection(cursor,this.path[this.path.length-2],this.conn) <= 3)
            return true;
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
//        this.delta.x+=x;
//        this.delta.y+=y;
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
            ctx.strokeStyle=color=="black"?COLOR_INK:COLOR_HIGHLIGHT;
            ctx.lineWidth=LINEWIDTH;
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
