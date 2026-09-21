/**
 * Base Skeleton component with animated light-theme pulse
 */
export function Skeleton({ className = "", rounded = "rounded-lg", ...props }) {
  return (
    <div
      className={`animate-pulse bg-surface-3/80 ${rounded} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
