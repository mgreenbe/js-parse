function getIncr(str) {
  let lines = str.split('\n');
  let n = lines.length - 1;
  return { rows: n, cols: lines[n].length, chars: str.length };
}

function doIncr(str, { row, col, char }) {
  let { rows, cols, chars } = getIncr(str);
  return {
    row: row + rows,
    col: rows === 0 ? col + cols : cols,
    char: char + chars
  };
}

module.exports = { doIncr };
