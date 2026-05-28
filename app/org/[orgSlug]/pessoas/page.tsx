import { PessoasPage } from "@/app/protected/pessoas/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgPessoasPage({ params }: OrgPageProps) {
  const { orgSlug } = await params;

  return <PessoasPage orgSlug={orgSlug} />;
}
