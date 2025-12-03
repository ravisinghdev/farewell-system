import { getFarewellMembers } from "@/actions/people";
import { ClassBarrierGrid } from "@/components/people/class-barrier-grid";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Farewell Giving Class",
  description:
    "View the farewell giving class (Grade 11) grouped by class barrier.",
};

export default async function FarewellClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch students specifically from Grade 11 (Farewell Giving Class)
  const students = await getFarewellMembers(id, "student", 11);

  // Fetch teachers to map them to barriers
  const teachers = await getFarewellMembers(id, "teacher");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Farewell Giving Class (Grade 11)
          </h1>
          <p className="text-muted-foreground">
            The organizers and hosts, grouped by their Class Barriers.
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
