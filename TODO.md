# TODO

## Progress - Movies sorted by Name
- page: 56 (God bless America)

## IMDB Scraping Interface Watchdog
- implement a watchdog which performs once a day
  - scrape different IMDB pages
  - compare with expected result (json suffices)
  - generate an email which informs me of broken IMDB scraper
  - generate a light-weight status page which informs users of broken IMDB scraper

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
  -> 

on Rescan:
- tokenize and find out if the tokens are either special title types or just language types
-> if user has appropriate language type setting (i.e. the preferred language types accomply with the chosen regions) then filter the language types, i.e. Token = "($LANGUAGE_FULL title)"
-> if the user has preferred title types then filter by them, else discard the title completely

## Road to Release (Win/Linux/Mac)
- add SERIES support

- figure out how to build a Mac version

## Duplicates

- an actual dupliacte is the same file in another location (e.g. local copy vs. on server)
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

## Other
- dont import "See full summary>>"

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