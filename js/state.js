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
            "PLAY", "FLY", "DRAGALL", "SPLASH", "SELECT"
        ];
    }
    is(oldState) {
        if (!this.states.includes(oldState)) { error(here(), "unknown state '"+oldState+"'"); }
        return this.s==oldState;
    }
    set(newState) {
        if (!this.states.includes(newState)) { error(here(), "unknown state '"+newState+"'"); }
        if (state.DEBUG && !this.is(newState)) log(here(), this.s+" -> "+newState);
        this.s=newState;
    }
}