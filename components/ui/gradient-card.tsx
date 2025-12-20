import { cn } from "@/lib/utils";

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "gold" | "purple" | "default";
}

export function GradientCard({
  className,
  variant = "default",
  children,
  ...props
}: GradientCardProps) {
  const gradients = {
    gold: "bg-[linear-gradient(135deg,#FCD34D_0%,#F59E0B_100%)] text-black border-none",
    purple:
      "bg-[linear-gradient(135deg,#C084FC_0%,#7C3AED_100%)] text-white border-none",
    default: "bg-card text-card-foreground border border-border shadow-sm",
  };

  return (
    <div
      className={cn(
        "rounded-3xl p-6 shadow-lg transition-all hover:scale-[1.02]",
        gradients[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
