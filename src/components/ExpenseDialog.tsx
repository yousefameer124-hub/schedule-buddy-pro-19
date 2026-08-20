import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type ExpenseCategory,
  type PaymentMethod,
} from "@/lib/schedule";
import { useMutate, type Expense } from "@/lib/api";

type Form = {
  name: string;
  category: ExpenseCategory;
  amount: number;
  spent_on: string;
  method: PaymentMethod;
  description: string;
};

const emptyForm = (): Form => ({
  name: "",
  category: "other",
  amount: 0,
  spent_on: new Date().toISOString().slice(0, 10),
  method: "cash",
  description: "",
});

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense: Expense | null;
}) {
  const [form, setForm] = useState<Form>(emptyForm());
  const mutate = useMutate("expenses");

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setForm({
        name: expense.name,
        category: expense.category,
        amount: Number(expense.amount),
        spent_on: expense.spent_on,
        method: expense.method,
        description: expense.description ?? "",
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, expense]);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  async function save() {
    if (!form.name.trim()) {
      toast.error("Expense name is required");
      return;
    }
    if (!(form.amount > 0)) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    const values = {
      name: form.name.trim(),
      category: form.category,
      amount: form.amount,
      spent_on: form.spent_on,
      method: form.method,
      description: form.description.trim() || null,
    };
    try {
      if (expense) await mutate.mutateAsync({ op: "update", id: expense.id, values });
      else await mutate.mutateAsync({ op: "insert", values });
      toast.success(expense ? "Expense updated" : "Expense added");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove() {
    if (!expense) return;
    try {
      await mutate.mutateAsync({ op: "delete", id: expense.id });
      toast.success("Expense deleted");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>Clinic spending — visible to admins only.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ex-name">Expense</Label>
            <Input
              id="ex-name"
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Electricity bill"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => set({ category: v as ExpenseCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ex-amount">Amount</Label>
              <Input
                id="ex-amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => set({ amount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ex-date">Date</Label>
              <Input
                id="ex-date"
                type="date"
                value={form.spent_on}
                onChange={(e) => set({ spent_on: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Payment method</Label>
              <Select
                value={form.method}
                onValueChange={(v) => set({ method: v as PaymentMethod })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ex-desc">Note / description</Label>
            <Textarea
              id="ex-desc"
              rows={2}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {expense ? (
            <Button variant="destructive" onClick={remove} disabled={mutate.isPending}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={mutate.isPending}>
              {expense ? "Save changes" : "Add expense"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
