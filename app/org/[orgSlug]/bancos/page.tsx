import { BancosPage } from "@/features/protected-pages/bancos-page";

type OrgRouteParams = {
  orgSlug: string;
};

type PageProps = {
  params: Promise<OrgRouteParams>;
};

export default async function OrgProtectedBancosPage({ params }: PageProps) {
  const { orgSlug } = await params;

  return <BancosPage orgSlug={orgSlug} />;
}
