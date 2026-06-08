import { spawnSync } from "node:child_process";
import { cpSync, copyFileSync, mkdtempSync, rmdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const originalCwd = process.cwd();

function runVitest(cwd, env = process.env) {
  const vitest = join(cwd, "node_modules", "vitest", "vitest.mjs");
  return spawnSync(process.execPath, [vitest, "run", ...process.argv.slice(2)], {
    cwd,
    env,
    stdio: "inherit",
  });
}

function runFromTemporaryMirror() {
  const mirror = mkdtempSync(join(tmpdir(), "hrtms-racing-portal-"));
  const mirrorModules = join(mirror, "node_modules");

  try {
    cpSync(join(originalCwd, "src"), join(mirror, "src"), { recursive: true });
    for (const file of ["package.json", "tsconfig.json", "vite.config.ts"]) {
      copyFileSync(join(originalCwd, file), join(mirror, file));
    }
    symlinkSync(join(originalCwd, "node_modules"), mirrorModules, "junction");

    const nodeOptions = [
      process.env.NODE_OPTIONS,
      "--preserve-symlinks",
      "--preserve-symlinks-main",
    ].filter(Boolean).join(" ");

    return runVitest(mirror, { ...process.env, NODE_OPTIONS: nodeOptions });
  } finally {
    try {
      rmdirSync(mirrorModules);
    } catch {}
    rmSync(mirror, { recursive: true, force: true });
  }
}

const result = process.platform === "win32" && originalCwd.includes("#")
  ? runFromTemporaryMirror()
  : runVitest(originalCwd);

process.exit(result.status ?? 1);
