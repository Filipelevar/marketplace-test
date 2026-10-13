export function CartBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      aria-hidden
      className="absolute -top-1.5 -right-2 grid size-4 place-items-center rounded-full border-2 border-background bg-primary text-[10px] font-medium text-primary-foreground"
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}
