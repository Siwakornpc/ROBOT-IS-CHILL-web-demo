const TOKEN_START = '\uE000';
const TOKEN_END = '\uE001';

function makeToken(tokens, token) {
  const index = tokens.push(token) - 1;
  return `${TOKEN_START}${index}${TOKEN_END}`;
}

function normalizeDiscordLists(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let inFence = false;
  let fenceChar = '';
  let fenceLength = 0;
  let multiLineQuote = false;

  for (const line of lines) {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})(?:.*)?$/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceChar = fence[1][0];
        fenceLength = fence[1].length;
      } else if (fence[1][0] === fenceChar && fence[1].length >= fenceLength) {
        inFence = false;
        fenceChar = '';
        fenceLength = 0;
      }
      output.push(line);
      continue;
    }
    if (inFence) {
      output.push(line);
      continue;
    }
    if (multiLineQuote) {
      output.push(line === '' ? '>' : `> ${line}`);
      continue;
    }
    if (line.startsWith('>>> ')) {
      multiLineQuote = true;
      const content = line.slice(3).replace(/^ /, '');
      output.push(content === '' ? '>' : `> ${content}`);
      continue;
    }
    output.push(line);
  }
  return output.join('\n');
}

function escapeEmptyListMarkers(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let inFence = false;
  let fenceChar = '';
  let fenceLength = 0;
  return lines.map((line) => {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})(?:.*)?$/);
    if (fence) {
      if (!inFence) { inFence = true; fenceChar = fence[1][0]; fenceLength = fence[1].length; }
      else if (fence[1][0] === fenceChar && fence[1].length >= fenceLength) { inFence = false; fenceChar = ''; fenceLength = 0; }
      return line;
    }
    if (inFence) return line;
    if (/^ {0,3}[-*]\s*$/.test(line)) return line.replace(/^\s*([-*])\s*$/, '$1');
    if (/^ {0,3}\d+\.\s*$/.test(line)) return line.replace(/^\s*(\d+)\.\s*$/, '$1\\.');
    return line;
  }).join('\n');
}

function normalizeListMarkerTypes(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let inFence = false;
  let fenceChar = '';
  let fenceLength = 0;
  const isFence = (line) => line.match(/^ {0,3}(`{3,}|~{3,})(?:.*)?$/);
  const bulletRe = /^ {0,3}([-*])(\s+)(.*)$/;
  const orderedRe = /^ {0,3}(\d+)([.)])(\s+)(.*)$/;
  const topLevelMarkerRe = /^\s*(?:[-*]\s+|\d+[.)]\s+)/;
  const indentedContinuationRe = /^\s{2,}\S/;
  let i = 0;
  let justEndedTopLevelList = false;

  while (i < lines.length) {
    const line = lines[i];
    const fence = isFence(line);
    if (fence) {
      if (!inFence) { inFence = true; fenceChar = fence[1][0]; fenceLength = fence[1].length; }
      else if (fence[1][0] === fenceChar && fence[1].length >= fenceLength) { inFence = false; fenceChar = ''; fenceLength = 0; }
      output.push(line);
      justEndedTopLevelList = false;
      i++;
      continue;
    }
    if (inFence) { output.push(line); i++; continue; }
    const bulletMatch = line.match(bulletRe);
    const orderedMatch = line.match(orderedRe);
    if (bulletMatch || orderedMatch) {
      const blockType = orderedMatch ? 'ordered' : 'bullet';
      const bulletChar = bulletMatch ? bulletMatch[1] : '-';
      let n = orderedMatch ? Number(orderedMatch[1]) : 1;
      while (i < lines.length) {
        const l = lines[i];
        const b = l.match(bulletRe);
        const o = l.match(orderedRe);
        if (!b && !o) break;
        const rest = o ? o[4] : b[3];
        if (blockType === 'ordered') {
          output.push(`${n}. ${rest}`);
          n++;
        } else {
          output.push(`${bulletChar} ${rest}`);
        }
        i++;
      }
      justEndedTopLevelList = true;
      continue;
    }
    const shouldBreakList = justEndedTopLevelList && line.trim() !== '' && !topLevelMarkerRe.test(line) && !indentedContinuationRe.test(line);
    if (shouldBreakList) output.push('');
    output.push(line);
    justEndedTopLevelList = false;
    i++;
  }
  return output.join('\n');
}

function protectUnsupportedGfmSyntax(source) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const output = [...lines];
  let inFence = false;
  let fenceChar = '';
  let fenceLength = 0;
  const isFence = (line) => line.match(/^ {0,3}(`{3,}|~{3,})(?:.*)?$/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = isFence(line);
    if (fence) {
      if (!inFence) { inFence = true; fenceChar = fence[1][0]; fenceLength = fence[1].length; }
      else if (fence[1][0] === fenceChar && fence[1].length >= fenceLength) { inFence = false; fenceChar = ''; fenceLength = 0; }
      continue;
    }
    if (inFence) continue;
    if (/^ {0,3}(?:[-*])\s+\[[ xX]\]\s+/.test(line)) { output[i] = line.replace(/^\s*[-*]\s+\[([ xX])\]\s+/, '$1'); }
    const next = lines[i + 1];
    if (line.includes('|') && next && /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(next)) { let j = i; while (j < lines.length && !isFence(lines[j]) && lines[j].trim() !== '') { output[j] = lines[j].replace(/\|/g, '\\|'); j++; } i = j - 1; }
  }
  return output.join('\n');
}

function preserveDiscordEmptyLines(source, tokens) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let inFence = false;
  let fenceChar = '';
  let fenceLength = 0;
  const isFence = (line) => line.match(/^ {0,3}(`{3,}|~{3,})(?:.*)?$/);
  const isListItemLine = (line) => /^ {0,3}(?:[-*]\s+|\d+[.)]\s+)/.test(line);
  const isIndentedContinuation = (line) => /^\s{2,}\S/.test(line);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = isFence(line);
    if (fence) {
      if (!inFence) { inFence = true; fenceChar = fence[1][0]; fenceLength = fence[1].length; }
      else if (fence[1][0] === fenceChar && fence[1].length >= fenceLength) { inFence = false; fenceChar = ''; fenceLength = 0; }
      output.push(line);
      continue;
    }
    if (inFence) { output.push(line); continue; }
    if (line.trim() === '') {
      const prev = [...lines.slice(0, i)].reverse().find((candidate) => candidate.trim() !== '');
      const next = lines.slice(i + 1).find((candidate) => candidate.trim() !== '');
      const isListBoundaryBreak = Boolean(prev) && isListItemLine(prev) && Boolean(next) && next.trim() !== '' && !isListItemLine(next) && !isIndentedContinuation(next);
      if (isListBoundaryBreak) { output.push(''); continue; }
      let count = 1;
      while (i + 1 < lines.length && lines[i + 1].trim() === '') { count++; i++; }
      output.push(Array.from({ length: count }, () => makeToken(tokens, { type: 'blankLine' })).join(''));
      continue;
    }
    output.push(line);
    if (i < lines.length - 1) output.push('\n');
  }
  return output.join('');
}

function prepareSource(source, tokens) {
  source = source.replace(/\r\n?/g, '\n');
  const normalized = preserveDiscordEmptyLines(
    protectUnsupportedGfmSyntax(
      normalizeListMarkerTypes(
        normalizeDiscordLists(
          escapeEmptyListMarkers(source)
        )
      )
    ),
    tokens
  );
  return normalized;
}

for (const input of ['- foo\nbar', '- foo\n  bar', '- foo\n- bar', '- foo\n\nbar']) {
  const tokens = [];
  const prepared = prepareSource(input, tokens);
  console.log('INPUT', JSON.stringify(input));
  console.log('PREPARED', JSON.stringify(prepared));
  console.log('TOKENS', tokens);
}
