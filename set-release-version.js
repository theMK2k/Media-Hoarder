/**
 * set-release-version
 *
 * helper script to set the version in Media Hoarder RELEASE file names to the one from package.json
 */
const fs = require("fs");

const version = require("./package.json").version;

const files = fs.readdirSync("RELEASE");

// logger.log('files:', files);

// logger.log('version:', version);

for (let i = 0; i < files.length; i++) {
  const file = files[i];

  if (!file.includes("-VERSION-")) {
    continue;
  }

  fs.renameSync(`RELEASE/${file}`, `RELEASE/${file.replace("-VERSION-", `-${version}-`)}`);
}
