"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Coins02Icon,
  MoneyAdd01Icon,
  Notification01Icon,
  UserAdd01Icon,
  UserGroupIcon,
} from "hugeicons-react";
import { toast } from "sonner";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const notifIcons: Record<string, { icon: React.ReactNode; bg: string }> = {
  payout: {
    icon: <MoneyAdd01Icon className="size-4" />,
    bg: "bg-foreground text-primary",
  },
  contribution_due: {
    icon: <Coins02Icon className="size-4" />,
    bg: "bg-primary text-foreground",
  },
  member_join: {
    icon: <UserAdd01Icon className="size-4" />,
    bg: "bg-foreground text-primary",
  },
  circle_completed: {
    icon: <UserGroupIcon className="size-4" />,
    bg: "bg-primary text-foreground",
  },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: res, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list(),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All marked as read");
    },
  });

  const notifications = (res?.data ?? []) as NotificationItem[];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Notifications" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : notifications.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <img
                src="/illustrations/empty-mailbox.svg"
                alt=""
                loading="lazy"
                decoding="async"
                className="size-32 object-contain"
              />
            </EmptyMedia>
            <EmptyDescription>No notifications yet.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup>
          {notifications.map((n) => {
            const meta = notifIcons[n.type] ?? {
              icon: <Notification01Icon className="size-4" />,
              bg: "bg-primary text-foreground",
            };
            return (
              <Item key={n.id} variant="muted" size="sm">
                <ItemMedia
                  variant="icon"
                  className={cn("rounded-full size-8", meta.bg)}
                >
                  {meta.icon}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{n.title}</ItemTitle>
                  <ItemDescription>{n.body}</ItemDescription>
                </ItemContent>
              </Item>
            );
          })}
        </ItemGroup>
      )}
    </div>
  );
}
