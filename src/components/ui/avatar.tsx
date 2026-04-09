import { cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
  xl: "h-14 w-14 text-lg",
} as const;

// Paleta de cores baseada no nome — determinística
const PALETTE = [
  "bg-indigo-500 text-white",
  "bg-violet-500 text-white",
  "bg-emerald-500 text-white",
  "bg-cyan-500 text-white",
  "bg-pink-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-teal-500 text-white",
];

function getColor(name: string): string {
  const code = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return PALETTE[code % PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "avatar-initials rounded-full",
        SIZE_CLASSES[size],
        getColor(name),
        className
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
