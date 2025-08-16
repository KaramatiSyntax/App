// src/components/MatchCard/MatchCardSkeleton.jsx

import { Skeleton } from "@/components/ui/skeleton";

export default function MatchCardSkeleton() {
  return (
    <div className="relative bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
      {/* 16:9 Banner Skeleton */}
      <div className="relative aspect-video w-full">
        <Skeleton className="h-full w-full" />
        
        {/* Skeleton Content Overlay */}
        <div className="absolute inset-0 p-2 flex flex-col justify-between">
          {/* Top Section */}
          <div>
            <Skeleton className="h-6 w-3/5" />
          </div>

          {/* Bottom Section */}
          <div className="space-y-2">
            {/* Player count and status line */}
            <div className="flex items-center justify-between text-sm">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>

            {/* Progress Bar Skeleton */}
            <Skeleton className="h-1.5 w-full" />

            {/* Entry and Prize line */}
            <div className="flex items-center justify-between gap-1">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}