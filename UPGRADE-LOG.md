# Dependency Upgrade Log

This document tracks all dependency upgrades, breaking changes, and workarounds applied during the modernization of Media-Hoarder.

**Start Date:** 2026-01-12
**Target:** Node.js 22 LTS, Electron 39, Vue 3, Vuetify 3
**Goal:** Upgrade all 47 dependencies and resolve 36 security vulnerabilities

---

## Phase 0: Preparation & Tooling (Days 1-3)

**Status:** In Progress
**Date Started:** 2026-01-12

### Environment Setup

- **Current Node.js:** 14.17.5
- **Target Node.js:** 22.x.x (will switch after dependencies are compatible)
- **Git Branch:** update-dependencies
- **Initial Tag:** phase-0-start

### Actions Taken

1. ✅ Confirmed nvm-windows 1.1.10 installed
2. ✅ Confirmed Node.js 22 already available via nvm
3. ✅ Created git branch: update-dependencies
4. ✅ Created initial tag: phase-0-start
5. ✅ Created UPGRADE-LOG.md (this file)

### Notes

- Decided to **stay on Node.js 14** for Phases 0-3 to avoid breaking current dependencies
- Will switch to Node.js 22 after dependencies are upgraded in Phase 4+

---

## Phase 1: Foundation Upgrades (Days 4-7)

**Status:** ✅ Complete
**Date Completed:** 2026-01-13

### Completed Changes

- ✅ Upgraded Node.js-compatible utilities:
  - async 3.0.1 → 3.2.6
  - fs-extra 10.0.0 → 11.3.3 (added to transpileDependencies)
  - jsonfile 6.0.1 → 6.2.0
  - loglevel 1.7.1 → 1.9.2
  - minimist 1.2.5 → 1.2.8
  - moment 2.29.1 → 2.30.1
  - semver 7.3.5 → 7.7.3
  - xml2js 0.4.23 → 0.6.2
- ✅ Fixed roboto-fontface wildcard version: "\*" → "0.10.0"
- ✅ sqlite3: Kept at 5.1.6 (5.1.7 lacks prebuilt binaries for Electron 13)
- ✅ cheerio: Kept at 1.0.0-rc.10 (newer versions require Node 18+)
- ✅ Removed version pinning violations (^) from package.json

### Deferred Changes

- ❌ Replace `request` → `axios` - **DEFERRED** due to app architecture (see Breaking Changes)
- ❌ Remove `@babel/polyfill` → `core-js` - **DEFERRED** with axios migration

---

## Phase 2: Electron Upgrade (Days 8-14)

**Status:** 🚧 In Progress
**Detailed Plan:** See [PHASE-2-PLAN.md](PHASE-2-PLAN.md)

### Phase 2a: Electron 13.6.6 → 22.3.27 (Node 14.16 → 16.17)

**Status:** ✅ Complete
**Date Completed:** 2026-01-14

#### Completed Changes

- ✅ Upgraded @electron/remote 2.0.1 → 2.1.3
- ✅ Upgraded Electron 13.6.6 → 22.3.27
- ✅ Fixed breaking change: Replaced `new-window` event with `setWindowOpenHandler()`
- ✅ Fixed breaking change: Removed deprecated `app.allowRendererProcessReuse`
- ✅ Added `require("@electron/remote/main").enable(win.webContents)` for Electron 14+ compatibility
- ✅ Rebuilt sqlite3 5.1.6 for Electron 22 (Node.js 16.17.1)
- ✅ Vulnerabilities reduced: 446 → 437 (9 resolved)
- ✅ Manual testing passed

#### Files Modified

- [src/background.js](src/background.js) - Added shell import, removed deprecated property, updated window open handler, enabled @electron/remote
- [package.json](package.json) - Updated Electron and @electron/remote versions
- package-lock.json - Updated dependencies

#### Notes

- Sandboxing changes (Electron 20+) - No action needed, current settings still work
- Native window opening - Tested and working with new `setWindowOpenHandler()`
- All dialogs using @electron/remote working correctly

### Phase 2b: Electron 22.3.27 → 28.3.3 (Node 16.17 → 18.18)

**Status:** ✅ Complete
**Date Completed:** 2026-01-15

#### Completed Changes

- ✅ Upgraded Electron 22.3.27 → 28.3.3
- ✅ Updated README.md: Removed Windows 7/8 support references
- ✅ Migrated `protocol.registerFileProtocol()` → `protocol.handle()` with `net.fetch()`
- ✅ Registered `local-resource` scheme in `protocol.registerSchemesAsPrivileged()`
- ✅ Added `pathToFileURL()` for proper Windows path handling
- ✅ Fixed package.json `main` field: `background.js` → `./background.js`
- ✅ sqlite3 5.1.6 kept (better-sqlite3 migration deferred to Phase 2d)
- ✅ Vulnerabilities reduced: 437 → 436

#### Breaking Changes Addressed

**1. Protocol Handler Migration (src/background.js)**

- Changed from callback-based `protocol.registerFileProtocol()` to Promise-based `protocol.handle()`
- Added `net` import from electron
- Registered `local-resource` scheme with `supportFetchAPI: true`
- Implemented proper Windows path handling:
  - Decode URI
  - Fix double slashes from URL parsing
  - Add colon after drive letter
  - Convert to backslashes
  - Use `pathToFileURL()` for proper file:// URL creation

**2. Windows 7/8 Support Dropped (Electron 23+)**

- Updated README.md to remove Windows 7/8 references

#### Notes

- No `ipcRenderer.sendTo()` usage found (breaking change didn't apply)
- No `setTrafficLightPosition()` usage found (breaking change didn't apply)
- better-sqlite3 migration deferred to Phase 2d (requires Node 20+)
- Still using host Node 14 for builds (will upgrade to Node 22 in Phase 2d)

### Phase 2c: Electron 28.3.3 → 33.4.1 (Node 18.18 → 20.18)

**Status:** ✅ Complete
**Date Completed:** 2026-01-15

#### Completed Changes

- ✅ Upgraded Electron 28.3.3 → 33.4.1
- ✅ Rebuilt sqlite3 5.1.6 for Electron 33 (Node.js 20.18)
- ✅ Vulnerabilities: 436 (unchanged)

#### Breaking Changes Analysis

- **BrowserView → WebContentsView:** Not used in codebase
- **Crash event handlers:** Not used in codebase
- **File.path usage:** Not used in codebase
- **Native modules (C++20):** sqlite3 rebuilt successfully with prebuilt binaries

#### Notes

- Very clean upgrade - no breaking changes applied to this codebase
- All existing functionality tested and working

### Phase 2d: Electron 33.4.1 → 39.2.7 (Node 20.18 → 22.20)

**Status:** ✅ Complete
**Date Completed:** 2026-01-15

#### Completed Changes

- ✅ Upgraded Electron 33.4.1 → 39.2.7
- ✅ Rebuilt sqlite3 5.1.6 for Electron 39 (Node.js 22.20)
- ✅ Vulnerabilities: 436 → 435 (1 resolved)

#### Breaking Changes Analysis

- **plugin-crashed event:** Not used in codebase
- **--host-rules:** Not used in codebase
- **macOS 11 support:** Only affects macOS builds (documentation)

#### Known Deprecation Warnings (Non-blocking)

- `DEP0128` (Invalid 'main' field in dist_electron) - vue-cli-plugin-electron-builder issue, fixed in Phase 3
- `DEP0040` (punycode deprecated) - From request/cheerio dependencies
- `session.getPreloads/setPreloads` - @electron/remote 2.1.3 not updated for Electron 39 yet

#### Host Node.js Version

- ❌ **Node 22 incompatible with Webpack 4** - `error:0308010C:digital envelope routines::unsupported`
- Webpack 4 uses MD4 hashing removed in OpenSSL 3.0 (Node 17+)
- **Keeping Node 14 until Phase 3** (Vue CLI 5 / Webpack 5 upgrade)
- Electron 39's embedded Node 22.20 works fine - only affects build tooling

#### Notes

- All deprecation warnings are non-blocking
- App runs smoothly with no browser console errors
- Still requires Node.js 14.x for development and builds (Webpack 4 limitation)
- Node 22 upgrade deferred to Phase 3 (Webpack 5)

---

## Phase 3: Vue CLI & Build Tool Upgrades (Days 15-18)

**Status:** ✅ Complete
**Date Completed:** 2026-01-16

### Completed Changes

- ✅ Upgraded Vue CLI 4.5.13 → 5.0.8
- ✅ Upgraded Webpack 4 → 5 (via Vue CLI)
- ✅ Upgraded vue-cli-plugin-electron-builder 2.1.1 → 3.0.0-alpha.4
- ✅ Upgraded ESLint 6.8.0 → 8.57.1
- ✅ Upgraded Prettier 2.4.1 → 3.4.2
- ✅ Replaced babel-eslint → @babel/eslint-parser 7.23.10
- ✅ Upgraded eslint-plugin-vue 6.2.2 → 9.33.0
- ✅ Upgraded eslint-plugin-prettier 3.4.1 → 5.2.1
- ✅ Upgraded @vue/eslint-config-prettier 6.0.0 → 8.0.0
- ✅ Upgraded sass-loader 10.2.0 → 13.3.3
- ✅ Upgraded vue-cli-plugin-vuetify 2.4.2 → 2.5.8
- ✅ Replaced @cliqz/adblocker-electron 1.22.7 → @ghostery/adblocker-electron 2.13.4
- ✅ **Node.js 14 → 22 for development and builds**

### Breaking Changes Addressed

**1. ESLint Configuration (.eslintrc.js)**

- Changed parser from `babel-eslint` to `@babel/eslint-parser`
- Added `requireConfigFile: false` to parserOptions
- Disabled `vue/multi-word-component-names` rule (too strict for existing components)
- Disabled `vue/no-mutating-props` rule (existing code patterns)

**2. Prettier 3.x Formatting**

- Ran `npm run format` to fix all formatting differences
- Minor whitespace/line break changes across codebase

**3. Node.js Version**

- Updated `.nvmrc`: 14.17.5 → 22
- Updated `engines` in package.json: `>=14.17.5 <15.0.0` → `>=22.0.0 <23.0.0`
- Updated all npm scripts: `check-node-version --node ^14.17` → `^22`

**4. Adblocker Package Renamed**

- @cliqz/adblocker-electron → @ghostery/adblocker-electron
- Updated import in src/background.js
- Fixes preload script absolute path error on Electron 39

### Remaining Warnings (Non-blocking)

- `DEP0128` (main field in dist_electron) - vue-cli-plugin-electron-builder quirk
- `DEP0040` (punycode) - From request/cheerio dependencies (Phase 6)

### Notes

- vue-cli-plugin-electron-builder v3.0.0-alpha.4 is alpha but stable for this use case
- Webpack 5 persistent caching provides faster rebuilds
- All existing functionality tested and working

---

## Phase 4: Vue 2 → Vue 3 + Vuetify 3 Migration

**Status:** 🚧 In Progress (Phase 4c)
**Date Started:** 2026-01-XX

### Phase 4a: Core Framework Upgrades

**Status:** ✅ Complete

- ✅ Vue 2.6.14 → Vue 3.5.x
- ✅ Vue Router 3 → 4
- ✅ vue-i18n 8 → 9 (legacy mode)
- ✅ Event bus: Custom → mitt
- ✅ Vuetify 2.5.9 → Vuetify 3.x

### Phase 4b: electron-vite Migration

**Status:** ✅ Complete

- ✅ Migrated from vue-cli-plugin-electron-builder to electron-vite
- ✅ Created `electron.vite.config.js` with main, preload, renderer sections
- ✅ Updated project structure for electron-vite conventions

### Phase 4c: Vue 3 / Vuetify 3 Compatibility Fixes

**Status:** 🚧 In Progress

#### Completed

- ✅ Vue 3 `emits` declarations added to all 20 components
- ✅ Vuetify 3 v-select: `item-text` → `item-title` prop rename
- ✅ Vuetify 3 v-select slots: `item.Property` → `item.raw.Property`
- ✅ Vuetify 3 v-tabs: `v-tab-item` → `v-window-item` migration
- ✅ vue-i18n 9: `this.$i18n._vm.messages` → `this.$i18n.getLocaleMessage()`
- ✅ v-text-field: Added `variant="underlined"` to all instances
- ✅ word-highlighter: Wrapped in span for class attribute (fragment component)
- ✅ Passive event listener hack added for Vuetify 3 touch/wheel warnings
- ✅ Vuetify 3 input height: Overrode `--v-input-control-height: 46px` (was 56px) globally for `.v-input--density-default` — Vuetify 3 adopted Material Design 3 spacing which made filter checkboxes/switches consume too much vertical space
- ✅ Vuetify 3 label line-height: Added `.mk-filter-checkbox .v-label { line-height: 1.2 }` — Vuetify 3 changed `v-label` line-height from ~1.2 to 1.5 (MD3 typography), causing excessive spacing on wrapped checkbox labels
- ✅ `@electron/remote` default import fix: Vite's CJS interop resolved named imports (`{ dialog }`, `{ shell }`, etc.) but failed on default imports (`import remote from "@electron/remote"`), causing `quit()`, `toggleFullScreen()`, and `setProgressBar()` to throw `Cannot read properties of undefined`. Fixed by creating `src/renderer/electron-remote-shim.js` that uses `require()` directly and re-exports as ESM, aliased via `electron.vite.config.js`
- ✅ Vuetify 3 dialog z-index fix: Removed `z-index: 300 !important` from `MediaPropertyDialog` and `ScanHistoryItemDialog` — these were Vuetify 2 overrides that forced dialogs below Vuetify 3's layout-managed navigation drawer (~z-index 1002). Vuetify 3's overlay system automatically assigns `z-index: 2000+` to dialogs, so the explicit low values caused the sidebar to render on top of dialogs
- ✅ Vuetify 3 filter checkbox boolean fix: All 17 `fetchFilter*()` functions in `store.js` returned `1 AS Selected` (integer) from SQLite. Vuetify 3's `v-checkbox` uses strict comparison (`deepEqual`) against `true` (boolean), so checkboxes appeared unchecked despite the title correctly showing "(All)" (which uses JavaScript truthy evaluation). Fixed by adding `!!result.Selected` coercion in each fetch function. Also refactored all fetch functions to use a single `forEach` loop: unconditional coercion + formatting first, then conditional merge of saved filter values

- ✅ Vuetify 3 sidebar resize vs fixed pagination: MediaList.vue top nav used `position: fixed; width: 100%` which broke out of Vuetify's layout flow, causing pagination to overflow when the resizable sidebar changed width. The three hardcoded 320px spacer divs were a workaround that no longer matched the dynamic width. Fixed by switching to `position: sticky; top: 48px` which keeps the element in the document flow and automatically respects the sidebar width managed by `v-main`. Removed the spacer divs and the now-unnecessary `margin-top` offset on the content container

- ✅ Vuetify 3 MediaPropertyDialog person layout: `v-list-item` no longer creates horizontal layout in Vuetify 3. Replaced with explicit flexbox (`display: flex; align-items: flex-start; gap: 12px`) so the person photo stays left and description + movie/series lists flow to the right. Photo container uses `flex-shrink: 0; width: 120px` with `position: sticky; top: 0` to stay visible during scrolling. Added `border-radius: 8px` for rounded corners, centered the loading spinner and placeholder icon with flexbox, and switched `v-img` from `contain` to `cover` for proper photo fill

- ✅ MediaPropertyDialog recursive stacking: Property dialogs (person, genre, company, etc.) can now stack indefinitely. Previously, clicking a person inside a person dialog replaced the first dialog. Now `MediaPropertyDialog` intercepts all property-click events internally via `onMICmediaItemEvent` and opens a recursive `mk-media-property-dialog` child (registered via `defineAsyncComponent` to avoid circular import). The `show` prop watcher resets child state on close. A new `closeAllPropertyDialogs` eventBus event closes the full stack when "Filter by..." is clicked at any nesting level — `onFilterClick` emits both `this.$emit("close")` (existing path) and `eventBus.closeAllPropertyDialogs()` so MediaList's `closeAllPropertyDialogs()` method sets all property dialog shows to false

- ✅ moment.js locale translations restored: `fromNow()` now returns translated strings (e.g. German "vor 3 Monaten") instead of always falling back to English. Root cause: Vite pre-bundles `moment` as an isolated ESM chunk; locale files internally call `require('../moment')` at runtime which hits Node's CJS module cache — a completely separate instance, so locale registrations were lost. Fixed by adding `moment: { type: "cjs" }` to `electronRenderer` resolve in `electron.vite.config.js` (forces all `import moment` to use `require()`, unifying the instance) and loading locale data via `require("moment/locale/de")` / `require("moment/locale/fr")` calls in `store.js` init (static ESM imports of locale sub-paths crash in Vite's strict-mode ESM context because `this` is `undefined` at the top level of an ES module)

#### Dependency Bulk Update (2026-03-08)

- ✅ Ran `npm outdated` and upgraded all outdated packages to latest
- ✅ Version-pinned all dependencies in package.json (no `^` or `~`)
- ✅ cheerio 1.0.0-rc.10 → 1.2.0: Changed `import cheerio from "cheerio"` → `import { load as cheerioLoad } from "cheerio"` (default export removed)
- ✅ html-to-text 5.1.1 → 9.0.5: Changed `import htmlToText from "html-to-text"` → `import { convert as htmlToTextConvert } from "html-to-text"` (default export removed, `fromString` renamed to `convert`, options changed: `wordwrap: null` → `wordwrap: false`, `ignoreImage`/`ignoreHref` → selectors-based config)
- ✅ requestretry 7 → 8: Added `postman-request` as explicit dependency (requestretry 8 switched from `request` to `postman-request`)
- ✅ Vuetify 3 v-select slots: `item.raw.Property` → `item.Property` (Vuetify 3.12 passes raw object directly to slots)
- ✅ Home.vue: `dense` → `density="comfortable"` (deprecated prop)
- ✅ Added `__VUE_I18N_FULL_INSTALL__` and `__VUE_I18N_LEGACY_API__` build-time defines in electron.vite.config.js

#### Deliberately Held Back Versions

- **vue-router@4.6.4** (not 5.x): vue-router 5 emits `next()` deprecation warnings from its own internals (not fixable in app code). Staying on 4.x until vue-router 5 stabilizes.
- **vuetify@3.12.2** (not 4.x): Vuetify 4 requires significant layout/component API changes beyond the current scope. Will revisit in a dedicated phase.
- **vue-i18n@10.0.8** (not 11.x): vue-i18n 11 deprecated legacy API mode which this app uses extensively (Options API with `$t()`). Migrating to Composition API mode would require rewriting all components. Staying on 10.x which supports legacy mode without warnings.

#### In Progress

- 🔄 Testing for remaining console warnings/errors

### Key Files Modified (Phase 4c)

- `src/renderer/main.js` - Passive event listener override
- `src/renderer/components/Settings.vue` - v-tabs migration, vue-i18n fix
- `src/renderer/components/MediaList.vue` - v-select fixes
- `src/renderer/components/shared/Pagination.vue` - v-select fixes
- `src/renderer/components/shared/MediaItemCard.vue` - word-highlighter fix
- Multiple dialog components - emits declarations, v-text-field variant
- `src/renderer/electron-remote-shim.js` - New shim for @electron/remote CJS interop
- `electron.vite.config.js` - Added @electron/remote alias to shim

### Known Workarounds (see CLAUDE.md)

- Passive event listener override in main.js
- vuedraggable disabled (incompatible with Vue 3.4+)
- HTML warning suppression in vue-i18n

---

## Phase 6: Final Cleanup & Security Hardening (Days 49-60)

**Status:** Not Started

### Planned Changes

- video.js 7 → 8
- Electron IPC security migration
- Remove @electron/remote
- Final security audit
- Investigate and resolve npm install warnings (peer dependencies, deprecations)

---

## Breaking Changes Encountered

### Phase 1: fs-extra requires transpilation

- **Issue**: fs-extra 11.3.3 uses modern JS syntax (nullish coalescing `??`)
- **Impact**: Webpack 4 (Vue CLI 4) fails to compile without transpilation
- **Solution**: Added `"fs-extra"` to `transpileDependencies` in vue.config.js

### Phase 1: sqlite3 5.1.7 lacks prebuilt binaries for Electron 13

- **Issue**: sqlite3 5.1.7 has no prebuilt N-API v36 binaries for Electron 13, requires Python to build from source
- **Impact**: Application fails at runtime with "Could not locate the bindings file" error
- **Solution**: Rolled back to sqlite3 5.1.6 which has working prebuilt binaries (napi-v6)
- **Note**: Will upgrade to newer sqlite3 in Phase 2 when upgrading Electron

### Phase 1: axios migration blocked by app architecture

- **Issue**: Attempted to replace deprecated `request`/`requestretry` with `axios`
- **Impact**: IMDB scraping broke due to CORS - app runs HTTP requests in renderer process, axios is blocked by browser CORS policy
- **Root Cause**: App architecture has IMDB scraping in renderer process (store.js, Vue components), not main process
- **Decision**: **DEFERRED axios migration** - would require major refactoring to move HTTP to main process via IPC
- **Status**: Keeping `request`/`requestretry` for now, will address in future phase

---

## Workarounds Applied

_None needed for Phase 1 (simplified scope)_

---

## Testing Notes

_This section will track testing results for each phase_

---

## Security Vulnerabilities Resolved

**Initial Count:** 36 vulnerabilities (3 critical, 10 high, 11 moderate, 12 low)

### Phase 1 Resolutions

- _To be documented_

### Phase 2 Resolutions

- _To be documented_

### Phase 3 Resolutions

- _To be documented_

### Phase 4 Resolutions

- _To be documented_

### Phase 5 Resolutions

- _To be documented_

### Phase 6 Resolutions

- _To be documented_

---

## Timeline

| Phase | Start Date | End Date | Actual Duration | Notes       |
| ----- | ---------- | -------- | --------------- | ----------- |
| 0     | 2026-01-12 | -        | -               | In Progress |
| 1     | -          | -        | -               |             |
| 2     | -          | -        | -               |             |
| 3     | -          | -        | -               |             |
| 4     | -          | -        | -               |             |
| 5     | -          | -        | -               |             |
| 6     | -          | -        | -               |             |

---

## Lessons Learned

_This section will capture key insights and lessons from the upgrade process_
