import { Badge } from '@/components/primitives/Badge'
import { Wordmark } from '@/components/Wordmark'

export function TopBar() {
  return (
    <header className="bg-sidebar text-sidebar-foreground border-sidebar-border flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <Wordmark height={20} className="text-foreground" />
      {/* Bespoke off-token gradient flourish — intentionally not a DS Badge variant. */}
      <Badge
        variant="outline"
        className="h-[18px] border-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 font-semibold tracking-wide text-white uppercase shadow-[0_0_10px] shadow-fuchsia-500/50"
      >
        beta
      </Badge>
    </header>
  )
}
