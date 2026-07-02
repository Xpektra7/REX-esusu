import { cn } from "@/lib/utils";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { MEMBER_STATUS } from "@/lib/status";
import type { MemberItem } from "@/types";

export type { MemberItem };

function MemberStatusBadge({ status }: { status: string }) {
  const s =
    MEMBER_STATUS[status as keyof typeof MEMBER_STATUS] ?? {
      className: "bg-muted text-muted-foreground",
      label: status.charAt(0).toUpperCase() + status.slice(1),
      icon: MEMBER_STATUS.invited.icon,
    };
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider",
        s.className,
      )}
    >
      <Icon className="size-3.5" />
      {s.label}
    </span>
  );
}

export function MemberList({ members }: { members: MemberItem[] }) {
  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No members yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => {
        const name = member.user?.name ?? "??";
        return (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-border px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <DiceBearAvatar name={name} />
              <div>
                <p className="text-sm font-medium">{name}</p>
                <div className="flex items-center gap-2">
                  {member.role === "admin" && (
                    <span className="text-[10px] font-semibold tracking-wider text-primary">
                      Admin
                    </span>
                  )}
                  {member.rotation_order != null && (
                    <span className="text-[10px] text-muted-foreground">
                      Position #{member.rotation_order}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <MemberStatusBadge status={member.status} />
          </div>
        );
      })}
    </div>
  );
}
