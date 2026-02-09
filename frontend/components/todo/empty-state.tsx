import { ClipboardList } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">No tasks yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Get started by adding your first task using the form above.
      </p>
    </div>
  )
}
