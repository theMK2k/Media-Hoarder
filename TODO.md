# Progress - Movies sorted by Name
- page: 42

# Other
- add "isExtraOf" relation for tbl_Movies
	-> don't count Extras (e.g. in filters)
	-> don't show Extras in main list
	-> show Extras in expanded item
	-> implement extra detection in rescan (determine to which movie the extra must be assigned to, e.g. multiple releases of the same movie, maybe work with IMDB id but also with parts of the Name)

- join multi-part files (1_2, 2_2, ...)

OK - exit menuitem


- youtube (incl. subscription importer -> https://www.youtube.com/subscription_manager?action_takeout=1)

- fix Age Rating filter (undetermined yields no results -> see filterParentalAdvisory)
- fix duplication check in filescan, e.g. "Audition ~ Ôdishon (De)(Sub De)(HD)[1999][Drama, Horror, Mystery][7.2 @ 65149][tt0235198].mkv"
- correctly implement scrollcontainer class (e.g. Medialist)
- fix moment's missing local time (see MediaList.lastAccessDisplayText)

# Settings
- sourcePath: check for removed files
- minimumWaitForSetAccess (update Access datetime after ... seconds)

# Features

## Edit Movie
- 

## Last Seen (last_access_at)
- in movie details
- as sortable
- write before launching

## Completed
-> not necessary: we just use 
- in movie details
- as filter

## IMDB MetaData
OK - Parental Guidance (Sex/Nudity, Gore etc. scores)
- 

## Filters
- Quality
- Year
WIP - Persons (Search-filter)
OK - Age
OK - Own Rating
OK - IMDB Rating
OK - MetaCritic
NAH - Number of Votes
OK - Metacritic Score
- Company (Search-filter)


## MediaList - Sort
-> implement as chips (multiple sort, e.g. Year -> Name or Year -> Metacritic Score)
- Sort by:
    - Name
    - Own Rating
    - IMDB Rating
    - Metacritic Score
    - 

## MediaList - Movie (non-selected)
- MetaCritic Score

## MediaList - Selected Movie
- show more information
- 

## Edit Movie
- allow to re-assign new IMDB entry
    - perform rescan after re-assign (only this movie)
- 

## TV
- have a 2- or 3-



# QA
- check how fetchMedia/MediaList works if only filescan has been performed (no MI/IMDB data)


# DONE
- min/maxAge is false when 0 is in place

## Watchlist
- add as filter
- implement "add to watchlist button"
-> Implemented as arbitrary lists

## Play "Button" as masked image
- see data/maskPlay.pdn/png
- embedded as base64 with https://www.base64-image.de/