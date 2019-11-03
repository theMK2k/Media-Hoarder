## Progress - Movies sorted by Name
- page: 42

## Other
- filter by Person or Company: this should deselect all Persons and only select the one Person chosen (same with companies)
- correctly implement scrollcontainer class (e.g. Medialist)
OK? - fix moment's missing local time (see MediaList.lastAccessDisplayText)

## Settings
OK - sourcePath: check for removed files
- minimumWaitForSetAccess (update Access datetime after ... seconds)

## Company
- scrape from IMDB
- find out a way to display the "top 5" companies involved

## Filters
- Company (Search-filter)


## MediaList - Movie (non-selected)
- MetaCritic Score

## MediaList - Selected Movie
- show more information
- 

## Edit Movie
- allow to re-assign new IMDB entry
    - perform rescan after re-assign (only this movie)
- 


# QA
- check how fetchMedia/MediaList works if only filescan has been performed (no MI/IMDB data)

- youtube (incl. subscription importer -> https://www.youtube.com/subscription_manager?action_takeout=1)






# DONE
- min/maxAge is false when 0 is in place

## Other
OK - MultiPart: interpret "1_2" as "(1/2)"
OK - exit menuitem
OK - fix Age Rating filter (undetermined yields no results -> see filterParentalAdvisory)
OK - fix duplication check in filescan, e.g. "Audition ~ Ôdishon (De)(Sub De)(HD)[1999][Drama, Horror, Mystery][7.2 @ 65149][tt0235198].mkv"

## Watchlist
- add as filter
- implement "add to watchlist button"
-> Implemented as arbitrary lists

## Play "Button" as masked image
- see data/maskPlay.pdn/png
- embedded as base64 with https://www.base64-image.de/

## Extras
OK - add "isExtraOf" relation for tbl_Movies
OK	-> don't count Extras (e.g. in filters)
OK	-> don't show Extras in main list
OK	-> show Extras in expanded item
OK	-> implement extra detection in rescan (determine to which movie the extra must be assigned to, e.g. multiple releases of the same movie, maybe work with IMDB id but also with parts of the Name)

## Last Seen (last_access_at)
- in movie details
- as sortable
- set after predefined time

## IMDB MetaData
OK - Parental Guidance (Sex/Nudity, Gore etc. scores)

## Filters
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
