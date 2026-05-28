const ORG_ROUTE_PREFIX = "/org";

const protectedToOrgSegment: Record<string, string> = {
  "/protected": "",
  "/protected/pessoas": "pessoas",
  "/protected/gastos": "gastos",
  "/protected/contas-a-pagar": "contas-a-pagar",
  "/protected/contas-a-receber": "contas-a-receber",
  "/protected/bancos": "bancos",
  "/protected/relatorios": "relatorios",
  "/protected/configuracoes": "configuracoes",
  "/protected/admin": "admin",
  "/protected/admin/usuarios": "admin/usuarios",
  "/protected/admin/permissoes": "admin/permissoes",
};

export function getOrganizationBasePath(orgSlug: string) {
  return `${ORG_ROUTE_PREFIX}/${encodeURIComponent(orgSlug)}`;
}

export function getOrganizationPath(orgSlug: string, segment = "") {
  const basePath = getOrganizationBasePath(orgSlug);
  const normalizedSegment = segment.replace(/^\/+/, "").replace(/\/+$/, "");

  return normalizedSegment ? `${basePath}/${normalizedSegment}` : basePath;
}

export function getOrgPathFromProtectedPath(protectedPath: string, orgSlug?: string | null) {
  if (!orgSlug) {
    return protectedPath;
  }

  return getOrganizationPath(orgSlug, protectedToOrgSegment[protectedPath] ?? "");
}

export function getOrgSlugFromPathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] !== "org" || !segments[1]) {
    return null;
  }

  return decodeURIComponent(segments[1]);
}
