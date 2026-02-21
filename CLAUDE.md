# CLAUDE.md - Project Intelligence for Media Hoarder

## Project Overview

Media Hoarder is an Electron desktop app for managing movie/series collections with IMDB integration. It uses Vue 3, Vuetify 3, vue-router 4, vue-i18n 9, and better-sqlite3.

## Architecture

- **Build system:** electron-vite (not Vue CLI)
- **Config:** `electron.vite.config.js` (main, preload, renderer sections)
- **Main process:** `src/main/index.js`
- **Preload:** `src/preload/index.js`
- **Renderer:** `src/renderer/` (Vue app)
  - Entry: `src/renderer/main.js`
  - Components: `src/renderer/components/`
  - Dialogs: `src/renderer/components/dialogs/`
  - Shared: `src/renderer/components/shared/`
- **Helpers:** `src/helpers/` (shared between main/renderer, aliased as `@helpers`)
- **Database:** better-sqlite3 (native module, externalized in build)

## Key Patterns

- **Options API** throughout (no Composition API migration)
- **Event bus:** mitt-based, exported from `src/renderer/eventBus.js`
- **Global properties:** `$shared` (reactive state), accessed via `this.$shared` in components
- **i18n:** Legacy mode (`legacy: true`), uses `$t()` in templates
- **Dialogs:** Use `:model-value` / `@update:model-value` pattern (Vue 3 v-model)

## Known Hacks & Workarounds

### Passive Event Listener Override (src/renderer/main.js)

**WARNING:** The top of `main.js` monkey-patches `EventTarget.prototype.addEventListener` to force `passive: true` on touch/wheel events. This suppresses Chromium's "[Violation] Added non-passive event listener" console warnings caused by Vuetify 3 internals.

**Risk:** If `preventDefault()` is needed on touch/wheel events (e.g., preventing scroll in dialogs, menus, or draggable elements), this hack will silently break it. The browser ignores `preventDefault()` on passive listeners.

**If you see scroll/touch issues:** This hack is the first thing to investigate. Remove or scope it down.

### HTML Warning Suppression (src/renderer/i18n.js)

`warnHtmlInMessage: "off"` suppresses vue-i18n warnings about HTML in translation strings. The app intentionally uses HTML in some i18n messages.

## Alias Map

| Alias          | Path            |
| -------------- | --------------- |
| `@` (renderer) | `src/renderer/` |
| `@helpers`     | `src/helpers/`  |
| `@` (main)     | `src/`          |

## Dev Commands

```bash
npm run dev        # Start dev server (electron-vite)
npm run build      # Production build
```

## Migration Progress

**IMPORTANT:** See `UPGRADE-LOG.md` for detailed migration progress. Update it after completing any migration task to ensure continuity across sessions.

- Phase 1-2: Electron upgrade ✅
- Phase 3: Vue CLI 4 -> 5, Webpack 5, Node 22 ✅
- Phase 4a: Vue 2 -> Vue 3, Vuetify 2 -> 3, vue-router 3 -> 4, vue-i18n 8 -> 9 ✅
- Phase 4b: electron-vite migration ✅
- Phase 4c: Vuetify 3 / Vue 3 compatibility fixes 🚧 (in progress)
