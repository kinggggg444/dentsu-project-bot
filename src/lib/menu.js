const FRAME_WIDTH = 48;
const INNER_WIDTH = FRAME_WIDTH - 2;

function border(left, fill, right) {
  return `${left}${fill.repeat(FRAME_WIDTH)}${right}`;
}

function frameLine(value = '') {
  const text = String(value);
  const visible = text.length > INNER_WIDTH ? text.slice(0, INNER_WIDTH) : text;
  return `║${visible.padEnd(INNER_WIDTH, ' ')}║`;
}

function premiumMenu(rawMenu) {
  const lines = String(rawMenu)
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trimEnd());

  const titleLine = lines.find((line) => line.includes('*') && /^[║│]/.test(line));
  const title = titleLine
    ? titleLine
      .replace(/^[║│]\s*/, '')
      .replace(/\s*[║│]\s*$/, '')
      .trim()
    : 'DENTSU MENU';

  const commands = lines
    .filter((line) => line.trimStart().startsWith('│'))
    .map((line) => line.replace(/^\s*│\s*/, '').trim());

  const notes = lines.filter((line) => {
    const value = line.trim();
    return value
      && !value.startsWith('╔')
      && !value.startsWith('╚')
      && !value.startsWith('║')
      && !value.startsWith('│')
      && !value.startsWith('>')
      && !value.includes('BOT_FOOTER');
  });

  return [
    border('╔', '═', '╗'),
    frameLine(title),
    border('╠', '═', '╣'),
    '',
    ...commands.map((command) => frameLine(`  ${command}`)),
    ...(notes.length ? ['', ...notes.map((note) => frameLine(`  ${note}`))] : []),
    '',
    frameLine(`  ${'Powered by DENTSU PROJECT BOT'}`),
    border('╚', '═', '╝'),
  ].join('\n');
}

module.exports = { premiumMenu };