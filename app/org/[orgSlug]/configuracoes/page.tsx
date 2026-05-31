import { ConfiguracoesPage } from "@/features/protected-pages/configuracoes-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageProps = {
  params: Promise<OrgRouteParams>;
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

export default async function OrgProtectedConfiguracoesPage({
  params,
  searchParams,
}: PageProps) {
  const { orgSlug } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <ConfiguracoesPage
      orgSlug={orgSlug}
      checkoutStatus={getCheckoutStatus(resolvedSearchParams)}
      portalStatus={getPortalStatus(resolvedSearchParams)}
    />
  );
}
