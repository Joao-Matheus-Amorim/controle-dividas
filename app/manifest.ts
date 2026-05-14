import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FamilyFinance",
    short_name: "FamilyFinance",
    description: "Painel financeiro familiar para controle de gastos, contas, bancos e permissões.",
    start_url: "/protected",
    scope: "/",
    display: "standalone",
    background_color: "#080810",
    theme_color: "#8b72f8",
    orientation: "portrait-primary",
    categories: ["finance", "productivity"],
    lang: "pt-BR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
