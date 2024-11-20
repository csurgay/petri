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
