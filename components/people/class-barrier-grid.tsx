"use client";

import { useState } from "react";
import { Database } from "@/types/supabase";
import { PersonCard } from "./person-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type FarewellMember =
  Database["public"]["Tables"]["farewell_members"]["Row"] & {
    user:
      | (Database["public"]["Tables"]["users"]["Row"] & {
          grade?: number | null;
          section?: string | null;
        })
      | null;
  };

interface ClassBarrierGridProps {
  students: FarewellMember[];
  teachers: FarewellMember[];
  farewellId: string;
}

export function ClassBarrierGrid({
  students,
  teachers,
  farewellId,
}: ClassBarrierGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter based on search
  const filteredStudents = students.filter((s) =>
    s.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTeachers = teachers.filter((t) =>
    t.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by section
  const sections = Array.from(
    new Set([
      ...filteredStudents.map(
        (s) => s.user?.section || s.section || "Unassigned"
      ),
      ...filteredTeachers.map(
        (t) => t.user?.section || t.section || "Unassigned"
      ),
    ])
  ).sort();

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students or teachers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {sections.map((section) => {
        const sectionStudents = filteredStudents.filter(
          (s) => (s.user?.section || s.section || "Unassigned") === section
        );
        const sectionTeachers = filteredTeachers.filter(
          (t) => (t.user?.section || t.section || "Unassigned") === section
        );

        if (sectionStudents.length === 0 && sectionTeachers.length === 0)
          return null;

        return (
          <div key={section} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-primary">
                Class Barrier: {section}
              </h2>
              <Badge variant="outline" className="text-base">
                {sectionStudents.length} Students
              </Badge>
              {sectionTeachers.length > 0 && (
                <Badge variant="secondary" className="text-base">
                  {sectionTeachers.length} Mentors
                </Badge>
              )}
            </div>

            <div className="rounded-xl border bg-card/50 p-6 backdrop-blur-sm">
              {/* Freedoms Section - Placeholder/Feature */}
              <div className="mb-6 rounded-lg border border-dashed p-4 bg-muted/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Class Freedoms & Privileges
                </h3>
                <p className="text-sm text-muted-foreground">
                  Access to exclusive class events, voting rights for class
                  representatives, and priority seating.
                </p>
              </div>

              {/* Teachers/Mentors */}
              {sectionTeachers.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-4 text-lg font-semibold text-muted-foreground flex items-center gap-2">
                    <span className="h-1 w-8 bg-primary rounded-full" />
                    Class Mentors
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sectionTeachers.map((teacher) => (
                      <PersonCard
                        key={teacher.id}
                        member={teacher}
                        farewellId={farewellId}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Students */}
              {sectionStudents.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-muted-foreground flex items-center gap-2">
                    <span className="h-1 w-8 bg-secondary rounded-full" />
                    Students
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sectionStudents.map((student) => (
                      <PersonCard
                        key={student.id}
                        member={student}
                        farewellId={farewellId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {sections.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No members found matching your search.
        </div>
      )}
    </div>
  );
}
