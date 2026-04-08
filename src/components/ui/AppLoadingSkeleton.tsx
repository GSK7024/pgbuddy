import { Skeleton } from "@/components/ui/skeleton";

export const AppLoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar Skeleton - hidden on mobile */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border/50 bg-card/80 p-5 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <Skeleton className="h-6 w-24" />
        </div>
        
        {/* Navigation links skeletons */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header Skeleton - visible only on mobile */}
        <div className="lg:hidden fixed top-0 left-0 right-0 h-14 border-b border-border/50 bg-background/80 flex items-center justify-between px-4 z-40">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-20 h-5" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:ml-64 lg:p-8 pt-20 lg:pt-8 w-full">
          {/* Header section skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`kpi-${i}`} className="p-6 rounded-xl border border-border/50 bg-card/50">
                <Skeleton className="h-5 w-24 mb-4" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>

          {/* Large Content Block */}
          <div className="border border-border/50 bg-card/50 rounded-xl p-6 h-96">
            <div className="flex justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`row-${i}`} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
