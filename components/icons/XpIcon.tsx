import { cn } from '@/lib/utils';

interface XpIconProps {
  className?: string;
}

export function XpIcon({ className }: XpIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-4 h-4 inline-block align-middle ml-1", className)}
    >
      <circle cx="12" cy="12" r="11" fill="white" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="13"
        fontWeight="bold"
        fill="black"
      >
        XP
      </text>
    </svg>
  );
}
