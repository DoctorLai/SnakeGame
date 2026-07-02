# Security Policy

Simple Snake Game is a small, fully offline Manifest V3 Chrome extension. It
makes no network requests and requests only the `storage` permission (to sync
your best score via `chrome.storage.sync`). Because of this, its attack surface
is intentionally minimal — but we still take security seriously and appreciate
responsible disclosure.

## Supported versions

Security fixes are applied to the latest released version, which is published on
the Chrome Web Store and tagged in this repository.

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| < 1.3   | :x:                |

Please make sure you are running the latest version before reporting an issue,
as older releases are not patched.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
pull requests, or discussions.**

Instead, use one of the private channels below:

1. **GitHub Security Advisories (preferred).** Open a private report via the
   repository's **Security → Report a vulnerability** tab
   (<https://github.com/doctorlai/snakegame/security/advisories/new>).
2. **Email.** Contact the maintainer at **dr.zhihua.lai@gmail.com** with the
   details. Please include `Simple Snake Game security` in the subject line.

To help us triage quickly, include as much of the following as you can:

- A description of the vulnerability and its potential impact.
- The extension version and Chrome version affected.
- Step-by-step instructions to reproduce the issue.
- Any proof-of-concept code, screenshots, or logs.
- Any suggested remediation, if you have one.

## What to expect

- **Acknowledgement:** we aim to respond within **5 business days**.
- **Assessment:** we will confirm the issue and determine its severity.
- **Fix & disclosure:** valid vulnerabilities will be fixed in a timely manner.
  We will coordinate a disclosure timeline with you and credit you in the
  release notes unless you prefer to remain anonymous.

Thank you for helping keep Simple Snake Game and its users safe.
