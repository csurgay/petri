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
    }

    adjust_p1p2() {
        this.p1.x=this.x-Math.sin(this.alpha)*this.h/2;
        this.p1.y=this.y+Math.cos(this.alpha)*this.h/2;
        this.p2.x=this.x+Math.sin(this.alpha)*this.h/2;
        this.p2.y=this.y-Math.cos(this.alpha)*this.h/2;
    }
    
    draw() {
        this.adjust_p1p2();
        ctx.beginPath();
        ctx.lineWidth=2;
        ctx.strokeStyle="black";
        ctx.fillStyle="rgb(250, 230, 190)";
        if (this.enabled()) ctx.fillStyle="red";
        if (pn.highlighted==this) ctx.strokeStyle="blue";
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
