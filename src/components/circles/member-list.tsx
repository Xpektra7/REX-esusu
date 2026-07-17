import { memo } from "react";
import { UserGroupIcon } from "hugeicons-react";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { MEMBER_STATUS } from "@/lib/status";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { MemberItem } from "@/types";

export type { MemberItem };

function MemberStatusBadge({ status }: { status: string }) {
  const s = MEMBER_STATUS[status as keyof typeof MEMBER_STATUS] ?? {
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

export const MemberList = memo(function MemberList({ members }: { members: MemberItem[] }) {
  if (members.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserGroupIcon className="size-6" />
          </EmptyMedia>
          <EmptyDescription>No members yet.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => {
        const name = member.user?.name ?? "??";
        return (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl bg-card px-4 py-3"
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
                  {member.rotationOrder != null && (
                    <span className="text-[10px] text-muted-foreground">
                      Position #{member.rotationOrder}
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
});
