import { RelatoriosPage } from "@/app/protected/relatorios/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrgRelatoriosPage({ params, searchParams }: OrgPageProps) {
  const { orgSlug } = await params;

  return <RelatoriosPage orgSlug={orgSlug} searchParams={searchParams} />;
}
