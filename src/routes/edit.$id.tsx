import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { QAForm, type QAFormValues } from "@/components/QAForm";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/edit/$id")({
  head: () => ({ meta: [{ title: "Edit record — QA Admin" }] }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const { creds, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!creds) navigate({ to: "/login", replace: true });
  }, [creds, navigate]);

  const query = useQuery({
    queryKey: ["qa", id],
    queryFn: () => api.get(creds!, id),
    enabled: !!creds,
  });

  useEffect(() => {
    if (query.error instanceof ApiError && (query.error.status === 401 || query.error.status === 403)) {
      signOut();
      toast.error("Session expired, please log in again");
      navigate({ to: "/login", replace: true });
    }
  }, [query.error, signOut, navigate]);

  const mutation = useMutation({
    mutationFn: (values: QAFormValues) => api.update(creds!, { id, ...values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qa-list"] });
      qc.invalidateQueries({ queryKey: ["qa", id] });
      toast.success("Record updated");
      navigate({ to: "/" });
    },
    onError: (err) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        signOut();
        toast.error("Session expired, please log in again");
        navigate({ to: "/login", replace: true });
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to update");
      }
    },
  });

  if (!creds) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Edit Q&amp;A</h1>

        {query.isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {query.isError && !query.isLoading && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">
              {query.error instanceof Error ? query.error.message : "Failed to load record"}
            </p>
          </div>
        )}

        {query.data && (
          <QAForm
            defaultValues={{ question: query.data.question, answer: query.data.answer }}
            submitting={mutation.isPending}
            onSubmit={(v) => mutation.mutate(v)}
            submitLabel="Save changes"
          />
        )}
      </main>
    </div>
  );
}
