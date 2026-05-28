import { GastosPage } from "@/app/protected/gastos/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrgGastosPage({ params, searchParams }: OrgPageProps) {
  const { orgSlug } = await params;

  return <GastosPage orgSlug={orgSlug} searchParams={searchParams} />;
}
