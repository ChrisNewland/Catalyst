import { prisma } from "@/lib/db";
import { createCat, archiveCat, unarchiveCat } from "@/lib/actions/cat";

function formatDate(d: Date | null) {
  return d ? d.toLocaleDateString() : "—";
}

export default async function AdminCatsPage() {
  const cats = await prisma.cat.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Manage cats</h1>

      <form
        action={async (formData) => {
          "use server";
          await createCat(formData);
        }}
        className="card flex flex-col gap-2"
      >
        <h2 className="font-semibold">Add a cat</h2>
        <label className="field">
          Name
          <input name="name" required />
        </label>
        <label className="field">
          Notes
          <textarea name="notes" rows={2} />
        </label>
        <label className="field">
          Medical flags
          <input name="medicalFlags" placeholder="e.g. FIV+, kidney diet" />
        </label>
        <button type="submit" className="btn-primary mt-2">
          Add cat
        </button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink/60">
            <th className="py-2">Name</th>
            <th className="py-2">Intake</th>
            <th className="py-2">Archived</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {cats.map((cat) => (
            <tr key={cat.id} className="border-t border-ink/10">
              <td className="py-2 font-semibold">{cat.name}</td>
              <td className="py-2">{formatDate(cat.intakeDate)}</td>
              <td className="py-2">{formatDate(cat.archivedAt)}</td>
              <td className="py-2 text-right">
                {cat.archivedAt ? (
                  <form
                    action={async () => {
                      "use server";
                      await unarchiveCat(cat.id);
                    }}
                  >
                    <button className="btn-secondary py-2 px-3 text-sm">
                      Unarchive
                    </button>
                  </form>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await archiveCat(cat.id);
                    }}
                  >
                    <button className="btn-secondary py-2 px-3 text-sm">
                      Archive
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
