import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
const importer = path.resolve("scripts/import-media.mjs");
function fixture(
  fn: (
    root: string,
    manifest: any,
    run: () => ReturnType<typeof spawnSync>,
  ) => void,
) {
  const root = mkdtempSync(path.join(tmpdir(), "body-burner-media-"));
  mkdirSync(path.join(root, "data"));
  mkdirSync(path.join(root, "assets"));
  writeFileSync(
    path.join(root, "data/exercises.json"),
    JSON.stringify([{ id: "E002" }]),
  );
  writeFileSync(path.join(root, "data/media.json"), "{}");
  writeFileSync(
    path.join(root, "assets/example.gif"),
    Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64",
    ),
  );
  const manifest = {
    provider: "test-only",
    licenseReference: "fixture",
    licenseConfirmed: true,
    items: [
      { exerciseId: "E002", file: "example.gif", visuallyVerified: true },
    ],
  };
  const run = () => {
    writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest));
    return spawnSync(
      process.execPath,
      [importer, path.join(root, "manifest.json"), path.join(root, "assets")],
      { cwd: root, encoding: "utf8" },
    );
  };
  try {
    fn(root, manifest, run);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
test("media import refuses unconfirmed licensing", () =>
  fixture((_root, m, run) => {
    m.licenseConfirmed = false;
    const r = run();
    assert.notEqual(r.status, 0);
    assert.match(String(r.stderr), /confirmed app embedding rights/);
  }));
test("media import rejects path escape before copying bytes", () =>
  fixture((root, m, run) => {
    writeFileSync(path.join(root, "outside.gif"), "GIF89a");
    m.items[0].file = "../outside.gif";
    const r = run();
    assert.notEqual(r.status, 0);
    assert.match(String(r.stderr), /escapes source directory/);
    assert.equal(
      readFileSync(path.join(root, "data/media.json"), "utf8"),
      "{}",
    );
  }));
test("verified media produces a hashed local asset and matching manifest", () =>
  fixture((root, _m, run) => {
    const r = run();
    assert.equal(r.status, 0, String(r.stderr));
    const map = JSON.parse(
      readFileSync(path.join(root, "data/media.json"), "utf8"),
    );
    assert.match(map.E002.url, /^\/exercises\/E002-[a-f0-9]{12}\.gif$/);
    assert.equal(map.E002.sha256.length, 64);
    assert.deepEqual(
      readFileSync(path.join(root, "public", map.E002.url)),
      readFileSync(path.join(root, "assets/example.gif")),
    );
  }));
