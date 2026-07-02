import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface DiceBearAvatarProps {
  name: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function DiceBearAvatar({
  name,
  size = "default",
  className,
}: DiceBearAvatarProps) {
  const seed = encodeURIComponent(name);

  return (
    <Avatar size={size} className={className}>
      <AvatarImage
        src={`https://api.dicebear.com/10.x/identicon/svg?rowColor=f5c211&backgroundColor=000000&seed=${seed}`}
        alt={name}
      />
    </Avatar>
  );
}
