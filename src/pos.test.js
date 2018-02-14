let { doIncr } = require('./pos.js');

let justin = `
I brag about you to anyone outside
But I'm a man of the woods, it's my pride
I'm sorry baby, you know I try
But I'm a man of the woods, it's my pride

Hey, sugar plum, look at where we are
So tonight, if I take it too far
That's okay because you know
(That's okay because you know)
I hear the making up's fun
Been a minute since we've had some time to breathe
So if you see another side of me
That's okay because you know
(That's okay because you know)
I hear the making up's fun`.trim();

test('justin', () => {
  let pos0 = { row: 1, col: 0, char: 0 };

  let i1 = justin.indexOf(',') + 1;
  let head1 = justin.slice(0, i1);
  let tail1 = justin.slice(i1);
  let pos1 = doIncr(head1, pos0);

  let i2 = tail1.indexOf('plum') + 1;
  let head2 = tail1.slice(0, i2);
  let tail2 = tail1.slice(i2);
  let pos2 = doIncr(head2, pos1);

  let i3 = tail2.indexOf('(') + 1;
  let head3 = tail2.slice(0, i3);
  let tail3 = tail2.slice(i3);
  let pos3 = doIncr(head3, pos2);

  console.log(head3, pos3);

  expect(pos1.row).toBe(2);
  expect(pos1.col).toBe(27);
  expect(pos1.char).toBe(head1.length);

  expect(pos2.row).toBe(6);
  expect(pos2.col).toBe(12);
  expect(pos2.char).toBe(head1.length + head2.length);

  expect(pos3.row).toBe(9);
  expect(pos3.col).toBe(1);
  expect(pos3.char).toBe(head1.length + head2.length + head3.length);
});
