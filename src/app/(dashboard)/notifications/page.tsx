"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import {
  NOTIFICATION_ICONS,
  NOTIFICATION_ICON_FALLBACK,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: res, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list(),
    refetchInterval: 5_000,
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All marked as read");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-mini"] });
    },
  });

  const handleOpen = (n: Notification) => {
    if (!n.read) markReadMutation.mutate(n.id);
    const route = (n.data as { route?: string } | null)?.route;
    if (route) router.push(route);
  };

  const notifications = ((res?.data as { items: Notification[] } | undefined)?.items ?? []) as Notification[];
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
        <ItemGroup className="gap-0! py-2 bg-card">
          {notifications.map((n, i) => {
            const def = NOTIFICATION_ICONS[n.type] ?? NOTIFICATION_ICON_FALLBACK;
            const Icon = def.icon;
            return (
              <div key={n.id}>
                <ItemSeparator className={i === 0 ? "hidden" : ""} />
                <Item
                  variant="muted"
                  size="sm"
                  render={
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      className={cn("w-full text-left transition-colors", "")}
                    />
                  }
                >
                  <ItemMedia
                    variant="icon"
                    className={cn("symbol-container p-0!", def.bg)}
                  >
                    <Icon className="symbol-width" />
                  </ItemMedia>
                  <ItemContent
                    className={cn(n.read && "text-muted-foreground")}
                  >
                    <ItemTitle
                      className={cn(
                        "line-clamp-1",
                        n.read && "text-muted-foreground",
                      )}
                    >
                      {n.title}
                    </ItemTitle>
                    <ItemDescription
                      className={cn(
                        "line-clamp-1",
                        n.read && "text-muted-foreground",
                      )}
                    >
                      {n.body}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </div>
            );
          })}
        </ItemGroup>
      )}
    </div>
  );
}
