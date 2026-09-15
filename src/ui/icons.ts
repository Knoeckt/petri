// The icon set: inline SVG in the critter style, thick ink outline, flat fills, one highlight. 24-unit grid.
// Colours are the palette tokens (design doc §12). Every emoji in the UI goes through here.
const INK = '#1f3d33', CREAM = '#fff6dc', TEAL = '#22d3b0', GOLD = '#ffd43b', GOLD2 = '#e6a800', DANGER = '#e63946', WOOD = '#c98a4a', PAPER = '#f4ead0';
const S = `stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
const hi = (d: string) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;

const ICONS: Record<string, string> = {
  flask: `<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3" fill="${CREAM}" ${S}/><path d="M7.5 15h9l1.5 3.5H6z" fill="${TEAL}" stroke="none"/>${hi('M11 6v3')}`,
  microscope: `<path d="M9 3l5 2-3 8-4-1.5z" fill="${CREAM}" ${S}/><path d="M6 19h12M9 19v-3h6v3M12 12a5 5 0 0 1 4 6" fill="none" ${S}/><circle cx="6.5" cy="13" r="2" fill="${GOLD}" ${S}/>${hi('M10.5 5.5l2.5 1')}`,
  pill: `<rect x="3" y="8.5" width="18" height="8" rx="4" transform="rotate(-30 12 12)" fill="${CREAM}" ${S}/><path d="M7.7 15.4l7.8-4.5" ${S} fill="none"/><path d="M10.5 6.5l4.7 3.7 3 2A4 4 0 0 1 17 18.5L12.4 14z" fill="${DANGER}" stroke="none" transform="rotate(-30 12 12) translate(0 0)" opacity="0"/><rect x="12" y="8.5" width="9" height="8" rx="4" transform="rotate(-30 12 12)" fill="${DANGER}" stroke="none"/><rect x="3" y="8.5" width="18" height="8" rx="4" transform="rotate(-30 12 12)" fill="none" ${S}/>${hi('M6 12.5l3-1.8')}`,
  book: `<path d="M4 5.5A2 2 0 0 1 6 4h5v15H6a2 2 0 0 0-2 2zM20 5.5A2 2 0 0 0 18 4h-5v15h5a2 2 0 0 1 2 2z" fill="${PAPER}" ${S}/><path d="M11 4v15M13 4v15" fill="none" ${S}/>${hi('M6.5 7.5h3')}`,
  rocket: `<path d="M12 3c3.5 2 5 6 5 10l-5 3-5-3c0-4 1.5-8 5-10z" fill="${CREAM}" ${S}/><path d="M7 13l-3 4 4-1M17 13l3 4-4-1" fill="${DANGER}" ${S}/><circle cx="12" cy="10" r="2" fill="${TEAL}" ${S}/><path d="M10 17l2 4 2-4" fill="${GOLD}" ${S}/>${hi('M10.5 7c.5-1 1-1.5 1.5-2')}`,
  scroll: `<path d="M6 5h12v13a2 2 0 0 1-2 2H6z" fill="${PAPER}" ${S}/><path d="M4 5a2 2 0 0 1 4 0v1H4zM14 18a2 2 0 0 0 4 0" fill="${WOOD}" ${S}/><path d="M9 9h6M9 12h6M9 15h4" fill="none" ${S} stroke-width="1.6"/>`,
  map: `<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="${PAPER}" ${S}/><path d="M9 4v14M15 6v14" fill="none" ${S} stroke-width="1.6"/><path d="M5 10c2 1 3 3 3 5M12 9c2 0 3 2 5 2" fill="none" stroke="${TEAL}" stroke-width="2" stroke-linecap="round"/><circle cx="17" cy="14" r="1.6" fill="${DANGER}" stroke="${INK}" stroke-width="1.5"/>`,
  dna: `<path d="M7 3c0 6 10 6 10 12s-10 6-10 6M17 3c0 6-10 6-10 12s10 6 10 6" fill="none" ${S}/><path d="M8.5 6h7M8.5 18h7M9.5 12h5" fill="none" stroke="${TEAL}" stroke-width="2.4" stroke-linecap="round"/>`,
  cart: `<path d="M3 4h3l2 11h10l2-7H7" fill="${CREAM}" ${S}/><circle cx="9.5" cy="19" r="1.6" fill="${INK}"/><circle cx="16.5" cy="19" r="1.6" fill="${INK}"/><path d="M9 11h9" fill="none" ${S} stroke-width="1.6"/>`,
  vase: `<path d="M9 3h6l-1 3c3 1 4 4 4 7 0 4-2 8-6 8s-6-4-6-8c0-3 1-6 4-7z" fill="${WOOD}" ${S}/><path d="M8 12h8" fill="none" stroke="${GOLD}" stroke-width="2"/>${hi('M9 9c.5-1 1.2-1.6 2-2')}`,
  kettle: `<path d="M6 10h12l-1 8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#3a3a42" ${S}/><path d="M5 7h14v3H5zM12 7V4M18 12h3v3h-3" fill="#2b2b30" ${S}/><path d="M8 20h8l1 2H7z" fill="${WOOD}" ${S}/><path d="M8.5 12.5c1 1 2.5 1 3.5 0" fill="none" stroke="${TEAL}" stroke-width="2" stroke-linecap="round"/>`,
  drop: `<path d="M12 3c3 4.5 6 8 6 11.5a6 6 0 0 1-12 0C6 11 9 7.5 12 3z" fill="${TEAL}" ${S}/>${hi('M9 14c0 1.5 1 2.8 2.5 3.2')}`,
  note: `<path d="M6 3h9l4 4v14H6z" fill="${PAPER}" ${S}/><path d="M15 3v4h4" fill="${CREAM}" ${S}/><path d="M9 11h7M9 14h7M9 17h4" fill="none" ${S} stroke-width="1.6"/>`,
  genome: `<path d="M8 3c0 6 8 6 8 12s-8 6-8 6M16 3c0 6-8 6-8 12s8 6 8 6" fill="none" ${S}/><path d="M9.5 6h5M9.5 18h5M10.5 12h3" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>`,
  lock: `<rect x="5" y="10" width="14" height="11" rx="2.5" fill="${GOLD}" ${S}/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" ${S}/><circle cx="12" cy="15.5" r="1.6" fill="${INK}"/>`,
  hand: `<path d="M9 21c-2 0-4-2-5-5l-1.5-4a1.5 1.5 0 0 1 2.8-1l1.2 2.5V5.5a1.5 1.5 0 0 1 3 0V11l.5-8a1.5 1.5 0 0 1 3 0v8l.5-6.5a1.5 1.5 0 0 1 3 0V12l.5-3.5a1.5 1.5 0 0 1 3 0V16c0 3-2 5-5 5z" fill="${GOLD}" ${S}/>${hi('M6.5 14l1 2.5')}`,
  speaker: `<path d="M4 9h4l5-4v14l-5-4H4z" fill="${CREAM}" ${S}/><path d="M16 9c1.5 1.5 1.5 4.5 0 6M19 6c3 3 3 9 0 12" fill="none" ${S}/>`,
  mute: `<path d="M4 9h4l5-4v14l-5-4H4z" fill="${CREAM}" ${S}/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="${DANGER}" stroke-width="2.4" stroke-linecap="round"/>`,
  warp: `<circle cx="12" cy="13" r="8" fill="${CREAM}" ${S}/><path d="M12 8v5l3 2M9 3h6" fill="none" ${S}/><path d="M17 5l2 2" fill="none" ${S}/>`,
  boost: `<path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1.5-4 .5 1.5 1.5 2 2.5 1 0-3-1-4 0-6z" fill="${GOLD}" ${S}/><path d="M11 15a1.5 2 0 0 0 3 0c0-1-.5-2-1.5-3-1 1-1.5 2-1.5 3z" fill="${DANGER}" stroke="none"/><path d="M6 20h12" fill="none" ${S}/>`,
  play: `<path d="M7 4l12 8-12 8z" fill="${CREAM}" ${S}/>`,
  ticket: `<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z" fill="${GOLD}" ${S}/><path d="M9 6v14" fill="none" ${S} stroke-dasharray="2 2"/>`,
  // artifacts
  pebble: `<path d="M5 14c0-4 3-7 7-7s7 2 7 6-3 6-7 6-7-1-7-5z" fill="#9c9a92" ${S}/>${hi('M8 11c1-1.5 2.5-2.2 4-2.3')}`,
  lamp: `<path d="M8 3h8l2 9H6z" fill="${GOLD}" ${S}/><path d="M11 12h2v6h-2zM8 21h8" fill="${CREAM}" ${S}/><path d="M9 18h6" fill="none" ${S}/>`,
  sprinkles: `<path d="M8 4h8v4H8zM7 8h10l1 12H6z" fill="${CREAM}" ${S}/><circle cx="10" cy="12" r="1" fill="${TEAL}"/><circle cx="14" cy="14" r="1" fill="${DANGER}"/><circle cx="11" cy="17" r="1" fill="${GOLD2}"/>`,
  prism: `<path d="M12 3l8 16H4z" fill="#a78bfa" ${S}/><path d="M12 3v16" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/>${hi('M9 12l2-4')}`,
  chime: `<path d="M5 5h14" fill="none" ${S}/><path d="M8 5v9M12 5v12M16 5v8" fill="none" ${S} stroke-width="3"/><circle cx="8" cy="15.5" r="1.5" fill="${GOLD}" ${S}/><circle cx="12" cy="18.5" r="1.5" fill="${GOLD}" ${S}/><circle cx="16" cy="14.5" r="1.5" fill="${GOLD}" ${S}/>`,
  moon: `<path d="M15 3a9 9 0 1 0 6 15 8 8 0 0 1-6-15z" fill="#dfe6ee" ${S}/>${hi('M8 8c-1 2-1 4 0 6')}`,
  key: `<circle cx="8" cy="9" r="4.5" fill="${GOLD}" ${S}/><path d="M11.5 11.5L20 20M17 17l2-2M15 15l2-2" fill="none" ${S}/><circle cx="7.5" cy="8.5" r="1.3" fill="${INK}"/>`,
  bell: `<path d="M12 3a1.5 1.5 0 0 1 1.5 1.5V6a5 5 0 0 1 4 5v4l2 2H4.5l2-2v-4a5 5 0 0 1 4-5V4.5A1.5 1.5 0 0 1 12 3z" fill="${GOLD}" ${S}/><path d="M10 19a2 2 0 0 0 4 0" fill="${GOLD2}" ${S}/>${hi('M9 9c.5-1.5 1.5-2.3 2.5-2.6')}`,
  // shop
  crate: `<rect x="4" y="8" width="16" height="12" rx="1.5" fill="${WOOD}" ${S}/><path d="M4 12h16M12 8v12M6 8l2-4h8l2 4" fill="none" ${S}/>`,
  fire: `<path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1.5-4 .5 1.5 1.5 2 2.5 1 0-3-1-4 0-6z" fill="${GOLD}" ${S}/><path d="M11 15a1.5 2 0 0 0 3 0c0-1-.5-2-1.5-3-1 1-1.5 2-1.5 3z" fill="${DANGER}" stroke="none"/>`,
  ice: `<rect x="5" y="6" width="14" height="12" rx="3" fill="#cdeffc" ${S}/><path d="M12 8v8M8.5 10l7 4M15.5 10l-7 4" fill="none" stroke="#5aa9ff" stroke-width="1.8" stroke-linecap="round"/>`,
  // townsfolk fallbacks and misc
  face: `<circle cx="12" cy="12" r="9" fill="${CREAM}" ${S}/><circle cx="9" cy="10.5" r="1.2" fill="${INK}"/><circle cx="15" cy="10.5" r="1.2" fill="${INK}"/><path d="M9 15c1.5 1.5 4.5 1.5 6 0" fill="none" ${S}/>`,
  tick: `<path d="M5 12l5 5 9-10" fill="none" stroke="${TEAL}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  skull: `<path d="M12 3a8 8 0 0 0-8 8c0 3 1.5 5 4 6v3h8v-3c2.5-1 4-3 4-6a8 8 0 0 0-8-8z" fill="${CREAM}" ${S}/><circle cx="9" cy="11" r="2" fill="${INK}"/><circle cx="15" cy="11" r="2" fill="${INK}"/><path d="M11 17v2M13 17v2" fill="none" ${S}/>`,
};

/** an inline SVG for the icon; unknown names draw a question mark tile so a missing icon is visible, not silent */
export function icon(name: string, size = 24, cls = ''): string {
  const body = ICONS[name] || `<rect x="4" y="4" width="16" height="16" rx="4" fill="${CREAM}" ${S}/><text x="12" y="16.5" text-anchor="middle" font-size="11" font-weight="700" fill="${INK}">?</text>`;
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}
export const hasIcon = (name: string) => name in ICONS;
/** artifact and shop items map to an icon by id */
export const iconFor = (id: string) => hasIcon(id) ? id : id === 'boost' ? 'fire' : id === 'icepack' ? 'ice' : 'pebble';
