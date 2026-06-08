import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { existsSync } from "node:fs";
import { dirname, extname, isAbsolute, resolve } from "node:path";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

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

export default defineConfig({
  plugins: [
    resolveLocalTypeScriptImports(),
    tsConfigPaths(),
    tanstackStart({ server: { entry: "server" } }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    preserveSymlinks: true,
  },
});
