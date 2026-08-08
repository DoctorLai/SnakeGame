# Contributing to Simple Snake Game

Thanks for taking the time to contribute! This project is a small, dependency-free
Chrome extension, so getting started is quick.

## Getting started

```bash
git clone https://github.com/doctorlai/snakegame.git
cd snakegame
nvm use
npm install
```

## Development workflow

| Task                       | Command                |
| -------------------------- | ---------------------- |
| Run all CI checks          | `npm run check`        |
| Run the test suite         | `npm test`             |
| Run tests in watch mode    | `npm run test:watch`   |
| Generate a coverage report | `npm run coverage`     |
| Lint the source            | `npm run lint`         |
| Auto-fix lint issues       | `npm run lint:fix`     |
| Format files               | `npm run format`       |
| Check formatting only      | `npm run format:check` |
| Validate metadata and i18n | `npm run validate`     |
| Build the store `.zip`     | `npm run build`        |
| Check, then build          | `npm run release`      |

Please run `npm run check` before opening a pull request; CI runs the same
command on Node 22 and 24.

### Loading the extension locally

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select the `snake/` folder.
4. Open the extension popup to play.

## Project layout

- `snake/js/engine.js` — pure, framework-free game logic (fully unit-tested).
- `snake/js/game.js` — thin DOM/Canvas adapter that drives the engine.
- `snake/js/main.js`, `translate.js`, `background.js` — settings, i18n, service worker.
- `tests/` — Vitest unit tests for the engine.

## Guidelines

- Keep game logic inside `engine.js` so it stays testable.
- Add or update tests for any behaviour change; coverage is enforced in CI.
- Run `npm run check` before opening a pull request.
- Keep pull requests focused and describe the motivation in the description.

## Translations

The project has two independent translation layers:

- **In-app UI strings** live in [`snake/lang/`](snake/lang) as one `*.js` file
  per language (for example `en-us.js`, `zh-cn.js`). To add a UI language, copy
  an existing file, translate the values, register it in the `get_lang()` switch
  in [`snake/js/translate.js`](snake/js/translate.js), and add an `<option>` to
  the language selector in [`snake/main.html`](snake/main.html). When you add a
  new UI string, add its key to **every** file so no language regresses.
- **Localized extension metadata** lives in
  [`snake/_locales/`](snake/_locales) as `messages.json` files named by Chrome
  locale code (for example `en`, `fr`, `ja`). Only use
  [locale codes Chrome supports](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales).
- **Chrome Web Store description copy** lives in
  [`store-listing/description.md`](store-listing/description.md). Keep it
  concise and focused on the extension's functionality.

`npm run validate` parses every locale file and checks that all in-app
translations use the English key set and are registered in both `main.html` and
`translate.js`. Run it directly while translating, then run `npm run check`
before opening a pull request.

## Preparing a release

Maintainers should use the same numeric version in `package.json` and
`snake/manifest.json`. `npm run validate`
rejects version drift. Add the release date and notable changes to
[CHANGELOG.md](CHANGELOG.md), then run `npm run release` to validate and package
the extension.

## Security

Please do not report security vulnerabilities through public issues. Review the
[Security Policy](SECURITY.md) and report them privately instead.

## Reporting bugs and requesting features

Please use the issue templates under
[`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE) when opening an issue, and fill
in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) when you send a
change. General help and support expectations are documented in
[SUPPORT.md](SUPPORT.md).

By contributing you agree that your contributions will be licensed under the
[MIT License](LICENSE).
