import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export function TaskCardSkeleton() {
  return (
    <Card className="h-[140px] border-l-4 border-l-muted">
      <CardContent className="p-3 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-12 rounded" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>
  );
}




