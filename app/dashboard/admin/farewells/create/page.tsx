import { createFarewellAction } from "@/app/actions/farewell-admin-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function CreateFarewellPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Create New Farewell
          </CardTitle>
          <CardDescription>
            Fill in the details to create a new farewell batch for your school.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={createFarewellAction} className="space-y-6">
            {/* Farewell Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Farewell Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Farewell 2025"
                required
                className="h-11"
              />
            </div>

            {/* Batch Year */}
            <div className="space-y-2">
              <Label htmlFor="year" className="text-sm font-medium">
                Batch Year
              </Label>
              <Input
                id="year"
                name="year"
                type="number"
                required
                className="h-11"
              />
            </div>

            {/* Section */}
            <div className="space-y-2">
              <Label htmlFor="section" className="text-sm font-medium">
                Section
              </Label>
              <Input
                id="section"
                name="section"
                placeholder="A"
                required
                className="h-11"
              />
            </div>

            {/* Requires Approval */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label className="font-medium">Requires Admin Approval</Label>
                <p className="text-sm text-gray-500">
                  Users must request to join and wait for admin approval.
                </p>
              </div>

              <Switch name="requiresApproval" />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full h-11 text-md font-medium">
              Create Farewell
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
