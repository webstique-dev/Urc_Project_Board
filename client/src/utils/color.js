// Turns a board's single accent hex color into an elegant light white-and-cream
// ambient gradient background, with high contrast for cards and lists.
export const boardGradient = (hex = "#B45309") => {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 180;
  const g = parseInt(clean.substring(2, 4), 16) || 83;
  const b = parseInt(clean.substring(4, 6), 16) || 9;
  return `radial-gradient(circle at 12% 8%, rgba(${r}, ${g}, ${b}, 0.12) 0%, transparent 48%), linear-gradient(160deg, rgba(${r}, ${g}, ${b}, 0.06) 0%, #FAF8F5 55%, #F4F0E8 100%)`;
};

export const PALETTE = [
  "#B45309", "#D97706", "#059669", "#0284C7", "#E11D48", "#0D9488", "#44403C",
];
