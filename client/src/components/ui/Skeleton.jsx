/**
 * Base Skeleton component with warm shimmer wave animation
 */
export function Skeleton({ className = "", rounded = "rounded-lg", ...props }) {
  return (
    <div
      className={`animate-shimmer ${rounded} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
