const encodeSvg = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, auto`;

function cursorSvg(label: string, fill: string, extra = ''): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
  <circle cx="12" cy="12" r="9" fill="${fill}" stroke="#111" stroke-width="1.5"/>
  <path d="M12 5v14M5 12h14" stroke="#111" stroke-width="1.5" stroke-linecap="round"/>
  ${extra}
  <text x="12" y="21" text-anchor="middle" font-size="6" font-family="Arial" fill="#111">${label}</text>
</svg>`;
}

export const TOOL_CURSORS = {
  moveIdle: encodeSvg(cursorSvg('M', '#dbeafe')),
  moveSelected: encodeSvg(cursorSvg('M', '#bfdbfe')),
  moveDragging: encodeSvg(cursorSvg('M', '#93c5fd')),
  moveCopy: encodeSvg(cursorSvg('+', '#bfdbfe')),
  moveStamp: encodeSvg(cursorSvg('++', '#93c5fd')),
  moveInvalid: encodeSvg(
    cursorSvg(
      '!',
      '#fecaca',
      '<circle cx="17" cy="7" r="4" fill="#ef4444" stroke="#111" stroke-width="1"/><path d="M15 7h4" stroke="#fff" stroke-width="1.2"/>'
    )
  ),
  tapeIdle: encodeSvg(cursorSvg('T', '#fef08a')),
  tapeMeasure: encodeSvg(cursorSvg('T', '#fde047')),
  tapeGuide: encodeSvg(cursorSvg('T+', '#fde68a')),
} as const;

