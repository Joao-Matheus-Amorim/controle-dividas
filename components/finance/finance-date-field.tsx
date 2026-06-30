"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { financeInputClass } from "@/components/finance/finance-form-ui";

type FinanceDateFieldProps = {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
};

function formatDateLabel(value: string) {
  if (!value) {
    return "Selecionar data";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export function FinanceDateField({
  id,
  name,
  label,
  defaultValue,
  value: controlledValue,
  onValueChange,
  required = false,
}: FinanceDateFieldProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const pickerId = `${id}-picker`;
  const triggerId = `${id}-trigger`;
  const value = controlledValue ?? internalValue;

  function handleValueChange(nextValue: string) {
    setInternalValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <>
      <input type="hidden" name={name} value={value} required={required} />
      <Label htmlFor={triggerId}>{label}</Label>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            id={triggerId}
            type="button"
            variant="outline"
            className="h-12 w-full justify-between rounded-2xl border-border bg-background px-4 text-left text-base font-semibold text-foreground hover:bg-ff-bg-soft md:text-sm"
          >
            <span>{formatDateLabel(value)}</span>
            <CalendarDays className="h-4 w-4 text-primary" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm rounded-3xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>Escolha a data para este lançamento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={pickerId}>Data</Label>
              <Input
                id={pickerId}
                type="date"
                value={value}
                onChange={(event) => handleValueChange(event.target.value)}
                required={required}
                className={financeInputClass}
              />
            </div>
            <Button type="button" className="h-12 w-full rounded-2xl" onClick={() => setIsOpen(false)}>
              Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
