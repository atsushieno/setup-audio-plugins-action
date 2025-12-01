It is a hacky project that @atsushieno let Claude Code write almost everything.

setup-audio-plugins-action is a GitHub Action that installs audio plugins
through [studiorack-cli](https://github.com/studiorack/studiorack-cli).
The action uses `npx @studiorack/cli` to install the requested plugins.

The action installs plugins system-wide and requires sudo privileges on
Linux and macOS. On GitHub Actions hosted runners, sudo access is available
without password prompts, so the installation works seamlessly.

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
