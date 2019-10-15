# Other
- fix duplication check in filescan, e.g. "Audition ~ Ôdishon (De)(Sub De)(HD)[1999][Drama, Horror, Mystery][7.2 @ 65149][tt0235198].mkv"
- correctly implement scrollcontainer class (e.g. Medialist)

# Features


## Last Seen (last_access_at)
- in movie details
- as sortable
- write before launching

## Completed
- in movie details
- as filter

## IMDB MetaData
OK - Parental Guidance (Sex/Nudity, Gore etc. scores)
- 

## Filters
OK - Age
OK - Own Rating
OK - IMDB Rating
OK - MetaCritic
NAH - Number of Votes
OK - Metacritic Score
- Company (Search-filter)
- Persons (Search-filter)

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
