import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { systemCurrencyOptions } from "@/lib/finance/bank-options";

type CurrencyCodeInputProps = {
  id: string;
  name: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function CurrencyCodeInput({
  id,
  name,
  value,
  defaultValue,
  disabled,
  readOnly,
  required = true,
  className,
  onChange,
}: CurrencyCodeInputProps) {
  const listId = `${id}-currency-options`;

  return (
    <>
      <Input
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        list={listId}
        inputMode="text"
        pattern="[A-Za-z]{3}"
        maxLength={3}
        placeholder="Ex: EUR, BRL, USD"
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        className={className}
      />
      <datalist id={listId}>
        {systemCurrencyOptions.map((currency) => (
          <option key={currency} value={currency} />
        ))}
      </datalist>
    </>
  );
}
