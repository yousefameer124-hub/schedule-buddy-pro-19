import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRouteHead } from "@/lib/page-head";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLogs, type AuditLog } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/audit")({
  head: createFileRouteHead(
    "Audit Log",
    "Record of staff actions across the clinic system.",
  ),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: role, error } = await supabase.rpc("bootstrap_current_user", {
      _full_name:
        (data.user.user_metadata as { full_name?: string })?.full_name ??
        data.user.email ??
        "Staff",
    });
    if (error || role !== "admin") throw redirect({ to: "/calendar" });
  },
  component: AuditPage,
});

type ProfileRow = { id: string; full_name: string; email: string | null };

function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      if (error) throw new Error(error.message);
      return (data ?? []) as ProfileRow[];
    },
    staleTime: 60_000,
  });
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function summarizeChanges(log: AuditLog) {
  const parts: string[] = [];
  if (log.old_value) parts.push(`before: ${JSON.stringify(log.old_value)}`);
  if (log.new_value) parts.push(`after: ${JSON.stringify(log.new_value)}`);
  return parts.join(" · ");
}

function AuditPage() {
  const { data: logs = [], isLoading } = useAuditLogs();
  const { data: profiles = [] } = useProfiles();
  const [search, setSearch] = useState("");

  const nameById = useMemo(() => {
    const m = new Map<string, ProfileRow>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  const resolveName = (id: string | null) => {
    if (!id) return "System";
    const p = nameById.get(id);
    return p?.full_name ?? p?.email ?? id.slice(0, 8);
  };

  const filtered = useMemo(() => {
    // Hook already returns newest-first; preserve order, filter client-side.
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      return (
        l.action?.toLowerCase().includes(q) ||
        l.entity?.toLowerCase().includes(q) ||
        (l.entity_id ?? "").toLowerCase().includes(q) ||
        resolveName(l.user_id).toLowerCase().includes(q)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, search, nameById]);

  return (
    <main className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <Badge variant="secondary">{filtered.length} entries</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Record of staff actions across the clinic system.
      </p>

      <div className="relative mt-4 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search action, entity, user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Record ID</th>
              <th className="p-3">Details / changes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground" colSpan={6}>
                  No audit entries.
                </td>
              </tr>
            )}
            {filtered.map((log) => (
              <tr key={log.id} className="align-top">
                <td className="whitespace-nowrap p-3 text-muted-foreground">
                  {formatTimestamp(log.created_at)}
                </td>
                <td className="p-3 font-medium">{resolveName(log.user_id)}</td>
                <td className="p-3">
                  <Badge variant="outline">{log.action}</Badge>
                </td>
                <td className="p-3">{log.entity}</td>
                <td className="max-w-[12rem] truncate p-3 font-mono text-xs text-muted-foreground">
                  {log.entity_id ?? "—"}
                </td>
                <td className="max-w-md p-3">
                  {summarizeChanges(log) ? (
                    <code className="block whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {summarizeChanges(log)}
                    </code>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
