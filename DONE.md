# DONE

## v1.0.0

### Road to Release (Win/Linux/Mac)

- [x] IMDB detection
- [x] -> improve by utilizing year (162 of 170 matched, 2553 of 2648 matched)
- [x] "Browse" VLC path -> depending on OS type provide default path / default extension
- [x] -> provide mediainfo-rar or similar for Linux/Mac - or better yet let the user provide a path?
  - [x] -> user must provide

- [x] preferred Regions
- [x] let user define preferred (local) Regions to identify the primary title
- [x] -> fetch Countries from <https://www.imdb.com/search/title/> and provide as list
- [x] -> Auto set region by user's localization setting?

### I18N Basic

- [x] moment.humanize should also be localized (see de.json!)
- [x] implement vue-i18n
- [x] Add UI-Language Selection in Settings
- [x] change static strings in components to $t('key')

```text
    src\App.vue
    src\components\Settings.vue
    src\components\Home.vue
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
```

### Release Attributes

- [x] EXTENDED, Director's Cut, UNRATED etc.
- [x] -> implement in shared.releaseAttributes save as Settings.ReleaseAttributes
- [x] -> let them be sortable

OK? => let user re-edit the entry/attributes

- [x] Save/Load of filter
- [x] implement Dialog incl. filtering and removal of individual release attributes

### Harden fetch from web

- [x] How should we handle ECONNRESET? maybe requestretry?
- [x] How can we test this?

- [x] investigate offline error handling
  - [x] imdb scraper test Dialog
  - [x] imdb scraping during (re-)scan
  - [x] track errors during rescan
  - [x] mark item as scanErrors, containing the log of scan errors (NULL if everything is fine)
  - [x] show this at the item in MediaList with button for direct rescan of the item and info to also perform rescan
  - [x] on rescan (quick): also take items with hasScrapeErrors being truthy into account (not only isNew = true)
  - [x] check movie identification based on name (this should also fail during scan)
  - [x] -> add movie identification on item-based rescan if no tconst is available
  - [x] imdb search/find
  - [x] imdb scraping on persons, companies etc.

### More Dialogs

- [x] add AudioLanguageDialog
- [x] add SubtitleLanguageDialog
- [x] -> for clicking the individual language in the MediaList
- [x] -> allow "filter by this language"
- [x] -> what do we do with "+3" entries?
- [x] -> they should expand

### Icons for Navbar

- [x] would it be good to have (many) icons for the sections and filters in the navbar?
- [x] -> yes, all icons identified

### IMDB Scraper Checks / Watchdog

- [x] put all IMDB scraping functions from store.js into imdb-scraper.js
- [x] Implement test-framework callable in app and also in imdb-scraper-watchdog
- [x] Implement IMDB Scraper Checks Dialog, usable from
  - [x] Settings (via Button)
  - [x] after Scan Options Dialog and before actual Scan

### Open moviechat.org button

- [x] -> link <https://moviechat.org/tt0054215>

### Filming Locations

- [x] add as section in MediaLists
- [x] add filter

### Rating Demographics

- [x] scrape
- [x] allow the user to choose which demography to use as IMDB rating
- [x] show demographics matrix when clicking IMDB score for an item

### CompanyDialog, PersonDialog, Plot Keyword Dialog, Filming Locations Dialog

- [x] include statistical infos (how many movies)

### 720p, SD, HD Detection

- [x] fix resolution Detection, e.g. 4:3 HD is oftentimes detected as 720p

### Age Rating

- [x] use user-chosen regions (countries) as basis for the age rating shown in the main list

### Settings - Scraper / Scan Media Options

- [x] allow user to deselect things for the IMDB scraper (analog to store.scanOptions)

### View-Switchig multiple event handling bug

### History/New Version Popup

- [x] shown on startup
- [x] welcome message
- [x] latest introduced features
- [x] history (show more..)
- [x] info if this is the latest version (based on github releases page?)

Content:

```json
[
  {
    "version": "1.0",
    "description": "version-1.0.html"
  },
  {
    "version": "0.5",
    "description": "version-0.5.html"
  }
]
```

- [x] small backlog.json
- [x] load version-xx.html from file or from github if not available
- [x] render within VersionDialog

### Investigate an "AND" filter

- [x] how would SQL queries look?
- [x] save AND filter setting alongside the filters themselves

### Show Scan-Progress in Taskbar

- [x] see: <https://www.electronjs.org/docs/tutorial/progress-bar>

### MediaList

- [x] Bug? Age (range) isn't shown anymore

### Rescan dialog

- [x] show warning when a source path cannot be found but it is set to remove entries on re-scan

### Recalculation of Pagination Items on mouseover

- [x] when mouseover on items, pagination items get recalced
- [x] reason could be usage of this.$set (it was indeed)

### Show Indicator when filters apply

### Person Search

- [x] "David Lynch" should have multiple hits, unfortunately only one is shown

### Duplicates

- [x] an actual duplicate is the same file in another location (e.g. local copy vs. on server)
- [x] a meta duplicate has the same IMDB ID

- [x] Rescan: when a movie was moved (same filename+size just deleted at location X and added on location Y)

  - [x] -> copy over userdefined data (e.g. rating etc. also member of lists)
  - [x] => do we really want this? what are the scenarios?: a "twin" may already exist and should be updated whenever a change happens - in this case we have id_Movies from the "source file" and should all other movies with same filename and size

- [x] => see shared.duplicatesHandling to check which features allow duplicate handling

Features:

- [x] relinkIMDB
- [x] addToList
- [x] updateRating
- [x] updateTitle
- [x] updateSubTitle
- [x] updateLastAccess

- [x] Test actual duplicates

- [x] also implement rescan (actualDuplicates and metaDuplicates can be found there, too)

### IMDB title

- [x] provide languages management (also based on regions!)
- [x] -> we need them for the "preferred Languages" from MediaInfo
- [x] -> we need them for the Primary Title

- [x] -> create tbl_IMDB_Languages
- [x] -> create tbl_IMDB_Regions
- [x] -> Create tbl_IMDB_Regions_Languages (mapping)
- [x] -> "your chosen regions provide the following language options, please select the ones you prefer as Primary Title"

- [x] provide whitelist management of title types
- [x] -> check title types from MovieManager's mm.db

on Rescan:

- [x] tokenize and find out if the tokens are either special title types or just language types
- [x] -> if user has appropriate language type setting (i.e. the preferred language types accomply with the chosen regions) then filter the language types, i.e. Token = "($LANGUAGE_FULL title)"
- [x] -> if the user has preferred title types then filter by them, else discard the title completely

### Pagination

- [x] implement better pagination control (move left, move right, middle: current page / total pages -> dropdown)

### Plotkeywords

- [x] scrape plotkeywords
- [x] show
- [x] filter

### Full Plot Summary

- [x] scrape full plot summary from /plotsummary (find the correct one using the summary text from main page)
- [x] show full plot summary when item is selected

### Restructure Settings

- [x] Tabbed view (either sidebar or horizontal tabs)

General

- [x] Media Player Path
- [x] MediaInfo Path
- [x] Last Access retention (seconds)
- [X] Update on Twins by filename + filesize
- [X] Update on Twins by IMDB ID

Cinema
  
- [x] Source Paths

Series
  
- [x] Source Paths

### Media Scan

- [x] as soon as a tbl_Movies entry is written, also write Name

- [x] min/maxAge is false when 0 is in place

### @Mike

- [x] Analyze the call App.vue -> store.rescan(onlyNew); -> node functionality without IPC or whatever

### Other

- [x] dont import "See full summary>>"
- [x] implement fetchFilter IMDB/Metacritic Score
- [x] implement Company filter by Company Name instead of ID
- [x] -> call companyDialog via eventBus when company is clicked in searchDialog
- [x] -> some numbers mismatch (filter and main list)

- [x] MediaList: when changing a page, autoscroll up?

- [x] Rescan: only 1 button on sidenav, show dialog to choose "only new" or "compete" rescan

- [x] Trailer Player with Video.js (extract video source from imdb trailer page)
- [x] -> MediaList showTrailerLocal

- [x] remember "sort by" setting (same as remembering the filters)
- [x] -> "sort by" is destroyed upon reload after adding/removing entry to a list

- [x] remember last page (same as remembering filters)

- [x] Remove movie from list -> Reload -> List is unchecked (why?)
- [x] filescan new fields:
- [x] size (display humanized e.g. 13.5 GB, 760 MB)
- [x] creation date

- [x] bottom bar should adjust to sidenav (we have its z-index at 100 now)
- [x] filter by Person or Company: this should deselect all Persons and only select the one Person chosen (same with companies)
- [x] MultiPart: interpret "1_2" as "(1/2)"
- [x] exit menuitem
- [x] fix Age Rating filter (undetermined yields no results -> see filterParentalAdvisory)
- [x] fix duplication check in filescan, e.g. `Audition ~ Ôdishon (De)(Sub De)(HD)[1999][Drama, Horror, Mystery][7.2 @ 65149][tt0235198].mkv`

### Languages Filter

- [x] MediaInfo Scan: add to tbl_Movies_Languages (Audio, Subtitle)
- [x] add Audio- and Subtitle Filters in App.vue

### Watchlist

- [x] add as filter
- [x] implement "add to watchlist button"
- [x] -> Implemented as arbitrary lists

### Play "Button" as masked image

- [x] see data/maskPlay.pdn/png
- [x] embedded as base64 with <https://www.base64-image.de/>

### Extras

- [x] add "isExtraOf" relation for tbl_Movies
- [x] -> don't count Extras (e.g. in filters)
- [x] -> don't show Extras in main list
- [x] -> show Extras in expanded item
- [x] -> implement extra detection in rescan (determine to which movie the extra must be assigned to, e.g. multiple releases of the same movie, maybe work with IMDB id but also with parts of the Name)

### Last Seen (last_access_at)

- [x] in movie details
- [x] as sortable
- [x] set after predefined time

### IMDB MetaData

- [x] Parental Guidance (Sex/Nudity, Gore etc. scores)

### Filters

- [x] Company (Search-filter)
- [x] Person (Search-filter)
- [x] Year
- [x] Quality
- [x] People (Search-filter)
- [x] Age
- [x] Own Rating
- [x] IMDB Rating
- [x] Metacritic
- [x] Metacritic Score

### MediaList - Sort

Sort by:

- [x] Name
- [x] Own Rating
- [x] IMDB Rating
- [x] Metacritic Score

### Settings

- [x] Source Path dialog
- [x] -> prefill Description with directory name?
- [x] "loader" on SourcePath removal (it may take some time)
- [x] sourcePath: check for removed files
- [x] minimumWaitForSetAccess (update Access datetime after ... seconds)

### Company

- [x] scrape from IMDB
- [x] find out a way to display the "top 5" companies involved

### MediaList - Movie (non-selected)

- [x] Metacritic Score

### MediaList - Selected Movie

- [x] show more information
- [x] add Content Advisory (Sex & Nudity, Gore etc.)

### Edit Movie

- [x] allow to re-assign new IMDB entry
  - [x] -> opens IMDB search (store/scrapeIMDBAdvancedTitleSearch)
  - [x] perform rescan after re-assign (only this movie)
  - [x] refactor rescanMoviesMetaData (we need to differentiate mediainfo metadata and imdb metadata, we don't need findIMDBtconst when id_Movies is provided)

### Dialog Enter and Escape

- [x] Enter should "OK" the dialog
- [x] Esc should "Cancel" the dialog

```text
Dialog.vue

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
```
