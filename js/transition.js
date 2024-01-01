class Transition extends Object {
    constructor(x,y,alpha=Math.PI/2) {
        super(x,y);
        this.type=TRANSITION;
        this.id="T"+nextId(this.type);
        this.x=x;
        this.y=y;
        this.alpha=alpha;
        this.h=50;
        this.w=15;
        this.p1=new Coord(0,0);
        this.p2=new Coord(0,0);
        this.label=new Label(this.id,this.x,this.y-20);
        this.connectors=[];
        for (var i=0; i<12; i++) this.connectors.push(new Coord(0,0));
        this.adjust_p1p2();
    }

    rotate(cx,cy,x,y,alpha) {
        var tx=x-cx,ty=y-cy;
        return [tx*Math.cos(alpha)-ty*Math.sin(alpha)+cx,
                tx*Math.sin(alpha)+ty*Math.cos(alpha)+cy];
    }

    adjust_p1p2() {
        this.p1.x=this.x-Math.sin(this.alpha)*this.h/2;
        this.p1.y=this.y+Math.cos(this.alpha)*this.h/2;
        this.p2.x=this.x+Math.sin(this.alpha)*this.h/2;
        this.p2.y=this.y-Math.cos(this.alpha)*this.h/2;
        this.connectors[0].moveTo(this.p1.x,this.p1.y);
        this.connectors[1].moveTo(this.p2.x,this.p2.y);
        this.connectors[2].moveTo(
            this.x+Math.cos(this.alpha)*this.w/2,
            this.y+Math.sin(this.alpha)*this.w/2
        );
        this.connectors[3].moveTo(
            this.x-Math.cos(this.alpha)*this.w/2,
            this.y-Math.sin(this.alpha)*this.w/2
        );
        this.connectors[4].moveTo(
            this.x+this.rotate(0,0,this.w/2,this.h/3,this.alpha)[0],
            this.y+this.rotate(0,0,this.w/2,this.h/3,this.alpha)[1]
        );
        this.connectors[5].moveTo(
            this.x+this.rotate(0,0,-this.w/2,this.h/3,this.alpha)[0],
            this.y+this.rotate(0,0,-this.w/2,this.h/3,this.alpha)[1]
        );
        this.connectors[6].moveTo(
            this.x+this.rotate(0,0,this.w/2,-this.h/3,this.alpha)[0],
            this.y+this.rotate(0,0,this.w/2,-this.h/3,this.alpha)[1]
        );
        this.connectors[7].moveTo(
            this.x+this.rotate(0,0,-this.w/2,-this.h/3,this.alpha)[0],
            this.y+this.rotate(0,0,-this.w/2,-this.h/3,this.alpha)[1]
        );
        this.connectors[8].moveTo(
            this.x+this.rotate(0,0,this.w/2,this.h/6,this.alpha)[0],
            this.y+this.rotate(0,0,this.w/2,this.h/6,this.alpha)[1]
        );
        this.connectors[9].moveTo(
            this.x+this.rotate(0,0,-this.w/2,this.h/6,this.alpha)[0],
            this.y+this.rotate(0,0,-this.w/2,this.h/6,this.alpha)[1]
        );
        this.connectors[10].moveTo(
            this.x+this.rotate(0,0,this.w/2,-this.h/6,this.alpha)[0],
            this.y+this.rotate(0,0,this.w/2,-this.h/6,this.alpha)[1]
        );
        this.connectors[11].moveTo(
            this.x+this.rotate(0,0,-this.w/2,-this.h/6,this.alpha)[0],
            this.y+this.rotate(0,0,-this.w/2,-this.h/6,this.alpha)[1]
        );
    }
    
    draw() {
        this.adjust_p1p2();
        ctx.beginPath();
        ctx.lineWidth=LINEWIDTH;
        ctx.strokeStyle=this.color;
        ctx.fillStyle=COLOR_CANVAS;
        if (this.enabled()) ctx.fillStyle=COLOR_ENABLED;
        if (pn.highlighted==this) ctx.strokeStyle=COLOR_HIGHLIGHT;
        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.rotate(this.alpha);
        ctx.rect(-this.w/2,-this.h/2,this.w,this.h);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        if (pn.transeq[pn.mptr]==this || pn.transeq[pn.mptr-1]==this) {
            ctx.beginPath();
            ctx.moveTo(this.p1.x,this.p1.y);
            ctx.lineTo(this.p2.x,this.p2.y);
            ctx.stroke();
        }
        if (false) {
            ctx.beginPath();
            ctx.strokeStyle=COLOR_ENABLED;
            this.connectors.forEach(c=>{
                ctx.moveTo(c.x,c.y);
                ctx.arc(c.x,c.y,3,0,2*Math.PI);
            });
            ctx.stroke();
        }
    }

    dragTo(dx,dy) {
        super.dragTo(dx,dy);
        this.label.dragTo(dx,dy);
    }

    cursored(cursor) {
        if (distancePointAndSection(cursor,this.p1,this.p2) <= this.w/2+1)
            return true;
        else 
            return false;
    }

    delete() {
        for (var i=0; i<pn.f.length; i++)
            pn.f.forEach(flow => {
                if (flow.o1==this || flow.o2==this) {
                    pn.f.splice(pn.f.indexOf(flow),1);
                }
            });
        pn.l.splice(pn.l.indexOf(this.label),1);
        pn.t.splice(pn.t.indexOf(this),1);
    }

    enabled() {
        var ret=true;
        pn.p.forEach(place => {
            var sum=0;
            pn.f.forEach(f => {
                if (f.subtype=="ENABLER" && f.o1==place && f.o2==this) {
                    sum+=f.weight;
                }
            });
            ret&=(place.tokens>=sum); 
        });
        pn.f.forEach(f => {
            if (f.subtype=="INHIBITOR" && f.o2==this) {
                ret&=(f.o1.tokens<f.weight);
            }
        });
        return ret;
    }

    fire() {
        pn.p.forEach(place => {
            var sumIn=0, sumOut=0;
            pn.f.forEach(flow => {
                if (flow.subtype=="ENABLER") {
                    if (flow.o1==place && flow.o2==this) sumIn+=flow.weight;
                    if (flow.o2==place && flow.o1==this) sumOut+=flow.weight;
                }
            });
            place.tokens+=sumOut;
            place.tokens-=sumIn;
        });
    }
}
