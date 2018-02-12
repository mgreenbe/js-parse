let SUCCESS = 'SUCCESS';
let FAIL = 'FAIL';

function succeed(result) {
  return function(str) {
    return {
      status: SUCCESS,
      rest: str,
      result: result
    };
  };
}

function fail(details) {
  return { status: FAIL, details };
}

function map(f, p) {
  return function(str) {
    let output = p(str);
    return output.status === SUCCESS
      ? Object.assign(output, { result: f(output.result) })
      : { status: FAIL };
  };
}

function mapOutput(f, p) {
  return function(str) {
    return f(p(str), str);
  };
}

let peek = p =>
  mapOutput(
    (output, str) =>
      output.status === SUCCESS
        ? Object.assign(output, { rest: str })
        : { status: FAIL },
    p
  );

let negativePeek = p =>
  mapOutput(
    (output, str) =>
      output.status === SUCCESS
        ? { status: FAIL }
        : { status: SUCCESS, rest: str },
    p
  );

function satisfy(f) {
  return function(str) {
    let [ch, ...rest] = str;
    return f(ch)
      ? { status: SUCCESS, result: ch, rest: rest.join('') }
      : { status: FAIL };
  };
}

function thisChar(c) {
  return satisfy(cc => cc === c);
}

function seq(parsers) {
  if (!Array.isArray(parsers)) {
    throw new TypeError('You must pass an array to seq.');
  }
  return function(str) {
    if (parsers.length === 0) {
      return { status: SUCCESS, result: [], rest: str };
    } else {
      let [p, ...ps] = parsers;
      let pOutput = p(str);
      if (pOutput.status === SUCCESS) {
        let psOutput = seq(ps)(pOutput.rest);
        if (psOutput.status === SUCCESS) {
          return {
            status: SUCCESS,
            result: [pOutput.result, ...psOutput.result],
            rest: psOutput.rest
          };
        }
      }
    }
    return { status: 'FAIL' };
  };
}

function alt(parsers) {
  return function(str) {
    if (parsers.length > 0) {
      let [p, ...ps] = parsers;
      let pOutput = p(str);
      if (pOutput.status === SUCCESS) {
        return pOutput;
      } else return alt(ps)(str);
    }
    return { status: FAIL };
  };
}

function charInString(s) {
  if (typeof s !== 'string') {
    throw new TypeError('char takes a string argument.');
  }
  return function(str) {
    return s.includes(str[0])
      ? { status: SUCCESS, result: str[0], rest: str.slice(1) }
      : { status: FAIL };
  };
}

let letter = charInString(
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
);

let digit = charInString('0123456789');

function charInRange(m, n) {
  return function(str) {
    return m <= str.charCodeAt(0) && str.charCodeAt(0) <= n
      ? { status: SUCCESS, result: str[0], rest: str.slice(1) }
      : { status: FAIL };
  };
}

function thisString(s) {
  return map(arr => arr.join(''), seq([...s].map(thisChar)));
}

function zeroOrMore(p) {
  return function(str) {
    let pOutput = p(str);
    if (pOutput.status === SUCCESS) {
      let recOutput = zeroOrMore(p)(pOutput.rest);
      return {
        status: SUCCESS,
        result: [pOutput.result, ...recOutput.result],
        rest: recOutput.rest
      };
    } else {
      return { status: SUCCESS, result: [], rest: str };
    }
  };
}

function oneOrMore(p) {
  return map(([r, rs]) => [r, ...rs], seq([p, zeroOrMore(p)]));
}

function times(n, p) {
  return seq(Array(n).fill(p));
}

function atLeast(n, p) {
  return map(([a, b]) => [...a, ...b], seq([times(n, p), zeroOrMore(p)]));
}

function atMost(n, p) {
  console.log(`n = ${n}`);
  return function(str) {
    if (n === 0) {
      let lookahead = peek(p)(str);
      if (lookahead.status === SUCCESS) {
        return { status: FAIL };
      } else {
        return { status: SUCCESS, result: [], rest: str };
      }
    } else if (n > 0) {
      let output = p(str);
      if (output.status === SUCCESS) {
        let recOutput = atMost(n - 1, p)(output.rest);
        return recOutput.status === SUCCESS
          ? Object.assign(recOutput, {
              result: [output.result, ...recOutput.result]
            })
          : { status: FAIL };
      } else {
        return { status: SUCCESS, result: [], rest: str };
      }
    } else {
      throw new RangeError(`n (${n}) must be nonnegative.`);
    }
  };
}

function regex(re) {
  return function(str) {
    let modifiedRE = new RegExp('^' + re.source, re.flags);
    let result = modifiedRE.exec(str);
    return result !== null
      ? { status: SUCCESS, result, rest: str.slice(result[0].length) }
      : { status: FAIL };
  };
}

function chain(p, f) {
  return function(str) {
    let pOutput = p(str);
    return f(pOutput, str);
  };
}

module.exports = {
  alt,
  atLeast,
  chain,
  charInString,
  map,
  peek,
  oneOrMore,
  regex,
  seq,
  thisChar,
  thisString,
  times,
  zeroOrMore
};
