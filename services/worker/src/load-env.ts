import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const rootEnv = resolve(import.meta.dirname, "../../../.env");

if (existsSync(rootEnv)) {
  config({ path: rootEnv });
}
