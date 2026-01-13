# Phase 2: Electron Upgrade Plan (13.6.6 → 39.2.7)

**Current Version:** Electron 13.6.6 (Node.js 14.16)
**Target Version:** Electron 39.2.7 (Node.js 22.20)
**Strategy:** Incremental upgrades through stable major versions

---

## Overview

Phase 2 will upgrade Electron from 13.6.6 to 39.2.7 in 4 sub-phases:

| Sub-Phase | Electron | Node.js | Key Changes |
|-----------|----------|---------|-------------|
| **2a** | 13 → 22 | 14.16 → 16.17 | @electron/remote, sandboxing |
| **2b** | 22 → 28 | 16.17 → 18.18 | Windows 7/8 drop, IPC changes, sqlite3 upgrade |
| **2c** | 28 → 33 | 18.18 → 20.18 | BrowserView → WebContentsView, crash events |
| **2d** | 33 → 39 | 20.18 → 22.20 | macOS 12+, final API updates |

---

## Phase 2a: Electron 13.6.6 → 22.3.27

**Node.js:** 14.16 → 16.17
**Estimated Duration:** 2-3 days
**Risk Level:** Medium

### Pre-Upgrade Checklist

- [ ] Create git tag: `phase-2a-start`
- [ ] Run full manual test suite (TESTING-CHECKLIST.md Phase 0)
- [ ] Take screenshots of all 14 dialogs
- [ ] Note current app startup time
- [ ] Verify sqlite3 5.1.6 working

### Upgrade Steps

1. **Update @electron/remote** (critical dependency)
   ```bash
   npm install @electron/remote@2.1.3 --save-exact
   ```

2. **Upgrade Electron**
   ```bash
   npm install electron@22.3.27 --save-dev --save-exact
   ```

3. **Rebuild native modules**
   ```bash
   npm run postinstall
   ```

4. **Update electron-builder** (if needed for Electron 22 compatibility)
   - Check current: `vue-cli-plugin-electron-builder@2.1.1`
   - May need to stay on Vue CLI plugin until Phase 3

### Breaking Changes to Address

#### 1. Remote Module (Already Handled ✅)
- App already uses `@electron/remote@2.0.1`
- Upgrade to 2.1.3 for better Electron 22 support
- Verify `require("@electron/remote/main").initialize()` in background.js

#### 2. Renderer Process Sandboxing (Electron 20+)
- **Change:** Sandboxing enabled by default
- **Impact:** Node integration in renderer might break
- **Current config:** `nodeIntegration: true, contextIsolation: false` in vue.config.js
- **Action:** Test if current settings still work, may need adjustments

#### 3. nativeWindowOpen Standard (Electron 18+)
- **Change:** `window.open()` uses native implementation by default
- **Action:** Test any `window.open()` usage in code

#### 4. new-window Event Removed (Electron 22)
- **Change:** `new-window` event removed from WebContents
- **Action:** Search codebase for `'new-window'` event listeners
  ```bash
  grep -r "new-window" src/
  ```
- **Replacement:** Use `webContents.setWindowOpenHandler()` if found

### Testing Checklist

#### Smoke Tests (After Each Change)
- [ ] `npm run dev:lite` launches
- [ ] No errors in console
- [ ] Database loads
- [ ] Can navigate screens
- [ ] App closes cleanly

#### Full Manual Tests
- [ ] All database operations (CRUD)
- [ ] IMDB scraping still works
- [ ] Video playback works
- [ ] All 14 dialogs open/close
- [ ] Window state persistence works
- [ ] External player launching works
- [ ] File dialogs work (@electron/remote)
- [ ] Settings save/load correctly

#### Build Tests
- [ ] `npm run electron:build-win-portable` succeeds
- [ ] Portable version runs correctly
- [ ] Database operations work in built version

### Known Issues & Workarounds

*To be documented during upgrade*

### Rollback Procedure

```bash
git reset --hard phase-2a-start
rm -rf node_modules package-lock.json
npm install
npm run postinstall
npm run dev:lite
```

### Success Criteria

- [ ] Application launches without errors
- [ ] All Phase 0 manual tests pass
- [ ] Performance same or better than Phase 2a start
- [ ] sqlite3 5.1.6 still working
- [ ] Windows portable build works

---

## Phase 2b: Electron 22.3.27 → 28.3.3

**Node.js:** 16.17 → 18.18
**Estimated Duration:** 2-3 days
**Risk Level:** Medium-High

### Pre-Upgrade Checklist

- [ ] Create git tag: `phase-2b-start`
- [ ] Verify Phase 2a tests all pass
- [ ] Run full manual test suite

### Upgrade Steps

1. **Upgrade Electron**
   ```bash
   npm install electron@28.3.3 --save-dev --save-exact
   ```

2. **Rebuild native modules**
   ```bash
   npm run postinstall
   ```

3. **Upgrade sqlite3** (now Node 18 compatible)
   ```bash
   npm install sqlite3@5.1.7 --save-exact
   npm run postinstall
   ```

### Breaking Changes to Address

#### 1. Windows 7/8/8.1 Support Removed (Electron 23+)
- **Change:** Minimum Windows version is now Windows 10
- **Action:** Update documentation if referencing Windows 7/8
- **Check:** Remove any Windows 7/8 specific code/checks

#### 2. ipcRenderer.sendTo() Removed (Electron 28)
- **Change:** Must use MessageChannel/MessagePort instead
- **Action:** Search codebase for `sendTo`:
  ```bash
  grep -r "sendTo" src/
  ```
- **Replacement:** Use `ipcRenderer.postMessage()` or MessageChannel

#### 3. Protocol Handlers Deprecated (Electron 25+)
- **Change:** `protocol.register*Protocol()` deprecated
- **Action:** Search for protocol registration:
  ```bash
  grep -r "registerFileProtocol\|registerHttpProtocol" src/
  ```
- **Replacement:** Use `protocol.handle()` API

#### 4. BrowserWindow.setTrafficLightPosition() (Electron 28, macOS only)
- **Change:** Replaced with `setWindowButtonPosition()`
- **Action:** Search for `setTrafficLightPosition`:
  ```bash
  grep -r "setTrafficLightPosition" src/
  ```

### SQLite3 Upgrade Decision Point

**Option A: Upgrade to sqlite3@5.1.7**
- Pros: Minimal code changes
- Cons: Package unmaintained, slower performance

**Option B: Migrate to better-sqlite3@12.6.0** (RECOMMENDED)
- Pros: 11.7x faster, actively maintained, better API
- Cons: API changes required, synchronous instead of async
- Migration effort: ~4-6 hours
- See: SQLITE-MIGRATION.md (to be created if chosen)

**Decision:** [User decides]

### Testing Checklist

- [ ] Full smoke test suite
- [ ] sqlite3/better-sqlite3 operations work
- [ ] All database CRUD operations
- [ ] IMDB scraping works
- [ ] All dialogs work
- [ ] IPC communication works (if sendTo was used)
- [ ] Protocol handlers work (if custom protocols used)
- [ ] Build and test portable version

### Success Criteria

- [ ] All Phase 0 tests pass
- [ ] sqlite3 upgraded and working OR better-sqlite3 migration complete
- [ ] No Windows 7/8 legacy code remaining
- [ ] IPC communication working

---

## Phase 2c: Electron 28.3.3 → 33.4.1

**Node.js:** 18.18 → 20.18
**Estimated Duration:** 2-3 days
**Risk Level:** Medium-High

### Pre-Upgrade Checklist

- [ ] Create git tag: `phase-2c-start`
- [ ] Verify Phase 2b tests all pass
- [ ] Run full manual test suite

### Upgrade Steps

1. **Upgrade Electron**
   ```bash
   npm install electron@33.4.1 --save-dev --save-exact
   ```

2. **Rebuild native modules**
   ```bash
   npm run postinstall
   ```

### Breaking Changes to Address

#### 1. BrowserView Deprecated (Electron 30)
- **Change:** BrowserView → WebContentsView
- **Action:** Search for BrowserView usage:
  ```bash
  grep -r "BrowserView" src/
  ```
- **Replacement:** Use `WebContentsView` API
- **Impact:** Likely none unless using embedded browser views

#### 2. Crash Event Changes (Electron 29)
- **Change:** `renderer-process-crashed`, `crashed`, `gpu-process-crashed` removed
- **Action:** Search for crash event handlers:
  ```bash
  grep -r "renderer-process-crashed\|gpu-process-crashed" src/
  ```
- **Replacement:** Use `render-process-gone` and `child-process-gone`

#### 3. File.path Property Removed (Electron 32)
- **Change:** `File.path` property no longer available
- **Action:** Search for `File.path` usage:
  ```bash
  grep -r "\.path" src/ | grep -i file
  ```
- **Replacement:** Use `webUtils.getPathForFile(file)`

#### 4. WebSQL Support Removed (Electron 31)
- **Change:** Chromium removed WebSQL support
- **Action:** Verify app doesn't use WebSQL (uses sqlite3 instead)
- **Impact:** Should be none (app uses sqlite3 via Node.js)

#### 5. Native Modules Require C++20 (Electron 33)
- **Change:** Native modules must be compiled with C++20
- **Action:** Ensure sqlite3/better-sqlite3 prebuilt binaries available
- **Impact:** Should work with `npm run postinstall` rebuild

### Testing Checklist

- [ ] Full smoke test suite
- [ ] Database operations work
- [ ] File dialogs work (File.path changes)
- [ ] Crash recovery works (if crash handlers used)
- [ ] All dialogs work
- [ ] Video playback works
- [ ] Build and test portable version

### Success Criteria

- [ ] All Phase 0 tests pass
- [ ] No deprecated BrowserView usage
- [ ] Crash event handlers updated (if any)
- [ ] File operations working with new API

---

## Phase 2d: Electron 33.4.1 → 39.2.7

**Node.js:** 20.18 → 22.20
**Estimated Duration:** 2-3 days
**Risk Level:** Medium

### Pre-Upgrade Checklist

- [ ] Create git tag: `phase-2d-start`
- [ ] Verify Phase 2c tests all pass
- [ ] Run full manual test suite

### Upgrade Steps

1. **Switch to Node.js 22** (can now use system Node 22)
   ```bash
   nvm use 22
   node --version  # Verify 22.x
   ```

2. **Update package.json engines**
   ```json
   "engines": {
     "node": ">=22.0.0 <23.0.0"
   }
   ```

3. **Upgrade Electron**
   ```bash
   npm install electron@39.2.7 --save-dev --save-exact
   ```

4. **Rebuild native modules**
   ```bash
   npm run postinstall
   ```

5. **Update .nvmrc**
   ```bash
   echo "22" > .nvmrc
   ```

### Breaking Changes to Address

#### 1. macOS 11 Support Removed (Electron 38)
- **Change:** Minimum macOS version is now 12 (Monterey)
- **Action:** Update documentation
- **Impact:** Build settings may need updating

#### 2. plugin-crashed Event Removed (Electron 38)
- **Change:** Event removed from Chromium
- **Action:** Search for plugin crash handlers:
  ```bash
  grep -r "plugin-crashed" src/
  ```
- **Impact:** Likely none (plugins rarely used)

#### 3. --host-rules Deprecated (Electron 39)
- **Change:** Use `--host-resolver-rules` instead
- **Action:** Search for host-rules usage:
  ```bash
  grep -r "host-rules" .
  ```
- **Impact:** Likely none unless using network config

#### 4. GTK 4 Default (Electron 36, Linux)
- **Change:** GTK 4 becomes default for GNOME
- **Action:** Test on Linux if possible
- **Impact:** Visual changes on Linux

### Testing Checklist

- [ ] Full smoke test suite on Node.js 22
- [ ] Database operations work
- [ ] IMDB scraping works
- [ ] All dialogs work
- [ ] Video playback works
- [ ] Build portable version on Node.js 22
- [ ] Test on Windows 10/11
- [ ] Test on Linux (if available)
- [ ] Test on macOS 12+ (if available)

### Success Criteria

- [ ] All Phase 0 tests pass
- [ ] App runs on Node.js 22
- [ ] Windows build works
- [ ] Linux build works (if applicable)
- [ ] macOS build works (if applicable)
- [ ] No deprecated API warnings

---

## Phase 2 Final Checklist

After completing all sub-phases:

### Documentation Updates

- [ ] Update UPGRADE-LOG.md with Phase 2 completion
- [ ] Update README.md with new Node.js/Electron requirements
- [ ] Update package.json `engines` field
- [ ] Update .nvmrc to Node.js 22
- [ ] Document any breaking changes discovered

### Testing

- [ ] Run complete TESTING-CHECKLIST.md Phase 2 tests
- [ ] Compare performance with Phase 0 baseline
- [ ] Test all 14 dialogs
- [ ] Test all database operations
- [ ] Test IMDB scraping thoroughly
- [ ] Test video playback
- [ ] Build all platform installers (Windows, Linux, macOS)
- [ ] Test portable and setup versions

### Git Management

- [ ] Create final tag: `phase-2-complete`
- [ ] Verify all sub-phase tags exist:
  - `phase-2a-complete`
  - `phase-2b-complete`
  - `phase-2c-complete`
  - `phase-2d-complete`
- [ ] Update ROLLBACK.md with Phase 2 rollback notes

### Commit Phase 2

```bash
git add -A
git commit -m "Phase 2: Electron upgrade complete (13.6.6 → 39.2.7)

- Electron 13.6.6 → 22.3.27 (Node 14.16 → 16.17)
- Electron 22.3.27 → 28.3.3 (Node 16.17 → 18.18)
- Electron 28.3.3 → 33.4.1 (Node 18.18 → 20.18)
- Electron 33.4.1 → 39.2.7 (Node 20.18 → 22.20)
- Updated @electron/remote 2.0.1 → 2.1.3
- [sqlite3 5.1.6 → 5.1.7 OR migrated to better-sqlite3 12.6.0]
- Addressed all breaking changes through Electron 39
- Updated Node.js requirement to 22.x

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Risk Mitigation

### High-Risk Areas

1. **sqlite3 native module** - Most likely to break
   - Mitigation: Rebuild after each Electron upgrade
   - Backup: Keep prebuilt binaries if available

2. **@electron/remote** - IPC communication
   - Mitigation: Test all dialogs after each upgrade
   - Backup: Have IPC-based alternative ready

3. **Window management** - Breaking API changes
   - Mitigation: Test window state persistence
   - Backup: Document current window API usage

4. **Video playback** - Chromium changes
   - Mitigation: Test video.js compatibility
   - Backup: Fallback to external player

### Emergency Rollback

If any sub-phase fails critically:

```bash
# Rollback to previous sub-phase
git reset --hard phase-2[X]-start  # X = a, b, c, or d
rm -rf node_modules package-lock.json
npm install
npm run postinstall

# Switch back to Node.js 14 if needed
nvm use 14
npm run dev:lite
```

---

## Phase 2 Success Criteria Summary

- [ ] Electron upgraded from 13.6.6 to 39.2.7
- [ ] Node.js upgraded from 14.16 to 22.20
- [ ] All Phase 0 manual tests pass
- [ ] Database operations work correctly
- [ ] IMDB scraping works correctly
- [ ] Video playback works correctly
- [ ] All 14 dialogs work correctly
- [ ] Windows builds work (portable + setup)
- [ ] Performance same or better than baseline
- [ ] No console errors or warnings
- [ ] All native modules rebuilt successfully
- [ ] Documentation updated

---

## Next Steps After Phase 2

Once Phase 2 is complete, proceed to:
- **Phase 3:** Vue CLI 4 → 5, Webpack 4 → 5
- **Phase 4:** Vue 2 → 3 migration
- **Phase 5:** Vuetify 2 → 3 migration
- **Phase 6:** Security hardening, remove @electron/remote
