# Series

This document describes strategies in (re-)scanning series.

## Sourcepath may only contain directories containing a series each

Pros:

- Media Hoarder can directly work with the assumption that any encountered sub-directory of the source path contains a series each
- anything below the sub-directory (files, directories) will be assigned to the series
- if imdb metadata of the series cannot be found, the directory name will be used as the series title (user can still manually link to imdb)
- knowing the series is contained in a directory, Media Hoarder can re-check if the imdb linking was plausible (i.e. by comparing episodes)

Cons:

- This approach is rather straight-forward and possibly not too problematic for any user
- If a user has `series/drama`, `series/action` etc. then these must be the source paths and not `series`

## File/Directory Naming

Media Hoarder will support the following episode namings (non-case sensitive):

- `s1e1` (denoting the season and episode)
- `s01e01` (denoting the season and episode with leading zeros)
- `s01e01e02e03` (denoting the season and multiple episodes)
- `s01e1-4` (denoting the season and multiple episodes)
- `s01e01-e04` (denoting the season and multiple episodes with leading zeros)
- `1x1` (denoting the season and episode)

For bonus content, Media Hoarder supports:

- `s1b1` (season and bonus number)
- `s01b01` (season and bonus number with leading zeros)

Date-based series (e.g. talk shows, sports events)

- `2023-01-31`

## Series in tbl_Movies

- the series itself (the sub-directory below the source path) is denoted by:

  - having a sourcepath with MediaType = "series"
  - Series_id_Movies_Owner IS NULL (links to the series' entry)
  - startYear
  - (optional) endYear

- an episode is denoted by:

  - having a sourcepath with MediaType = "series"
  - (+)Series_id_Movies_Owner (links to the series' entry)

- (+) Series_Season (integer)
- (+) Series_Episodes_First (integer, the first episode, for sorting)
- (+) Series_Episodes_Rest (text, the remaining episodes, comma separated)
  - Note: Series_Episodes_First and Series_Episodes_Rest may be combined after query to `S01E05`, `S01E03-E05`, `S01E01E03E05` or whatever fits in the UI
- (+) Series_Bonus_Number (integer, bonus)

-> TODO: merge the same series (same imdb tconst) when querying; merging in db is counter-productive because multiple sourcepaths may apply (and be filtered!)

## Re-Scanning

- Build up the series' entries
- Build up the episodes entries
- scan for metadata
  - detect tconst for series
  - detect tconst for episodes
  - provide imdb metadata for series and each episode
    - Note: multi-episodes must be combined somehow
