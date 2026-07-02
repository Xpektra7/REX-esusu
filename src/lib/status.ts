import {
  CheckmarkCircle01Icon,
  Clock01Icon,
  Cancel01Icon,
} from "hugeicons-react";
import type { ComponentType } from "react";

// -----------------------------------------------------------------------
// Contribution status (paid / pending / defaulted)
// -----------------------------------------------------------------------

export const CONTRIBUTION_STATUS = {
  paid: {
    icon: CheckmarkCircle01Icon,
    className: "bg-primary/15 text-primary",
    label: "Paid",
  },
  pending: {
    icon: Clock01Icon,
    className: "bg-muted text-muted-foreground",
    label: "Pending",
  },
  defaulted: {
    icon: Cancel01Icon,
    className: "bg-foreground/10 text-foreground",
    label: "Defaulted",
  },
} as const satisfies Record<
  string,
  {
    icon: ComponentType<{ className?: string }>;
    className: string;
    label: string;
  }
>;

// -----------------------------------------------------------------------
// Member status (active / invited / defaulted / completed / removed / left)
// -----------------------------------------------------------------------

export const MEMBER_STATUS = {
  active: {
    className: "bg-primary text-foreground",
    label: "Active",
    icon: CheckmarkCircle01Icon,
  },
  invited: {
    className: "bg-muted text-muted-foreground",
    label: "Invited",
    icon: Clock01Icon,
  },
  defaulted: {
    className: "bg-foreground text-background",
    label: "Defaulted",
    icon: Cancel01Icon,
  },
  completed: {
    className: "bg-foreground text-primary",
    label: "Completed",
    icon: CheckmarkCircle01Icon,
  },
  removed: {
    className: "bg-foreground/10 text-foreground",
    label: "Removed",
    icon: Cancel01Icon,
  },
  left: {
    className: "bg-muted text-muted-foreground",
    label: "Left",
    icon: Cancel01Icon,
  },
} as const satisfies Record<
  string,
  {
    className: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }
>;

// -----------------------------------------------------------------------
// Cycle status (paid_out / active / pending / closed)
// -----------------------------------------------------------------------

export const CYCLE_STATUS: Record<string, string> = {
  paid_out: "bg-primary/15 text-primary",
  active: "bg-muted text-muted-foreground",
  pending: "bg-muted text-muted-foreground",
  closed: "bg-primary/15 text-primary",
};

// -----------------------------------------------------------------------
// Debt status (active / cleared)
// -----------------------------------------------------------------------

export const DEBT_STATUS: Record<string, string> = {
  active: "bg-foreground/10 text-foreground",
  cleared: "bg-primary/15 text-primary",
};
