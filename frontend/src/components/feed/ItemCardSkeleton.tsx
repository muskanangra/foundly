import { Skeleton } from '../ui/Loader'

export function ItemCardSkeleton() {
  return (
    <div
      className="bg-surface border border-line rounded-[10px] overflow-hidden"
      aria-hidden="true"
    >
      {/* Image */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      {/* Info */}
      <div className="p-3 flex flex-col gap-2">
        {/* ID row */}
        <div className="flex justify-between gap-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-16" />
        </div>
        {/* Name */}
        <Skeleton className="h-4 w-4/5" />
        {/* Chips */}
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}
