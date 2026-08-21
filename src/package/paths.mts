import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function isDirectory(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function packageRoot(moduleUrl = import.meta.url): string {
  return resolve(dirname(fileURLToPath(moduleUrl)), "..", "..");
}

export async function resolveBundleRoot(
  override = process.env.SARATHI_BUNDLE_ROOT,
  moduleUrl = import.meta.url,
): Promise<string> {
  if (override) {
    const expanded =
      override === "~"
        ? homedir()
        : override.startsWith("~/") || override.startsWith("~\\")
          ? resolve(homedir(), override.slice(2))
          : override;
    const selected = resolve(expanded);
    if (!(await isDirectory(selected)))
      throw new Error(`bundle root does not exist: ${selected}`);
    return selected;
  }

  const root = packageRoot(moduleUrl);
  const bundled = resolve(root, "bundle");
  if (await isDirectory(bundled)) return bundled;
  if (await isDirectory(resolve(root, "scripts"))) return root;
  throw new Error("Sarathi package assets are missing; reinstall sarathi-sdlc");
}
