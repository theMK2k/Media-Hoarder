# Media Hoarder Database

This document describes the SQLite database schema of Media Hoarder (`data/media-hoarder.db`), powered by better-sqlite3.

## Table Overview

| Table | Purpose | Rows (sample) |
| ----- | ------- | ------------- |
| tbl_Movies | Central table: one row per movie/episode/extra | 30,574 |
| tbl_SourcePaths | Root directories the app scans for media | 19 |
| tbl_Settings | Key-value application settings | 29 |
| tbl_Genres | Genre lookup (28 IMDB genres) | 28 |
| tbl_Movies_Genres | Movie-to-genre junction | 82,207 |
| tbl_Movies_IMDB_Credits | Movie-to-person credits (cast, crew) | 6,421,055 |
| tbl_Movies_IMDB_Companies | Movie-to-company associations | 612,172 |
| tbl_Movies_IMDB_Filming_Locations | Movie-to-filming-location junction | 77,364 |
| tbl_Movies_IMDB_Plot_Keywords | Movie-to-plot-keyword junction | 1,388,473 |
| tbl_Movies_Languages | Audio/subtitle languages per movie | 183,417 |
| tbl_Movies_MI_Tracks | MediaInfo track details per movie | 281,016 |
| tbl_Movies_MI_Qualities | Video quality labels per movie | 30,276 |
| tbl_Movies_Release_Attributes | Release tags (e.g. "BluRay", "HDR") per movie | 26,412 |
| tbl_IMDB_Persons | IMDB person bios and photos | 1,157 |
| tbl_IMDB_Filming_Locations | Location name lookup | 32,730 |
| tbl_IMDB_Plot_Keywords | Keyword lookup | 152,982 |
| tbl_IMDB_Regions | Country/region codes | 262 |
| tbl_IMDB_Languages | Language codes | 105 |
| tbl_IMDB_Regions_Languages | Region-to-language mapping | 275 |
| tbl_IMDB_Title_Types | IMDB title type definitions | 124 |
| tbl_AgeRating | Age ratings by country | 39,158 |
| tbl_Lists | User-created lists | 16 |
| tbl_Lists_Movies | List-to-movie junction | 384 |
| tbl_Scan_Processes | Scan run history with stats | 130 |
| tbl_Scan_Processes_Items | Individual items affected per scan | 9,370 |
| tbl_Filter_Persons | Saved person filters | 52 |
| tbl_Filter_Companies | Saved company filters | 7 |
| tbl_Filter_IMDB_Filming_Locations | Saved location filters | 3 |
| tbl_Filter_IMDB_Plot_Keywords | Saved keyword filters | 15 |
| tbl_Filter_Cache | Cached filter state (key-value) | 0 |
| tbl_DB_Migrations | Schema migration log | 1 |

## Core Tables

### tbl_Movies (central entity)

The main table representing every media item: movies, series, episodes, and extras. Key column groups:

- **Identity:** `id_Movies` (PK), `id_SourcePaths` (FK), `RelativePath`, `RelativeDirectory`, `Filename`, `Name`, `Name2`
- **File metadata:** `Size`, `file_created_at`, `created_at`, `last_access_at`, `isDirectoryBased`
- **MediaInfo (MI_):** `MI_Duration`, `MI_Duration_Seconds`, `MI_Duration_Formatted`, `MI_Quality`, `MI_Aspect_Ratio`, `MI_Audio_Languages`, `MI_Subtitle_Languages`, `MI_Done`
- **IMDB core:** `IMDB_tconst`, `IMDB_Done`, `IMDB_releaseType`, `IMDB_originalTitle`, `IMDB_primaryTitle`, `IMDB_localTitle`, `IMDB_startYear`, `IMDB_endYear`, `IMDB_runtimeMinutes`
- **IMDB ratings (overall):** `IMDB_rating`, `IMDB_numVotes`, `IMDB_metacriticScore`
- **IMDB demographic ratings:** Broken down by gender (males/females), age brackets (under_18, 18_29, 30_44, 45_plus), top_1000_voters, us/non_us_users -- each with `IMDB_rating_*` and `IMDB_numVotes_*` columns
- **IMDB content:** `IMDB_plotSummary`, `IMDB_plotSummaryFull`, `IMDB_posterSmall_URL`, `IMDB_posterLarge_URL`, `IMDB_Trailer_URL`
- **IMDB parental advisory:** `IMDB_Parental_Advisory_Nudity`, `_Violence`, `_Profanity`, `_Alcohol`, `_Frightening`
- **IMDB age rating:** `IMDB_MinAge`, `IMDB_MaxAge`, `IMDB_id_AgeRating_Chosen_Country`
- **IMDB top credits (denormalized):** `IMDB_Top_Directors`, `IMDB_Top_Writers`, `IMDB_Top_Producers`, `IMDB_Top_Cast`, `IMDB_Top_Production_Companies`
- **Plot/description:** `plotSummary`, `plotSummaryFull`, `Description`, plus `*_Translated` variants
- **Series hierarchy:** `Series_id_Movies_Owner` (FK to parent series), `Series_Season`, `Series_Episodes_First`, `Series_Episodes_Complete`, `Series_Bonus_Number`, `Series_Num_Episodes`, `Series_Num_Seasons`, `Series_Num_Bonus`, `Series_currentPage`
- **Extras hierarchy:** `Extra_id_Movies_Owner` (FK to parent movie/series)
- **Status flags:** `Rating` (user rating), `Completed`, `isRemoved`, `isNew`, `isUnlinkedIMDB`, `scanErrors`, `DefinedByUser`

### tbl_SourcePaths

Root directories where the app scans for media files.

| Column | Description |
| ------ | ----------- |
| id_SourcePaths | PK |
| MediaType | "movies" or "series" |
| Path | Filesystem path |
| Description | User-given label |
| checkRemovedFiles | Whether to detect deletions |
| created_at | Timestamp |

### tbl_Settings

Simple key-value store for application configuration (29 settings).

## IMDB Lookup Tables

### tbl_Genres

Genre definitions with a unique `GenreID` (text) and display `Name`.

### tbl_IMDB_Persons

Person profiles: `IMDB_Person_ID`, `Photo_URL`, `ShortBio`, `LongBio`. Only persons that have been looked up are cached here (1,157 rows).

### tbl_IMDB_Filming_Locations

Distinct location strings (32,730 entries).

### tbl_IMDB_Plot_Keywords

Distinct plot keywords (152,982 entries).

### tbl_AgeRating

Age ratings per country: `Country`, `Code`, `Age`.

### tbl_IMDB_Regions / tbl_IMDB_Languages / tbl_IMDB_Regions_Languages

Region and language reference data with a junction table mapping which languages are spoken in which regions.

### tbl_IMDB_Title_Types

IMDB title type definitions with example titles and links (124 types).

## Junction / Association Tables

These link movies to their many-to-many relationships:

| Table | Links | Unique Constraint |
| ----- | ----- | ----------------- |
| tbl_Movies_Genres | Movie <-> Genre | (none, indexed both FKs) |
| tbl_Movies_IMDB_Credits | Movie <-> Person + Category + Credit | (id_Movies, Category, IMDB_Person_ID, Credit) |
| tbl_Movies_IMDB_Companies | Movie <-> Company + Category + Role | (id_Movies, Category, IMDB_Company_ID, Role) |
| tbl_Movies_IMDB_Filming_Locations | Movie <-> Location + Details, NumVotes | (id_Movies, id_IMDB_Filming_Locations) |
| tbl_Movies_IMDB_Plot_Keywords | Movie <-> Keyword + NumVotes, NumRelevant | (id_Movies, id_IMDB_Plot_Keywords) |
| tbl_Movies_Languages | Movie <-> Type + Language | (id_Movies, Type, Language) |
| tbl_Movies_MI_Qualities | Movie <-> Quality label + Category | (none) |
| tbl_Movies_MI_Tracks | Movie <-> MediaInfo track (full detail) | (none, indexed id_Movies + type) |
| tbl_Movies_Release_Attributes | Movie <-> Release tag (searchTerm) | (none, indexed id_Movies) |
| tbl_Lists_Movies | List <-> Movie | (none) |

## MediaInfo Tables

### tbl_Movies_MI_Tracks

Stores detailed MediaInfo output per track (video, audio, text/subtitle, general). Contains ~170 columns covering codec, resolution, bitrate, color space, channel layout, frame rate, and many more technical properties. Each row is one track within one movie file.

### tbl_Movies_MI_Qualities

Categorized quality labels (e.g. "720p", "1080p", "4K") per movie, with optional `Category_Name` and `Category_Sort` for grouping.

## User Features

### tbl_Lists / tbl_Lists_Movies

User-created lists (favorites, watchlists, etc.) with a junction table linking lists to movies.

### tbl_Filter_* Tables

Saved filter selections for the UI:

- `tbl_Filter_Persons` -- saved person filters (by IMDB_Person_ID)
- `tbl_Filter_Companies` -- saved company name filters
- `tbl_Filter_IMDB_Filming_Locations` -- saved location filters
- `tbl_Filter_IMDB_Plot_Keywords` -- saved keyword filters
- `tbl_Filter_Cache` -- general key-value filter state cache

## Operational Tables

### tbl_Scan_Processes

Logs each scan run with start/end timestamps, scan type, settings, and detailed stats:

- Add/remove counts for movies, series, episodes, and extras
- Size before/after/diff (total, movies, series)
- Count before/after/diff (movies, series, episodes)

### tbl_Scan_Processes_Items

Individual items affected by each scan: action type, movie ID, path, and hierarchy references.

### tbl_DB_Migrations

Tracks applied schema migrations by ID and name.

## Key Relationships

```text
tbl_SourcePaths (1) ----< (N) tbl_Movies
tbl_Movies (1) ----< (N) tbl_Movies [via Extra_id_Movies_Owner -- extras]
tbl_Movies (1) ----< (N) tbl_Movies [via Series_id_Movies_Owner -- episodes]
tbl_Movies (N) >----< (N) tbl_Genres [via tbl_Movies_Genres]
tbl_Movies (N) >----< (N) tbl_IMDB_Persons [via tbl_Movies_IMDB_Credits]
tbl_Movies (N) >----< (N) tbl_IMDB_Filming_Locations [via tbl_Movies_IMDB_Filming_Locations]
tbl_Movies (N) >----< (N) tbl_IMDB_Plot_Keywords [via tbl_Movies_IMDB_Plot_Keywords]
tbl_Movies (1) ----< (N) tbl_Movies_IMDB_Companies
tbl_Movies (1) ----< (N) tbl_Movies_Languages
tbl_Movies (1) ----< (N) tbl_Movies_MI_Tracks
tbl_Movies (1) ----< (N) tbl_Movies_MI_Qualities
tbl_Movies (1) ----< (N) tbl_Movies_Release_Attributes
tbl_Movies (N) >----< (N) tbl_Lists [via tbl_Lists_Movies]
tbl_Movies (1) ----< (N) tbl_Scan_Processes_Items
```

## Indexes

The schema uses extensive indexing for performance:

- **tbl_Movies:** Indexes on `id_SourcePaths`, `IMDB_tconst`, `IMDB_rating`, `IMDB_numVotes`, `IMDB_metacriticScore`, `IMDB_startYear`, `IMDB_runtimeMinutes`, `IMDB_releaseType`, `MI_Duration_Seconds`, `MI_Aspect_Ratio`, `Extra_id_Movies_Owner`
- **Junction tables:** Both FK columns indexed; unique composite indexes prevent duplicates on credits, companies, filming locations, plot keywords, and languages
- **Lookup tables:** Unique indexes on natural keys (GenreID, Location, Keyword, IMDB_Person_ID, Settings Key)
