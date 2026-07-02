"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.notifications.list(),
  });

  const notifications = (data?.data as any[]) ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Stay updated on your circles.
      </p>
      <div className="mt-8 space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </>
        ) : notifications.length > 0 ? (
          notifications.map((n: any) => (
            <div key={n.id} className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
