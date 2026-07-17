"use client";

import { FileDownloadIcon, Notification03Icon } from "hugeicons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function CycleActions({ circleId }: { circleId: string }) {
  const [reminding, setReminding] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleRemind = async () => {
    setReminding(true);
    try {
      const res = await api.circles.remind(circleId);
      alert(`Reminders sent to ${res.data.notified} pending member(s)`);
    } catch {
      alert("Failed to send reminders. Try again.");
    } finally {
      setReminding(false);
    }
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await api.circles.report(circleId);
      alert("Report downloaded successfully.");
    } catch {
      alert("Failed to download report. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button className="w-full" onClick={handleRemind} disabled={reminding}>
        <Notification03Icon className="size-4" />
        {reminding ? "Sending..." : "Remind Pending Members"}
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleDownloadReport}
        disabled={downloading}
      >
        <FileDownloadIcon className="size-4" />
        {downloading ? "Downloading..." : "Download Cycle Report"}
      </Button>
    </div>
  );
}
