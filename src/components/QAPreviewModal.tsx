import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { QARecord } from "@/lib/api";
import { relativeTime } from "@/lib/time";

interface Props {
  record: QARecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (record: QARecord) => void;
  onDelete: (record: QARecord) => void;
}

export function QAPreviewModal({ record, open, onOpenChange, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false);

  if (!record) return null;

  const updated = relativeTime(record.updatedAt ?? record.createdAt);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record.answer);
      setCopied(true);
      toast.success("Answer copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle className="pr-6 text-base font-semibold leading-snug">
              {record.question}
            </DialogTitle>
            {updated && (
              <p className="text-xs text-muted-foreground" title={updated.full}>
                Updated {updated.rel}
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Answer</span>
              <Button variant="ghost" size="sm" onClick={copy} className="h-7 gap-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{record.answer}</p>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 border-t border-border bg-muted/30 px-6 py-3 sm:gap-2">
            <Button variant="outline" onClick={() => onDelete(record)} className="gap-1.5">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button onClick={() => onEdit(record)} className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
