import { getFarewellMembers } from "@/actions/people";
import { PeopleGrid } from "@/components/people/people-grid";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Junior Contributors",
  description: "View all junior contributors in this farewell.",
};

export default async function JuniorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Fetch juniors specifically from Grade 11
  const juniors = await getFarewellMembers(id, "junior", 11);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Junior Contributors
          </h1>
          <p className="text-muted-foreground">
            The upcoming batch helping organize the event.
          </p>
        </div>
      </div>
      <PeopleGrid initialMembers={juniors} farewellId={id} role="junior" />
    </div>
  );
}
