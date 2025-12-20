"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/utils";
import {
  Check,
  X,
  UserPlus,
  MoreVertical,
  Search,
  Clock,
  Loader2,
} from "lucide-react";
import {
  addParticipantsAction,
  removeParticipantAction,
  markAttendanceAction,
  searchParticipantsAction,
} from "@/app/actions/rehearsal-participant-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ParticipantManagerProps {
  rehearsalId: string;
  farewellId: string;
  participants: any[];
  isAdmin: boolean;
}

export function ParticipantManager({
  rehearsalId,
  farewellId,
  participants,
  isAdmin,
}: ParticipantManagerProps) {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Search State
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        const results = await searchParticipantsAction(farewellId, query);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, farewellId]);

  async function handleAttendance(
    userId: string,
    status: "present" | "absent" | "late"
  ) {
    const result = await markAttendanceAction(
      rehearsalId,
      farewellId,
      userId,
      status
    );
    if (result.error) {
      toast.error("Error", { description: result.error });
    } else {
      router.refresh();
    }
  }

  async function handleAddParticipant(userId: string) {
    const result = await addParticipantsAction(rehearsalId, farewellId, [
      userId,
    ]);
    if (result.error) {
      toast.error("Error", { description: result.error });
    } else {
      toast.success("Participant Added");
      setIsAddDialogOpen(false);
      setQuery("");
      setSearchResults([]);
      router.refresh();
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this participant?")) return;
    const result = await removeParticipantAction(
      rehearsalId,
      farewellId,
      userId
    );
    if (result.error) {
      toast.error("Error", { description: result.error });
    } else {
      toast.success("Participant Removed");
      router.refresh();
    }
  }

  // Highlight helper
  const HighlightText = ({
    text,
    highlight,
  }: {
    text: string;
    highlight: string;
  }) => {
    if (!highlight.trim() || !text) return <span>{text}</span>;

    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span
              key={i}
              className="bg-yellow-200 dark:bg-yellow-900 font-semibold"
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Stats
  const presentCount = participants.filter(
    (p) => p.attendance_status === "present" || p.attendance_status === "late"
  ).length;
  const totalCount = participants.length;
  const attendancePercentage =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">
              Participants ({totalCount})
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Attendance: {attendancePercentage}%</span>
              <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>
            </div>
          </div>
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Participant</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-8"
                    />
                    {isSearching && (
                      <div className="absolute right-2 top-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border rounded-md max-h-[200px] overflow-y-auto">
                      {searchResults.map((user) => {
                        const isAlreadyAdded = participants.some(
                          (p) => p.user_id === user.id
                        );
                        return (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors ${
                              isAlreadyAdded
                                ? "opacity-50 pointer-events-none"
                                : ""
                            }`}
                            onClick={() =>
                              !isAlreadyAdded && handleAddParticipant(user.id)
                            }
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>
                                {getInitials(user.full_name || "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col text-sm">
                              <span className="font-medium">
                                <HighlightText
                                  text={user.full_name}
                                  highlight={query}
                                />
                              </span>
                              <span className="text-xs text-muted-foreground">
                                <HighlightText
                                  text={user.email}
                                  highlight={query}
                                />
                              </span>
                            </div>
                            {isAlreadyAdded && (
                              <span className="ml-auto text-xs text-green-600 flex items-center">
                                <Check className="w-3 h-3 mr-1" /> Added
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {query.length >= 2 &&
                    !isSearching &&
                    searchResults.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        No members found.
                      </div>
                    )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Readiness</TableHead>
                <TableHead>Attendance</TableHead>
                {isAdmin && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No participants added yet.
                  </TableCell>
                </TableRow>
              ) : (
                participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.user?.avatar_url} />
                          <AvatarFallback>
                            {getInitials(p.user?.full_name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {p.user?.full_name}
                          </span>
                          <span className="text-xs text-muted-foreground hidden sm:inline-block">
                            {p.user?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="capitalize font-normal"
                      >
                        {p.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {p.readiness_status?.costume && (
                          <Badge
                            className="text-[10px] px-1 h-5"
                            variant="secondary"
                          >
                            Costume
                          </Badge>
                        )}
                        {p.readiness_status?.props && (
                          <Badge
                            className="text-[10px] px-1 h-5"
                            variant="secondary"
                          >
                            Props
                          </Badge>
                        )}
                        {!p.readiness_status?.costume &&
                          !p.readiness_status?.props && (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant={
                                  p.attendance_status === "present"
                                    ? "default"
                                    : "ghost"
                                }
                                className={`h-7 w-7 ${
                                  p.attendance_status === "present"
                                    ? "bg-green-600 hover:bg-green-700"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleAttendance(p.user_id, "present")
                                }
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark Present</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant={
                                  p.attendance_status === "late"
                                    ? "default"
                                    : "ghost"
                                }
                                className={`h-7 w-7 ${
                                  p.attendance_status === "late"
                                    ? "bg-yellow-600 hover:bg-yellow-700"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleAttendance(p.user_id, "late")
                                }
                              >
                                <Clock className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark Late</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant={
                                  p.attendance_status === "absent"
                                    ? "default"
                                    : "ghost"
                                }
                                className={`h-7 w-7 ${
                                  p.attendance_status === "absent"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleAttendance(p.user_id, "absent")
                                }
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Mark Absent</TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <Badge
                          variant={
                            p.attendance_status === "present"
                              ? "default"
                              : p.attendance_status === "late"
                              ? "secondary"
                              : p.attendance_status === "absent"
                              ? "destructive"
                              : "outline"
                          }
                          className="capitalize"
                        >
                          {p.attendance_status}
                        </Badge>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleRemove(p.user_id)}
                              className="text-destructive"
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  );
}
