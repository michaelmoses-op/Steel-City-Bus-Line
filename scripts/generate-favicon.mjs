/**
 * Regenerate tab icons from the brand bus mark.
 * - apps/web/app/icon.png — Next.js file-based favicon (do not duplicate under public/icon.png)
 * - apps/web/public/branding/favicon-32.png — static URL for /favicon.ico rewrite
 *
 * Run from repo root: node scripts/generate-favicon.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "apps/web/public/branding/logo-mark.png");
const appIcon = path.join(root, "apps/web/app/icon.png");
const publicIcon = path.join(root, "apps/web/public/branding/favicon-32.png");

if (!fs.existsSync(src)) {
  console.error("Missing", src);
  process.exit(1);
}

for (const out of [appIcon, publicIcon]) {
  execSync(`pnpm dlx sharp-cli --input "${src}" --output "${out}" resize 32 32`, {
    stdio: "inherit",
    cwd: root,
    shell: true,
  });
}

console.log(`[favicon] ${appIcon} (${fs.statSync(appIcon).size} bytes)`);
