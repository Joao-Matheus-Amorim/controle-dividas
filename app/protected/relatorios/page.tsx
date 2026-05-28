import { RelatoriosPage } from "@/features/protected-pages/relatorios-page";

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

type PageProps = {
  searchParams?: PageSearchParams;
};

export default async function ProtectedRelatoriosPage({ searchParams }: PageProps) {
  return <RelatoriosPage searchParams={searchParams} />;
}
