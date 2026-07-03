"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loading01Icon } from "hugeicons-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { PageBreadcrumbs } from "@/components/shared/page-breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { joinCircleSchema } from "@/lib/validations";

export default function JoinCirclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(props.params);
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["circle", id],
    queryFn: () => api.circles.get(id),
  });

  const circle = res?.data as { name?: string } | undefined;

  const mutation = useMutation({
    mutationFn: () => api.circles.join(id, inviteCode),
    onSuccess: () => {
      toast.success("You've joined the circle!");
      router.push(`/circles/${id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to join circle");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = joinCircleSchema.safeParse({ inviteCode });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid code");
      return;
    }
    setError("");
    mutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-1/2 rounded" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Circles", href: "/circles" },
          {
            label: circle?.name ?? "Circle",
            href: circle?.name ? `/circles/${id}` : undefined,
          },
          { label: "Join" },
        ]}
      />

      <div>
        <h1 className="text-xl font-bold">Join Circle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {circle?.name
            ? `Enter the invite code for "${circle.name}"`
            : "Enter the invite code to join this circle."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="inviteCode" className="text-sm font-medium">
            Invite Code
          </label>
          <Input
            id="inviteCode"
            placeholder="e.g. ESUSU-XYZ"
            value={inviteCode}
            onChange={(e) => {
              setInviteCode(e.target.value);
              setError("");
            }}
            aria-invalid={!!error}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending || !inviteCode}
        >
          {mutation.isPending && (
            <Loading01Icon className="size-4 animate-spin" />
          )}
          {mutation.isPending ? "Joining..." : "Join Circle"}
        </Button>
      </form>
    </div>
  );
}
