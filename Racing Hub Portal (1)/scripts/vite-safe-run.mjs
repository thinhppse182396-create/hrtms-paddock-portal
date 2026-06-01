import { spawnSync } from "node:child_process";
import { join } from "node:path";

const command = process.argv[2] ?? "dev";
const args = process.argv.slice(3);
const originalCwd = process.cwd();

function runVite(cwd) {
  const vite = join(cwd, "node_modules", "vite", "bin", "vite.js");
  return spawnSync(process.execPath, [vite, command, ...args], {
    cwd,
    env: process.env,
    stdio: "inherit",
  });
}

function findDriveAlias() {
  for (let code = "Z".charCodeAt(0); code >= "T".charCodeAt(0); code -= 1) {
    const drive = `${String.fromCharCode(code)}:`;
    const result = spawnSync("subst", [drive, originalCwd], { stdio: "ignore" });
    if (result.status === 0) return drive;
  }

  return null;
}

let driveAlias = null;
let result;

try {
  if (process.platform === "win32" && originalCwd.includes("#")) {
    driveAlias = findDriveAlias();
  }

  result = runVite(driveAlias ? `${driveAlias}\\` : originalCwd);
} finally {
  if (driveAlias) {
    spawnSync("subst", [driveAlias, "/D"], { stdio: "ignore" });
  }
}

process.exit(result?.status ?? 1);
