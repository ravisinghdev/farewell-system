import { getFarewellMembers } from "@/actions/people";
import { ClassBarrierGrid } from "@/components/people/class-barrier-grid";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "12th Grade Students",
  description: "View all 12th grade students grouped by class barrier.",
};

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch students specifically from Grade 12
  const students = await getFarewellMembers(id, "student", 12);

  // Fetch teachers to map them to barriers
  const teachers = await getFarewellMembers(id, "teacher");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            12th Grade Students
          </h1>
          <p className="text-muted-foreground">
            Meet the graduating class grouped by their Class Barriers.
          </p>
        </div>
      </div>
      <ClassBarrierGrid
        students={students || []}
        teachers={teachers || []}
        farewellId={id}
      />
    </div>
  );
}
