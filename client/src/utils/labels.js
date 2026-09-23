// Dynamic color definitions and helper utilities for project labels

export const LABEL_COLOR_OPTIONS = [
  { name: "Sky Blue", value: "#0284c7" },
  { name: "Amber Orange", value: "#d97706" },
  { name: "Stone Slate", value: "#57534e" },
  { name: "Yellow", value: "#ca8a04" },
  { name: "Cyan Teal", value: "#0891b2" },
  { name: "Purple", value: "#9333ea" },
  { name: "Rose Red", value: "#e11d48" },
  { name: "Emerald Green", value: "#059669" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Pink", value: "#db2777" },
  { name: "Zinc Slate", value: "#3f3f46" },
];

export const PRESET_CONSTRUCTION_LABELS = [
  { name: "Planning", color: "#0284c7" },
  { name: "Site Work", color: "#d97706" },
  { name: "Structural", color: "#57534e" },
  { name: "Electrical", color: "#ca8a04" },
  { name: "Plumbing", color: "#0891b2" },
  { name: "Procurement", color: "#9333ea" },
  { name: "Safety", color: "#e11d48" },
  { name: "Inspection", color: "#059669" },
];

export const LABEL_COLORS = {
  Planning: {
    bg: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    dot: "bg-sky-500",
    color: "#0284c7",
  },
  "Site Work": {
    bg: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    dot: "bg-amber-500",
    color: "#d97706",
  },
  Structural: {
    bg: "bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700",
    dot: "bg-stone-600",
    color: "#57534e",
  },
  Electrical: {
    bg: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
    dot: "bg-yellow-500",
    color: "#ca8a04",
  },
  Plumbing: {
    bg: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
    dot: "bg-cyan-500",
    color: "#0891b2",
  },
  Procurement: {
    bg: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    dot: "bg-purple-500",
    color: "#9333ea",
  },
  Safety: {
    bg: "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    dot: "bg-rose-500",
    color: "#e11d48",
  },
  Inspection: {
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    dot: "bg-emerald-500",
    color: "#059669",
  },
};

/**
 * Returns a style object or CSS class info for a given label name
 */
export function getLabelInfo(labelName, boardLabels = []) {
  if (!labelName) {
    return { name: "", color: "#64748b", className: "bg-surface-2 text-ink border-line" };
  }

  // Check if found in board labels
  const boardMatch = (boardLabels || []).find(
    (l) => (l.name || l).toLowerCase() === labelName.toLowerCase()
  );

  const colorHex = boardMatch?.color || LABEL_COLORS[labelName]?.color || "#0284c7";

  const staticClass = LABEL_COLORS[labelName]?.bg;
  if (staticClass && !boardMatch?.color) {
    return {
      name: labelName,
      color: colorHex,
      className: staticClass,
    };
  }

  return {
    name: labelName,
    color: colorHex,
    style: {
      backgroundColor: `${colorHex}15`,
      borderColor: `${colorHex}40`,
      color: colorHex,
    },
  };
}

export function getLabelBadgeClass(label, boardLabels = []) {
  if (!label) return "bg-surface-2 text-ink border-line";
  const match = LABEL_COLORS[label];
  if (match) return match.bg;
  return "bg-surface-2 text-ink border-line";
}

export function getLabelDotColor(label, boardLabels = []) {
  if (!label) return "#94a3b8";
  const boardMatch = (boardLabels || []).find(
    (l) => (l.name || l).toLowerCase() === label.toLowerCase()
  );
  if (boardMatch?.color) return boardMatch.color;
  if (LABEL_COLORS[label]?.color) return LABEL_COLORS[label].color;
  return "#0284c7";
}
