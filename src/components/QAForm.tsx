import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const schema = z.object({
  question: z.string().trim().min(3, "At least 3 characters"),
  answer: z.string().trim().min(1, "Required"),
});
export type QAFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<QAFormValues>;
  submitting?: boolean;
  onSubmit: (values: QAFormValues) => void;
  submitLabel?: string;
}

export function QAForm({ defaultValues, submitting, onSubmit, submitLabel = "Save" }: Props) {
  const navigate = useNavigate();
  const [confirmLeave, setConfirmLeave] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isDirty }, reset } = useForm<QAFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { question: "", answer: "", ...defaultValues },
  });

  useEffect(() => {
    if (defaultValues) reset({ question: "", answer: "", ...defaultValues });
  }, [defaultValues, reset]);

  const question = watch("question") ?? "";
  const answer = watch("answer") ?? "";

  // beforeunload guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !submitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, submitting]);

  const handleCancel = () => {
    if (isDirty && !submitting) {
      setConfirmLeave(true);
    } else {
      navigate({ to: "/" });
    }
  };

  // Auto-grow textarea
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: rhfAnswerRef, ...answerRest } = register("answer");
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.max(ta.scrollHeight, 240) + "px";
  }, [answer]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="question">Question</Label>
            <span className="text-xs text-muted-foreground">{question.length}</span>
          </div>
          <Input id="question" autoFocus placeholder="What is..." {...register("question")} />
          {errors.question && <p className="text-xs text-destructive">{errors.question.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="answer">Answer</Label>
            <span className="text-xs text-muted-foreground">{answer.length}</span>
          </div>
          <Textarea
            id="answer"
            placeholder="Write the answer here..."
            rows={10}
            className="min-h-[240px] resize-none leading-relaxed"
            {...answerRest}
            ref={(el) => {
              rhfAnswerRef(el);
              taRef.current = el;
            }}
          />
          {errors.answer && <p className="text-xs text-destructive">{errors.answer.message}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved changes that will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate({ to: "/" })}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
