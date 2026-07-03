import { cn } from "@/lib/utils";

interface IllustrationProps {
  name: "circles" | "empty" | "empty-mailbox" | "empty-wallet" | "no-data" | "not-found" | "referral" | "success";
  className?: string;
}

export function Illustration({ name, className }: IllustrationProps) {
  return (
    <img
      src={`/illustrations/${name}.svg`}
      alt=""
      loading="lazy"
      decoding="async"
      className={cn("size-48 object-contain", className)}
    />
  );
}
