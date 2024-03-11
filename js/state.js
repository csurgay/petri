class State {
    constructor(startState) {
        this.s=startState;
        this.states=[
            "IDLE", "SELECT", "DRAG", "DRAWARROW", "LEFTDOWN", "DELETE",
            "MIDDLE", "PAN", "RUN", "SHIFTCLICK", "ZOOM", "MULTISEGMENT", 
            "PLAY", "FLY", "DRAGALL", "BUTTONCLICK"
        ];
    }
    is(oldState) {
        if (!this.states.includes(oldState)) { error("unknown state '"+oldState+"'"); }
        return this.s==oldState;
    }
    set(newState) {
        if (!this.states.includes(newState)) { error("unknown state '"+newState+"'"); }
        if (DEBUG) if (!this.is(newState)) log(this.s+" -> "+newState);
        this.s=newState;
    }
}