# TO-DOs

## Memory Leak (multiple reloads of medialist)

- more intelligent loading?
- better garbage collection?
OK -> we have a memory leak using eventBus.$on -> implement eventBus.$off on beforeDestroy() lifecycle hook
-> we still have the memory leak: don't fetch all data at once (re-fetch for each page)
OK -> check if memory leak is only in dev-mode (yes, it still persists even in prod-mode)

## Harden fetch from web
- How should we handle ECONNRESET? maybe request-retry?
- How can we test this?

## scrapeIMDBSuggestion - use alternative search method

- currently we use the suggestion API which doesn't support non-latin names
- maybe we should use `https://www.imdb.com/find?q=` (which is IMDB search incl. ENTER)?

## I18N - Basic
- implement vue-i18n
- Add UI-Language Selection in Settings
- support all languages supported by DeepL (API):
    en, de, fr, es, it, nl, pl, ja, pt-PT, pt-BR, ru, zh
- change static strings in components to $t('key')
    OK src\App.vue
    OK src\components\Settings.vue
    OK src\components\Home.vue
    src\components\MediaList.vue

    src\components\shared\AddLanguagesDialog.vue
    src\components\shared\AddRegionsDialog.vue
    src\components\shared\AddTitleTypeDialog.vue
    src\components\shared\CheckIMDBScraperDialog.vue
    src\components\shared\CompanyDialog.vue
    src\components\shared\Dialog.vue
    src\components\shared\FilmingLocationDialog.vue
    src\components\shared\LinkIMDBDialog.vue
    src\components\shared\ListDialog.vue
    src\components\shared\LocalVideoPlayerDialog.vue
    src\components\shared\Pagination.vue
    src\components\shared\PersonDialog.vue
    src\components\shared\PlotKeywordDialog.vue
    src\components\shared\RatingDemographicsDialog.vue
    src\components\shared\ScanOptionsDialog.vue
    src\components\shared\SearchDataDialog.vue
    src\components\shared\SourcePath.vue
    src\components\shared\TitleType.vue
    src\components\shared\VersionDialog.vue
    src\components\shared\VideoPlayerDialog.vue

    (other .js files?)

## I18N - Advanced
- Create AWS-based Service for automatic translation
  - Integrate with DeepL API
  - Integrate Payment API (sorry, but DeepL is great but also wants some cash)

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
