var grid=10;
class graphics {
    constructor(ctx) {
        this.ctx=ctx;
    }
    moveTo(x,y) {
        if (snap=="SNAP") this.ctx.moveTo(snap(x),snap(y));
        else this.ctx.moveTo(x,y);
    }
    lineTo(x,y) {
        if (snap=="SNAP") this.ctx.lineTo(snap(x),snap(y));
        else this.ctx.lineTo(x,y);
    } 
    rect(x,y,w,h) {
        if (snap=="SNAP") this.ctx.rect(snap(x),snap(y),w,h);
        else this.ctx.rect(x,y,w,h);
    }
    arc(x,y,r,a1,a2) {
        if (snap=="SNAP") this.ctx.arc(snap(x),snap(y),r,a1,a2);
        else this.ctx.arc(x,y,r,a1,a2);
    }
    fillText(t,x,y) {
        if (snap=="SNAP") this.ctx.fillText(t,snap(x),snap(y));
        else this.ctx.fillText(t,x,y);
    }
    beginPath() { this.ctx.beginPath() }
    fill(mode) { this.ctx.fill(mode) }
    stroke() { this.ctx.stroke() }
}

function snap(v) {
    if (grid==0||shiftKeys(storedEvt,"ALT")||shiftKeys(storedEvt,"ALTSHIFT")||state==PAN) return v
    else return Math.round(v/grid)*grid;
}