function __seq(parsers) {
  if (!Array.isArray(parsers)) {
    throw new TypeError('You must pass an array to seq.');
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

function __alt(parsers) {
  if (!Array.isArray(parsers)) {
    throw new TypeError('You must pass an array to seq.');
  }
  return function(str, endPrev) {
    if (parsers.length === 0) {
      return [];
    } else {
      let [p, ...ps] = parsers;
      let pReply = p(str, endPrev);
      if (isSuccess(pReply)) {
        return [pReply];
      } else {
        let psReply = __alt(ps)(str, endPrev);
        return [pReply, ...psReply];
      }
    }
  };
}

function wrap(combinator, parserName) {
  return function(parsers) {
    return function(str, endPrev) {
      let replies = combinator(parsers)(str, endPrev);
      let n = replies.length;
      if (n === 0) {
        return fail({ parserName, value: [], endPrev, end: endPrev });
      }
      if (isSuccess(replies[n - 1])) {
        return Object.assign(
          replies,
          succeed({
            parser: parserName,
            rest: replies[n - 1].rest,
            end: replies[n - 1].end,
            endPrev
          })
        );
      } else {
        return Object.assign(
          replies,
          fail({
            parser: parserName,
            endPrev
          })
        );
      }
    };
  };
}

let seq = wrap(__seq, 'seq');

let alt = wrap(__alt, 'alt');

module.exports = { seq, alt };
