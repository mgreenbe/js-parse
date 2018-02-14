let {
  char,
  digit,
  digits,
  fail,
  initPos,
  isSuccess,
  letter,
  letters,
  mappedRegex,
  maybeSpaces,
  maybeWhitespace,
  noneOf,
  oneOf,
  regex,
  spaces,
  succeed,
  whitespace
} = require("./parsers.js");

let { doIncr } = require("./pos.js");

function __seq(parsers) {
  if (!Array.isArray(parsers)) {
    throw new TypeError("You must pass an array to seq.");
  }
  return function(str, endPrev) {
    if (parsers.length === 0) {
      return [];
    } else {
      let [p, ...ps] = parsers;
      let pReply = p(str, endPrev);
      if (isSuccess(pReply)) {
        let psReply = __seq(ps)(pReply.rest, pReply.end);
        return [pReply, ...psReply];
      } else {
        return [pReply];
      }
    }
  };
}

function seq(parsers) {
  return function(str, endPrev) {
    let replies = __seq(parsers)(str, endPrev);
    let n = replies.length;
    if (n === 0) {
      return succeed({ parser: seq, value: [], endPrev, end: endPrev });
    }
    if (isSuccess(replies[n - 1])) {
      return succeed({
        parser: "seq",
        end: replies[n - 1].end,
        endPrev,
        replies
      });
    } else {
      return fail({
        parser: "seq",
        endPrev,
        replies
      });
    }
  };
}

let pos0 = { row: 1, col: 0, char: 0 };
let p = seq([letters, whitespace, digits]);
console.log(JSON.stringify(p("abc   d123", pos0), null, 4));
