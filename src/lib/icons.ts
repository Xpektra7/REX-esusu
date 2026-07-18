import type { ComponentType } from "react";
import {
  Alert02Icon,
  Coins02Icon,
  MoneyAdd01Icon,
  Notification01Icon,
  Shield02Icon,
  Tick02Icon,
  UserAdd01Icon,
  UserCircleIcon,
  UserGroupIcon,
  Wallet01Icon,
} from "hugeicons-react";

export type IconDef = {
  icon: ComponentType<{ className?: string }>;
  bg: string;
};

const payout = {
  icon: MoneyAdd01Icon,
  bg: "bg-foreground text-primary",
} as const satisfies IconDef;

const contribution = {
  icon: Coins02Icon,
  bg: "bg-primary text-foreground",
} as const satisfies IconDef;

const member = {
  icon: UserAdd01Icon,
  bg: "bg-foreground text-primary",
} as const satisfies IconDef;

const circle = {
  icon: UserGroupIcon,
  bg: "bg-primary text-foreground",
} as const satisfies IconDef;

const alert = {
  icon: Alert02Icon,
  bg: "bg-destructive/10 text-destructive",
} as const satisfies IconDef;

const defaultIcon = {
  icon: Notification01Icon,
  bg: "bg-primary text-foreground",
} as const satisfies IconDef;

export const NOTIFICATION_ICONS: Record<string, IconDef> = {
  payout,
  contribution_due: contribution,
  reminder: { icon: Notification01Icon, bg: "bg-primary text-foreground" },
  member_join: member,
  circle_completed: circle,
  circle_invite: { icon: UserCircleIcon, bg: "bg-foreground text-primary" },
  default_alert: alert,
  trust_score_changed: {
    icon: Shield02Icon,
    bg: "bg-primary text-foreground",
  },
  withdrawal_status: { icon: Wallet01Icon, bg: "bg-foreground text-primary" },
  debt_cleared: { icon: Tick02Icon, bg: "bg-primary text-foreground" },
};

export const NOTIFICATION_ICON_FALLBACK: IconDef = defaultIcon;

export const ACTIVITY_ICONS: Record<string, IconDef> = {
  contribution,
  payout,
  circle_join: member,
  circle_create: { icon: UserGroupIcon, bg: "bg-foreground text-primary" },
  topup: contribution,
  withdrawal: { icon: Wallet01Icon, bg: "bg-foreground text-primary" },
};
