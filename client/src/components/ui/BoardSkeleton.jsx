import { Skeleton } from "./Skeleton.jsx";

const SKELETON_COLUMNS = [
  {
    titleWidth: "w-24",
    cardCount: "3",
    cards: [
      { titleWidth: "w-5/6", hasLabel: true, labelWidth: "w-14", assignees: 2, metaWidth: "w-16" },
      { titleWidth: "w-full", hasLabel: false, assignees: 1, metaWidth: "w-20" },
      { titleWidth: "w-3/4", hasLabel: true, labelWidth: "w-16", assignees: 3, metaWidth: "w-14" },
    ],
  },
  {
    titleWidth: "w-28",
    cardCount: "2",
    cards: [
      { titleWidth: "w-4/5", hasLabel: true, labelWidth: "w-12", assignees: 2, metaWidth: "w-16" },
      { titleWidth: "w-full", hasLabel: false, assignees: 1, metaWidth: "w-14" },
    ],
  },
  {
    titleWidth: "w-20",
    cardCount: "3",
    cards: [
      { titleWidth: "w-full", hasLabel: false, assignees: 2, metaWidth: "w-20" },
      { titleWidth: "w-3/4", hasLabel: true, labelWidth: "w-14", assignees: 1, metaWidth: "w-14" },
      { titleWidth: "w-4/5", hasLabel: false, assignees: 2, metaWidth: "w-16" },
    ],
  },
  {
    titleWidth: "w-16",
    cardCount: "1",
    cards: [
      { titleWidth: "w-2/3", hasLabel: true, labelWidth: "w-12", assignees: 1, metaWidth: "w-14" },
    ],
  },
];

export default function BoardSkeleton() {
  return (
    <div className="board-canvas min-h-[calc(100vh-56px-56px)] flex flex-col bg-base animate-in fade-in duration-200">
      {/* Board Header Skeleton mirroring BoardView.jsx */}
      <div className="relative z-20 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-black/25 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-6 sm:h-7 w-48 sm:w-56 bg-white/10" />
          <Skeleton className="h-3.5 w-64 sm:w-80 bg-white/10" />
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Filter Popover Placeholder */}
          <Skeleton className="h-8 w-20 rounded-lg bg-white/10" />

          {/* Member Avatars Placeholder */}
          <div className="flex -space-x-1.5 sm:-space-x-2">
            <Skeleton className="w-7 h-7 rounded-full border-2 border-surface/80 bg-white/10" />
            <Skeleton className="w-7 h-7 rounded-full border-2 border-surface/80 bg-white/10" />
            <Skeleton className="w-7 h-7 rounded-full border-2 border-surface/80 bg-white/10" />
          </div>

          {/* Manage Team Button Placeholder */}
          <Skeleton className="h-8 w-28 rounded-lg bg-white/10" />
        </div>
      </div>

      {/* Lists Row Canvas mirroring BoardView.jsx */}
      <div className="flex-1 overflow-x-auto scrollbar-hide px-4 sm:px-6 py-4 sm:py-5 snap-x snap-mandatory sm:snap-none scroll-smooth">
        <div className="flex gap-4 h-full items-start pb-4">
          {SKELETON_COLUMNS.map((col, idx) => (
            <div
              key={idx}
              className="w-[82vw] max-w-[300px] sm:w-72 shrink-0 snap-center sm:snap-align-none bg-black/30 backdrop-blur-md border border-white/15 rounded-xl flex flex-col max-h-full shadow-card"
            >
              {/* List Header mirroring List.jsx */}
              <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
                <div className="flex items-center gap-1.5">
                  <Skeleton className={`h-4 ${col.titleWidth} bg-white/15`} />
                  <Skeleton className="h-4 w-5 rounded-full bg-white/10" />
                </div>
                <Skeleton className="w-6 h-6 rounded-lg bg-white/10" />
              </div>

              {/* Cards Container mirroring List.jsx */}
              <div className="flex-1 overflow-y-auto scrollbar-hide px-2.5 space-y-2 pb-2">
                {col.cards.map((card, cIdx) => (
                  <div
                    key={cIdx}
                    className="bg-surface rounded-lg border border-line px-3 py-2.5 shadow-card space-y-2"
                  >
                    {/* Optional Label Badge */}
                    {card.hasLabel && (
                      <div className="flex gap-1 mb-1">
                        <Skeleton className={`h-3.5 ${card.labelWidth} rounded bg-accent/20`} />
                      </div>
                    )}

                    {/* Card Title */}
                    <Skeleton className={`h-4 ${card.titleWidth}`} />

                    {/* Card Meta Row (Priority dot, due date/checklist, assignees) */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <Skeleton className={`h-3 ${card.metaWidth}`} />
                      </div>
                      <div className="flex -space-x-1.5 shrink-0 ml-auto">
                        {Array.from({ length: card.assignees }).map((_, aIdx) => (
                          <Skeleton
                            key={aIdx}
                            className="w-5 h-5 rounded-full border-2 border-surface shrink-0"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Card Button Placeholder mirroring List.jsx */}
              <div className="px-2.5 pb-2.5 pt-1">
                <Skeleton className="h-8 w-full rounded-lg bg-white/10" />
              </div>
            </div>
          ))}

          {/* Add Another List Column Placeholder mirroring BoardView.jsx */}
          <div className="w-[82vw] max-w-[300px] sm:w-72 shrink-0 snap-center sm:snap-align-none">
            <Skeleton className="h-11 w-full rounded-xl bg-white/5 border border-dashed border-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
