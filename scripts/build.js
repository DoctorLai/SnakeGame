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
const { PNG } = require("pngjs");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "snake");
const distDir = path.join(root, "dist");
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const requiredIconSizes = ["16", "32", "48", "128"];

function readManifest() {
  const manifestPath = path.join(sourceDir, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!manifest.version) {
    throw new Error("snake/manifest.json is missing a version field");
  }
  return manifest;
}

function validateIcon(relativePath, expectedSize) {
  const filePath = path.join(sourceDir, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Manifest icon is missing: ${relativePath}`);
  }

  const data = fs.readFileSync(filePath);
  if (data.length < pngSignature.length || !data.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`Manifest icon is not a PNG: ${relativePath}`);
  }

  let offset = pngSignature.length;
  const chunkTypes = [];

  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > data.length) {
      throw new Error(`Manifest icon has a truncated PNG chunk: ${relativePath}`);
    }

    const type = data.toString("ascii", offset + 4, offset + 8);
    chunkTypes.push(type);
    if (type === "IEND" && length !== 0) {
      throw new Error(`Manifest icon has an invalid IEND chunk: ${relativePath}`);
    }

    offset = chunkEnd;
    if (type === "IEND") break;
  }

  const middleChunks = chunkTypes.slice(1, -1);
  if (
    chunkTypes[0] !== "IHDR" ||
    chunkTypes.at(-1) !== "IEND" ||
    middleChunks.length === 0 ||
    offset !== data.length
  ) {
    throw new Error(`Manifest icon has an invalid PNG structure: ${relativePath}`);
  }
  const unexpectedChunks = middleChunks.filter((type) => type !== "IDAT");
  if (unexpectedChunks.length > 0) {
    throw new Error(
      `Manifest icon contains unsupported metadata (${unexpectedChunks.join(", ")}): ${relativePath}`
    );
  }

  let image;
  try {
    image = PNG.sync.read(data, { checkCRC: true, skipRescale: true });
  } catch (error) {
    throw new Error(`Manifest icon cannot be decoded: ${relativePath}`, { cause: error });
  }
  if (
    expectedSize !== undefined &&
    (image.width !== expectedSize || image.height !== expectedSize)
  ) {
    throw new Error(
      `Manifest icon ${relativePath} must be ${expectedSize}x${expectedSize}, found ${image.width}x${image.height}`
    );
  }
  if (expectedSize === undefined && image.width !== image.height) {
    throw new Error(`Manifest icon must be square: ${relativePath}`);
  }
}

function validateManifestIcons(manifest) {
  const icons = manifest.icons;
  if (!icons || typeof icons !== "object" || Array.isArray(icons)) {
    throw new Error("snake/manifest.json must declare extension icons");
  }
  for (const size of requiredIconSizes) {
    if (typeof icons[size] !== "string" || !icons[size]) {
      throw new Error(`snake/manifest.json is missing its ${size}x${size} icon`);
    }
  }
  validateIconDictionary(icons, "manifest icons");

  const actionIcon = manifest.action && manifest.action.default_icon;
  if (typeof actionIcon === "string" && actionIcon) {
    validateIcon(actionIcon);
  } else if (actionIcon && typeof actionIcon === "object" && !Array.isArray(actionIcon)) {
    validateIconDictionary(actionIcon, "action icons");
  } else if (actionIcon !== undefined) {
    throw new Error("snake/manifest.json has an invalid action.default_icon");
  }
}

function validateIconDictionary(icons, label) {
  for (const [size, relativePath] of Object.entries(icons)) {
    if (!/^[1-9]\d*$/.test(size) || !Number.isSafeInteger(Number(size))) {
      throw new Error(`snake/manifest.json has an invalid ${label} size: ${size}`);
    }
    if (typeof relativePath !== "string" || !relativePath) {
      throw new Error(`snake/manifest.json has an invalid ${label} path for size ${size}`);
    }
    validateIcon(relativePath, Number(size));
  }
}

async function build() {
  if (!fs.existsSync(path.join(sourceDir, "manifest.json"))) {
    throw new Error(`Extension source not found at ${sourceDir}`);
  }

  const manifest = readManifest();
  const version = manifest.version;
  const outFile = path.join(distDir, `simple-snake-game-v${version}.zip`);

  fs.mkdirSync(distDir, { recursive: true });
  fs.rmSync(outFile, { force: true });
  validateManifestIcons(manifest);

  const output = fs.createWriteStream(outFile);
  const { ZipArchive } = await import("archiver");
  const archive = new ZipArchive({ zlib: { level: 9 } });

  try {
    await new Promise((resolve, reject) => {
      output.on("close", () => {
        const kb = (archive.pointer() / 1024).toFixed(1);
        console.log(
          `Created ${path.relative(root, outFile)} (${kb} KB, ${archive.pointer()} bytes)`
        );
        resolve();
      });
      output.on("error", reject);

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
  } catch (error) {
    fs.rmSync(outFile, { force: true });
    throw error;
  }

  return outFile;
}

build().catch((err) => {
  console.error(`Build failed: ${err.message}`);
  process.exitCode = 1;
});
