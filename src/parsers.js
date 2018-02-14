let { doIncr } = require('./pos.js');

function succeed(obj) {
  return Object.assign({ type: 'reply', status: 'success' }, obj || {});
}

function fail(obj) {
  return Object.assign({ type: 'reply', status: 'fail' }, obj || {});
}

function isSuccess(obj) {
  return obj.status === 'success';
}

function isFailure(obj) {
  return !isSuccess(obj);
}

function char(c) {
  return function(str, pos) {
    return c === str[0]
      ? success({ value: c, rest: str.slice(1), pos: doIncr(c, pos) })
      : fail({
          parser: 'char',
          message: `Expected '${c}' at position (${pos.row}, ${pos.col +
            1}). Found '${str[0]}' there.`
        });
  };
}

function oneOf(alphabet) {
  if (typeof alphabet !== 'string') {
    throw new TypeError('oneOf takes a string argument.');
  }
  return function(str, pos) {
    return alphabet.includes(str[0])
      ? succeed({
          parser: 'oneOf',
          value: str[0],
          rest: str.slice(1),
          pos: doIncr(str[0], pos)
        })
      : fail({
          parser: 'oneOf',
          message: `Expected a character of ${alphabet} at position (${
            pos.row
          }, ${pos.col + 1}). Found ${str[0]} there.`
        });
  };
}

function noneOf(alphabet) {
  return function(str, pos) {
    let reply = oneOf(alphabet)(str, pos);
    return isSuccess(reply)
      ? fail({
          parser: 'noneOf',
          expected: `Expected a character not in '${alphabet}' at position (${
            pos.row
          }, ${pos.col + 1}).`,
          found: `Found '${reply.value[0]}'.`
        })
      : success({
          parser: 'noneOf',
          value: str[0],
          rest: str.slice(1),
          pos: doIncr(str[0], pos)
        });
  };
}

function regex(re) {
  return function(str, pos) {
    let modifiedRE = new RegExp('^' + re.source, re.flags);
    let match = modifiedRE.exec(str);
    return match !== null
      ? succeed({
          parser: 'regex',
          value: match,
          rest: str.slice(match[0].length),
          pos: doIncr(match[0], pos)
        })
      : fail({
          parser: 'regex',
          expected: `Expected to match /${modifiedRE.source}/${
            modifiedRE.flags
          } at position (${pos.row}, ${pos.col + 1}).`,
          found: `Found '${str.slice(0, 10)}${
            str.length <= 10 ? '' : '...'
          }' there.`,
          pos
        });
  };
}

function mappedRegex(re, successReply, failReply) {
  return function(str, pos) {
    let reply = regex(re)(str, pos);
    return Object.assign(
      reply,
      isSuccess(reply) ? successReply(reply) : failReply(reply)
    );
  };
}

let letter = mappedRegex(
  /[a-zA-Z]/,
  ({ value }) => ({ parser: 'letter', value: value[0] }),
  ({ pos }) => ({
    parser: 'letter',
    expected: `Expected a letter at position (${pos.row}, ${pos.col + 1}).`
  })
);

let letters = mappedRegex(
  /[a-zA-Z]+/,
  ({ value }) => ({ parser: 'letters', value: value[0] }),
  ({ pos }) => ({
    parser: 'letters',
    expected: `Expected a string of letters at position (${pos.row}, ${pos.col +
      1}).`
  })
);

let digit = mappedRegex(
  /[0-9]/,
  ({ value }) => ({ parser: 'digit', value: value[0] }),
  ({ pos }) => ({
    parser: 'letters',
    expected: `Expected a digit at position (${pos.row}, ${pos.col + 1}).`
  })
);

let digits = mappedRegex(
  /[0-9]+/,
  ({ value }) => ({ parser: 'digitd', value: value[0] }),
  ({ pos }) => ({
    parser: 'letters',
    expected: `Expected a string of digits (length > 0) at position (${
      pos.row
    }, ${pos.col + 1}).`
  })
);

let spaces = mappedRegex(
  /[ ]+/,
  ({ value }) => ({ parser: 'spaces', value: value[0] }),
  ({ pos }) => ({
    parser: 'spaces',
    expected: `Expected a string of spaces (length > 0) at position (${
      pos.row
    }, ${pos.col + 1}).`
  })
);

let maybeSpaces = mappedRegex(
  /[ ]*/,
  ({ value }) => ({ parser: 'maybeSpaces', value: value[0] }),
  () => {
    throw new Error('maybeSpaces should never fail!');
  }
);

let whitespace = mappedRegex(
  /\s+/,
  ({ value }) => ({ parser: 'whitespace', value: value[0] }),
  ({ pos }) => ({
    parser: 'spaces',
    expected: `Expected whitespace (length > 0) at position (${
      pos.row
    }, ${pos.col + 1}).`
  })
);

let maybeWhitespace = mappedRegex(
  /\s*/,
  ({ value }) => ({ parser: 'maybeWhitespace', value: value[0] }),
  () => {
    throw new Error('maybeWhitepace should never fail!');
  }
);

module.exports = {
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
};
