let {
  succeed,
  fail,
  isSuccess,
  char,
  oneOf,
  noneOf,
  regex,
  mappedRegex,
  letter,
  letters,
  digit,
  digits,
  spaces,
  maybeSpaces,
  whitespace,
  maybeWhitespace
} = require('./parsers.js');

let { doIncr } = require('./pos.js');

function seq(parsers) {
  if (!Array.isArray(parsers)) {
    throw new TypeError('You must pass an array to seq.');
  }
  return function(str, pos) {
    if (parsers.length === 0) {
      return succeed({ value: [], rest: str, pos });
    } else {
      let [p, ...ps] = parsers;
      console.log(pos);
      let pReply = p(str, pos);
      if (isSuccess(pReply)) {
        let psReply = seq(ps)(pReply.rest, pReply.pos);
        if (isSuccess(psReply)) {
          return succeed({
            value: [pReply.value, ...psReply.value],
            rest: psReply.rest,
            pos: psReply.pos
          });
        } else {
          return [pos, ...(Array.isArray(psReply) ? psReply : [psReply])];
        }
      } else {
        return pReply;
      }
    }
    // return { status: 'FAIL', parser: 'seq' };
  };
}

let pos0 = { row: 1, col: 0, char: 0 };
let p = seq([letters, digits, letters]);
console.log(JSON.stringify(p('abc123###', pos0), null, 4));
