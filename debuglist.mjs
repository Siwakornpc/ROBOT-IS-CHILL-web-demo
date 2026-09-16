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
      justEndedTopLevelList = false;
      i++;
      continue;
    }

    if (inFence) {
      output.push(line);
      i++;
      continue;
    }

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

    const shouldBreakList =
      justEndedTopLevelList &&
      line.trim() !== '' &&
      !topLevelMarkerRe.test(line) &&
      !indentedContinuationRe.test(line);

    if (shouldBreakList) output.push('');
    output.push(line);
    justEndedTopLevelList = false;
    i++;
  }

  return output.join('\n');
}

for (const input of ['- foo\nbar', '- foo\n  bar', '- foo\n- bar', '- foo\n\nbar']) {
  console.log('INPUT=', JSON.stringify(input));
  console.log(JSON.stringify(normalizeListMarkerTypes(input)));
}
