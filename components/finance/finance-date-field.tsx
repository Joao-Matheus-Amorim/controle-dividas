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
  required = false,
}: FinanceDateFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const pickerId = `${id}-picker`;
  const triggerId = `${id}-trigger`;

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
            className="h-12 w-full justify-between rounded-2xl border-white/10 bg-[#080810] px-4 text-left text-base font-semibold text-white hover:bg-white/10 md:text-sm"
          >
            <span>{formatDateLabel(value)}</span>
            <CalendarDays className="h-4 w-4 text-[#8b72f8]" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm rounded-3xl border-white/10 bg-[#10101a] text-white">
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
                onChange={(event) => setValue(event.target.value)}
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
