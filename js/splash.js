class SplashForm extends Form {
    constructor(title, margin) { // m=margin
        super("SPLASHFORM", title, 20, 10, 200, 100, margin);
//        this.visible=true;
//        this.active=true;
        this.visible=false;
        this.active=false;
        this.m=30;
    }
    draw() {
        super.draw();
    }
    processFormEvent(pMyEvent) {
        super.processFormEvent(pMyEvent);
    }
}
