"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.users.me(),
  });

  const user = data?.data as any;

  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account settings.
      </p>

      <section className="mt-8 max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <p className="text-sm text-muted-foreground">{user?.name}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          {isLoading ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <p className="text-sm text-muted-foreground">{user?.phone}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">BVN</label>
          {isLoading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <p className="text-sm text-muted-foreground">
              {user?.bvn_last4 ? `****${user.bvn_last4}` : "Not provided"}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
