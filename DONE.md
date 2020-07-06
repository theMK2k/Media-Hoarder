# DONE

## Road to Release (Win/Linux/Mac)
OK - IMDB detection
OK -> improve by utilizing year (162 of 170 matched, 2553 of 2648 matched)

OK - "Browse" VLC path -> depending on OS type provide default path / default extension
OK - provide mediainfo-rar or similar for Linux/Mac - or better yet let the user provide a path?
    ->  user must provide

OK - preferred Regions
OK  - let user define preferred (local) Regions to identify the primary title
OK  -> fetch Countries from https://www.imdb.com/search/title/ and provide as list
OK  -> Auto set region by user's localization setting?

## I18N Basic
OK - moment.humanize should also be localized (see de.json!)
OK - implement vue-i18n
OK - Add UI-Language Selection in Settings
OK - change static strings in components to $t('key')
    OK src\App.vue
    OK src\components\Settings.vue
    OK src\components\Home.vue
    OK src\components\MediaList.vue

    OK src\components\shared\AddLanguagesDialog.vue
    OK src\components\shared\AddRegionsDialog.vue
    OK src\components\shared\AddTitleTypeDialog.vue
    OK src\components\shared\CheckIMDBScraperDialog.vue
    OK src\components\shared\CompanyDialog.vue
    OK src\components\shared\Dialog.vue
    OK src\components\shared\FilmingLocationDialog.vue
    OK src\components\shared\LinkIMDBDialog.vue
    OK src\components\shared\ListDialog.vue
    OK src\components\shared\LocalVideoPlayerDialog.vue
    OK src\components\shared\Pagination.vue
    OK src\components\shared\PersonDialog.vue
    OK src\components\shared\PlotKeywordDialog.vue
    OK src\components\shared\RatingDemographicsDialog.vue
    OK src\components\shared\ScanOptionsDialog.vue
    OK src\components\shared\SearchDataDialog.vue
    OK src\components\shared\SourcePath.vue
    OK src\components\shared\TitleType.vue
    OK src\components\shared\VersionDialog.vue
    OK src\components\shared\VideoPlayerDialog.vue

## Harden fetch from web
OK - How should we handle ECONNRESET? maybe requestretry?
OK - How can we test this?

- investigate offline error handling
  OK - imdb scraper test Dialog
  OK - imdb scraping during (re-)scan
  OK  - track errors during rescan
  OK  - mark item as scanErrors, containing the log of scan errors (NULL if everything is fine)
  OK  - show this at the item in MediaList with button for direct rescan of the item and info to also perform rescan
  OK  - on rescan (quick): also take items with hasScrapeErrors being truthy into account (not only isNew = true)
  OK - check movie identification based on name (this should also fail during scan)
  OK -> add movie identification on item-based rescan if no tconst is available
  OK - imdb search/find
  OK - imdb scraping on persons, companies etc.

## More Dialogs
OK - add AudioLanguageDialog
OK - add SubtitleLanguageDialog
OK -> for clicking the individual language in the MediaList
OK -> allow "filter by this language"
OK -> what do we do with "+3" entries?
OK  -> they should expand

## Icons for Navbar?
OK - would it be good to have (many) icons for the sections and filters in the navbar?

## IMDB Scraper Checks / Watchdog

OK - put all IMDB scraping functions from store.js into imdb-scraper.js
OK - create a watchdog CLI which tests imdb-scraper.js
      - creates an error report
      - sends an email on error
      - saves status on web location (client can then check the status)
    OK -> start with "npm run imdb-scraper-watchdog"
OK - Implement test-framework callable in app and also in imdb-scraper-watchdog
OK - Implement IMDB Scraper Checks Dialog, usable from
OK    - Settings (via Button)
OK    - after Scan Options Dialog and before actual Scan

## Open moviechat.org button
-> link https://moviechat.org/tt0054215

## Filming Locations
OK - add as section in MediaLists
OK - add filter

## Rating Demographics
OK - scrape
OK - allow the user to choose which demography to use as IMDB rating
OK - show demographics matrix when clicking IMDB score for an item

## CompanyDialog, PersonDialog, Plot Keyword Dialog, Filming Locations Dialog
include statistical infos (how many movies)

## 720p, SD, HD Detection
OK - fix resolution Detection, e.g. 4:3 HD is oftentimes detected as 720p

## Age Rating
- use user-chosen regions (countries) as basis for the age rating shown in the main list

## Settings - Scraper / Scan Media Options
- allow user to deselect things for the IMDB scraper (analog to store.scanOptions)

## View-Switchig multiple event handling bug

## History/New Version Popup
- shown on startup
- welcome message
- latest introduced features
- history (show more..)
- info if this is the latest version (based on github releases page?)

Content:

[
  {
    version: "1.0",
    features: [
      {
        shortDescription: "TV Series Support",
        longDescription: "Added TV Series Support allows to scan TV Series (expected are directories for the full series and subdirectories for seasons)",
        link: "https://link-to-further-explanations.com"
      }
    ],

    fixes: [

    ],

    other: [

    ]
  }
]
- provide a full set as json
- provide the latest version as json (this will be loaded from github by the client in order to inform the user of new version and it's features)

OR

Content:

[
  {
    version: "1.0",
    description: "version-1.0.html"
  },
  {
    version: "0.5",
    description: "version-0.5.html"
  }
]

-> small backlog.json
-> load version-xx.html from file or from github if not available
-> render within VersionDialog

## Investigate an "AND" filter
OK - how would SQL queries look?
OK -> save AND filter setting alongside the filters themselves

## Show Scan-Progress in Taskbar
- see: https://www.electronjs.org/docs/tutorial/progress-bar

## MediaList
- Bug? Age (range) isn't shown anymore

## Rescan dialog
- show warning when a source path cannot be found but it is set to remove entries on re-scan

## Recalculation of Pagination Items on mouseover
- when mouseover on items, pagination items get recalced
- reason could be usage of this.$set (it was indeed)

## Show Indicator when filters apply

## Person Search
- "David Lynch" should have multiple hits, unfortunately only one is shown

## Duplicates

- an actual duplicate is the same file in another location (e.g. local copy vs. on server)
- a meta duplicate has the same IMDB ID

- Rescan: when a movie was moved (same filename+size just deleted at location X and added on location Y)

  -> copy over userdefined data (e.g. rating etc. also member of lists)
  => do we really want this? what are the scenarios?: a "twin" may already exist and should be updated whenever a change happens - in this case we have id_Movies from the "source file" and should all other movies with same filename and size

=> see shared.duplicatesHandling to check which features allow duplicate handling

Features:
  OK relinkIMDB
  OK addToList
  OK updateRating
  updateTitle
  updateSubTitle
  OK updateLastAccess

- Test actual duplicates

- also implement rescan (actualDuplicates and metaDuplicates can be found there, too)

## IMDB title

- provide languages management (also based on regions!)
-> we need them for the "preferred Languages" from MediaInfo
-> we need them for the Primary Title

-> create tbl_IMDB_Languages
-> create tbl_IMDB_Regions
-> Create tbl_IMDB_Regions_Languages (mapping)
-> "your chosen regions provide the following language options, please select the ones you prefer as Primary Title"

OK - provide whitelist management of title types
  OK -> check title types from MovieManager's mm.db

on Rescan:
- tokenize and find out if the tokens are either special title types or just language types
-> if user has appropriate language type setting (i.e. the preferred language types accomply with the chosen regions) then filter the language types, i.e. Token = "($LANGUAGE_FULL title)"
-> if the user has preferred title types then filter by them, else discard the title completely

## Pagination
- implement better pagination control (move left, move right, middle: current page / total pages -> dropdown)

## Plotkeywords
OK - scrape plotkeywords
OKish - show
- filter

## Full Plot Summary
- scrape full plot summary from /plotsummary (find the correct one using the summary text from main page)
- show full plot summary when item is selected

## Restructure Settings

- Tabbed view (either sidebar or horizontal tabs)
  1. General
  - Media Player Path
  - MediaInfo Path
  - Last Access retention (seconds)
  - [X] Update on Twins by filename + filesize
  - [X] Update on Twins by IMDB ID

  2. Cinema
  - Source Paths

  3. Series
  - Source Paths

## Media Scan
OK - as soon as a tbl_Movies entry is written, also write Name

- min/maxAge is false when 0 is in place

## @Mike

Analyze the call App.vue -> store.rescan(onlyNew); -> node functionality without IPC or whatever

## Other
OK - dont import "See full summary>>"

OK - implement fetchFilter IMDB/Metacritic Score

OK - implement Company filter by Company Name instead of ID
OK -> call companyDialog via eventBus when company is clicked in searchDialog
  -> some numbers mismatch (filter and main list)

OK - MediaList: when changing a page, autoscroll up?

OK - Rescan: only 1 button on sidenav, show dialog to choose "only new" or "compete" rescan

OK - Trailer Player with Video.js (extract video source from imdb trailer page)
OK -> MediaList showTrailerLocal

OK - remember "sort by" setting (same as remembering the filters)
OK -> "sort by" is destroyed upon reload after adding/removing entry to a list

OK - remember last page (same as remembering filters)

OK - Remove movie from list -> Reload -> List is unchecked (why?)
OK - filescan new fields:
OK - size (display humanized e.g. 13.5 GB, 760 MB)
OK - creation date

OK - bottom bar should adjust to sidenav (we have its z-index at 100 now)
OK - filter by Person or Company: this should deselect all Persons and only select the one Person chosen (same with companies)
OK - MultiPart: interpret "1_2" as "(1/2)"
OK - exit menuitem
OK - fix Age Rating filter (undetermined yields no results -> see filterParentalAdvisory)
OK - fix duplication check in filescan, e.g. "Audition ~ Ôdishon (De)(Sub De)(HD)[1999][Drama, Horror, Mystery][7.2 @ 65149][tt0235198].mkv"

## Languages Filter

OK - MediaInfo Scan: add to tbl_Movies_Languages (Audio, Subtitle)
OK - add Audio- and Subtitle Filters in App.vue

## Watchlist

- add as filter
- implement "add to watchlist button"
-> Implemented as arbitrary lists

## Play "Button" as masked image

- see data/maskPlay.pdn/png
- embedded as base64 with https://www.base64-image.de/

## Extras

OK - add "isExtraOf" relation for tbl_Movies
OK -> don't count Extras (e.g. in filters)
OK -> don't show Extras in main list
OK -> show Extras in expanded item
OK -> implement extra detection in rescan (determine to which movie the extra must be assigned to, e.g. multiple releases of the same movie, maybe work with IMDB id but also with parts of the Name)

## Last Seen (last_access_at)

- in movie details
- as sortable
- set after predefined time

## IMDB MetaData

OK - Parental Guidance (Sex/Nudity, Gore etc. scores)

## Filters

OK - Company (Search-filter)
OK - Person (Search-filter)
OK - Year
OK - Quality
WIP - Persons (Search-filter)
OK - Age
OK - Own Rating
OK - IMDB Rating
OK - Metacritic
NAH - Number of Votes
OK - Metacritic Score

## MediaList - Sort

- Sort by:
OK    - Name
OK    - Own Rating
OK    - IMDB Rating
OK    - Metacritic Score

## Settings
OK - Source Path dialog
    -> prefill Description with directory name?
OK - "loader" on SourcePath removal (it may take some time)
OK - sourcePath: check for removed files
OK - minimumWaitForSetAccess (update Access datetime after ... seconds)

## Company

OK - scrape from IMDB
OK - find out a way to display the "top 5" companies involved

## MediaList - Movie (non-selected)

OK - Metacritic Score

## MediaList - Selected Movie

OK - show more information
OK - add Content Advisory (Sex & Nudity, Gore etc.)

## Edit Movie

OK - allow to re-assign new IMDB entry
  OK -> opens IMDB search (store/scrapeIMDBAdvancedTitleSearch)
    OK - perform rescan after re-assign (only this movie)
      OK -> refactor rescanMoviesMetaData (we need to differentiate mediainfo metadata and imdb metadata, we don't need findIMDBtconst when id_Movies is provided)

## Dialog Enter and Escape
-> Enter should "OK" the dialog
-> Esc should "Cancel" the dialog

- Dialog.vue
  OK - Enter
  OK - Esc

- CompanyDialog.vue
  N/A - Enter
  OK - Esc

- ListDialog.vue
  OK - Enter
  OK - Esc

- LocalVideoPlayerDialog.vue
  N/A - Enter
  OK - Esc

- PersonDialog.vue
  N/A - Enter
  OK - Esc

- ScanOptionsDialog.vue
  OK - Enter
  OK - Esc

- SearchDataDialog.vue
  N/A - Enter
  OK - Esc

- LinkIMDBDialog.vue
  N/A - Enter
  OK - Esc

- VideoPlayerDialog.vue
  N/A - Enter
  OK - Esc
