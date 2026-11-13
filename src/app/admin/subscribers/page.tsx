import { RowActions } from "@/components/admin/row-actions";
import { Empty, PageTitle } from "@/components/admin/ui";
import { editorPageClient } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { formatDateTime } from "@/lib/format";

export default async function SubscribersPage() {
  const { supabase } = await editorPageClient();
  const { data } = await supabase
    .from("subscribers")
    .select("id, email, created_at, unsubscribed_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  const subs = data ?? [];
  const active = subs.filter((s) => !s.unsubscribed_at).length;
  return (
    <>
      <PageTitle eyebrow="Newsletter" title="Subscribers" />
      <p className="mb-6 text-sm text-gray-400">
        {active} active · {subs.length - active} unsubscribed.{" "}
        {isEmailConfigured()
          ? "Subscribers are emailed automatically when an article is first published."
          : "Email sending is not configured (RESEND_API_KEY / EMAIL_FROM), so no newsletters are sent."}
      </p>
      {subs.length === 0 ? (
        <Empty>NO SUBSCRIBERS</Empty>
      ) : (
        <div className="divide-y divide-white/5 border border-white/10">
          {subs.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 p-3">
              <span className={`flex-1 font-mono text-sm ${s.unsubscribed_at ? "text-gray-600 line-through" : "text-white"}`}>{s.email}</span>
              <span className="font-mono text-xs text-gray-500">{formatDateTime(s.created_at)}</span>
              <RowActions actions={[{ label: "Delete", action: "deleteSubscriber", arg: s.id, danger: true }]} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
