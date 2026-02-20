/**
 * set-portable
 *
 * helper script to set Media Hoarder to portable/non-portable before the build task (we currently do this because nodejs/javascript don't support macros)
 */
const fs = require("fs");

const minimist = require("minimist");
const { exit } = require("process");

const cmdArguments = minimist(process.argv.slice(2));

if (!cmdArguments.portable) {
  console.error("set-portable ERROR: Command Line Parameter --portable=[true,false] missing!");
  exit(1);
}

const isPORTABLE = cmdArguments.portable === "true";

let content = fs.readFileSync("./src/helpers/helpers.js", "utf8");

if (isPORTABLE) {
  content = content.replace(/const isPORTABLE = false/, "const isPORTABLE = true");
  console.log("Media Hoarder set to PORTABLE");
} else {
  content = content.replace(/const isPORTABLE = true/, "const isPORTABLE = false");
  console.log("Media Hoarder set to non-PORTABLE");
}

fs.writeFileSync("./src/helpers/helpers.js", content);
