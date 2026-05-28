import { RelatoriosPage } from "@/features/protected-pages/relatorios-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  params: Promise<OrgRouteParams>;
  searchParams?: PageSearchParams;
};

export default async function OrgProtectedRelatoriosPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;

  return <RelatoriosPage orgSlug={orgSlug} searchParams={searchParams} />;
}
