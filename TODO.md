# TODO

## Settings
- "loader" on SourcePath removal (it may take some time)

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

## Progress - Movies sorted by Name
- page: 56 (God bless America)

## Road to Release (Win/Linux/Mac)
- IMDB detection
OK -> improve by utilizing year (162 of 170 matched, 2553 of 2648 matched)

OK - "Browse" VLC path -> depending on OS type provide default path / default extension
OK - provide mediainfo-rar or similar for Linux/Mac - or better yet let the user provide a path?
    ->  user must provide
- provide Language Settings (which is the primary language of the user?)
- provide Language Mapping (German -> De etc. should be extendable by the user, too)

- add TV support

## Twins

- a twin is the same file in another location (e.g. local copy vs. on server)
- a twin for certain metadata (e.g. user rating) has the same IMDB ID
- Rescan: when a movie was moved (same filename+size just deleted at location X and added on location Y)

  -> copy over userdefined data (e.g. rating etc. also member of lists)
  => do we really want this? what are the scenarios?: a "twin" may already exist and should be updated whenever a change happens - in this case we have id_Movies from the "source file" and should all other movies with same filename and size

## Other

- correctly implement scrollcontainer class (e.g. Medialist)

OK? - fix moment's missing local time (see MediaList.lastAccessDisplayText)

## Settings

## Company

## Filters

## MediaList - Movie (non-selected)

## MediaList - Selected Movie

## Edit Movie

## QA

- check how fetchMedia/MediaList works if only filescan has been performed (no MI/IMDB data)

- youtube (incl. subscription importer -> <https://www.youtube.com/subscription_manager?action_takeout=1)>

# DONE

## Media Scan
OK - as soon as a tbl_Movies entry is written, also write Name

- min/maxAge is false when 0 is in place

## @Mike

Analyze the call App.vue -> store.rescan(onlyNew); -> node functionality without IPC or whatever

## Other
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
OK - MetaCritic
NAH - Number of Votes
OK - Metacritic Score

## MediaList - Sort

- Sort by:
OK    - Name
OK    - Own Rating
OK    - IMDB Rating
OK    - Metacritic Score

## Settings

OK - sourcePath: check for removed files
OK - minimumWaitForSetAccess (update Access datetime after ... seconds)

## Company

OK - scrape from IMDB
OK - find out a way to display the "top 5" companies involved

## MediaList - Movie (non-selected)

OK - MetaCritic Score

## MediaList - Selected Movie

OK - show more information
OK - add Content Advisory (Sex & Nudity, Gore etc.)

## Edit Movie

OK - allow to re-assign new IMDB entry
  OK -> opens IMDB search (store/scrapeIMDBAdvancedTitleSearch)
    OK - perform rescan after re-assign (only this movie)
      OK -> refactor rescanMoviesMetaData (we need to differentiate mediainfo metadata and imdb metadata, we don't need findIMDBtconst when id_Movies is provided)
