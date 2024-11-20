class Control extends Label {
    constructor(label,x,y,controlType,value) {
        super(label,x,y,"left");
        this.type="CONTROL";
        this.controlType=controlType; // "INTEGER", "STRING", "BOOLEAN"
        this.value=value;
        this.valueLabel=new Label(value.toString(),x+120,y,"left");
    }
    newValue() {
        this.valueLabel.text=this.value.toString();
    }
    hover() {
        var ret = 
            ccursor.x>this.x &&
            ccursor.x<this.x+this.width &&
            ccursor.y>this.y &&
            ccursor.y<this.y+this.size;
        if (ret) { 
            return this;
        }
        else return false;
    }
    draw() {
        if (this.visible) {
            super.draw();
            this.valueLabel.draw();
        }
    }
    increment() {
        if (this.controlType=="INTEGER") {
            this.value++;
        }
        else if (this.controlType=="BOOLEAN") {
            this.value=true;
        }
        this.newValue();
    }
    decrement() {
        if (this.controlType=="INTEGER") {
            this.value--;
        }
        else if (this.controlType=="BOOLEAN") {
            this.value=false;
        }
        this.newValue();
    }
}
