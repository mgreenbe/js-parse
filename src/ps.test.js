let _ = require('lodash');
let {
  alt,
  atLeast,
  between,
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
  trim,
  zeroOrMore
} = require('./pc.js');

let SUCCESS = 'SUCCESS';
let FAIL = 'FAIL';

function rnd(stringOrArray) {
  return stringOrArray[_.random(stringOrArray.length - 1)];
}

let lowerCaseLetters = 'abcdefghijklmnopqrstuvwxyz';
let upperCaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let digits = '0123456789';

function word(length = _.random(5, 10), alphabet = lowerCaseLetters) {
  return _.range(length)
    .map(() => rnd(alphabet))
    .join('');
}

test('(map, charInString)', () => {
  let chars = word();
  let ch = rnd(chars);
  let str = ch + word();
  expect(map(s => s.toUpperCase(), charInString(chars))(str)).toEqual({
    status: SUCCESS,
    result: ch.toUpperCase(),
    rest: str.slice(1)
  });
});

test('(thisString)', () => {
  let w1 = word();
  let w2 = word();
  expect(thisString(w1)(w1 + w2)).toEqual({
    status: SUCCESS,
    result: w1,
    rest: w2
  });
});

test('(oneOrMore, thisString)', () => {
  let w = word();
  let result = Array(_.random(1, 5)).fill(w);
  let rest = word();
  expect(oneOrMore(thisString(w))(result.join('') + rest)).toEqual({
    status: SUCCESS,
    result,
    rest
  });
});

test('(zeroOrMore, thisString)', () => {
  let w = word();
  let result = Array(_.random(3)).fill(w);
  let rest = word();
  expect(zeroOrMore(thisString(w))(result.join('') + rest)).toEqual({
    status: SUCCESS,
    result,
    rest
  });
});

test('(thisChar, times)', () => {
  let digit = rnd(digits);
  let n = _.random(1, 20);
  let result = Array(n).fill(digit);
  let rest = word();
  expect(times(n, thisChar(digit))(result.join('') + rest)).toEqual({
    status: SUCCESS,
    result,
    rest
  });
});

test('(seq, alt)', () => {
  let char = rnd(upperCaseLetters);
  let digit = rnd(digits);
  let result = _.range(_.random(10)).map(() => _.sample([char, digit]));
  let rest = rnd(lowerCaseLetters);
  let str = result.join('') + rest;
  let parser = zeroOrMore(alt([thisChar(digit), thisChar(char)]));
  expect(parser(str)).toEqual({
    status: SUCCESS,
    result,
    rest
  });
});

test('(alt, seq, thisChar, thisString, zeroOrMore', () => {
  let w = word();
  let result1 = Array(_.random(10)).fill(w);
  let parser1 = zeroOrMore(thisString(w));

  let char = rnd(upperCaseLetters);
  let digit = rnd(digits);
  let result2 = _.range(_.random(10)).map(() => _.sample([char, digit]));
  let parser2 = zeroOrMore(alt([thisChar(digit), thisChar(char)]));

  let result = [result1, result2];
  let rest = word();
  let str = result1.join('') + result2.join('') + rest;
  let parser = seq([parser1, parser2]);

  expect(parser(str)).toEqual({
    status: SUCCESS,
    result,
    rest
  });
});

test('(atLeat)', () => {
  let n = _.random(10, 20);
  let w = word();
  let result = Array(n).fill(w);
  let str = result.join('');
  let parser = atLeast(15, thisString(w));

  expect(parser(str)).toEqual(
    n >= 15 ? { status: SUCCESS, result, rest: '' } : { status: FAIL }
  );
});

test('(regex, seq)', () => {
  let n = _.random(5, 10);
  let result = _.range(n).map(() => word());
  let parser = seq(
    result
      .map(w => new RegExp(w))
      .map(regex)
      .map(p => map(result => result[0], p))
  );
  let rest = word();
  let str = result.join('') + rest;
  expect(parser(str)).toEqual({ status: SUCCESS, result, rest });
});

let controlWord = map(result => result[1], regex(/(\\[a-zA-Z]+) */));

test('(regex)', () => {
  expect(controlWord('\\textbf   123')).toEqual({
    status: SUCCESS,
    result: '\\textbf',
    rest: '123'
  });
});

test('(chain)', () => {
  let p = regex(/[^s]/);
  let q = chain(p, ({ result, rest }) => {
    return regex(new RegExp('\\w+' + result[0][0]))(rest);
  });
  let w = word();
  let ch = _.sample('!@#%&]{}|;:",/<>');
  expect(q(ch + w + ch).result[0]).toEqual(w + ch);
});

test('(between, trim)', () => {
  let lparen = thisChar('(');
  let rparen = thisChar(')');
  let result = word();
  let rest = word();
  let str = '(' + '     ' + result + '   ' + ')' + rest;
  let p = regex(/\w+/);
  expect(between(lparen, trim(p), rparen)(str).result[0]).toEqual(result);
});
