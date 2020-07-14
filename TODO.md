# TODO

## v1.0.0

### Release Attributes

- EXTENDED, Director's Cut, UNRATED etc.
-> implement in shared.releaseAttributes save as Settings.ReleaseAttributes
-> let them be sortable
=> let user re-edit the entry/attributes

### Fine-tune some text colors

- some help texts are too bright

### IMDB Scraping Interface Watchdog

- implement a watchdog which performs once a day
  - scrape different IMDB pages
  - compare with expected result (json suffices)
  - generate an email which informs me of broken IMDB scraper
  - generate a light-weight status page which informs users of broken IMDB scraper

### support Movies in directories (also .nfo parsing)

## LATER

### Memory Leak (multiple reloads of medialist)

- more intelligent loading?
- better garbage collection?
OK -> we have a memory leak using eventBus.$on -> implement eventBus.$off on beforeDestroy() lifecycle hook
-> we still have the memory leak: don't fetch all data at once (re-fetch for each page)
OK -> check if memory leak is only in dev-mode (yes, it still persists even in prod-mode)

### Use Alternative Search Method

- IMDB Detection uses Suggestion API which doesn't support non-latin names
- IMDB Link Dialog uses Advanced Title Search API which doesn't support non-latin names
- maybe we should use `https://www.imdb.com/find?q=` (which is IMDB search incl. ENTER)?
-> replace it in LinkIMDBDialog
-> also use it for IMDB detection by filename
IMPORTANT: Find API only yields results if the movie title is complete
=> we have to use find API only as fallback for the advancedTitleSearch
=> maybe we should implement an "ultimate" search which combines results of all three searches?

### I18N - Basic
- support all languages supported by DeepL or AWS (API):
    en, de, fr, es, it, nl, pl, ja, pt-PT, pt-BR, ru, zh

### I18N - Advanced
- Create AWS-based Service for automatic translation
  - Integrate with DeepL API or AWS
  - Integrate Payment API (sorry, DeepL/AWS are great but also want some cash)

### Mediainfo Languages

- we get languages like "German" from Mediainfo and map them to e.g. "De" using languages.js and store.js' ensureLanguageMapping
- however, we can't be sure that we know all possible Mediainfo provided languages
- how do we cope with that???
  - local logging?
  - webservice?

### Progress - Movies sorted by Name

- page: 56 (God bless America)

### Other

- correctly implement scrollcontainer class (e.g. Medialist)
OK? - fix moment's missing local time (see MediaList.lastAccessDisplayText)

### Youtube Support

- youtube (incl. subscription importer -> <https://www.youtube.com/subscription_manager?action_takeout=1)>

### QA

- check how fetchMedia/MediaList works if only filescan has been performed (no MI/IMDB data)

### Implement Backend as express server?

- this way we can have front- and backend as independent apps
