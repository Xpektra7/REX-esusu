"use client";

import { Button } from "@/components/ui/button";
import { Notification03Icon, FileDownloadIcon } from "hugeicons-react";

export function CycleActions() {
  return (
    <div className="flex flex-col gap-3">
      <Button className="w-full">
        <Notification03Icon className="size-4" />
        Remind Pending Members
      </Button>
      <Button variant="outline" className="w-full">
        <FileDownloadIcon className="size-4" />
        Download Cycle Report
      </Button>
    </div>
  );
}
