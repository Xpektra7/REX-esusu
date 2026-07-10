import { Coins02Icon } from "hugeicons-react";
import { DiceBearAvatar } from "@/components/shared/dicebear-avatar";
import { cn } from "@/lib/utils";

export const members = ["Ada", "Tunde", "Zainab", "Chidi", "Femi", "Ngozi"];
const radius = 42;

function pointOnRing(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle),
  };
}

export function CircleDiagram({ activeIndex }: { activeIndex: number }) {
  const coin = pointOnRing(activeIndex, members.length);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="8 5"
        />
        <circle
          cx={coin.x}
          cy={coin.y}
          r="2.6"
          fill="var(--primary)"
          stroke="var(--background)"
          strokeWidth="1"
          className="transition-[cx,cy] duration-700 ease-in-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="eyebrow font-heading text-foreground/70">
          Total Pot
        </span>
        <span className="mt-1 text-3xl font-heading font-bold text-primary">
          ₦450,000
        </span>
        <span className="mt-1 text-xs text-foreground/70">
          Cycle {activeIndex + 1} of {members.length}
        </span>
      </div>

      {members.map((name, i) => {
        const isPayout = i === activeIndex;
        const { x, y } = pointOnRing(i, members.length);
        return (
          <div
            key={name}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="relative">
              <DiceBearAvatar
                name={name}
                size="lg"
                className={cn(
                  "transition-shadow duration-700",
                  isPayout &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              />
              {isPayout && (
                <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-primary">
                  <Coins02Icon className="size-3 text-primary-foreground" />
                </span>
              )}
            </div>
            <span
              className={cn(
                "absolute top-full left-1/2 mt-1.5 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap transition-colors duration-700",
                isPayout ? "text-background" : "text-background/70",
              )}
            >
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
