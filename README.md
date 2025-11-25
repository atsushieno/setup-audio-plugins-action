setup-audio-plugins-action is a GitHub Action that installs audio plugins
through [studiorack-cli](https://github.com/studiorack/studiorack-cli).
Instead of relying on the npm distribution (which currently stalls on Linux),
the action clones the studiorack-cli repository, runs `npm ci && npm run build`,
and executes the freshly-built `build/index.js` to install the requested plugins.

During setup the action reconfigures Studiorack so that `appDir`, `pluginsDir`,
`presetsDir`, and `projectsDir` all live inside the runner's home directory
(`~/.local/share/open-audio-stack/...` on Linux, `~/Library/...` on macOS,
`%APPDATA%` on Windows). That keeps installs user-scoped and avoids elevation
prompts on hosted runners.

## Inputs

| Name | Required | Description |
| ---- | -------- | ----------- |
| `plugins` | yes | Newline separated list of Studiorack plugin slugs (leave empty to skip installs). |
| `studiorack-version` | no | Git ref (branch or tag) to clone from studiorack-cli (default `latest` → `main`). |
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

> [!TIP]
> The first action run for a given `studiorack-version` clones and builds the
> CLI sources, which can take a minute or two. The compiled tree is cached
> under `~/.local/share/open-audio-stack/studiorack-cli/<ref>` and reused on
> subsequent runs that request the same ref.
