# Contributing to Simple Snake Game

Thanks for taking the time to contribute! This project is a small, dependency-free
Chrome extension, so getting started is quick.

## Getting started

```bash
git clone https://github.com/doctorlai/snakegame.git
cd snakegame
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
| Build the store `.zip`     | `npm run build`        |
| Check, then build          | `npm run release`      |

Please run `npm run check` before opening a pull request; CI runs the same
command on Node 18, 20 and 22.

### Loading the extension locally

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select the `snake/` folder.
4. Open the extension popup to play.

## Project layout

- `snake/js/engine.js` — pure, framework-free game logic (fully unit-tested).
- `snake/js/game.js` — thin DOM/Canvas adapter that drives the engine.
- `snake/js/main.js`, `translate.js`, `background.js` — settings, i18n, service worker.
- `tests/` — Jest unit tests for the engine.

## Guidelines

- Keep game logic inside `engine.js` so it stays testable.
- Add or update tests for any behaviour change; coverage is enforced in CI.
- Run `npm run check` before opening a pull request.
- Keep pull requests focused and describe the motivation in the description.

## Reporting bugs and requesting features

Please use the issue templates under
[`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE) when opening an issue.

By contributing you agree that your contributions will be licensed under the
[MIT License](LICENSE).
