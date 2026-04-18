import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { QAForm, type QAFormValues } from "@/components/QAForm";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";

export const Route = createFileRoute("/new")({
  head: () => ({ meta: [{ title: "New record — QA Admin" }] }),
  component: NewPage,
});

function NewPage() {
  const { creds, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!creds) navigate({ to: "/login", replace: true });
  }, [creds, navigate]);

  const mutation = useMutation({
    mutationFn: (values: QAFormValues) => api.create(creds!, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["qa-list"] });
      toast.success("Record created");
      navigate({ to: "/" });
    },
    onError: (err) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        signOut();
        toast.error("Session expired, please log in again");
        navigate({ to: "/login", replace: true });
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to create");
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
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">New Q&amp;A</h1>
        <QAForm
          submitting={mutation.isPending}
          onSubmit={(v) => mutation.mutate(v)}
          submitLabel="Create"
        />
      </main>
    </div>
  );
}
