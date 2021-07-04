# TODO

## v1.0.0

- introduce a scan error (more like scan warning) when:
  - actual runtime differs from imdb runtime
  - release year differs from imdb year

### Bugs

- nothing

### Other

- nothing

## LATER

### Create i18n Editor

- [ ] include *.json export in Media Hoarder, also load additional files from %workdir%/i18n
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

### Other

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
