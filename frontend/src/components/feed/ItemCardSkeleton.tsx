export function ItemCardSkeleton() {
  return (
    <div
      className="rounded-2xl bg-champagne overflow-hidden border border-taupe/30 animate-pulse"
      aria-hidden="true"
    >
      <div className="aspect-[4/3] bg-taupe/20" />
      <div className="p-3.5 flex flex-col gap-2">
        <div className="h-5 w-3/4 rounded-lg bg-taupe/20" />
        <div className="h-4 w-1/2 rounded-lg bg-taupe/20" />
        <div className="h-4 w-2/5 rounded-lg bg-taupe/20" />
        <div className="h-3 w-16 rounded-lg bg-taupe/20" />
      </div>
    </div>
  )
}
