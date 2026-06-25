import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = process.cwd();

const targets = [
  "public/home/apartment-b.jpg",
  "public/home/private-house.jpg",
  "public/home/luxury-house.jpg",
  "public/home/officetel.jpg",
  "public/home/commercial-house.jpg",
];

const backupDir = path.join(root, "public/home/_backup_originals");

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function getSizeMB(filePath) {
  const bytes = fs.statSync(filePath).size;
  return (bytes / 1024 / 1024).toFixed(2);
}

for (const relativePath of targets) {
  const inputPath = path.join(root, relativePath);
  const fileName = path.basename(inputPath);
  const backupPath = path.join(backupDir, fileName);
  const tempPath = path.join(path.dirname(inputPath), `__optimized_${fileName}`);

  if (!fs.existsSync(inputPath)) {
    console.log(`SKIP: ${relativePath} not found`);
    continue;
  }

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    console.log(`BACKUP: ${fileName}`);
  } else {
    console.log(`BACKUP EXISTS: ${fileName}`);
  }

  const before = getSizeMB(inputPath);

  await sharp(inputPath)
    .resize({
      width: 1800,
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 78,
      mozjpeg: true,
    })
    .toFile(tempPath);

  fs.renameSync(tempPath, inputPath);

  const after = getSizeMB(inputPath);

  console.log(`${fileName}: ${before}MB -> ${after}MB`);
}

console.log("Done.");