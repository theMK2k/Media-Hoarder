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

**Status:** In Progress

### Planned Changes
- ~~Replace `request` → `axios`~~ **DEFERRED** - App architecture requires HTTP in renderer process, axios blocked by CORS
- Remove `@babel/polyfill` → `core-js`
- Fix `roboto-fontface` wildcard version
- Upgrade Node.js-compatible utilities
- Upgrade sqlite3 native module

---

## Phase 2: Electron Upgrade (Days 8-14)

**Status:** Not Started

### Planned Changes
- Electron 13.6.6 → 22.3.27 (Step 1)
- Electron 22.3.27 → 28.3.3 (Step 2)
- Electron 28.3.3 → 33.4.1 (Step 3)
- Electron 33.4.1 → 39.2.7 (Step 4)
- Update @electron/remote

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
