"use strict";

const { configureInstallDirs, getInput, normalizePlugins, runStudiorack } = require("./lib.js");

function installPlugin(plugin, version) {
  runStudiorack(["plugins", "install", plugin], version);
}

async function run() {
  try {
    const pluginsInput = getInput("plugins", { required: true });
    const plugins = normalizePlugins(pluginsInput);
    const version = "3.0.2";

    configureInstallDirs(version);

    if (plugins.length === 0) {
      console.log("No plugin slugs provided. Skipping Studiorack installation.");
      return;
    }

    console.log(`Installing ${plugins.length} plugin(s) using studiorack@${version}...`);
    runStudiorack(["plugins", "list"], version);
    for (const plugin of plugins) {
      console.log(`::group::Installing ${plugin}`);
      installPlugin(plugin, version);
      console.log(`::endgroup::`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

run();
