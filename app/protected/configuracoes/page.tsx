import { ConfiguracoesPage } from "@/features/protected-pages/configuracoes-page";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getCheckoutStatus(searchParams?: Record<string, string | string[] | undefined>) {
  const value = searchParams?.billing_checkout;

  return typeof value === "string" ? value : undefined;
}

function getPortalStatus(searchParams?: Record<string, string | string[] | undefined>) {
  const value = searchParams?.billing_portal;

  return typeof value === "string" ? value : undefined;
}

export default async function ProtectedConfiguracoesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <ConfiguracoesPage
      checkoutStatus={getCheckoutStatus(resolvedSearchParams)}
      portalStatus={getPortalStatus(resolvedSearchParams)}
    />
  );
}
