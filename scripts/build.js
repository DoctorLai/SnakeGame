"use strict";

/**
 * Build script: package the Chrome extension in `snake/` into a versioned
 * `.zip` under `dist/`, ready to upload to the Chrome Web Store.
 *
 * The archive contains the *contents* of `snake/` (so `manifest.json` sits at
 * the zip root, which is what the Chrome Web Store expects). Run with:
 *
 *   npm run build
 */

const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "snake");
const distDir = path.join(root, "dist");

function readVersion() {
  const manifestPath = path.join(sourceDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!manifest.version) {
    throw new Error("snake/manifest.json is missing a version field");
  }
  return manifest.version;
}

function build() {
  if (!fs.existsSync(path.join(sourceDir, "manifest.json"))) {
    throw new Error(`Extension source not found at ${sourceDir}`);
  }

  fs.mkdirSync(distDir, { recursive: true });

  const version = readVersion();
  const outFile = path.join(distDir, `simple-snake-game-v${version}.zip`);

  // Remove any stale archive so the reported size is accurate.
  if (fs.existsSync(outFile)) {
    fs.rmSync(outFile);
  }

  const output = fs.createWriteStream(outFile);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      const kb = (archive.pointer() / 1024).toFixed(1);
      console.log(`Created ${path.relative(root, outFile)} (${kb} KB, ${archive.pointer()} bytes)`);
      resolve(outFile);
    });

    archive.on("warning", (err) => {
      if (err.code === "ENOENT") {
        console.warn(err.message);
      } else {
        reject(err);
      }
    });
    archive.on("error", reject);

    archive.pipe(output);
    archive.glob("**/*", {
      cwd: sourceDir,
      ignore: ["**/.DS_Store", "**/Thumbs.db"],
      dot: false
    });
    archive.finalize();
  });
}

build().catch((err) => {
  console.error(`Build failed: ${err.message}`);
  process.exitCode = 1;
});
