"use strict";

const { configureInstallDirs, getInput, normalizePlugins, runStudiorack } = require("./lib.js");

function installPlugin(plugin, version, { useSystemScope }) {
  runStudiorack(["plugins", "install", plugin], version, { useSudo: useSystemScope });
}

async function run() {
  try {
    const pluginsInput = getInput("plugins", { required: true });
    const plugins = normalizePlugins(pluginsInput);
    const version = getInput("studiorack-version", { defaultValue: "latest" });
    const installScope = getInput("installation-scope", { defaultValue: "user" }).toLowerCase();
    const useSystemScope = installScope === "system";

    if (!["user", "system"].includes(installScope)) {
      throw new Error('installation-scope must be either "user" or "system"');
    }

    if (!useSystemScope) {
      configureInstallDirs(version);
    } else {
      console.log("Using system-wide installation scope (requires sudo).");
    }

    if (plugins.length === 0) {
      console.log("No plugin slugs provided. Skipping Studiorack installation.");
      return;
    }

    console.log(`Installing ${plugins.length} plugin(s) using studiorack@${version}...`);
    for (const plugin of plugins) {
      console.log(`::group::Installing ${plugin}`);
      installPlugin(plugin, version, { useSystemScope });
      console.log(`::endgroup::`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

run();
