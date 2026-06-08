import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("deploy vercel env sync guards", () => {
  const deployWorkflow = read(".github/workflows/deploy.yml");
  const readme = read("README.md");
  const validation = read("docs/VALIDACAO_TECNICA.md");

  it("syncs GitHub Supabase runtime values into Vercel production before deploy", () => {
    expect(deployWorkflow).toContain("sync supabase environment to vercel production");
    expect(deployWorkflow).toContain("next_public_supabase_url: ${{ vars.next_public_supabase_url }}");
    expect(deployWorkflow).toContain(
      "next_public_supabase_publishable_key: ${{ secrets.next_public_supabase_publishable_key }}",
    );
    expect(deployWorkflow).toContain("supabase_service_role_key: ${{ secrets.supabase_service_role_key }}");
    expect(deployWorkflow).toContain("vercel env add next_public_supabase_url production");
    expect(deployWorkflow).toContain("vercel env add next_public_supabase_publishable_key production");
    expect(deployWorkflow).toContain("vercel env add supabase_service_role_key production");
    expect(deployWorkflow).toContain("--force");
    expect(deployWorkflow).toContain(
      'printf "%s" "$next_public_supabase_url" | vercel env add next_public_supabase_url production',
    );
    expect(deployWorkflow).toContain(
      'printf "%s" "$next_public_supabase_publishable_key" | vercel env add next_public_supabase_publishable_key production',
    );
    expect(deployWorkflow).toContain(
      'printf "%s" "$supabase_service_role_key" | vercel env add supabase_service_role_key production',
    );
    expect(deployWorkflow).not.toContain("--value");
  });

  it("validates the Supabase URL and public API key pair before Vercel deploy", () => {
    expect(deployWorkflow).toContain("validate supabase public api key registration");
    expect(deployWorkflow).toContain("$next_public_supabase_url/rest/v1/");
    expect(deployWorkflow).toContain("--header \"apikey: $next_public_supabase_publishable_key\"");
    expect(deployWorkflow).toContain("--header \"authorization: bearer $next_public_supabase_publishable_key\"");
    expect(deployWorkflow).toContain("invalid api key|unregistered api key");
    expect(deployWorkflow).toContain(
      "next_public_supabase_publishable_key is not registered for next_public_supabase_url",
    );
  });

  it("fails frontend deploy before Vercel when Supabase runtime values are absent", () => {
    expect(deployWorkflow).toContain(
      "next_public_supabase_url must be configured in github actions repository variables",
    );
    expect(deployWorkflow).toContain(
      "next_public_supabase_publishable_key must be configured in github actions repository secrets",
    );
    expect(deployWorkflow).toContain(
      "supabase_service_role_key must be configured in github actions repository secrets",
    );
  });

  it("documents GitHub as the deploy source for Vercel Supabase runtime env", () => {
    expect(readme).toContain("sincroniza as variaveis supabase do github para o ambiente production da vercel");
    expect(readme).toContain("next_public_supabase_url");
    expect(readme).toContain("next_public_supabase_publishable_key");
    expect(readme).toContain("supabase_service_role_key");
    expect(readme).toContain("nao manter vercel production como fonte manual separada");
    expect(validation).toContain("fonte github para o runtime production da vercel");
    expect(validation).toContain("evitar drift entre github actions e vercel");
  });
});
