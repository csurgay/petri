class Control extends Label {
    constructor(label,x,y,controlType,value) {
        super(label,x,y);
        this.type="CONTROL";
        this.align="left";
        this.controlType=controlType; // "INTEGER", "STRING", "BOOLEAN"
        this.value=value;
    }
    draw() {
        super.draw();
        g.fillText(this.value,this.x+200,this.y);
        if (state.DEBUG) super.drawFrame();
    }
    increment() {
        if (this.controlType=="INTEGER") {
            this.value++;
        }
        else if (this.controlType=="BOOLEAN") {
            this.value=true;
        }
    }
    decrement() {
        if (this.controlType=="INTEGER") {
            this.value--;
        }
        else if (this.controlType=="BOOLEAN") {
            this.value=false;
        }
    }
}
