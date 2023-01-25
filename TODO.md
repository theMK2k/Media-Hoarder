# TODO

## NEXT Minor (current v1.1.0)

- [ ] WIN: update VLC, mediainfo-cli (and test)
- [ ] async db funcs (initDb, syncSqlite)

### Defects

- nothing

### Other

- nothing

## LATER

### Plugin System

- check Shopware's Plugin System <https://www.youtube.com/watch?v=SlhFzRpneJI>

### Remove Noise from duplicate router push

router.js

```js
// remove the noise from duplicated router pushs (https://stackoverflow.com/a/58439497/5627010)
const originalPush = Router.prototype.push;
Router.prototype.push = function push(location) {
  return originalPush.call(this, location).catch((err) => err);
};
```

### In-List File Management

- for individual movies as well as for the whole (filtered) list
- copy/move entries to
  - another sourcepath
  - a user-defined destination

### Customizable Quick Info Area

- [ ] have the quick info area customizable?
  - [ ] let user decide to hide certain fields
  - [ ] let user re-arrange the fields

### Find Inspiration from <https://github.com/whyboris/Video-Hub-App>

### Create i18n Editor

- [ ] check out <https://crowdin.com/> which is free for opensource projects

- [x] load message definitions from %workdir%/i18n (e.g. zh.json, fr.json etc.)
- [x] provide selectable languages from actually loaded messages
- [ ] include \*.json export in Media Hoarder
- [ ] investigate external i18n sources - so that tranlastors can access their creation
- [ ] dropdown of available (to be translated) languages
- [ ] read available en.json ($fieldName, $expectedText)
- [ ] provide $expectedText as Input, let user type the translation in the language of choice
- [ ] establish a way of file exchange
- [ ] implement i18n/where.json as copy of en.json. The value describes the location in the UI where the string is shown.

### Raspberry Pi (armhf) Build

### JSDoc everywhere

```text
/**
 * Description of the function
 * @param {string} myParam
 */
```

### TV Series Support

- incl. IMDB Rating heatmap like <https://whattowatchon.tv>
- Dialogs: most of them do not utilize mediaType
- Series / Episode detection in directory/filenames, examples:
  - "S01E01" - the default
  - "Ep01" - as seen with some anime stuff
  - "S01.Ep.01"
  - "E01" - episode without season - assume S01
  - "1x5" - same as S01E05
  - "S01E01E02" - multiple episodes
  - "S01E01-E03" - multiple episodes
  - "S01E01E02E03" - multiple episodes
  - "S01E01-03" - multiple episodes

### Memory Leak (multiple reloads of medialist)

- [ ] more intelligent loading?
- [ ] better garbage collection?
- [x] -> we have a memory leak using eventBus.$on -> implement eventBus.$off on beforeDestroy() lifecycle hook
- [x] -> we still have the memory leak: don't fetch all data at once (re-fetch for each page)
- [x] -> check if memory leak is only in dev-mode (yes, it still persists even in prod-mode)

### Use Alternative Search Method

- [ ] IMDB Detection uses Suggestion API which doesn't support non-latin names
- [ ] IMDB Link Dialog uses Advanced Title Search API which doesn't support non-latin names
- [ ] maybe we should use `https://www.imdb.com/find?q=` (which is IMDB search incl. ENTER)?
- [ ] -> replace it in LinkIMDBDialog
- [ ] -> also use it for IMDB detection by filename
- IMPORTANT: Find API only yields results if the movie title is complete
- [ ] => we have to use find API only as fallback for the advancedTitleSearch
- [ ] => maybe we should implement an "ultimate" search which combines results of all three searches?

### Filters Customization

- [ ] UI: implement App - Filters as array with Sort field
- [ ] add Settings - Filters tab
- [ ] user may reorder and show/hide filters
- [ ] also use this in the filtersList creation

### I18N - Basic

- [ ] support all languages supported by DeepL or AWS (API): `en, de, fr, es, it, nl, pl, ja, pt-PT, pt-BR, ru, zh`

### I18N - Advanced

- [ ] Create AWS-based Service for automatic translation
  - [ ] Integrate with DeepL API or AWS
  - [ ] Integrate Payment API (sorry, DeepL/AWS are great but also want some cash)

### Mediainfo Languages

- [ ] we get languages like "German" from Mediainfo and map them to e.g. "De" using languages.js and store.js' ensureLanguageMapping
- [ ] however, we can't be sure that we know all possible Mediainfo provided languages
- [ ] how do we cope with that???
  - [ ] local logging?
  - [ ] webservice?

### Progress - Movies sorted by Name

- page: 56 (God bless America)

### Other (later)

- [ ] investigate Linux "stores" (see: https://www.electron.build/configuration/linux.html)
  - [ ] Linux Mint
  - [ ] Flatpak <https://docs.flatpak.org/en/latest/electron.html>
  - [ ] Snap <https://snapcraft.io/docs/electron-apps>
- [ ] investigate scroll-snap <https://markodenic.com/css-tips/>
- [ ] have individual lists of "my lists" clickable, show dialog (analog to genres, people, companies etc.) and thus "filter by this list"

- [ ] create a MediaInfo watchdog

  - autodownload latest mediainfo
  - check for expected fields (error on fail)
  - check for new fields (warning on fail)

- [ ] Test mediainfo and VLC in Linux/MacOS (we now use "" in the exec)

  - [x] Win: OK
  - [x] Linux: OK
  - [ ] MacOS: ??

- [ ] MediaInfo supports "--Output=JSON", better use this instead of the default XML Output
- [ ] .iso handling?
- [ ] IMDB Awards (Oscars etc.) as data and filter criteria
- [ ] apply shared.\*AppliedContains to the media item once after completely fetching media
  - huge refactoring as movie data must then contain the information if it is affected by the filter
- [ ] items which have a scan error skew the next scan's time-per-item
- [ ] allow imdbid in relink dialog
- [ ] refactor
  - [x] use find-imdb-tconst.js and remove functions from store
  - [ ] find proper place for imdb-scraper.js, find-imdb-tconst.js
  - [ ] identify other functions in store.js which don't really belong there
  - [ ] provide util.promisified stuff in helpers.js and use it exclusively from there
- [ ] handle helpers.isPortable via env-var (get rid of set-portable.js)
- [ ] add a new rescan method: "rescan entries with errors"
- [ ] layout the app with css grid (see: <https://layout.bradwoods.io/customize>)
- [ ] treat rescan of particular titles as a queue (don't disable all other titles when a rescan runs)
  - same queue as a "Scan Media" process
- introduce #tags instead of lists (keep the datastructures in .db though)
- [ ] correctly implement mk-scrollcontainer class (e.g. Medialist)
- [ ] OK? - fix moment's missing local time (see MediaList.lastAccessDisplayText)

### Youtube Support

- [ ] youtube (incl. subscription importer -> <https://www.youtube.com/subscription_manager?action_takeout=1)>

### QA

- [ ] check how fetchMedia/MediaList works if only filescan has been performed (no MI/IMDB data)

### Unsure: Implement Backend as express-like server

- this way we can have front- and backend as independent apps
- major re-write neccessary
