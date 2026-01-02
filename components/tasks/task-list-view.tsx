"use client";

import { TaskWithDetails } from "@/app/actions/task-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Box } from "lucide-react";
import { useRouter } from "next/navigation";

interface TaskListViewProps {
  tasks: TaskWithDetails[];
  farewellId: string;
}

export function TaskListView({ tasks, farewellId }: TaskListViewProps) {
  const router = useRouter();

  const handleRowClick = (taskId: string) => {
    router.push(`/dashboard/${farewellId}/tasks/${taskId}`);
  };

  const statusColors: Record<string, string> = {
    planned:
      "bg-purple-500/10 text-purple-600 border-purple-200 hover:bg-purple-500/20",
    in_progress:
      "bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20",
    completed:
      "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20",
    waiting:
      "bg-yellow-500/10 text-yellow-600 border-yellow-200 hover:bg-yellow-500/20",
  };

  return (
    <div className="bg-card rounded-[2rem] border shadow-sm p-6 overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <div className="w-5 h-5 border-2 border-current rounded-md" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-card-foreground">My Tasks</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              This Week
            </p>
          </div>
        </div>
        <button className="text-sm font-semibold text-primary hover:underline">
          See All
        </button>
      </div>

      <div className="overflow-auto -mx-6 px-6 pb-2">
        <Table>
          <TableHeader className="border-none">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-muted-foreground font-medium w-[400px]">
                Task Name
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                Assign
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="group hover:bg-muted/50 border-none cursor-pointer transition-colors rounded-lg"
                  onClick={() => handleRowClick(task.id)}
                >
                  <TableCell className="font-semibold text-foreground py-4">
                    {task.title}
                  </TableCell>
                  <TableCell>
                    <div className="flex -space-x-2">
                      {task.assignees?.slice(0, 3).map((a) => (
                        <Avatar
                          key={a.user_id}
                          className="w-8 h-8 border-2 border-card"
                        >
                          <AvatarImage src={a.user.avatar_url || ""} />
                          <AvatarFallback>
                            {a.user.full_name?.substring(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {task.assignees?.length === 0 && (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-medium border px-3 py-1 rounded-full capitalize ${
                        statusColors[task.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground h-32"
                >
                  No tasks found. Create one to get started!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}




