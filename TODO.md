# TO-DOs

## Memory Leak (multiple reloads of medialist)
- more intelligent loading?
- better garbage collection?
OK -> we have a memory leak using eventBus.$on -> implement eventBus.$off on beforeDestroy() lifecycle hook
-> we still have the memory leak: don't fetch all data at once (re-fetch for each page)

## View-Switchig multiple event handling bug

## Backlog Popup
- shown on startup
- welcome message
- latest introduced features
- backlog (show more..)
- info if this is the latest version (based on github releases page?)

## Investigate an "AND" filter
- how would SQL queries look?

## Settings - Scraper / Scan Media Options
- allow user to deselect things for the IMDB scraper (analog to store.scanOptions)

## Rating Demographics
OK - scrape
OK - allow the user to choose which demography to use as IMDB rating
- show demographics matrix when clicking IMDB score for an item

## Age Rating
- use user-chosen regions (countries) as basis for the age rating shown in the main list

## Filming Locations
- add as section in MediaLists
- add filter

## CompanyDialog, PersonDialog, Plot Keyword Dialog
include statistical infos (how many movies)

## 720p, SD, HD Detection
OK? - fix resolution Detection, e.g. 4:3 HD is oftentimes detected as 720p

## IMDB Scraper Watchdog
- put all IMDB scraping functions from store.js into imdb-scraper.js
- create a watchdog CLI which tests imdb-scraper.js
  - creates an error report
  - sends an email on error
  - saves status on web location (client can then check the status)

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
- add SERIES support

- figure out how to build a Mac version

## Other
- dont import "See full summary>>"

- correctly implement scrollcontainer class (e.g. Medialist)

OK? - fix moment's missing local time (see MediaList.lastAccessDisplayText)

## Youtube Support
- youtube (incl. subscription importer -> <https://www.youtube.com/subscription_manager?action_takeout=1)>

## QA

- check how fetchMedia/MediaList works if only filescan has been performed (no MI/IMDB data)