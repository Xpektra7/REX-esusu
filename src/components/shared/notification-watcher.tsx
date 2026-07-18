"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { NOTIFICATION_ICONS, NOTIFICATION_ICON_FALLBACK } from "@/lib/icons";
import { api } from "@/lib/api";
import type { Notification } from "@/types";

function extractItems(data: unknown): Notification[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Notification[];
  const maybe = data as { items?: Notification[] };
  if (maybe.items && Array.isArray(maybe.items)) return maybe.items;
  return [];
}

export function NotificationWatcher() {
  const seenIds = useRef<Set<string> | null>(null);

  const { data: res } = useQuery({
    queryKey: ["notifications-watcher"],
    queryFn: () => api.notifications.list(),
    refetchInterval: 5_000,
  });

  useEffect(() => {
    const items = extractItems(res?.data);
    // First poll — seed seen IDs without toasting
    if (!seenIds.current) {
      seenIds.current = new Set(items.map((n) => n.id));
      return;
    }
    // Subsequent polls — toast any unseen unread notification
    for (const n of items) {
      if (seenIds.current.has(n.id)) continue;
      seenIds.current.add(n.id);
      if (n.read) continue;
      const def = NOTIFICATION_ICONS[n.type] ?? NOTIFICATION_ICON_FALLBACK;
      const Icon = def.icon;
      toast(n.title, {
        description: n.body,
        icon: <Icon className="size-4" />,
      });
    }
  }, [res]);

  return null;
}
