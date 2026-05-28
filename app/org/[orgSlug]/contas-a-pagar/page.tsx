import { ContasAPagarPage } from "@/features/protected-pages/contas-a-pagar-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  params: Promise<OrgRouteParams>;
  searchParams?: PageSearchParams;
};

export default async function OrgProtectedContasAPagarPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;

  return <ContasAPagarPage orgSlug={orgSlug} searchParams={searchParams} />;
}
