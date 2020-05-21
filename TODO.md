# TO-DOs

## Memory Leak (multiple reloads of medialist)
- more intelligent loading?
- better garbage collection?
OK -> we have a memory leak using eventBus.$on -> implement eventBus.$off on beforeDestroy() lifecycle hook
-> we still have the memory leak: don't fetch all data at once (re-fetch for each page)
OK -> check if memory leak is only in dev-mode (yes, it still persists even in prod-mode)

## Walk the TODOs in Code

## IMDB Scraper Watchdog
OK - put all IMDB scraping functions from store.js into imdb-scraper.js
WIP - create a watchdog CLI which tests imdb-scraper.js
      - creates an error report
      - sends an email on error
      - saves status on web location (client can then check the status)
    OK -> start with "npm run imdb-scraper-watchdog"
- Implement test-framework callable in app and also in imdb-scraper-watchdog
- How should we handle ECONNRESET? maybe fetch-retry?

## scrapeIMDBSearch - use alternative search method
- currently we use the suggestion API which doesn't support non-latin names
- maybe we should use https://www.imdb.com/find?q= (which is IMDB search incl. ENTER)?


## Mediainfo Languages
- we get languages like "German" from Mediainfo and map them to e.g. "De" using languages.js and store.js' ensureLanguageMapping
- however, we can't be sure that we know all possible Mediainfo provided languages
- how do we cope with that???
  - local logging?
  - webservice?

## Progress - Movies sorted by Name
- page: 56 (God bless America)

## Release Attributes
- EXTENDED, Director's Cut, UNRATED etc.

## IMDB Scraping Interface Watchdog
- implement a watchdog which performs once a day
  - scrape different IMDB pages
  - compare with expected result (json suffices)
  - generate an email which informs me of broken IMDB scraper
  - generate a light-weight status page which informs users of broken IMDB scraper

## Road to Release (Win/Linux/Mac)
- support Movies in directories (also .nfo)

## Other
- correctly implement scrollcontainer class (e.g. Medialist)

OK? - fix moment's missing local time (see MediaList.lastAccessDisplayText)

## Youtube Support
- youtube (incl. subscription importer -> <https://www.youtube.com/subscription_manager?action_takeout=1)>

## QA

- check how fetchMedia/MediaList works if only filescan has been performed (no MI/IMDB data)

## Implement Backend as express server
- this way we can have front- and backend as independent apps
