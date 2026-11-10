# BudScout mobile browser tests

This suite runs on pull requests and manually from GitHub Actions. It checks the Ohio map's tile positioning, visible tiles, map dimensions, dragging, List/Map switching, and demo comparison flow in mobile Chromium and WebKit (Safari engine emulation). It does **not** run on a physical iPhone.

## Run locally

Install Node.js 22+, Python 3 and dependencies:

```sh
npm install
npx playwright install chromium webkit
npm run test:e2e
```

The map test requires network access to Leaflet's CDN and OpenStreetMap tile servers. A failed external request can cause a test failure even when application code is correct; review Playwright traces/screenshots in the GitHub Actions artifact. Do not load-test public tile/geocoding services.

**Before merging:** inspect the GitHub Actions result and, for map layout changes, manually verify on iPhone Safari. Never infer physical-device compatibility from emulation alone.
