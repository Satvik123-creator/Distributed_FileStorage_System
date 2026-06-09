import React from "react";

const SkeletonBlock = ({ className = "" }) => (
  <div className={`rounded-lg bg-gray-800 animate-pulse ${className}`} />
);

const DashboardSkeleton = React.memo(() => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-6 w-40" />
        </div>
        <SkeletonBlock className="h-8 w-20 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-16" />
                <SkeletonBlock className="h-7 w-24" />
              </div>
              <SkeletonBlock className="h-9 w-9 rounded-lg" />
            </div>
            <SkeletonBlock className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <SkeletonBlock className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
            </div>
            <SkeletonBlock className="h-2 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <SkeletonBlock className="h-2 w-2 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <SkeletonBlock className="h-3 w-32" />
                    <SkeletonBlock className="h-2 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default DashboardSkeleton;
