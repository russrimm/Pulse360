# Copilot User Assets

Place your personal Copilot assets here so bootstrap can copy them into your VS Code user prompts folder.

Suggested layout:

- `agents/` for `*.agent.md`
- `skills/` for skill folders and `SKILL.md`
- `prompts/` for `*.prompt.md` templates

These files are copied by `scripts/bootstrap-dotfiles.mjs` using the `copilotAssets` section in `.dotfiles/bootstrap-manifest.json`.
