setup-audio-plugins-action is a GitHub Action that installs audio plugins
through [studiorack-cli](https://github.com/studiorack/studiorack-cli).
Add it to CI workflows to prepare DAW or plugin host test environments.

The action shells out to `npx @studiorack/cli plugins install <slug>` for
every entry you provide and therefore always uses the official CLI while
keeping it scoped to the runner.

During setup the action reconfigures Studiorack so that `appDir`, `pluginsDir`,
`presetsDir`, and `projectsDir` all live inside the runner's home directory
(`~/.local/share/open-audio-stack/...` on Linux, `~/Library/...` on macOS,
`%APPDATA%` on Windows). That keeps installs user-scoped and avoids elevation
prompts on hosted runners.

## Inputs

| Name | Required | Description |
| ---- | -------- | ----------- |
| `plugins` | yes | Newline separated list of Studiorack plugin slugs (leave empty to skip installs). |
| `studiorack-version` | no | CLI version or dist-tag passed to `npx` (default `latest`). |
| `cache` | no | Set to `true` to persist the Studiorack downloads directory across jobs. |
| `installation-scope` | no | `system` (default) runs via sudo for machine-wide installs on Linux/macOS; `user` keeps installs under the runner home. |

## Usage example

```yaml
name: Install plugins
on:
  push:
  pull_request:

jobs:
  install_audio_plugins:
    runs-on: ubuntu-latest
    steps:
      - uses: atsushieno/setup-audio-plugins-action@main
        with:
          studiorack-version: latest
          cache: true
          plugins: |
            asb2m10/dexed
            sfztools/sfizz
            baconpaul/six-sines
```

When caching is enabled, the action automatically stores the Studiorack
downloads directory (which contains fetched installers) in `actions/cache`
using the plugin list and CLI version as part of the cache key.

Leaving the `plugins` input empty will skip installation entirely while still
running the optional cache restore/save steps.

> [!NOTE]
> studiorack-cli normally attempts to elevate privileges for system installs.
> The default `installation-scope: system` runs the CLI via sudo on Linux/macOS
> so plugins end up under the standard system locations. Use `installation-scope:
> user` if you prefer runner-local paths without sudo.
