let { doIncr } = require("./pos.js");

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function succeed(obj, parser) {
  return Object.assign(obj || {}, { parser, status: "success" });
}

function fail(obj, parser) {
  return Object.assign(obj || {}, { parser, status: "fail" });
}

function isSuccess(obj) {
  return obj.status === "success";
}

function isFailure(obj) {
  return !isSuccess(obj);
}

let initPos = { row: 1, col: 0, char: 0 };

function regex(re) {
  return function(str, endPrev = initPos) {
    let modifiedRE = new RegExp("^" + re.source, re.flags);
    let match = modifiedRE.exec(str);
    return match !== null
      ? succeed(
          {
            value: match,
            rest: str.slice(match[0].length),
            endPrev: endPrev,
            end: doIncr(match[0], endPrev)
          },
          "regex"
        )
      : fail(
          {
            found: `${str.slice(0, 10)}${str.length <= 10 ? "" : "..."}`,
            endPrev
          },
          `regex(/${modifiedRE.source}/${modifiedRE.flags})`
        );
  };
}

function mappedRegex(re, parserName, group = 0) {
  return function(str, endPrev = initPos) {
    let reply = regex(re)(str, endPrev);
    return isSuccess(reply)
      ? Object.assign(succeed(reply, parserName), {
          value: reply.value[group]
        })
      : fail(reply, parserName);
  };
}

let char = c => mappedRegex(new RegExp("^" + escapeRegExp(c)), "char");

let oneOf = string =>
  mappedRegex(new RegExp(`^[${escapeRegExp(string)}]`), `oneOf ${string}`);

let noneOf = string =>
  mappedRegex(new RegExp(`^[^${escapeRegExp(string)}]`), `noneOf ${string}`);

let letter = mappedRegex(/[a-zA-Z]/, "letter");

let letters = mappedRegex(/[a-zA-Z]+/, "letters");

let digit = mappedRegex(/[0-9]/, "digit");

let digits = mappedRegex(/[0-9]+/, "digits");

let spaces = mappedRegex(/[ ]+/, "spaces");

let maybeSpaces = mappedRegex(/[ ]*/, "maybeSpaces");

let whitespace = mappedRegex(/\s+/, "whitespace");

let maybeWhitespace = mappedRegex(/\s*/, "maybeWhitespace");

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

console.log(noneOf("678^&\\asdfa")("aq\\?34abcd123"));
