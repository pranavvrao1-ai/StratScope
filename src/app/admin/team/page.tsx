import { redirect } from "next/navigation";
import { RowActions, type RowAction } from "@/components/admin/row-actions";
import { PageTitle } from "@/components/admin/ui";
import { editorPageClient } from "@/lib/auth";

export default async function TeamPage() {
  const { supabase, profile } = await editorPageClient();
  if (profile.role !== "admin") redirect("/admin");
  const { data } = await supabase.from("profiles").select("id, email, display_name, role, created_at").order("created_at");
  return (
    <>
      <PageTitle eyebrow="Access control" title="Team" />
      <p className="mb-6 max-w-2xl text-sm text-gray-400">
        Invite people from the Supabase dashboard (Authentication → Users → Invite user). New accounts have no access until you give them a role
        here. Editors manage all content; administrators can also manage roles.
      </p>
      <div className="divide-y divide-white/5 border border-white/10">
        {(data ?? []).map((u) => {
          const actions: RowAction[] = [];
          if (u.role !== "editor") actions.push({ label: "Make editor", action: "roleEditor", arg: u.id });
          if (u.role !== "admin") actions.push({ label: "Make admin", action: "roleAdmin", arg: u.id, danger: true });
          if (u.role !== "none") actions.push({ label: "Revoke access", action: "roleNone", arg: u.id, danger: true });
          return (
            <div key={u.id} className="flex flex-wrap items-center gap-4 p-3">
              <div className="flex-1">
                <p className="text-sm text-white">{u.display_name || u.email}</p>
                <p className="font-mono text-xs text-gray-500">{u.email}</p>
              </div>
              <span className="font-mono text-xs uppercase text-gold">{u.role}</span>
              {u.id !== profile.id && <RowActions actions={actions} />}
            </div>
          );
        })}
      </div>
    </>
  );
}
