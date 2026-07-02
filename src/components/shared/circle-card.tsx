import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { UserGroupIcon, Calendar01Icon, SavingsIcon } from "hugeicons-react";
import Link from "next/link";

export interface CircleData {
  id: string;
  name: string;
  status: "active" | "inactive";
  contribution_amount: number;
  frequency: string;
  current_cycle: number;
  cycle_count: number;
  member_position?: number;
  total_members?: number;
}

function formatNaira(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  });
}

const iconMap = [
  { icon: UserGroupIcon, bg: "bg-blue-100 text-blue-800" },
  { icon: Calendar01Icon, bg: "bg-amber-100 text-amber-800" },
  { icon: SavingsIcon, bg: "bg-green-100 text-green-800" },
] as const;

export function CircleCard({ circle }: { circle: CircleData }) {
  const idx = circle.name.length % iconMap.length;
  const Icon = iconMap[idx].icon;
  const progress =
    circle.cycle_count > 0
      ? (circle.current_cycle / circle.cycle_count) * 100
      : 0;

  return (
    <Link
      href={`/circles/${circle.id}`}
      className="block transition-colors hover:opacity-80"
    >
      <Card className="py-4">
        <CardHeader className="px-4">
          <div className="flex items-start justify-between p-0!">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full",
                  iconMap[idx].bg,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div>
                <CardTitle>{circle.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Rotating Savings Group
                </p>
              </div>
            </div>
            <Badge variant={circle.status === "active" ? "default" : "outline"}>
              {circle.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>

        <Separator />

        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs tracking-wider text-muted-foreground">
                Contribution
              </p>
              <p className="text-base font-bold">
                {formatNaira(circle.contribution_amount)}
              </p>
            </div>
            {circle.member_position != null && circle.total_members != null && (
              <div className="text-right">
                <p className="text-xs tracking-wider text-muted-foreground">
                  Position
                </p>
                <p className="text-base font-bold">
                  {circle.member_position} / {circle.total_members}
                </p>
              </div>
            )}
          </div>

          <Progress value={progress} className="mt-4">
            <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
              <span>
                Cycle {circle.current_cycle} of {circle.cycle_count}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
          </Progress>
        </CardContent>
      </Card>
    </Link>
  );
}
