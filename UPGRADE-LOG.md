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
- ✅ Fixed roboto-fontface wildcard version: "*" → "0.10.0"
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

**Status:** 📋 Not Started

#### Planned Changes

- Upgrade Electron 22.3.27 → 28.3.3
- Remove Windows 7/8 support references
- Migrate `ipcRenderer.sendTo()` to MessageChannel
- Update protocol handlers to `protocol.handle()`
- **Decision Point:** Upgrade sqlite3 to 5.1.7 OR migrate to better-sqlite3 12.6.0

### Phase 2c: Electron 28.3.3 → 33.4.1 (Node 18.18 → 20.18)

**Status:** 📋 Not Started

#### Planned Changes

- Upgrade Electron 28.3.3 → 33.4.1
- Migrate BrowserView → WebContentsView (if used)
- Update crash event handlers (render-process-gone, child-process-gone)
- Update File.path usage → webUtils.getPathForFile()
- Verify native modules build with C++20

### Phase 2d: Electron 33.4.1 → 39.2.7 (Node 20.18 → 22.20)

**Status:** 📋 Not Started

#### Planned Changes

- **Switch to Node.js 22** (can finally use system Node 22!)
- Upgrade Electron 33.4.1 → 39.2.7
- Update package.json engines to Node 22.x
- Update .nvmrc to 22
- Remove macOS 11 support references
- Test GTK 4 on Linux

---

## Phase 3: Vue CLI & Build Tool Upgrades (Days 15-18)

**Status:** Not Started

### Planned Changes
- Vue CLI 4 → 5
- Webpack 4 → 5
- Remove Babel 6 CLI
- Update sass-loader, sass

---

## Phase 4: Vue 2 → Vue 3 Migration (Days 19-35)

**Status:** Not Started

### Planned Changes
- Vue 2.6.14 → Vue 3.5.26
- Vue Router 3 → 4
- Vue i18n 8 → 11
- Event bus migration (mitt)
- 28 component updates

---

## Phase 5: Vuetify 2 → Vuetify 3 Migration (Days 36-48)

**Status:** Not Started

### Planned Changes
- Vuetify 2.5.9 → 3.11.6
- Update all 28 components
- Visual regression testing

---

## Phase 6: Final Cleanup & Security Hardening (Days 49-60)

**Status:** Not Started

### Planned Changes
- video.js 7 → 8
- Electron IPC security migration
- Remove @electron/remote
- Final security audit

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

*None needed for Phase 1 (simplified scope)*

---

## Testing Notes

*This section will track testing results for each phase*

---

## Security Vulnerabilities Resolved

**Initial Count:** 36 vulnerabilities (3 critical, 10 high, 11 moderate, 12 low)

### Phase 1 Resolutions
- *To be documented*

### Phase 2 Resolutions
- *To be documented*

### Phase 3 Resolutions
- *To be documented*

### Phase 4 Resolutions
- *To be documented*

### Phase 5 Resolutions
- *To be documented*

### Phase 6 Resolutions
- *To be documented*

---

## Timeline

| Phase | Start Date | End Date | Actual Duration | Notes |
|-------|-----------|----------|----------------|-------|
| 0 | 2026-01-12 | - | - | In Progress |
| 1 | - | - | - | |
| 2 | - | - | - | |
| 3 | - | - | - | |
| 4 | - | - | - | |
| 5 | - | - | - | |
| 6 | - | - | - | |

---

## Lessons Learned

*This section will capture key insights and lessons from the upgrade process*
