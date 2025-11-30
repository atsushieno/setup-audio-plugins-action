setup-audio-plugins-action is a GitHub Action that installs audio plugins
through [studiorack-cli](https://github.com/studiorack/studiorack-cli).
The action uses `npx @studiorack/cli` to install the requested plugins.

During setup the action reconfigures Studiorack so that `appDir`, `pluginsDir`,
`presetsDir`, and `projectsDir` all live inside the runner's home directory
(`~/.local/share/open-audio-stack/...` on Linux, `~/Library/...` on macOS,
`%APPDATA%` on Windows). That keeps installs user-scoped and avoids elevation
prompts on hosted runners.

## Inputs

| Name | Required | Description |
| ---- | -------- | ----------- |
| `plugins` | yes | Newline separated list of Studiorack plugin slugs (leave empty to skip installs). |
| `cache` | no | Set to `true` to persist the Studiorack downloads directory across jobs. |

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
          cache: true
          plugins: |
            asb2m10/dexed
            sfztools/sfizz
            baconpaul/six-sines
```

This action uses studiorack-cli version 3.0.1.

When caching is enabled, the action automatically stores the Studiorack
downloads directory (which contains fetched installers) in `actions/cache`
using the plugin list as part of the cache key.

Leaving the `plugins` input empty will skip installation entirely while still
running the optional cache restore/save steps.
