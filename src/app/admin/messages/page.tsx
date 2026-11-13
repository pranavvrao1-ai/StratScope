import { RowActions } from "@/components/admin/row-actions";
import { Empty, PageTitle } from "@/components/admin/ui";
import { editorPageClient } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export default async function MessagesPage() {
  const { supabase } = await editorPageClient();
  const { data } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, handled, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  const messages = data ?? [];
  return (
    <>
      <PageTitle eyebrow="Inbox" title="Contact Messages" />
      {messages.length === 0 ? (
        <Empty>NO MESSAGES</Empty>
      ) : (
        <div className="divide-y divide-white/5 border border-white/10">
          {messages.map((m) => (
            <div key={m.id} className={`space-y-2 p-4 ${m.handled ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-gray-500">
                <span className="font-sans text-sm font-bold text-white">{m.name}</span>
                <a href={`mailto:${m.email}`} className="text-gold hover:text-white">
                  {m.email}
                </a>
                <span>{formatDateTime(m.created_at)}</span>
                {!m.handled && <span className="uppercase text-gold">new</span>}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm text-gray-300">{m.message}</p>
              <RowActions
                actions={[
                  m.handled
                    ? { label: "Mark unread", action: "markUnhandled", arg: m.id }
                    : { label: "Mark handled", action: "markHandled", arg: m.id },
                  { label: "Delete", action: "deleteMessage", arg: m.id, danger: true },
                ]}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
