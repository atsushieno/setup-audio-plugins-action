"use strict";

const crypto = require("crypto");
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const STUDIORACK_PACKAGE = "@studiorack/cli";

function normalizeInputName(name) {
  return name
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/gi, "_")
    .toUpperCase();
}

function getInput(name, { required = false, defaultValue = "" } = {}) {
  const key = `INPUT_${normalizeInputName(name)}`;
  const value = process.env[key] || "";
  if (!value && required) {
    throw new Error(`Input "${name}" is required but was not provided`);
  }
  return value || defaultValue;
}

function normalizePlugins(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function resolveAppDir() {
  const dirName = "open-audio-stack";
  if (process.platform === "win32") {
    return process.env.APPDATA || path.join(os.homedir(), dirName);
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Preferences", dirName);
  }
  return path.join(os.homedir(), ".local", "share", dirName);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function createCacheKey(plugins, version) {
  const normalized = normalizePlugins(plugins).join(",");
  const hash = crypto.createHash("sha256").update(`${version}|${normalized}`).digest("hex").slice(0, 20);
  return `studiorack-${version}-${hash}`;
}

function runStudiorack(args, version, { useSudo = false } = {}) {
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const fullArgs = ["--yes", `${STUDIORACK_PACKAGE}@${version}`, ...args];
  const env = { ...process.env, VITEST_WORKER_ID: process.env.VITEST_WORKER_ID || "gha" };
  let command = npxCmd;
  let commandArgs = fullArgs;
  if (useSudo) {
    if (process.platform === "win32") {
      throw new Error("System-wide installs via sudo are not supported on Windows runners.");
    }
    command = "sudo";
    commandArgs = ["-n", npxCmd, ...fullArgs];
  }

  const result = spawnSync(command, commandArgs, { stdio: "inherit", env });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`studiorack ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function configureInstallDirs(version) {
  const appDir = resolveAppDir();
  const dirMap = {
    appDir,
    pluginsDir: path.join(appDir, "plugins"),
    presetsDir: path.join(appDir, "presets"),
    projectsDir: path.join(appDir, "projects"),
  };

  for (const dirKey of ["appDir", "pluginsDir", "presetsDir", "projectsDir"]) {
    ensureDir(dirMap[dirKey]);
    console.log(`${dirKey} -> ${dirMap[dirKey]}`);
    runStudiorack(["config", "set", dirKey, dirMap[dirKey]], version);
  }

  return dirMap;
}

module.exports = {
  getInput,
  normalizePlugins,
  resolveAppDir,
  ensureDir,
  createCacheKey,
  runStudiorack,
  configureInstallDirs,
  STUDIORACK_PACKAGE,
};
