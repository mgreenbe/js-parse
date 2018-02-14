let { doIncr } = require("./pos.js");

function succeed(obj) {
  return Object.assign({ type: "reply", status: "success" }, obj || {});
}

function fail(obj) {
  return Object.assign({ type: "reply", status: "fail" }, obj || {});
}

function isSuccess(obj) {
  return obj.status === "success";
}

function isFailure(obj) {
  return !isSuccess(obj);
}

let initPos = { row: 1, col: 0, char: 0 };

function char(c) {
  return function(str, endPrev = initPos) {
    return c === str[0]
      ? succeed({
          parser: "char",
          value: c,
          rest: str.slice(1),
          endPrev: endPrev,
          end: doIncr(c, endPrev)
        })
      : fail({
          parser: "char",
          expected: `${c}`,
          found: `${str[0]}`,
          endPrev
        });
  };
}

function oneOf(alphabet) {
  if (typeof alphabet !== "string") {
    throw new TypeError("oneOf takes a string argument.");
  }
  return function(str, endPrev = initPos) {
    return alphabet.includes(str[0])
      ? succeed({
          parser: "oneOf",
          value: str[0],
          rest: str.slice(1),
          endPrev: endPrev,
          end: doIncr(str[0], endPrev)
        })
      : fail({
          parser: "oneOf",
          expected: `a character of '${alphabet}'`,
          found: `${str[0]}`,
          endPrev
        });
  };
}

function noneOf(alphabet) {
  return function(str, endPrev = initPos) {
    let reply = oneOf(alphabet)(str, endPrev);
    return isSuccess(reply)
      ? fail({
          parser: "noneOf",
          expected: `a character not in '${alphabet}'`,
          found: `${reply.value[0]}`,
          endPrev
        })
      : success({
          parser: "noneOf",
          value: str[0],
          rest: str.slice(1),
          endPrev: endPrev,
          end: doIncr(str[0], endPrev)
        });
  };
}

function regex(re) {
  return function(str, endPrev = initPos) {
    let modifiedRE = new RegExp("^" + re.source, re.flags);
    let match = modifiedRE.exec(str);
    return match !== null
      ? succeed({
          parser: "regex",
          value: match,
          rest: str.slice(match[0].length),
          endPrev: endPrev,
          end: doIncr(match[0], endPrev)
        })
      : fail({
          parser: "regex",
          expected: `/${modifiedRE.source}/${modifiedRE.flags}`,
          found: `${str.slice(0, 10)}${str.length <= 10 ? "" : "..."}`,
          endPrev
        });
  };
}

function mappedRegex(re, successReply, failReply) {
  return function(str, endPrev = initPos) {
    let reply = regex(re)(str, endPrev);
    return Object.assign(
      reply,
      isSuccess(reply) ? successReply(reply) : failReply(reply)
    );
  };
}

let letter = mappedRegex(
  /[a-zA-Z]/,
  ({ value }) => ({ parser: "letter", value: value[0] }),
  ({ endPrev }) => ({
    parser: "letter",
    expected: `a letter`,
    endPrev
  })
);

let letters = mappedRegex(
  /[a-zA-Z]+/,
  ({ value }) => ({ parser: "letters", value: value[0] }),
  ({ endPrev }) => ({
    parser: "letters",
    expected: `a string of letters`,
    endPrev
  })
);

let digit = mappedRegex(
  /[0-9]/,
  ({ value }) => ({ parser: "digit", value: value[0] }),
  ({ endPrev }) => ({
    parser: "letters",
    expected: `a digit`,
    endPrev
  })
);

let digits = mappedRegex(
  /[0-9]+/,
  ({ value }) => ({ parser: "digits", value: value[0] }),
  ({ endPrev }) => ({
    parser: "letters",
    expected: `a string of digits (length > 0)`,
    endPrev
  })
);

let spaces = mappedRegex(
  /[ ]+/,
  ({ value }) => ({ parser: "spaces", value: value[0] }),
  ({ endPrev }) => ({
    parser: "spaces",
    expected: `a string of spaces (length > 0)`,
    endPrev
  })
);

let maybeSpaces = mappedRegex(
  /[ ]*/,
  ({ value }) => ({ parser: "maybeSpaces", value: value[0] }),
  () => {
    throw new Error("maybeSpaces should never fail!");
  }
);

let whitespace = mappedRegex(
  /\s+/,
  ({ value }) => ({ parser: "whitespace", value: value[0] }),
  ({ endPrev }) => ({
    parser: "spaces",
    expected: `whitespace (length > 0)`,
    endPrev
  })
);

let maybeWhitespace = mappedRegex(
  /\s*/,
  ({ value }) => ({ parser: "maybeWhitespace", value: value[0] }),
  () => {
    throw new Error("maybeWhitepace should never fail!");
  }
);

module.exports = {
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
};
