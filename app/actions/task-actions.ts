"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ActionState } from "@/types/custom";
import { Database } from "@/types/supabase";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type TaskAssignment = Database["public"]["Tables"]["task_assignments"]["Row"];

export type TaskWithDetails = Task & {
  assignees: {
    user_id: string;
    user: {
      full_name: string | null;
      avatar_url: string | null;
    };
  }[];
  comments?: {
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  }[];
  activity?: {
    id: string;
    action_type: string;
    details?: string;
    metadata?: any;
    created_at: string;
    actor: {
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  }[];
  _count?: {
    comments: number;
    attachments: number;
  };
};

/* ======================================================
   HELPERS
====================================================== */

async function getProfileId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authUserId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId) // Depending on schema, might be just id if auth.users maps 1:1 using triggers
    .single();

  // Fallback if users table uses same ID as auth.users (common in some setups)
  if (!data) return authUserId;

  return data.id;
}

/* ======================================================
   READ ACTIONS
====================================================== */

export async function getTasksAction(
  farewellId: string
): Promise<TaskWithDetails[]> {
  const supabase = await createClient();

  // We fetch task assignments which joins to 'users' table.
  // We assume 'users' table has full_name and avatar_url as per previous working code.
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      assignees:task_assignments(
        user_id,
        user:users(
          id,
          email,
          full_name,
          avatar_url
        )
      ),
      comments:task_comments(
        id,
        content,
        created_at,
        user:users(
          id,
          email,
          full_name,
          avatar_url
        )
      ),
      activity:task_activity_log(
        id,
        action_type,
        metadata,
        created_at,
        actor:users(
          id,
          email,
          full_name,
          avatar_url
        )
      )
    `
    )
    .eq("farewell_id", farewellId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return (data as any[]).map((task) => ({
    ...task,
    assignees: task.assignees.map((a: any) => ({
      ...a,
      user: {
        id: a.user.id,
        email: a.user.email,
        full_name: a.user.full_name,
        avatar_url: a.user.avatar_url,
      },
    })),
    comments: task.comments.map((c: any) => ({
      ...c,
      user: {
        id: c.user.id,
        email: c.user.email,
        full_name: c.user.full_name,
        avatar_url: c.user.avatar_url,
      },
    })),
    activity: task.activity.map((a: any) => ({
      ...a,
      actor: {
        id: a.actor.id,
        email: a.actor.email,
        full_name: a.actor.full_name,
        avatar_url: a.actor.avatar_url,
      },
    })),
  }));
}

export async function getTaskByIdAction(
  farewellId: string,
  taskId: string
): Promise<TaskWithDetails | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      assignees:task_assignments(
        user_id,
        user:users(
          id,
          email,
          full_name,
          avatar_url
        )
      ),
      comments:task_comments(
        id,
        content,
        created_at,
        user:users(
          id,
          email,
          full_name,
          avatar_url
        )
      ),
      activity:task_activity_log(
        id,
        action_type,
        metadata,
        created_at,
        actor:users(
          id,
          email,
          full_name,
          avatar_url
        )
      )
    `
    )
    .eq("farewell_id", farewellId)
    .eq("id", taskId)
    .single();

  if (error) {
    console.error("Error fetching task:", error);
    return null;
  }

  const task = data as any;
  return {
    ...task,
    assignees: task.assignees.map((a: any) => ({
      ...a,
      user: {
        id: a.user.id,
        email: a.user.email,
        full_name: a.user.full_name,
        avatar_url: a.user.avatar_url,
      },
    })),
    comments: task.comments.map((c: any) => ({
      ...c,
      user: {
        id: c.user.id,
        email: c.user.email,
        full_name: c.user.full_name,
        avatar_url: c.user.avatar_url,
      },
    })),
    activity: task.activity.map((a: any) => ({
      ...a,
      actor: {
        id: a.actor.id,
        email: a.actor.email,
        full_name: a.actor.full_name,
        avatar_url: a.actor.avatar_url,
      },
    })),
  };
}

/* ======================================================
   COMMENTS & ATTACHMENTS actions
====================================================== */

export async function getTaskCommentsAction(taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_comments")
    .select(
      `
      *,
      user:users(
        full_name,
        avatar_url
      )
    `
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return data;
}

export async function addTaskCommentAction(
  taskId: string,
  farewellId: string,
  content: string
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("task_comments").insert({
    task_id: taskId,
    user_id: user.id,
    content,
  });

  if (error) return { error: error.message };

  await supabase.from("task_activity_log").insert({
    task_id: taskId,
    action_type: "comment_added",
    actor_id: user.id,
    metadata: { snippet: content.substring(0, 50) },
  });

  revalidatePath(`/dashboard/${farewellId}/tasks`);
  return { success: true };
}

export async function getTaskActivityLogAction(taskId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_activity_log")
    .select(
      `
      *,
      actor:users(
        full_name,
        avatar_url
      )
    `
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

/* ======================================================
   WRITE ACTIONS
====================================================== */

export async function createTaskAction(
  farewellId: string,
  data: {
    title: string;
    status: Database["public"]["Enums"]["task_status"];
    priority?: Database["public"]["Enums"]["task_priority"];
    description?: string;
    dueAt?: Date;
    assigneeIds?: string[];
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 1. Create Task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      farewell_id: farewellId,
      title: data.title,
      status: data.status,
      priority: data.priority || "medium",
      description: data.description,
      due_at: data.dueAt?.toISOString(),
      created_by: user.id, // Assuming public.users matches auth.users or trigger handles it
    })
    .select()
    .single();

  if (taskError) return { error: taskError.message };

  // 2. Assign Users
  if (data.assigneeIds && data.assigneeIds.length > 0) {
    const assignments = data.assigneeIds.map((userId) => ({
      task_id: task.id,
      user_id: userId,
    }));

    const { error: assignError } = await supabase
      .from("task_assignments")
      .insert(assignments);

    if (assignError) {
      // Non-blocking error, but good to log
      console.error("Error assigning users:", assignError);
    }
  }

  // 3. Log Activity
  await supabase.from("task_activity_log").insert({
    task_id: task.id,
    action_type: "created",
    actor_id: user.id,
    metadata: { title: task.title },
  });

  revalidatePath(`/dashboard/${farewellId}/tasks`);
  return { success: true, data: task };
}

export async function updateTaskStatusAction(
  taskId: string,
  farewellId: string,
  newStatus: Database["public"]["Enums"]["task_status"]
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Update
  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId);

  if (error) return { error: error.message };

  // Log
  await supabase.from("task_activity_log").insert({
    task_id: taskId,
    action_type: "status_changed",
    actor_id: user.id,
    metadata: { new_status: newStatus },
  });

  revalidatePath(`/dashboard/${farewellId}/tasks`);
  return { success: true };
}

export async function updateTaskAction(
  taskId: string,
  farewellId: string,
  updates: {
    title?: string;
    description?: string;
    priority?: Database["public"]["Enums"]["task_priority"];
    status?: Database["public"]["Enums"]["task_status"];
    dueAt?: Date;
  }
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const dbUpdates: any = { ...updates };
  // map dueAt to due_at
  if (updates.dueAt !== undefined) {
    dbUpdates.due_at = updates.dueAt ? updates.dueAt.toISOString() : null;
    delete dbUpdates.dueAt;
  }

  const { error } = await supabase
    .from("tasks")
    .update(dbUpdates)
    .eq("id", taskId);

  if (error) return { error: error.message };

  // Log
  await supabase.from("task_activity_log").insert({
    task_id: taskId,
    action_type: "updated",
    actor_id: user.id,
    metadata: updates,
  });

  revalidatePath(`/dashboard/${farewellId}/tasks`);
  return { success: true };
}

export async function deleteTaskAction(
  taskId: string,
  farewellId: string
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/${farewellId}/tasks`);
  return { success: true };
}

export async function toggleTaskAssignmentAction(
  taskId: string,
  farewellId: string,
  userId: string,
  isAssigned: boolean
): Promise<ActionState> {
  const supabase = await createClient();

  if (isAssigned) {
    const { error } = await supabase
      .from("task_assignments")
      .insert({ task_id: taskId, user_id: userId });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("task_assignments")
      .delete()
      .eq("task_id", taskId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/${farewellId}/tasks`);
  return { success: true };
}
export async function getFarewellMembersAction(farewellId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("farewell_members")
    .select(
      `
      user_id,
      role,
      user:users(
        id,
        email,
        full_name,
        avatar_url
      )
    `
    )
    .eq("farewell_id", farewellId)
    .eq("active", true);

  if (error) {
    console.error("Error fetching members:", error);
    return [];
  }

  return data.map((m: any) => ({
    user_id: m.user.id,
    role: m.role,
    user: {
      id: m.user.id,
      email: m.user.email,
      full_name: m.user.full_name,
      avatar_url: m.user.avatar_url,
    },
  }));
}
