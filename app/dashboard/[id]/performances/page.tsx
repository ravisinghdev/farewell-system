"use client";

import { PageScaffold } from "@/components/dashboard/page-scaffold";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getPerformancesAction,
  createPerformanceAction,
  updatePerformanceStatusAction,
  deletePerformanceAction,
  voteForPerformanceAction,
  removeVoteForPerformanceAction,
} from "@/app/actions/event-actions";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Music,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Video,
  ThumbsUp,
} from "lucide-react";
import { useFarewell } from "@/components/providers/farewell-provider";
import { checkIsAdmin } from "@/lib/auth/roles";
import { createClient } from "@/utils/supabase/client";

export default function PerformancesPage() {
  const params = useParams();
  const farewellId = params.id as string;
  const { farewell } = useFarewell();
  const isAdmin = checkIsAdmin(farewell.role);

  const [performances, setPerformances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [performers, setPerformers] = useState("");
  const [duration, setDuration] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPerformances();
  }, [farewellId]);

  async function fetchPerformances() {
    const result = await getPerformancesAction(farewellId);
    if (result.data) {
      setPerformances(result.data);
    }
    setLoading(false);
  }

  function resetForm() {
    setTitle("");
    setType("");
    setPerformers("");
    setDuration("");
    setVideoFile(null);
  }

  async function handleCreate() {
    if (!title || !type || !performers) {
      toast.error("Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    let videoUrl = "";

    if (videoFile) {
      setUploading(true);
      const supabase = createClient();
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${farewellId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("performance_videos")
        .upload(filePath, videoFile);

      if (uploadError) {
        toast.error("Upload Error", {
          description: uploadError.message,
        });
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("performance_videos")
        .getPublicUrl(filePath);
      videoUrl = data.publicUrl;
      setUploading(false);
    }

    const performersList = performers.split(",").map((p) => p.trim());

    const result = await createPerformanceAction(farewellId, {
      title,
      type,
      performers: performersList,
      duration,
      video_url: videoUrl,
    });

    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      toast.success("Success", {
        description: "Performance proposed successfully",
      });
      setIsDialogOpen(false);
      resetForm();
      fetchPerformances();
    }
  }

  async function handleStatusUpdate(id: string, status: string) {
    const result = await updatePerformanceStatusAction(id, farewellId, status);
    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      toast.success("Success", {
        description: `Performance ${status}`,
      });
      fetchPerformances();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this performance?")) return;
    const result = await deletePerformanceAction(id, farewellId);
    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
    } else {
      toast.success("Success", {
        description: "Performance deleted",
      });
      fetchPerformances();
    }
  }

  async function handleVote(id: string, hasVoted: boolean) {
    // Optimistic update
    setPerformances((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            vote_count: hasVoted ? p.vote_count - 1 : p.vote_count + 1,
            has_voted: !hasVoted,
          };
        }
        return p;
      })
    );

    const result = hasVoted
      ? await removeVoteForPerformanceAction(id)
      : await voteForPerformanceAction(id);

    if (result.error) {
      toast.error("Error", {
        description: result.error,
      });
      // Revert optimistic update
      fetchPerformances();
    }
  }

  return (
    <PageScaffold
      title="Performances & Acts"
      description="Manage and schedule performances for the event."
      action={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Propose Performance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Propose a Performance</DialogTitle>
              <DialogDescription>
                Submit a performance idea for approval.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Group Dance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dance">Dance</SelectItem>
                    <SelectItem value="Song">Song</SelectItem>
                    <SelectItem value="Skit">Skit</SelectItem>
                    <SelectItem value="Speech">Speech</SelectItem>
                    <SelectItem value="Instrumental">Instrumental</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Performers (comma separated)</Label>
                <Input
                  placeholder="John, Jane, Mike"
                  value={performers}
                  onChange={(e) => setPerformers(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (approx)</Label>
                <Input
                  placeholder="e.g. 5 mins"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Upload Video (Optional)</Label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    setVideoFile(e.target.files ? e.target.files[0] : null)
                  }
                />
              </div>
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Submit Proposal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {performances.map((performance) => (
            <Card key={performance.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    {performance.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{performance.type}</Badge>
                    <Badge
                      variant={
                        performance.status === "approved"
                          ? "default"
                          : performance.status === "rejected"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {performance.status}
                    </Badge>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(performance.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance.video_url && (
                    <div className="rounded-md overflow-hidden bg-black aspect-video">
                      <video
                        src={performance.video_url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {performance.performers &&
                          performance.performers.join(", ")}
                      </span>
                    </div>
                    {performance.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{performance.duration}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant={performance.has_voted ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        handleVote(performance.id, performance.has_voted)
                      }
                      className="gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {performance.vote_count || 0}
                    </Button>

                    {isAdmin && performance.status === "proposed" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() =>
                            handleStatusUpdate(performance.id, "approved")
                          }
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() =>
                            handleStatusUpdate(performance.id, "rejected")
                          }
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageScaffold>
  );
}
