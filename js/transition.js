const h=50,w=15;
const transConnectors=[[0,-h/2],[0,h/2],[-w/2,0],[w/2,0],[-w/2,h/3],[w/2,h/3],[-w/2,-h/3],[w/2,-h/3],[-w/2,h/6],[w/2,h/6],[-w/2,-h/6],[w/2,-h/6]];
const p1=new Coord(0,0), p2=new Coord(0,0);

class Transition extends Object {
    constructor(x,y,alpha=Math.PI/2) {
        super(x,y);
        this.type=TRANSITION;
        this.id="T"+nextId(this.type);
        this.x=x;
        this.y=y;
        this.alpha=alpha;
        this.label=new Label(this.id,this.x,this.y-20);
        this.adjust_p1p2();
    }

    adjust_p1p2() {
        p1.x=this.x+rotate(0,0,transConnectors[0][0],transConnectors[0][1],this.alpha)[0];
        p1.y=this.y+rotate(0,0,transConnectors[0][0],transConnectors[0][1],this.alpha)[1];
        p2.x=this.x+rotate(0,0,transConnectors[1][0],transConnectors[1][1],this.alpha)[0];
        p2.y=this.y+rotate(0,0,transConnectors[1][0],transConnectors[1][1],this.alpha)[1];
    }

    draw() {
        ctx.beginPath();
        ctx.lineWidth=LINEWIDTH;
        ctx.strokeStyle=this.color;
        ctx.fillStyle=COLOR_CANVAS;
        if (this.enabled()) ctx.fillStyle=COLOR_ENABLED;
        if (pn.highlighted==this) ctx.strokeStyle=COLOR_HIGHLIGHT;
        ctx.save();
        ctx.translate(this.x,this.y);
        ctx.rotate(this.alpha);
        ctx.rect(-w/2,-h/2,w,h);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        this.adjust_p1p2();
        if (pn.transeq[pn.mptr]==this || pn.transeq[pn.mptr-1]==this) {
            ctx.beginPath();
            ctx.moveTo(p1.x,p1.y);
            ctx.lineTo(p2.x,p2.y);
        ctx.stroke();
        }
        if (false) {
            ctx.beginPath();
            ctx.strokeStyle=COLOR_HIGHLIGHT;
            transConnectors.forEach(c=>{
                var rot=rotate(0,0,c[0],c[1],this.alpha);
                ctx.moveTo(this.x+rot[0],this.y+rot[1]);
                ctx.arc(this.x+rot[0],this.y+rot[1],2,0,2*Math.PI);
            });
            ctx.stroke();
        }
    }

    dragTo(dx,dy) {
        super.dragTo(dx,dy);
        this.label.dragTo(dx,dy);
    }

    cursored(cursor) {
        this.adjust_p1p2();
        if (distancePointAndSection(cursor,p1,p2) <= w/2+1)
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
        this.clearMarkings();
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
