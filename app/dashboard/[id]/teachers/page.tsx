import { getFarewellMembers } from "@/actions/people";
import { PeopleGrid } from "@/components/people/people-grid";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teachers & Mentors",
  description: "View all teachers and mentors in this farewell.",
};

export default async function TeachersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teachers = await getFarewellMembers(id, "teacher");

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Teachers & Mentors
          </h1>
          <p className="text-muted-foreground">
            Our guiding lights and mentors.
          </p>
        </div>
      </div>
      <PeopleGrid initialMembers={teachers} farewellId={id} role="teacher" />
    </div>
  );
}
