import { compactCurrency, initials } from "@/lib/finance/formatting";

export type AccessProfileSummary = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  is_active: boolean;
  auth_user_id: string | null;
  linked_family_member_id: string | null;
};

export { compactCurrency, initials };
