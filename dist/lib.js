"use strict";

const crypto = require("crypto");
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const STUDIORACK_REPO = "https://github.com/studiorack/studiorack-cli.git";

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
  const cliEntrypoint = ensureStudiorackCli(version);
  const env = { ...process.env };
  const nodeCmd = process.execPath;
  let command = nodeCmd;
  let commandArgs = [cliEntrypoint, ...args];
  if (useSudo) {
    if (process.platform === "win32") {
      throw new Error("System-wide installs via sudo are not supported on Windows runners.");
    }
    command = "sudo";
    commandArgs = ["-n", nodeCmd, ...commandArgs];
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

function ensureStudiorackCli(version) {
  const ref = version === "latest" ? "main" : version;
  const normalizedRef = ref.replace(/[^a-zA-Z0-9._-]/g, "_");
  const baseDir = path.join(resolveAppDir(), "studiorack-cli", normalizedRef);
  const entry = path.join(baseDir, "build", "index.js");

  if (fs.existsSync(entry)) {
    return entry;
  }

  ensureDir(path.dirname(baseDir));
  cloneRepo(ref, baseDir);
  installDependencies(baseDir);
  buildCli(baseDir);

  if (!fs.existsSync(entry)) {
    throw new Error(`Failed to build studiorack-cli (missing ${entry})`);
  }

  return entry;
}

function cloneRepo(ref, destination) {
  if (fs.existsSync(destination)) {
    return;
  }

  const gitCmd = process.platform === "win32" ? "git.exe" : "git";
  const args = ["clone", "--depth", "1", "--branch", ref, STUDIORACK_REPO, destination];
  const result = spawnSync(gitCmd, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Failed to clone studiorack-cli (${ref})`);
  }
}

function installDependencies(directory) {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCmd, ["ci"], { cwd: directory, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("npm ci failed for studiorack-cli");
  }
}

function buildCli(directory) {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npmCmd, ["run", "build"], { cwd: directory, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("npm run build failed for studiorack-cli");
  }
}

module.exports = {
  getInput,
  normalizePlugins,
  resolveAppDir,
  ensureDir,
  createCacheKey,
  runStudiorack,
  configureInstallDirs,
};
