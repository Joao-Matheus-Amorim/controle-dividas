import { BancosPage } from "@/app/protected/bancos/page";

type OrgPageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgBancosPage({ params }: OrgPageProps) {
  const { orgSlug } = await params;

  return <BancosPage orgSlug={orgSlug} />;
}
