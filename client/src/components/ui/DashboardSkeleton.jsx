import { Skeleton } from "./Skeleton.jsx";

const SKELETON_PROJECTS = [
  { titleWidth: "w-44", desc1: "w-full", desc2: "w-3/4", members: 3 },
  { titleWidth: "w-36", desc1: "w-5/6", desc2: "w-1/2", members: 4 },
  { titleWidth: "w-48", desc1: "w-full", desc2: "w-2/3", members: 2 },
  { titleWidth: "w-40", desc1: "w-4/5", desc2: "w-3/5", members: 3 },
  { titleWidth: "w-52", desc1: "w-full", desc2: "w-4/5", members: 5 },
  { titleWidth: "w-32", desc1: "w-3/4", desc2: "w-1/3", members: 2 },
];

export default function DashboardSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-200">
      {/* Header Skeleton mirroring Dashboard.jsx */}
      <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="space-y-1.5">
          <Skeleton className="h-7 sm:h-8 w-32 sm:w-36" />
          <Skeleton className="h-4 w-44 sm:w-56" />
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap self-start sm:self-auto">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Grid of Board Cards mirroring Dashboard.jsx */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {SKELETON_PROJECTS.map((proj, i) => (
          <div
            key={i}
            className="rounded-xl sm:rounded-2xl border border-line bg-surface overflow-hidden shadow-card flex flex-col"
          >
            {/* Top Gradient Banner Placeholder (Flat muted color) */}
            <Skeleton className="h-20 sm:h-24 w-full rounded-none bg-white/[0.05]" />

            {/* Card Content mirroring Dashboard.jsx */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                <Skeleton className={`h-5 ${proj.titleWidth}`} />
                <div className="space-y-1.5 mt-2">
                  <Skeleton className={`h-3.5 ${proj.desc1}`} />
                  <Skeleton className={`h-3.5 ${proj.desc2}`} />
                </div>
              </div>

              {/* Bottom Row mirroring member avatars and open board action */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-line/50">
                <div className="flex items-center -space-x-1.5">
                  {Array.from({ length: proj.members }).map((_, mIdx) => (
                    <Skeleton
                      key={mIdx}
                      className="w-6 h-6 rounded-full border-2 border-surface shrink-0"
                    />
                  ))}
                </div>
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
