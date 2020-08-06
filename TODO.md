# TODO

## v1.0.0

### Bugs

- i18n: "Imported: wenigen Sekunden ago" <- mixed De and En

### JSDoc everywhere

```text
/**
 * Description of the function
 * @param {string} myParam
 */
```

### Fine-tune some text colors

- [ ] some help texts are too bright

### Automatically find mediainfo and vlc

- Linux "which"
- Windows "where"

### support Movies in directories (also .nfo parsing)

- we currently expect the whole movie name and release attributes being included in the filename, this is not always the case
- [x] find a way to decide if a movie file belongs to a dir-release or is standalone
- [x] if handling .rar files, summarize all individual filesizes
- [x] use isDirectoryBased in findIMDBtconstIncluded (tt12345 in file- or directory name)
- [x] use isDirectoryBased in findIMDBtconstInNFO (by .nfo file content)
- [x] use isDirectoryBased in finding findIMDBtconstByFileOrDirname (by File/Dirname)
- [x] use isDirectoryBased in finding Release attributes (DUBBED, BDRip etc.)
- [ ] handle extras in "Extras" directory
- [ ] check AssignIMDB (individual rescan)

#### A directory-based media file is

- a media file alongside an .nfo file (scene release)
  -> also don't expect any other media files in the directory
- a media file inside an "extra" or "extras" directory (this is our own definition!)
  -> use the full filename as Extra Name

-> set isDirectoryBased = 1
-> ignore the filename and use the directory's name instead
-> parse the .nfo for IMDB tconst

=> anything else: treat it as file-based media file (isDirectoryBased = 0)

#### ignored files are

- a media file inside a "sample" directory
- a media file inside a "proof" directory

#### An ignored 

### MacOS Release

- [ ] investigate binary signing

## LATER

### Dialogs: most of them do not utilize mediaType

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

- [ ] correctly implement scrollcontainer class (e.g. Medialist)
- [ ] OK? - fix moment's missing local time (see MediaList.lastAccessDisplayText)

### Youtube Support

- [ ] youtube (incl. subscription importer -> <https://www.youtube.com/subscription_manager?action_takeout=1)>

### QA

- [ ] check how fetchMedia/MediaList works if only filescan has been performed (no MI/IMDB data)

### Unsure: Implement Backend as express server

- this way we can have front- and backend as independent apps
- major re-write neccessary
