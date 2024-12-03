let anyAllOp="";
let anyAllRest=""
function convertAssert(assert) {
    let result="";
    let ptr=0;
    let c="";
    let placeName="";
    while (ptr<assert.length-1) {
        c=assert.charAt(ptr);
        while (c!="" && !isLetter(c)) {
            result+=c;
            c=assert.charAt(++ptr);
        }
        placeName="";
        while (isLetter(c)||isDigit(c)||isSymbol(c)) {
            placeName+=c;
            c=assert.charAt(++ptr);
        }
        if (placeName!="") {
            if (placeName=="ANY" || placeName=="ALL") {
                anyAllRest="";
                while (isSpace(c)) {
                    c=assert.charAt(++ptr);
                }
                while (isOperator(c)||isDigit(c)) {
                    anyAllRest+=c;
                    c=assert.charAt(++ptr);
                }
                result += "(";
                anyAllOp = (placeName=="ANY" ? " || " : " && ");
                for (let i=0; i<pn.p.length; i++) {
                    result=result+pn.p[i].tokens+anyAllRest;
                    if (i<pn.p.length-1) result+=anyAllOp;
                }
                result += ")";
            }
            else {
                let foundPlace=false;
                pn.p.forEach(place => {
                    if (place.label.text==placeName) {
                        foundPlace=true;
                        result = result + place.tokens;
                    }
                });
                if (!foundPlace) {
                    result = result + "0";
                    error(here(), "Place not found in AssertString: "+placeName);
                }
            }
        }
    }
    return result;
}
function isEmpty(s) {
    return s=="";
}
function isSpace(s) {
    return s==" ";
}
function isDigit(s) {
    return s>="0"&&s<="9";
}
function isLetter(s) {
    return s>="a"&&s<="z"||s>="A"&&s<="Z";
}
function isSymbol(s) {
    if (s=="") return false;
    return "-_.".includes(s);
}
function isOperator(s) {
    if (s=="") return false;
    return "<=>".includes(s);
}
