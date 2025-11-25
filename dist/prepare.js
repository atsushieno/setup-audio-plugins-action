"use strict";

const fs = require("fs");
const path = require("path");
const { createCacheKey, ensureDir, getInput, normalizePlugins, resolveAppDir } = require("./lib.js");

function writeOutput(name, value) {
  const serialized = `${name}=${value}`;
  console.log(serialized);
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    fs.appendFileSync(outputPath, `${serialized}\n`);
  }
}

async function run() {
  try {
    const pluginsInput = getInput("plugins", { required: true });
    const version = getInput("studiorack-version", { defaultValue: "latest" });
    const plugins = normalizePlugins(pluginsInput);
    const appDir = resolveAppDir();
    const downloadsDir = path.join(appDir, "downloads");
    ensureDir(downloadsDir);
    const cacheKey = createCacheKey(pluginsInput, version);
    const cachePrefix = `studiorack-${version}-`;

    writeOutput("app_dir", appDir);
    writeOutput("downloads_dir", downloadsDir);
    writeOutput("cache_key", cacheKey);
    writeOutput("cache_prefix", cachePrefix);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

run();
