const avatarColors = ["#7c3aed", "#2563eb", "#059669", "#db2777", "#ea580c", "#0891b2", "#d97706"]

export function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase()
  const color = avatarColors[name.charCodeAt(0) % avatarColors.length]
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : size === "md" ? "h-9 w-9 text-sm" : "h-11 w-11 text-sm"

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}
