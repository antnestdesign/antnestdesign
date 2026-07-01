import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const root = process.cwd();

const targets = ["public/home", "public/projects"];
const maxWidth = 1800;
const quality = 76;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith("_backup")) continue;
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function isSourceImage(file) {
  const ext = path.extname(file).toLowerCase();
  return [".jpg", ".jpeg", ".png"].includes(ext);
}

async function optimize(file) {
  const parsed = path.parse(file);
  const output = path.join(parsed.dir, `${parsed.name}.webp`);

  await sharp(file)
    .rotate()
    .resize({
      width: maxWidth,
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 6,
    })
    .toFile(output);

  const before = (await fs.stat(file)).size;
  const after = (await fs.stat(output)).size;

  console.log(
    `${path.relative(root, file)} -> ${path.relative(root, output)} | ${(
      before /
      1024 /
      1024
    ).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB`
  );
}

async function main() {
  for (const target of targets) {
    const dir = path.join(root, target);

    try {
      await fs.access(dir);
    } catch {
      continue;
    }

    const files = await walk(dir);
    const images = files.filter(isSourceImage);

    for (const file of images) {
      await optimize(file);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});