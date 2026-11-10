const { copyFile, mkdir, mkdtemp, readdir, rename, rm } = require("node:fs/promises");
const path = require("node:path");

// Resolve the icon toolset from the version used for packaging.
const builderDir = path.dirname(require.resolve("electron-builder/package.json"));
const { runIconsTool } = require(require.resolve("app-builder-lib/out/toolsets/icons", { paths: [builderDir] }));

async function generateIcons() {
  const inputFile = path.join(__dirname, "public", "icon.png");
  const buildDir = path.join(__dirname, "build");
  const iconDir = path.join(buildDir, "icons");

  await mkdir(iconDir, { recursive: true });
  const outDir = await mkdtemp(path.join(buildDir, ".icons-"));

  try {
    for (const outputFormat of ["set", "ico", "icns"]) {
      await runIconsTool({ inputFile, outputFormat, outDir });
    }
    await copyFile(inputFile, path.join(outDir, "1024x1024.png"));

    for (const file of await readdir(outDir)) {
      await rename(path.join(outDir, file), path.join(iconDir, file));
    }
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }

  console.log("Generated application icons in build/icons.");
}

generateIcons().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
