import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function LoadingSpinner({ className, ...props }: LoadingSpinnerProps) {
  return (
    <div className={cn("animate-spin", className)} {...props}>
      <Loader2 className="h-full w-full" />
    </div>
  );
}
