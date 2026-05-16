import { formatCurrency } from "@/lib/finance/calculations";

export type AccessProfileSummary = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean;
  auth_user_id: string | null;
  linked_family_member_id: string | null;
};

export function compactCurrency(value: number) {
  return formatCurrency(value).replace("€", "€ ");
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
