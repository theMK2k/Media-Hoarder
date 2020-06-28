# TO-DOs

## Memory Leak (multiple reloads of medialist)

- more intelligent loading?
- better garbage collection?
OK -> we have a memory leak using eventBus.$on -> implement eventBus.$off on beforeDestroy() lifecycle hook
-> we still have the memory leak: don't fetch all data at once (re-fetch for each page)
OK -> check if memory leak is only in dev-mode (yes, it still persists even in prod-mode)

## More Dialogs
- add AudioLanguageDialog
- add SubtitleLanguageDialog
-> for clicking the individual language in the MediaList
-> allow "filter by this language"
-> what do we do with "+3" entries?

## Fine-tune some text colors
- some help texts are too bright

## Harden fetch from web
OK - How should we handle ECONNRESET? maybe requestretry?
OK - How can we test this?
- investigate offline error handling
  OK - imdb scraper test Dialog
  WIP - imdb scraping during (re-)scan
    - currently:
      - the scan is through, the item is marked as isNew = false
      - now the movie won't be rescanned (quick scan)
    - requirement:
      - track errors during rescan
      - mark item as scanErrors, containing the log of scan errors (NULL if everything is fine)
      - show this at the item in MediaList with button for direct rescan of the item and info to also perform rescan
      - on rescan (quick): also take items with hasScrapeErrors being truthy into account (not only isNew = true)
  - imdb search/find
  - imdb scraping on persons, companies etc.

## Icons for Navbar?
- would it be good to have (many) icons for the sections and filters in the navbar?

## scrapeIMDBSuggestion - use alternative search method

- currently we use the suggestion API which doesn't support non-latin names
- maybe we should use `https://www.imdb.com/find?q=` (which is IMDB search incl. ENTER)?

## I18N - Basic
- support all languages supported by DeepL or AWS (API):
    en, de, fr, es, it, nl, pl, ja, pt-PT, pt-BR, ru, zh

## I18N - Advanced
- Create AWS-based Service for automatic translation
  - Integrate with DeepL API or AWS
  - Integrate Payment API (sorry, DeepL/AWS are great but also want some cash)

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
