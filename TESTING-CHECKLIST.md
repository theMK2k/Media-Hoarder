# Testing Checklist for Dependency Upgrade

This document provides a comprehensive testing checklist to verify Media-Hoarder functionality after each upgrade phase.

---

## Quick Smoke Test (Run After Every Change)

Minimum testing to verify nothing is critically broken:

- [ ] Application launches: `npm run dev:lite`
- [ ] No console errors on startup
- [ ] Database loads (existing movies/series visible)
- [ ] Can navigate between screens
- [ ] Application closes cleanly

**Time:** ~2 minutes

---

## Phase 0 Baseline Test

**Purpose:** Establish what works BEFORE any upgrades
**Date Performed:** 2026-01-12
**Node.js Version:** 14.17.5
**Status:** ⏳ To be performed

### Automated Tests
- [ ] `npm test` - Capture output and results

### Manual Tests - Core Functionality

#### 1. Application Launch
- [ ] `npm run dev:lite` launches successfully
- [ ] No errors in console on startup
- [ ] Main window appears with correct size/position
- [ ] Window state persists (resize, close, reopen)

#### 2. Database Operations
- [ ] Existing movies display in list
- [ ] Existing series display in list
- [ ] Can query database without errors
- [ ] Database file accessible at configured location

#### 3. Movie Scanning
- [ ] Can add new source path
- [ ] Can scan for new movies
- [ ] Movie metadata fetches from IMDB
- [ ] Poster images download correctly
- [ ] Movie appears in list after scan

#### 4. Series Management
- [ ] Can scan for new series
- [ ] Series episodes detected correctly
- [ ] Episode metadata fetches from IMDB
- [ ] Episode list displays correctly
- [ ] Episode heatmap displays ratings

#### 5. IMDB Scraper
- [ ] IMDB scraper finds correct movie
- [ ] IMDB scraper finds correct series
- [ ] Can manually reassign IMDB entry
- [ ] IMDB search dialog works
- [ ] Metadata saves to database

#### 6. Video Playback
- [ ] Embedded video player opens
- [ ] Video plays in embedded player
- [ ] Can launch external player (VLC)
- [ ] Playback controls work

#### 7. Search & Filtering
- [ ] Can search movies by title
- [ ] Can filter by source path
- [ ] Can filter by video quality
- [ ] Can filter by audio language
- [ ] Can filter by genre
- [ ] Can filter by rating
- [ ] Filters combine correctly

#### 8. Lists Management
- [ ] Can create new list
- [ ] Can add movie to list
- [ ] Can remove movie from list
- [ ] Can delete list
- [ ] Lists persist after restart

#### 9. Ratings & Reviews
- [ ] Can set 5-star rating for movie
- [ ] Rating displays correctly
- [ ] Rating persists after restart
- [ ] IMDB rating displays correctly
- [ ] Metacritic score displays correctly

#### 10. Settings
- [ ] Settings dialog opens
- [ ] Can modify source paths
- [ ] Can change language
- [ ] Can modify video player settings
- [ ] Settings save correctly
- [ ] Settings persist after restart

#### 11. Dialogs
Test each of the 14 dialogs:
- [ ] Movie details dialog
- [ ] Series details dialog
- [ ] Episode details dialog
- [ ] Cast/actor details dialog
- [ ] Settings dialog
- [ ] IMDB search dialog
- [ ] Add source path dialog
- [ ] Edit source path dialog
- [ ] Create list dialog
- [ ] Video player dialog
- [ ] Local video player dialog
- [ ] Rescan dialog
- [ ] ChatGPT integration dialog
- [ ] Episode heatmap dialog

#### 12. ChatGPT Integration
- [ ] ChatGPT dialog opens
- [ ] Can enter API key
- [ ] Can send prompt
- [ ] Receives response
- [ ] Can apply results to media

#### 13. Internationalization (i18n)
- [ ] Can switch to German language
- [ ] Translations display correctly
- [ ] Can switch back to English
- [ ] Language preference persists

#### 14. UI Components
- [ ] All buttons clickable
- [ ] All icons display correctly
- [ ] All tooltips work
- [ ] All menus work
- [ ] Drag-and-drop works (if applicable)
- [ ] Star ratings clickable

### Build & Distribution Tests
- [ ] `npm run build` completes without errors
- [ ] `npm run electron:build-win-portable` creates zip
- [ ] `npm run electron:build-win-setup` creates installer
- [ ] Portable version launches and works
- [ ] Installed version launches and works

### Performance Tests
- [ ] App starts in reasonable time (< 10 seconds)
- [ ] Database queries respond quickly
- [ ] UI is responsive (no lag)
- [ ] Video playback is smooth
- [ ] Large movie lists scroll smoothly

---

## Phase 1 Test (Foundation Upgrades)

**Purpose:** Verify deprecated package replacements work
**Date Performed:** TBD
**Status:** ⏳ Pending

### Critical Tests After Phase 1
- [ ] `npm test` passes
- [ ] IMDB scraper works (request → axios migration)
- [ ] File operations work (fs-extra upgrade)
- [ ] Database operations work (sqlite3 rebuild)
- [ ] All watchdog scripts work:
  - [ ] `npm run imdb-scraper-watchdog`
  - [ ] `npm run mediainfo-watchdog`

### Full Manual Test
- [ ] Run complete manual test from Phase 0 baseline
- [ ] Document any regressions in UPGRADE-LOG.md

---

## Phase 2 Test (Electron Upgrade)

**Purpose:** Verify Electron 39 compatibility and native modules
**Date Performed:** TBD
**Status:** ⏳ Pending

### Critical Tests After Each Electron Step
- [ ] Application launches
- [ ] Window management works
- [ ] Database operations work (sqlite3 rebuilt)
- [ ] File dialogs work (@electron/remote)
- [ ] External process launching works
- [ ] Video playback works

### Platform-Specific Tests
- [ ] Windows: All features work
- [ ] Linux: All features work (if available)
- [ ] macOS: All features work (if available)

### Build Tests
- [ ] Windows portable build works
- [ ] Windows setup build works
- [ ] Linux builds work (deb, AppImage, snap, rpm)
- [ ] macOS build works (dmg)

### Full Manual Test
- [ ] Run complete manual test from Phase 0 baseline
- [ ] Test on all available platforms

---

## Phase 3 Test (Build Tools)

**Purpose:** Verify Vue CLI 5, Webpack 5 compatibility
**Date Performed:** TBD
**Status:** ⏳ Pending

### Critical Tests After Phase 3
- [ ] `npm run serve` works
- [ ] `npm run build` works
- [ ] `npm run dev:lite` works
- [ ] Hot reload works
- [ ] All Babel CLI scripts work
- [ ] No webpack errors/warnings

### Build Performance
- [ ] Build time reasonable (document time)
- [ ] Bundle size reasonable (document size)
- [ ] Dev server starts quickly

### Full Manual Test
- [ ] Run complete manual test from Phase 0 baseline

---

## Phase 4 Test (Vue 3 Migration)

**Purpose:** Verify Vue 3 compatibility and component functionality
**Date Performed:** TBD
**Status:** ⏳ Pending

### Critical Tests After Phase 4
- [ ] App launches without console errors
- [ ] No Vue migration warnings in console
- [ ] All routes work
- [ ] Event bus works (mitt migration)
- [ ] i18n works (Vue i18n 11)

### Component-by-Component Testing
Test all 28 components:
- [ ] App.vue
- [ ] Home.vue
- [ ] MediaList.vue
- [ ] Settings.vue
- [ ] (List each dialog component and test)
- [ ] (List each shared component and test)

For each component verify:
- [ ] Renders without errors
- [ ] Props work correctly
- [ ] Events emit correctly
- [ ] Computed properties work
- [ ] Methods work
- [ ] Lifecycle hooks work

### Third-Party Component Tests
- [ ] vuedraggable works (v4)
- [ ] vue-star-rating works (v2)
- [ ] vue-word-highlighter works (or alternative)

### Full Manual Test
- [ ] Run complete manual test from Phase 0 baseline
- [ ] Special focus on component interactions

---

## Phase 5 Test (Vuetify 3 Migration)

**Purpose:** Verify Vuetify 3 compatibility and visual correctness
**Date Performed:** TBD
**Status:** ⏳ Pending

### Visual Regression Testing

**Before Phase 5:** Take screenshots of:
- [ ] Home screen
- [ ] Movie list view
- [ ] Movie details dialog
- [ ] Series list view
- [ ] Series details dialog
- [ ] Episode heatmap dialog
- [ ] Settings screen
- [ ] All other dialogs

**After Phase 5:** Compare screenshots and verify:
- [ ] Colors match theme
- [ ] Spacing/layout preserved
- [ ] Icons display correctly
- [ ] Buttons styled correctly
- [ ] Forms look correct
- [ ] Typography correct
- [ ] Dialogs positioned correctly

### Component Styling Tests
- [ ] All buttons render correctly
- [ ] All icons display (MDI font)
- [ ] All cards styled correctly
- [ ] All dialogs styled correctly
- [ ] All forms styled correctly
- [ ] All tooltips styled correctly
- [ ] All menus styled correctly
- [ ] Grid layout works correctly

### Functional Tests
- [ ] All buttons still clickable
- [ ] All forms still work
- [ ] All dialogs still open/close
- [ ] All tooltips still show
- [ ] All menus still work
- [ ] Data tables work (if used)
- [ ] Pagination works
- [ ] Sorting works
- [ ] Filtering works

### Full Manual Test
- [ ] Run complete manual test from Phase 0 baseline
- [ ] Special focus on visual appearance

---

## Phase 6 Test (Final Cleanup & Security)

**Purpose:** Verify security hardening and remaining upgrades
**Date Performed:** TBD
**Status:** ⏳ Pending

### Security Tests
- [ ] `npm audit --production` shows 0 vulnerabilities
- [ ] contextIsolation: true enabled
- [ ] nodeIntegration: false enabled
- [ ] No @electron/remote usage
- [ ] IPC channels work correctly
- [ ] Preload script works

### Critical Tests After Phase 6
- [ ] Video playback works (video.js 8)
- [ ] All Electron dialogs work via IPC
- [ ] File system access works via IPC
- [ ] External process launching works via IPC

### Performance Tests
- [ ] App startup time acceptable
- [ ] Video playback smooth
- [ ] Database queries fast
- [ ] UI responsive

### Platform Tests
- [ ] Windows build works
- [ ] Linux builds work
- [ ] macOS build works
- [ ] All installers work
- [ ] All portable versions work

### Final Full Manual Test
- [ ] Run complete manual test from Phase 0 baseline
- [ ] Compare with Phase 0 results
- [ ] Document any differences

---

## Regression Testing

After completing all phases, perform comprehensive regression testing:

### Data Integrity
- [ ] Existing movies still accessible
- [ ] Existing series still accessible
- [ ] All metadata preserved
- [ ] All ratings preserved
- [ ] All lists preserved
- [ ] Settings preserved

### Feature Parity
- [ ] All Phase 0 features still work
- [ ] No features lost during upgrade
- [ ] Performance same or better than Phase 0

### Multi-Platform Testing
- [ ] Test on Windows 7/8/10/11
- [ ] Test on multiple Linux distros (if available)
- [ ] Test on macOS Intel and Apple Silicon (if available)

---

## Bug Tracking

If bugs are found during testing:

1. Document in UPGRADE-LOG.md
2. Create detailed bug report including:
   - Phase where bug appeared
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Console errors (if any)
   - Screenshots (if applicable)
3. Fix bug before proceeding to next phase
4. Retest after fix
5. Document fix in UPGRADE-LOG.md

---

## Test Results Summary

### Phase 0 Baseline
- **Date:** TBD
- **Pass/Fail:** TBD
- **Notes:** TBD

### Phase 1
- **Date:** TBD
- **Pass/Fail:** TBD
- **Regressions:** TBD

### Phase 2
- **Date:** TBD
- **Pass/Fail:** TBD
- **Regressions:** TBD

### Phase 3
- **Date:** TBD
- **Pass/Fail:** TBD
- **Regressions:** TBD

### Phase 4
- **Date:** TBD
- **Pass/Fail:** TBD
- **Regressions:** TBD

### Phase 5
- **Date:** TBD
- **Pass/Fail:** TBD
- **Regressions:** TBD

### Phase 6
- **Date:** TBD
- **Pass/Fail:** TBD
- **Regressions:** TBD

---

## Final Sign-Off

Before considering the upgrade complete:

- [ ] All phases tested
- [ ] No critical bugs remaining
- [ ] Performance acceptable
- [ ] All platforms tested
- [ ] Documentation updated
- [ ] Security audit clean
- [ ] Ready for production use

**Final Approval:** _______________
**Date:** _______________
