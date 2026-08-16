interface SkeletonProps {
  className?: string
}

/**
 * Bloque placeholder animado (shimmer) para zonas que esperan datos del backend.
 * Las dimensiones se controlan vía className (p. ej. "h-4 w-3/4").
 */
export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-[3px] bg-sky/50 ${className}`}
    />
  )
}