let s = require('json-stringify-pretty-compact');
let _ = require('lodash');

let {
  mappedRegex,
  char,
  digit,
  digits,
  letter,
  letters,
  maybeSpaces,
  isSuccess
} = require('./parsers.js');
let { seq, alt } = require('./seqalt.js');

let lBrace = (str, endPrev) =>
  Object.assign(char('{')(str, endPrev), { parser: 'lBrace' });
let rBrace = (str, endPrev) =>
  Object.assign(char('}')(str, endPrev), { parser: 'rBrace' });
let lBrak = (str, endPrev) =>
  Object.assign(char('[')(str, endPrev), { parser: 'lBrak' });
let rBrak = (str, endPrev) =>
  Object.assign(char(']')(str, endPrev), { parser: 'rBrak' });

let controlWord = mappedRegex(
  /(\\[a-zA-Z]+)(?:\n? +|^\n(?!\n))/,
  ({ value }) => ({
    parser: 'controlWord',
    value: value[1]
  })
);

let braceGroup = (str, endPrev) =>
  Object.assign(seq([lBrace, letters, rBrace])(str, endPrev)[1], {
    parser: 'braceGroup'
  });

let command = (str, endPrev) =>
  Object.assign(seq([controlWord, braceGroup])(str, endPrev), {
    parser: 'command'
  });
let param = mappedRegex(
  /#(\d)/,
  ({ value }) => ({ parser: 'param', value: Number(value[1]) }),
  reply => reply
);

let space = mappedRegex(
  /^\n? +|^\n(?!\n)/,
  () => ({ parser: 'space' }),
  () => ({ parser: 'space' })
);

let sp = /(?:\n? +|\n(?!\n) *)?/;

let nargs = mappedRegex(
  new RegExp('\\[' + sp.source + '(\\d)' + sp.source + ']' + sp.source),
  ({ value }) => ({ parser: 'nargs', value: Number(value[1]) }),
  () => ({ parser: 'nargs' })
);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

let codes = [10, ..._.range(32, 65), ..._.range(91, 97), ..._.range(123, 127)];
let nonLetters = codes.map(x => String.fromCharCode(x));
let nonLettersRE = new RegExp(`[${escapeRegExp(nonLetters.join(''))}]`);

let controlSymbol = mappedRegex(
  new RegExp(`(\\\\${nonLettersRE.source})${sp.source}`),
  ({ value }) => ({ parser: 'controlSymbol', value: value[1] }),
  () => ({ parser: 'controlSymbol' })
);

let summary = reply => {
  if (Array.isArray(reply)) {
    return { [reply.parser]: reply.map(summary) };
  } else {
    return { [reply.parser]: reply.value };
  }
};

console.log(
  s(summary(command('\\textbf\n  {important} blah blah')), {
    maxLength: 50,
    indent: 2
  })
);

console.log(nargs('[  2     ]\n\n  {abc}'));

console.log(controlSymbol('\\&\nabcd'));

console.log(alt([letter, digit, braceGroup])('1{hahaha}'));
