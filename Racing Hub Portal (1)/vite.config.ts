// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { existsSync } from "node:fs";
import { dirname, extname, isAbsolute, resolve } from "node:path";

// Vite treats "#" in the workspace path as a URL fragment while resolving
// extensionless imports. Resolve local TypeScript files before that happens.
const isSourceFile = (path: string) => path.replaceAll("\\", "/").includes("/src/");

const resolveLocalTypeScriptImports = () => ({
  name: "resolve-local-typescript-imports",
  enforce: "pre" as const,
  resolveId(source: string, importer?: string) {
    const knownExtensions = [".ts", ".tsx", ".js", ".jsx", ".json"];
    const [sourcePath, query] = source.split("?", 2);
    if (!importer || (!sourcePath.startsWith(".") && !isAbsolute(sourcePath))) return null;

    const suffix = query ? `?${query}` : "";
    const importerPath = importer.split("?", 1)[0];
    const directCandidate = isAbsolute(sourcePath)
      ? sourcePath
      : resolve(dirname(importerPath), sourcePath);
    if (isSourceFile(directCandidate) && existsSync(directCandidate)) {
      return `${directCandidate}${suffix}`;
    }

    if (knownExtensions.includes(extname(sourcePath))) return null;
    for (const extension of [".ts", ".tsx"]) {
      const candidate = resolve(dirname(importerPath), `${sourcePath}${extension}`);
      if (isSourceFile(candidate) && existsSync(candidate)) return candidate;
    }

    return null;
  },
});

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  vite: {
    plugins: [resolveLocalTypeScriptImports()],
    resolve: {
      preserveSymlinks: true,
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
