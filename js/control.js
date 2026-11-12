class Control extends Label {
    constructor(parent,label,x,y,controlType,value) {
        super(label,x,y,"left");
        this.type="CONTROL";
        this.controlType=controlType; // "INTEGER", "STRING", "BOOLEAN"
        this.value=value;
        this.valueLabel=new Label(value.toString(),x+120,y,"left");
        parent.addChild(this);
        this.parent=parent;
    }
    newValue() {
        this.valueLabel.text=this.value.toString();
    }
    hover() {
        // drawn relative to the parent form, so hit-test there too
        const px=this.parent.x, py=this.parent.y;
        const right=Math.max(this.width, this.valueLabel.x+this.valueLabel.width-this.x);
        var ret = 
            ccursor.x>px+this.x &&
            ccursor.x<px+this.x+right &&
            ccursor.y>py+this.y-this.size/2-2 &&
            ccursor.y<py+this.y+this.size/2+2;
        if (ret) { 
            return this;
        }
        else return false;
    }
    draw(hoveredHighlighted=false) {
        if (this.visible) {
            super.draw(hoveredHighlighted, this.parent);
            this.valueLabel.draw(hoveredHighlighted, this.parent);
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
