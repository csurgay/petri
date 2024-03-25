const th=50,tw=15;
const transConnectors=[[0,-th/2],[0,th/2],[-tw/2,0],[tw/2,0]];
for (var i=1; i<=3; i++) {
    transConnectors.push(
        [-tw/2, i*th/9],
        [ tw/2, i*th/9],
        [-tw/2,-i*th/9],
        [ tw/2,-i*th/9]
);}
const p1=new Coord(0,0), p2=new Coord(0,0);

class Transition extends Object {
    constructor(x,y,alpha=Math.PI/2) {
        super(x,y);
        this.type="TRANSITION";
        this.id="T"+nextId(this.type);
        this.x=x;
        this.y=y;
        this.alpha=alpha;
        this.label=new Label(this.id,this.x-30,this.y-30);
        this.adjust_p1p2();
    }

    adjust_p1p2() {
        p1.x=this.x+rotate(0,0,transConnectors[0][0],transConnectors[0][1],this.alpha)[0];
        p1.y=this.y+rotate(0,0,transConnectors[0][0],transConnectors[0][1],this.alpha)[1];
        p2.x=this.x+rotate(0,0,transConnectors[1][0],transConnectors[1][1],this.alpha)[0];
        p2.y=this.y+rotate(0,0,transConnectors[1][0],transConnectors[1][1],this.alpha)[1];
    }

    draw() {
        g.beginPath();
        g.lineWidth(LINEWIDTH);
        g.fillStyle(COLOR_CANVAS);
        if (this.enabled()) g.fillStyle(pn.transeq[pn.mptr]==
            this?COLOR_WILLFIRE:COLOR_ENABLED);
        this.setColor();
        g.save();
        g.translate(this.x,this.y);
        g.rotate(this.alpha);
        g.rect(-tw/2,-th/2,tw,th);
        g.fill();
        g.stroke();
        g.restore();
        this.adjust_p1p2();
        // show connectors
        if (state.DEBUG) {
            g.beginPath();
            g.strokeStyle(COLOR_HIGHLIGHT);
            g.solid();
            transConnectors.forEach(c=>{
                var rot=rotate(0,0,c[0],c[1],this.alpha);
                g.moveTo(this.x+rot[0],this.y+rot[1]);
                g.arc(this.x+rot[0],this.y+rot[1],1,0,2*Math.PI);
            });
            g.stroke();
        }
        this.drawLineToLabel();
    }

    dragTo(dx,dy) {
        super.dragTo(dx,dy);
        this.label.dragTo(dx,dy);
    }

    hover(cursor) {
        this.adjust_p1p2();
        if (distancePointAndSection(cursor,p1,p2) <= tw/2+1)
            return true;
        else 
            return false;
    }

    rotate(delta) {
        this.alpha+=delta*Math.PI/64;
        if (this.alpha>2*Math.PI) this.alpha-=2*Math.PI;
        if (this.alpha<0) this.alpha+=2*Math.PI;
        if (Math.abs(this.alpha-1*Math.PI/4)<Math.PI/80) this.alpha=1*Math.PI/4;
        if (Math.abs(this.alpha-2*Math.PI/4)<Math.PI/80) this.alpha=2*Math.PI/4;
        if (Math.abs(this.alpha-3*Math.PI/4)<Math.PI/80) this.alpha=3*Math.PI/4;
        if (Math.abs(this.alpha)<Math.PI/80) this.alpha=0;
        this.adjust_p1p2();
        if (!this.hover(cursor)) pn.highlighted=null;
    }

    delete() {
        for (var i=pn.f.length-1; i>=0; i--) {
            if (pn.f[i].o1==this || pn.f[i].o2==this) {
                pn.f.splice(i,1);
            }
        }
        pn.l.splice(pn.l.indexOf(this.label),1);
        pn.t.splice(pn.t.indexOf(this),1);
        pn.clearMarkings();
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
