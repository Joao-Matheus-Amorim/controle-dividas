import { GastosPage } from "@/features/protected-pages/gastos-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  params: Promise<OrgRouteParams>;
  searchParams?: PageSearchParams;
};

export default async function OrgProtectedGastosPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;

  return <GastosPage orgSlug={orgSlug} searchParams={searchParams} />;
}
