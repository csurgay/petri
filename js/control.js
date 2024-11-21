class Control extends Label {
    constructor(parent,label,x,y,controlType,value) {
        super(label,x,y,"left");
        this.type="CONTROL";
        this.controlType=controlType; // "INTEGER", "STRING", "BOOLEAN"
        this.value=value;
        this.valueLabel=new Label(value.toString(),x+120,y,"left");
        parent.addChild(this);
    }
    newValue() {
        this.valueLabel.text=this.value.toString();
    }
    hover() {
        var ret = 
            ccursor.x>this.x &&
            ccursor.x<this.x+this.width &&
            ccursor.y>this.y-this.size/2 &&
            ccursor.y<this.y+this.size/2;
        if (ret) { 
            return this;
        }
        else return false;
    }
    draw(hovered=false) {
        if (this.visible) {
            super.draw(hovered);
            this.valueLabel.draw(hovered);
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
