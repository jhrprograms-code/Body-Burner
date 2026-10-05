import {
  readFile,
  mkdir,
  realpath,
  copyFile,
  writeFile,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const [manifestFile, assetsDirectory] = process.argv.slice(2);
if (!manifestFile || !assetsDirectory) {
  console.error(
    "Usage: npm run media:import -- manifest.json /absolute/path/to/licensed-assets",
  );
  process.exit(1);
}
const root = process.cwd();
const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
const catalog = JSON.parse(
  await readFile(path.join(root, "data/exercises.json"), "utf8"),
);
if (
  manifest.licenseConfirmed !== true ||
  !manifest.licenseReference ||
  !manifest.provider ||
  !Array.isArray(manifest.items)
)
  throw new Error(
    "A provider, license reference, confirmed app embedding rights and items are required.",
  );
const sourceRoot = await realpath(assetsDirectory);
const validIds = new Set(catalog.map((e) => e.id));
const seen = new Set();
const staged = [];
// Validate the entire batch before copying any media. Reject traversal and symlinks outside the asset root.
for (const item of manifest.items) {
  if (!validIds.has(item.exerciseId) || seen.has(item.exerciseId))
    throw new Error(`Unknown or duplicate exercise: ${item.exerciseId}`);
  seen.add(item.exerciseId);
  if (item.visuallyVerified !== true)
    throw new Error(
      `Confirm correct movement and equipment for ${item.exerciseId}`,
    );
  if (typeof item.file !== "string" || path.isAbsolute(item.file))
    throw new Error(
      "Asset file names must be relative to the supplied directory.",
    );
  const source = await realpath(path.resolve(sourceRoot, item.file));
  if (!source.startsWith(sourceRoot + path.sep))
    throw new Error("Asset path escapes source directory.");
  const info = await stat(source);
  if (!info.isFile() || info.size > 12000000)
    throw new Error("Each GIF must be a file smaller than 12 MB.");
  const bytes = await readFile(source);
  if (!["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString()))
    throw new Error(`${item.file} is not a GIF.`);
  const hash = createHash("sha256").update(bytes).digest("hex");
  staged.push({ ...item, source, hash });
}
const output = path.join(root, "public/exercises");
await mkdir(output, { recursive: true });
const current = JSON.parse(
  await readFile(path.join(root, "data/media.json"), "utf8"),
);
for (const item of staged) {
  const filename = `${item.exerciseId}-${item.hash.slice(0, 12)}.gif`;
  await copyFile(item.source, path.join(output, filename));
  current[item.exerciseId] = {
    url: `/exercises/${filename}`,
    provider: manifest.provider,
    license: manifest.licenseReference,
    sha256: item.hash,
  };
}
await writeFile(
  path.join(root, "data/media.json"),
  JSON.stringify(current, null, 2) + "\n",
);
console.log(
  `Imported ${staged.length} visually verified, licensed GIFs. Rebuild the app to publish them. Do not redistribute the provider's raw pack.`,
);
