"use client";

import { Button } from "@/components/ui/button";
import { Copy01Icon, ArrowRight01Icon } from "hugeicons-react";
import Link from "next/link";

interface CircleActionsProps {
  id: string;
  onInvite: () => void;
  isPending: boolean;
}

export function CircleActions({ id, onInvite, isPending }: CircleActionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <Button className="w-full" onClick={onInvite} disabled={isPending}>
        <Copy01Icon className="size-4" />
        {isPending ? "Generating..." : "Copy Invite Code"}
      </Button>
      <Link href={`/circles/${id}/report`}>
        <Button variant="secondary" className="w-full">
          View Report
          <ArrowRight01Icon className="size-4" />
        </Button>
      </Link>
    </div>
  );
}
