"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

const ONE_SECOND = 1000;

interface GraceCountdownProps {
  deadlineAt: string;
  gracePeriodHours: number;
}

function calcRemaining(deadlineAt: string, gracePeriodHours: number): number {
  const deadline = new Date(deadlineAt).getTime();
  const graceMs = gracePeriodHours * 3600000;
  return Math.max(0, deadline + graceMs - Date.now());
}

export function GraceCountdown({
  deadlineAt,
  gracePeriodHours,
}: GraceCountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    calcRemaining(deadlineAt, gracePeriodHours),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(calcRemaining(deadlineAt, gracePeriodHours));
    }, ONE_SECOND);
    return () => clearInterval(id);
  }, [deadlineAt, gracePeriodHours]);

  const totalHours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const isOverdue = remaining === 0;

  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        {isOverdue ? "Grace Period Ended" : "Grace Period"}
      </span>
      <span
        className={`font-heading text-lg font-bold ${isOverdue ? "text-destructive" : "text-primary"}`}
      >
        {isOverdue
          ? "Overdue"
          : `${String(totalHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
      </span>
      {!isOverdue && (
        <p className="text-[10px] text-muted-foreground">
          {gracePeriodHours}h grace period ends
        </p>
      )}
    </Card>
  );
}
