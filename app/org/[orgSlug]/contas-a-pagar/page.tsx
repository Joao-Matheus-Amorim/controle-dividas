import { ContasAPagarPage } from "@/app/protected/contas-a-pagar/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrgContasAPagarPage({ params, searchParams }: OrgPageProps) {
  const { orgSlug } = await params;

  return <ContasAPagarPage orgSlug={orgSlug} searchParams={searchParams} />;
}
