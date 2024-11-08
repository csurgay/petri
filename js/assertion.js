// Assertions
// <logical>  ::= <simple> <operator> <simple>
// <simple>   ::= "(" <simple> ")" | <value> <relation> <value>
// <operator> ::= "||" | "&&"
// <value>    ::= <name> | <number>
// <relation> ::= "<" | "=" | ">"
// <name>     ::= "ANY" | "ALL" | <LETTER> <string>
// <string>   ::= "" | <char> <string>
// <char>     ::= <LETTER> | <DIGIT> | <SYMBOL>
// <number>   ::= <DIGIT> <numrest>
// <numrest>  ::= "" | <DIGIT> <numrest>

function convertAssert(assert="(P1>1||P2>1)|| P3 > 1") {
    let result="";
    let ptr=0;
    let c="";
    let placeName="";
    while (ptr<assert.length) {
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
        pn.p.forEach(place => {
            if (place.label.label==placeName) {
                result = result + place.tokens;
            }
        });
    }
    return result;
}

function token(lookahead=false) {
    while(assert.charAt(0)==" ") {
        assert=assert.substring(1);
    }
    if (assert.length==0) return "";
    let ret=assert.charAt(0);
    console.log(ret);
    if (!lookahead) {
        assert=assert.substring(1);
    }
    return ret;
}
function isEmpty(s) {
    return s=="";
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

function parse_logical() {
    parse_simple();
    parse_operator();
    parse_simple();
}
function parse_simple() {
    if (token()=="(") {
        parse_simple();
        if (token()!=")") error("Parser simple: "+assert);
    }
    else {
        parse_value();
        parse_relation();
        parse_value();
    }
}
function parse_operator() {
    if (token()=="|") {

    }
    else if (token()=="&") {

    }
    else error("Parser operator: "+assert);
}
function parse_value() {
    if (isDigit(token(true))) {
        parse_number();
    }
    else if (isLetter(token(true))) {
        parse_name();
    }
}
function parse_relation() {
    if (token()=="<") {

    }
    else if (token()=="=") {
        
    }
    else if (token()==">") {
        
    }
    else error("Parser relation: "+assert);
}
function parse_name() {
    if (isLetter(token(true))) {
        token();
        parse_string();
    }
}
function parse_string() {
    if (isEmpty(token())) {

    }
    else {
        parse_char();
        parse_string();
    }
}
function parse_char() {
    let c=token(true);
    if (isLetter(c)||isDigit(c)||isSymbol(c)) {
        token();
    }
}
function parse_number() {
    if (isDigit(token(true))) {
        token();
        parse_numrest();
    }
}
function parse_numrest() {
    if (isDigit(token(true))) {
        token();
        parse_numrest();
    }
}