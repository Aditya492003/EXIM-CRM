import { initials, avatarColor } from "@/data/dummy";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  size = "md",
  className,
}) {
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white shadow-sm dark:ring-slate-900",
        avatarColor(name),
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
