import { prisma } from "@/lib/db";
import { createCat, archiveCat, unarchiveCat } from "@/lib/actions/cat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function formatDate(d: Date | null) {
  return d ? d.toLocaleDateString() : "\u2014";
}

export default async function AdminCatsPage() {
  const cats = await prisma.cat.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Manage cats</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add a cat</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await createCat(formData);
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="medicalFlags">Medical flags</Label>
              <Input
                id="medicalFlags"
                name="medicalFlags"
                placeholder="e.g. FIV+, kidney diet"
              />
            </div>
            <Button type="submit" className="mt-2">
              Add cat
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2">Name</th>
                <th className="py-2">Intake</th>
                <th className="py-2">Archived</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {cats.map((cat) => (
                <tr key={cat.id} className="border-t">
                  <td className="py-3 font-semibold">{cat.name}</td>
                  <td className="py-3">{formatDate(cat.intakeDate)}</td>
                  <td className="py-3">{formatDate(cat.archivedAt)}</td>
                  <td className="py-3 text-right">
                    {cat.archivedAt ? (
                      <form
                        action={async () => {
                          "use server";
                          await unarchiveCat(cat.id);
                        }}
                      >
                        <Button variant="outline" size="sm">
                          Unarchive
                        </Button>
                      </form>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          await archiveCat(cat.id);
                        }}
                      >
                        <Button variant="outline" size="sm">
                          Archive
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
