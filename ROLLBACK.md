# Rollback Procedures

This document provides instructions for rolling back to previous stable states during the dependency upgrade process.

---

## Git Tags

Each phase creates checkpoint tags that can be used for rollback:

```bash
# List all phase tags
git tag | grep phase-

# View current tags
git tag
```

### Available Tags

| Tag | Description | Date Created |
|-----|-------------|--------------|
| `phase-0-start` | Initial state before Phase 0 | 2026-01-12 |
| `phase-1-complete` | After foundation upgrades | TBD |
| `phase-2-electron-22` | After Electron 13 → 22 upgrade | TBD |
| `phase-2-electron-28` | After Electron 22 → 28 upgrade | TBD |
| `phase-2-electron-33` | After Electron 28 → 33 upgrade | TBD |
| `phase-2-complete` | After Electron 33 → 39 upgrade | TBD |
| `phase-3-complete` | After Vue CLI 5 upgrade | TBD |
| `phase-4-complete` | After Vue 3 migration (CRITICAL) | TBD |
| `phase-5-complete` | After Vuetify 3 migration (CRITICAL) | TBD |
| `phase-6-complete` | After final cleanup | TBD |

---

## Rollback Procedure

### Standard Rollback

To rollback to a specific phase:

```bash
# 1. Reset git to the tag
git reset --hard phase-N-complete

# 2. Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Rebuild native modules (important for sqlite3)
npm run postinstall

# 4. Test the application
npm run dev:lite
```

### Emergency Rollback (If Git Reset Fails)

If you need to completely restore the repository:

```bash
# 1. Stash any uncommitted changes
git stash

# 2. Force reset to tag
git reset --hard phase-N-complete

# 3. Clean everything
git clean -fdx  # WARNING: Removes ALL untracked files

# 4. Reinstall
npm install
npm run postinstall
```

---

## Phase-Specific Rollback Notes

### Phase 0: Preparation
- **Risk Level:** None
- **Rollback Impact:** Minimal, only removes documentation files
- **Command:** `git reset --hard phase-0-start`

### Phase 1: Foundation Upgrades
- **Risk Level:** Low
- **Rollback Impact:** Reverts deprecated package replacements
- **Command:** `git reset --hard phase-1-complete` OR `git reset --hard phase-0-start`
- **Notes:**
  - May need to restore `request` and `requestretry` packages
  - `@babel/polyfill` will be restored
  - Test IMDB scraper after rollback

### Phase 2: Electron Upgrade
- **Risk Level:** Medium
- **Rollback Impact:** Reverts Electron version, requires sqlite3 rebuild
- **Command:** `git reset --hard phase-2-electron-22` (or earlier step)
- **Critical Steps:**
  1. Reset to tag
  2. `npm install`
  3. `npm run postinstall` (CRITICAL for sqlite3)
  4. Test database operations thoroughly
- **Notes:**
  - sqlite3 must be rebuilt for the correct Electron version
  - Test on all platforms if possible

### Phase 3: Build Tool Upgrades
- **Risk Level:** Medium
- **Rollback Impact:** Reverts Vue CLI, Webpack, Babel changes
- **Command:** `git reset --hard phase-3-complete` OR `git reset --hard phase-2-complete`
- **Critical Steps:**
  1. Reset to tag
  2. Clean node_modules completely
  3. `npm install`
  4. Test all build scripts
- **Notes:**
  - Webpack 4 vs 5 differences may affect builds
  - Verify all npm scripts work after rollback

### Phase 4: Vue 2 → 3 Migration
- **Risk Level:** HIGH ⚠️
- **Rollback Impact:** Major framework rollback, all component changes reverted
- **Command:** `git reset --hard phase-4-complete` OR `git reset --hard phase-3-complete`
- **Critical Steps:**
  1. Reset to tag
  2. Clean node_modules completely
  3. `npm install`
  4. `npm run postinstall`
  5. Full manual testing required
- **Notes:**
  - This is a **CRITICAL CHECKPOINT**
  - Rolling back from here reverts significant code changes
  - All 28 components will revert to Vue 2 syntax
  - Event bus will revert from mitt to Vue instance
  - Router and i18n will revert to old APIs
  - Test everything thoroughly after rollback

### Phase 5: Vuetify 2 → 3 Migration
- **Risk Level:** HIGH ⚠️
- **Rollback Impact:** Major UI framework rollback, visual changes reverted
- **Command:** `git reset --hard phase-5-complete` OR `git reset --hard phase-4-complete`
- **Critical Steps:**
  1. Reset to tag
  2. Clean node_modules completely
  3. `npm install`
  4. Visual testing on all screens
- **Notes:**
  - This is a **CRITICAL CHECKPOINT**
  - Rolling back reverts all UI component changes
  - Visual regression testing required
  - Check all 28 components for proper styling

### Phase 6: Final Cleanup & Security
- **Risk Level:** Medium
- **Rollback Impact:** Reverts security hardening and final upgrades
- **Command:** `git reset --hard phase-6-complete` OR `git reset --hard phase-5-complete`
- **Critical Steps:**
  1. Reset to tag
  2. `npm install`
  3. `npm run postinstall`
  4. Security audit
- **Notes:**
  - May restore @electron/remote
  - IPC changes will be reverted
  - Security vulnerabilities may return

---

## Node.js Version Management

If you need to switch Node.js versions:

```bash
# Check available versions
nvm list

# Switch to Node.js 14
nvm use 14.17.5

# Switch to Node.js 22
nvm use 22

# Reinstall dependencies after switching
npm install
npm run postinstall
```

---

## Verifying Successful Rollback

After any rollback, verify the application works:

### Automated Tests
```bash
npm test
```

### Manual Smoke Test
1. Launch app: `npm run dev:lite`
2. Check database operations
3. Test IMDB scraper
4. Test video playback
5. Test all dialogs
6. Test settings save/load

---

## If Rollback Fails

If rollback doesn't work or the application is broken:

### Option 1: Try Earlier Tag
```bash
# Go back one more phase
git reset --hard phase-N-1-complete
npm install
npm run postinstall
```

### Option 2: Fresh Clone
```bash
# Clone repository fresh in a new location
cd ..
git clone https://github.com/theMK2k/Media-Hoarder.git Media-Hoarder-rollback
cd Media-Hoarder-rollback
git checkout update-dependencies
git reset --hard phase-N-complete
npm install
npm run postinstall
```

### Option 3: Return to Main Branch
```bash
# Go back to stable main/master branch
git checkout main  # or master
npm install
npm run postinstall
```

---

## Recovery Checklist

After rollback, verify:

- [ ] Application launches without errors
- [ ] Database operations work
- [ ] IMDB scraping functional
- [ ] Video playback works
- [ ] Settings persist correctly
- [ ] All dialogs open/close
- [ ] Build scripts work
- [ ] Tests pass (if applicable)

---

## Emergency Contacts

If you get stuck during rollback:
- Review UPGRADE-LOG.md for specific phase notes
- Check git log for recent changes: `git log --oneline -20`
- Compare with working tag: `git diff phase-N-complete`

---

## Prevention Tips

To avoid needing rollback:
1. ✅ Create git tags frequently
2. ✅ Test thoroughly after each phase
3. ✅ Keep detailed notes in UPGRADE-LOG.md
4. ✅ Don't skip intermediate steps
5. ✅ Back up important data before major changes
