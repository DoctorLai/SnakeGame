# Privacy Policy

_Last updated: 2 July 2026_

Simple Snake Game is a small, fully offline Manifest V3 Chrome extension. Your
privacy matters: the extension does **not** collect, transmit, sell, or share any
personal information, and it makes **no** network requests.

## Summary

- **No personal data is collected.**
- **No tracking, analytics, ads, or third-party code.**
- **No data ever leaves your browser** through the extension.
- The only data stored is your game settings, kept by Chrome via the
  `chrome.storage.sync` API.

## Information we collect

None. Simple Snake Game does not collect personally identifiable information,
usage analytics, telemetry, cookies, IP addresses, or location data. There are no
accounts to create and no logins.

## Data stored on your device

To make the game usable, the extension stores a small amount of gameplay
configuration using Chrome's [`chrome.storage.sync`](https://developer.chrome.com/docs/extensions/reference/api/storage)
API, under a single key (`snake_game_settings`):

| Data               | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| Best score         | Show and preserve your highest score            |
| UI language        | Remember your chosen interface language         |
| Speed setting      | Remember your preferred game speed              |
| Border (wall) mode | Remember whether walls are solid or wrap-around |

This data is not personal information and is never sent to the developer or any
third party.

### About Chrome Sync

If you are signed in to Chrome and have Sync enabled, Chrome may synchronize the
data above across your own devices through your Google Account. This
synchronization is performed by Google Chrome, not by the extension — Simple
Snake Game has no servers and never receives this data. It is governed by
[Google's Privacy Policy](https://policies.google.com/privacy). If Sync is
disabled, the settings remain only on your local device.

## Permissions

The extension requests a single permission:

- **`storage`** — used solely to save and restore the game settings listed above.
  It is not used to read your browsing history, tabs, or any website content.

## What we do not do

- We do not make network or API requests of any kind.
- We do not use analytics, telemetry, cookies, or fingerprinting.
- We do not display advertisements.
- We do not include third-party tracking libraries.
- We do not sell, rent, or share any data.

## Data retention and deletion

Your settings persist until you remove them. You can delete all stored data at any
time by:

- **Uninstalling the extension** (right-click the extension icon → **Remove**), or
- Clearing extension data via `chrome://extensions` (enable **Developer mode**,
  then use the storage/inspect tools), or your browser's site-data controls.

Uninstalling the extension removes its locally stored settings.

## Children's privacy

Simple Snake Game is a simple game suitable for all ages. Because it collects no
personal information, it does not knowingly collect data from children or anyone
else.

## Changes to this policy

If this policy changes, the updated version will be published in this repository
with a new "Last updated" date. Material changes will accompany a new extension
release.

## Contact

Questions about this privacy policy? Please open an issue at
<https://github.com/doctorlai/snakegame/issues> or contact the maintainer at
**dr.zhihua.lai@gmail.com**. Security concerns are covered by our
[Security Policy](SECURITY.md).
