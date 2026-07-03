import { cn } from "@/lib/utils";

interface IllustrationProps {
  name: "empty" | "not-found" | "success";
  className?: string;
}

export function Illustration({ name, className }: IllustrationProps) {
  return (
    <img
      src={`/illustrations/${name}.svg`}
      alt=""
      className={cn("size-48 object-contain", className)}
    />
  );
}
