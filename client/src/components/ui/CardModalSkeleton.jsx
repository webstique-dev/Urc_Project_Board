import { Skeleton } from "./Skeleton.jsx";
import { X } from "lucide-react";

export default function CardModalSkeleton({ onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Loading card details"
      className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-xl sm:rounded-2xl w-full max-w-5xl h-[92vh] sm:h-[86vh] flex flex-col shadow-pop overflow-hidden relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar Skeleton */}
        <div className="bg-surface/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-line flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32 rounded-md" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2-Column Responsive Body Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          {/* LEFT COLUMN: Main Card Details */}
          <div className="lg:col-span-7 flex flex-col overflow-y-auto scrollbar-hide p-5 sm:p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-line">
            {/* Title Bar */}
            <div className="flex items-start gap-3">
              <Skeleton className="w-6 h-6 rounded-full shrink-0 mt-1" />
              <Skeleton className="h-7 w-4/5 rounded-lg" />
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>

            {/* Metadata Badges: Members, Labels, Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-16" />
                <div className="flex gap-1.5">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <Skeleton className="w-7 h-7 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-14" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-14 rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-14" />
                <Skeleton className="h-7 w-full rounded-lg" />
              </div>
            </div>

            {/* Description Area */}
            <div className="pt-4 border-t border-line/60 space-y-2.5">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>

            {/* Checklist Section */}
            <div className="pt-4 border-t border-line/60 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-full rounded-lg" />
                <Skeleton className="h-7 w-5/6 rounded-lg" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Comments & Activity Feed */}
          <div className="lg:col-span-5 flex flex-col overflow-y-auto scrollbar-hide p-5 sm:p-6 space-y-5 bg-surface-2/30">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>

            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2.5">
                    <Skeleton className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-1/3" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
