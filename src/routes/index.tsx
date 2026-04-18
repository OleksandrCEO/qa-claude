import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/AppHeader";
import { QAPreviewModal } from "@/components/QAPreviewModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useAuth } from "@/lib/auth";
import { api, ApiError, type QARecord } from "@/lib/api";
import { relativeTime } from "@/lib/time";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "QA Admin" }] }),
  component: ListPage,
});

function ListPage() {
  const { creds, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [preview, setPreview] = useState<QARecord | null>(null);
  const [toDelete, setToDelete] = useState<QARecord | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!creds) navigate({ to: "/login", replace: true });
  }, [creds, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ["qa-list"],
    queryFn: () => api.list(creds!),
    enabled: !!creds,
  });

  useEffect(() => {
    if (query.error instanceof ApiError && (query.error.status === 401 || query.error.status === 403)) {
      signOut();
      toast.error("Session expired, please log in again");
      navigate({ to: "/login", replace: true });
    }
  }, [query.error, signOut, navigate]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "n" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate({ to: "/new" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const filtered = useMemo(() => {
    const items = query.data ?? [];
    const q = debounced.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => r.question.toLowerCase().includes(q) || r.answer.toLowerCase().includes(q));
  }, [query.data, debounced]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.remove(creds!, id);
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["qa-list"] });
      const prev = qc.getQueryData<QARecord[]>(["qa-list"]);
      qc.setQueryData<QARecord[]>(["qa-list"], (old) => (old ?? []).filter((r) => r.id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["qa-list"], ctx.prev);
      toast.error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("Record deleted");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["qa-list"] });
      setToDelete(null);
      setPreview(null);
    },
  });

  if (!creds) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions and answers..."
              className="pl-9"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              /
            </kbd>
          </div>
        </div>

        {query.isLoading && <SkeletonList />}

        {query.isError && !query.isLoading && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">
              {query.error instanceof Error ? query.error.message : "Failed to load records"}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => query.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!query.isLoading && !query.isError && filtered.length === 0 && (
          <EmptyState
            isFiltered={!!debounced}
            onAdd={() => navigate({ to: "/new" })}
            onClear={() => setSearch("")}
          />
        )}

        {!query.isLoading && filtered.length > 0 && (
          <ul className="space-y-2">
            {filtered.map((r) => (
              <QARow
                key={r.id}
                record={r}
                onOpen={() => setPreview(r)}
                onEdit={() => navigate({ to: "/edit/$id", params: { id: r.id } })}
                onDelete={() => setToDelete(r)}
              />
            ))}
          </ul>
        )}

        {query.isFetching && !query.isLoading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Refreshing
          </div>
        )}
      </main>

      <QAPreviewModal
        record={preview}
        open={!!preview}
        onOpenChange={(o) => !o && setPreview(null)}
        onEdit={(r) => { setPreview(null); navigate({ to: "/edit/$id", params: { id: r.id } }); }}
        onDelete={(r) => setToDelete(r)}
      />

      <DeleteConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        pending={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id)}
      />
    </div>
  );
}

function QARow({
  record,
  onOpen,
  onEdit,
  onDelete,
}: {
  record: QARecord;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = relativeTime(record.updatedAt ?? record.createdAt);
  return (
    <li className="group rounded-lg border border-border bg-card transition hover:border-foreground/20 hover:bg-accent/30">
      <div className="flex items-start gap-2 p-3 sm:gap-3 sm:p-4">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 min-w-0 cursor-pointer text-left focus:outline-none"
        >
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {record.question}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {record.answer}
          </p>
          {t && (
            <p className="mt-2 text-[11px] text-muted-foreground/80" title={t.full}>
              {t.rel}
            </p>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label="Edit"
            className="h-11 w-11 text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Delete"
            className="h-11 w-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="rounded-lg border border-border bg-card p-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ isFiltered, onAdd, onClear }: { isFiltered: boolean; onAdd: () => void; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-5 w-5 text-muted-foreground" />
      </div>
      {isFiltered ? (
        <>
          <h3 className="text-sm font-semibold">No matches</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Try a different search term.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={onClear}>
            Clear search
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-sm font-semibold">No records yet</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Add your first Q&amp;A to start building the knowledge base.
          </p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={onAdd}>
            <Plus className="h-4 w-4" /> Add your first Q&amp;A
          </Button>
        </>
      )}
    </div>
  );
}
