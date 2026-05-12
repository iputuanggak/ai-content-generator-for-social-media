interface ContentSkeletonProps {
  lines?: number;
}

export function ContentSkeleton({ lines = 3 }: ContentSkeletonProps) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          data-slot="skeleton"
          className="h-4 rounded bg-zinc-200"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
}
