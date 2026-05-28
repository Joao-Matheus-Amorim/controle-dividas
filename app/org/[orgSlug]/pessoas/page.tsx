import { PessoasPage } from "@/features/protected-pages/pessoas-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageProps = {
  params: Promise<OrgRouteParams>;
};

export default async function OrgProtectedPessoasPage({ params }: PageProps) {
  const { orgSlug } = await params;

  return <PessoasPage orgSlug={orgSlug} />;
}
