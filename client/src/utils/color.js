// Turns a board's single accent hex color into a moody two-tone gradient,
// similar in spirit to a Trello board background, without needing any
// external color library.
export const boardGradient = (hex = "#7C5CFF") => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 124;
  const g = parseInt(clean.substring(2, 4), 16) || 92;
  const b = parseInt(clean.substring(4, 6), 16) || 255;
  const dark = `rgb(${Math.round(r * 0.25)}, ${Math.round(g * 0.2)}, ${Math.round(b * 0.35)})`;
  return `radial-gradient(circle at 15% 0%, ${hex} 0%, transparent 45%), linear-gradient(160deg, ${dark} 0%, #0C0A14 65%)`;
};

export const PALETTE = [
  "#7C5CFF", "#E85D9C", "#E8975D", "#5DD8E8", "#5DE89E", "#E85D5D", "#B25DE8",
];
