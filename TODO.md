# TODO

- [ ] Provide Screenshots in README.md

## NEXT Major (v1.4.0)

### Series: scanning

- [WIP] Support Extras/Specials/Bonus
  - related ticket: #41 Series: Organization of Extras / Specials / Bonus, and Unnumbered Episodes
  - Extras/Specials/Bonus are indicated by B01 or S02B02 and will be treated as bonus
    - B01 will automatically go to Season 1
    - S00B01 will automatically go to Season 0 (the unknown Season)
    - [WIP] rename all Series "Extras" to "Bonus" (at least for the UI)
  - [ ] season's card should show the number of bonus
- [ ] provide more docs about season numbering, bonus/extras/specials

  - actual episodes without official numbering should be put into season 0 and sequentially numbered, e.g. S00E01, S00E02 (this allow the episodes overview to work)
  - Extras/Specials/Bonus attributed to a certain season should be sequentially numbered with the season prefixed, e.g. S02B01, S02B02
  - Extras/Specials/Bonus without attribution to a certain season should be put into season 0, e.g. S00B01, S00B02

- [ ] BUG: distinct release attributes for a series not correct (see: Star Trek Lower Decks)
- [ ] ScanProcessSummary support for individual rescans
- [ ] dont override mediaItem.Name when IMDB scan was unsuccessful
- [ ] BUG: unlinking a series does not unlink its episodes
- [ ] BUG: medialist for series does not reload after rescan
- [ ] BUG: series and the series being directory based leads to errors:
  - [ ] unlink IMDB leads to the series being called "Series" and not the name of the series derived from the directory
  - [x] during scan (before imdb metadata retrieval) a series is only shown as "Series"
- [ ] BUG: subtitles in .rar files are added to the media list
- [ ] BUG: rescanning a specific series does not run mediainfo on its episodes
- [ ] check "rescan" for possible double scanning / meta data retrieval
- [ ] BUG: findIMDBtconstInNFO does not search in correct sub-dir: `searching in Z:\_TESTSPACE\Media-Hoarder\Series`
- [ ] rescanHandleDuplicates (also provide snackbar progress for this)
- [ ] investigate with series-generator: find possible multitudes of episode numbers (also: episode == null)
  - [ ] if this is the case: we need a better getSeriesEpisodeTconstFromCache, possibly by utilizing levenshtein between filename and imdb's episode title
- [ ] #51 Found work around for custom shows and episodes
- [ ] #39 Multipart Episodes
- [ ] #36 Mediainfo always opening

### Series: Link IMDB Dialog

- [ ] for episodes:

  - [WIP] provide all entries for the current series (Series_id_Movies_Owner's IMDB_tconst)
    - [ ] new imdb scraper: scrapeSeriesSeasons(tconst) -> `https://www.imdb.com/title/tt0206512/episodes/` -> dropdown
  - [ ] allow a fallback to standard imdb search

### Series: Delete Media Dialog

- [ ] MediaList: onDeleteMediaDialogYes: also delete series and episodes properly

### Misc

- [ ] BUG: setting stars in Episodes view doesn't store them
- [ ] BUG: subdirectory called "extras" is not assigned to the main movie (the files are provided as main movies themselves)
- [ ] check tconst detection with movies, too (we changed some fullDirectory to fullPath)
- [ ] make loading of filters abortable (e.g. when switching from Series -> Episodes, the filters of Series don't have to be loaded completely through, or Episodes -> Series)
- [ ] BUG? when opening person dialog and clicking "filter by this person", the main list "jumps" and THEN reloads with the filter applied (possibly a fix for another issue)
- [ ] BUG: series in dialog always show yearStart
- [ ] store.saveFilterValues still works with MediaType and not SpecificMediaType
- [ ] investigate everything that still works with MediaType (and possibly should also use SpecificMediaType)
- [ ] investigate if we still use Series_id_Movies_Owner to differentiate Series and Episodes -> we have specificMediaType now
- [ ] we apparently do not use the timezone (we store in UTC)
- [ ] scanErrors:
  - [ ] review how rescan and applyIMDB handle scanErrors (string to object, handle null)
  - [ ] artificially test graphql not found errors
  - [ ] introduce WARNING vs. ERROR
    - WARNING:
      - imdb implausibility
    - ERROR:
      - (new) mediainfo without result (possibly due to max path length exceeded)
      - IMDB GraphQL errors
  - [ ] introduce error types:
    - during filescan
    - during imdb scraping
    - during mediainfo
- [ ] add ScanErrors functionality in applyMediaInfo (mediainfo may fail on exceeding 259 chars paths)
- [ ] investigate the errors of a bigger rescan:
  - [ ] store.js:2199 Error: Command failed: "c:\Apps\Video\MediaInfo CLI\MediaInfo.exe" --Output=XML "... a too long path exceeding 259 characters..."
- [ ] i18n: rescan finished snackbar
- [ ] refactor buildINSERTQuery, buildUDPATEQuery to accept only one object as function parameter
- [ ] IMDB Scraper: analyze video URLs in "Videos" section and find a better suited Trailer URL than the one primarily shown in the main page (which is oftentimes an IMDB special)

  - or simply use:
    - <https://www.imdb.com/title/tt0088247/videogallery/content_type-trailer/?sort=date&sortDir=desc>
    - <https://www.imdb.com/title/tt4154796/videogallery/content_type-trailer/?sortDir=desc&sort=duration>
    - the trailers are also labeled!

### Series: Documentation

- [ ] update 01-Media-Storage.md about aspects of tv series in Media Hoarder, link to it (github) from the history markdown

### Defects

- nothing

## LATER

### Series:scanning

- [ ] if season is unknown or episode number not set: try to find the imdb tconst by comparing names
  - [ ] store.findIMDBtconst: series episode find by name

### Series: Edit Media Dialog

- [ ] Allow user to upload a poster of their liking

### Misc (LATER)

- [ ] introduce AND filter for Video Qualities (other filters might also get AND filter added)
- [ ] Rescan: allow to select/unselect certain source paths for the rescan
- [ ] deprecate tbl_Movies.ML_Quality (it isn't used in code anymore)
- add ffmpeg in order to create screenshots for movies/episodes with missing poster
- [ ] provide "source path selection" in "scan media" dialog
  - allows to select a sub-set of source paths for a media scan
- [ ] include find-imdb-tconst-tests in imdb scraper watchdog
- [ ] fix file/dirbased name when IMDB tconst detection has no result: if the medium is directory-based, then show the directory name and not the file-based name
- [ ] new filter: min. IMDB votes
- [ ] "IMDB score comparison game" (in context of the current list?)
- [ ] curl/wget easylist.txt automatically before build <https://easylist.to/easylist/easylist.txt>
- [ ] later: properly differentiate V1, V2 and V3 mainPageData handling
- [ ] later: async db funcs (initDb, syncSqlite)
- [ ] add "play random media" functionality to the List Actions menu
- [ ] Trailer Show - trailer dialog is open, when adding to list the scrollbar appears on the side, also the trailer dialog seems to wiggle a bit when the add-to-list dialog closes

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
