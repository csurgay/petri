class Control extends Label {
    constructor(label,x,y,callback) {
        super(label,x,y);
        this.align="left";
        this.callback=callback;
    }
    draw() {
        super.draw();
        g.fillText(this.callback(),this.x+200,this.y);
    }
}
