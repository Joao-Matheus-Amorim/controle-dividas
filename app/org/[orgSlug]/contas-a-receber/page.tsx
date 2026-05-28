import { ContasAReceberPage } from "@/app/protected/contas-a-receber/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgContasAReceberPage({ params }: OrgPageProps) {
  const { orgSlug } = await params;

  return <ContasAReceberPage orgSlug={orgSlug} />;
}
