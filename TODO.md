# TODO

## Progress - Movies sorted by Name
- page: 56 (God bless America)

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