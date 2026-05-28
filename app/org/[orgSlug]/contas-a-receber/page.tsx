import { ContasAReceberPage } from "@/features/protected-pages/contas-a-receber-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageProps = {
  params: Promise<OrgRouteParams>;
};

export default async function OrgProtectedContasAReceberPage({ params }: PageProps) {
  const { orgSlug } = await params;

  return <ContasAReceberPage orgSlug={orgSlug} />;
}
