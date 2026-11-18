import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Replaces __SITE_URL__ in index.html (used for og:image and og:url). */
function siteUrlPlugin(siteUrl: string): Plugin {
  return {
    name: "vcs-site-url",
    transformIndexHtml: (html) => html.split("__SITE_URL__").join(siteUrl),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // On Vercel the production domain is injected automatically.
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl = (env.VITE_SITE_URL || (vercelHost ? `https://${vercelHost}` : "")).replace(
    /\/$/,
    "",
  );

  return {
    plugins: [react(), tailwindcss(), siteUrlPlugin(siteUrl)],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      // Forward /api/* to the FastAPI backend while developing in "live" mode.
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8000",
          changeOrigin: true,
        },
      },
    },
    build: {
      target: "es2022",
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // Heavy libraries live in their own chunks and load only with the sections that need them.
          manualChunks: {
            three: ["three"],
            r3f: ["@react-three/fiber", "@react-three/drei"],
            charts: ["recharts"],
            motion: ["framer-motion"],
          },
        },
      },
    },
  };
});
