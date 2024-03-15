class State {
    constructor(startState) {
        this.s=startState;
        this.RUNNING=true;
        this.DEBUG=0;
        this.RECORD=0;
        this.PLAYBACK=0;
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
        if (state.DEBUG) if (!this.is(newState)) log(here(), this.s+" -> "+newState);
        this.s=newState;
    }
}