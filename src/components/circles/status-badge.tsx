import { cn } from "@/lib/utils";
import { CONTRIBUTION_STATUS } from "@/lib/status";

export function ContributionStatusBadge({
  status,
}: {
  status: keyof typeof CONTRIBUTION_STATUS;
}) {
  const c = CONTRIBUTION_STATUS[status];
  const Icon = c.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider",
        c.className,
      )}
    >
      <Icon className="size-4" />
      {c.label}
    </span>
  );
}
