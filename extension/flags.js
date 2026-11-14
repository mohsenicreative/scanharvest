/* Flag artwork (inline SVG, no emoji) for the language picker. All flags render in a 3:2 box. */
globalThis.FLAGS = (() => {
  const wrap = (body, viewBox = '0 0 30 20') =>
    `<svg class="flag" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;

  function star(cx, cy, r, rotationDeg = 0) {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 ? r * 0.382 : r;
      const angle = (rotationDeg - 90 + i * 36) * Math.PI / 180;
      points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
    }
    return `<polygon points="${points.join(' ')}" fill="#FFDE00"/>`;
  }
  // Small stars of the Chinese flag point toward the large star.
  const towardBig = (x, y) => Math.atan2(5 - y, 5 - x) * 180 / Math.PI + 90;

  return {
    // United Kingdom (English)
    en: wrap(
      '<clipPath id="msc-uk-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>' +
      '<path d="M0,0 v30 h60 v-30 z" fill="#012169"/>' +
      '<path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>' +
      '<path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#msc-uk-t)" stroke="#C8102E" stroke-width="4"/>' +
      '<path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>' +
      '<path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>', '0 0 60 30'),
    // Iran (Persian)
    fa: wrap('<rect width="30" height="20" fill="#fff"/><rect width="30" height="6.67" fill="#239F40"/><rect y="13.33" width="30" height="6.67" fill="#DA0000"/>'),
    // France
    fr: wrap('<rect width="30" height="20" fill="#fff"/><rect width="10" height="20" fill="#002395"/><rect x="20" width="10" height="20" fill="#ED2939"/>'),
    // Germany
    de: wrap('<rect width="30" height="20" fill="#FFCE00"/><rect width="30" height="6.67" fill="#000"/><rect y="6.67" width="30" height="6.67" fill="#DD0000"/>'),
    // Spain
    es: wrap('<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>'),
    // China (Chinese)
    zh: wrap('<rect width="30" height="20" fill="#EE1C25"/>' + star(5, 5, 3) +
      star(10, 2, 1, towardBig(10, 2)) + star(12, 4, 1, towardBig(12, 4)) +
      star(12, 7, 1, towardBig(12, 7)) + star(10, 9, 1, towardBig(10, 9)))
  };
})();
