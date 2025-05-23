# Media Hoarder v1.4.5 Changelog

## Updates in 1.4.5

### Fixes

- Graph in **Settings | Scan History**: fixed the time range when scans did not provide a proper end date

## Updates in 1.4.4

You can now track your collection's size in **Settings | Scan History** with a nice graph plotting the changes over time.

![image](https://github.com/user-attachments/assets/8647ac0b-844e-4e90-b728-12a248df2bac)

### Fixes

- SCRAPER: Technical Data (Runtime)

## Updates in v1.4.3

_The last update of Media Hoarder isn't even a week old and IMDb comes around with a fully re-worked page for full credits (cast, crew, etc.) of movies and series. This update includes the necessary changes to scrape this new data._

### Fixes

- SCRAPER: Full Credits updated

## Updates in v1.4.2

### Feature: "Watched" indicator

_As soon as a medium has been watched, an indicator is shown in the media list as well as in the series episodes heatmap._

Media List: watched medium shows an icon in front of the title:

![image](https://github.com/user-attachments/assets/a1bd3014-408b-4a54-82b6-b753023a774e)

Episodes Heatmap: watched episodes have a different background pattern:

![image](https://github.com/user-attachments/assets/79739aa4-2fac-4dfd-a36a-68d4dc3bceb5)

### Feature: Heatmap Highlight season and episode number under cursor

![media-hoarder-heatmap-highlight](https://github.com/user-attachments/assets/7b1e26e7-462c-4852-bd6d-3c5085c61b03)

### Fixes

- SCRAPER
  - update Trailer URL handling
  - fix tests for plot summaries
  - update tests for companies data
  - update imdb search for more robust results

## Updates in v1.4.1

- SCRAPER: Release Info - primary title fix

# Media Hoarder v1.4.0

After several months of development, I am proud to present the next version of **Media Hoarder** which finally introduces **TV series support** and with that **Episodes Heatmaps**.

My thanks go to _**kolbdog323**_ for their continuous support and feedback during the development of this feature.

## TV Series Support

Watch the following video to see the new TV series support in action:

[![Media Hoarder v1.4.0 - TV Series Support](https://img.youtube.com/vi/3qfb5UWJrdQ/0.jpg)](https://www.youtube.com/watch?v=3qfb5UWJrdQ)

Please read here about how **Media Hoarder** expects series to be organized: [feature-series/docs/01-Media-Storage.md](https://github.com/theMK2k/Media-Hoarder/blob/feature-series/docs/01-Media-Storage.md)

- With Media Hoarder supporting TV series, you can now:

  - configure source paths for series
  - browse series (also filter, search and sort by numerous meta data)
  - click "into" a series to browse and sort it's episodes

- All Dialogs now support series

  - many dialogs show lists of movies and series (e.g. the ones a certain director has worked on)
  - you can now also click on any item in those lists and see details as well as play the movie/episode

- Show a heatmap of all episodes based on IMDB ratings by clicking the series rating
  - click each episode to see details and play the episode

## Other Features

- Added HDR variants to the Video Quality section

  - Media Hoarder now detects the following HDR variants: "HDR10", "HDR10+", "DV", "HLG"
  - the HDR variants are shown in the media entries of the main list
  - when clicked, you can see details about a certain HDR variant
  - Filter section "Video Quality" also contains these entries

- enhanced rescan summary

  - see how many movies/series/episodes have been added/updated/removed
    - click on Details: see changes on individual movies, series down to the files involved
  - go to Settings and review past rescans (details on click)
  - calculate collection sizes (dashboard shows the sizes)

- UI: add "w2wTV" button for Series and Episodes which opens up <https://whattowatchon.tv> with the series pre-selected

- Search Data Dialog (and other dialogs): show role of person/company

- clicking a media item in one of the smaller lists, shows the item's details and possibility to play

- Allow user to define audio / subtitle languages

## Changelog of the 1.4.0 beta phase (click to expand)

<details>
  <summary>v1.4.0-b6</summary>

### IMDB Scraper

- [x] SCRAPER: When scanning series, re-rank IMDB search results so that tv-series are higher than movies when detecting the IMDB entry
  - closes #61
- [x] SCRAPER: IMDB Scraper updated to properly get genres
</details>

<details>
  <summary>v1.4.0-b5</summary>

### Features (v1.4.0-b5)

- [x] FEAT: do an update check on the beta channel if the build is a beta build

A beta build (like this one) will now do version checks against other beta builds and tell you if a newer beta build is available. The link for downloading is also pointing to the beta releases (and not the Media Hoarder website's download section).

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/63dadfb6-a7cc-4357-b956-91ee852d0226)

### Misc (v1.4.0-b5)

- [x] DB Migrations
  - [x] new table: tbl_DB_Migrations
  - [x] implement migration runner
  </details>

<details>
  <summary>v1.4.0-b4</summary>

### Features (v1.4.0-b4)

- [x] FEAT: add HDR variants to the Video Quality section

Media Hoarder now detects the following HDR variants: "HDR10", "HDR10+", "DV", "HLG".

The HDR variants are shown in the media entries of the main list:

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/6f225bee-ee2e-4efd-ae21-631456ad8217)

When clicked, you can see details about a certain HDR variant:

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/b5eb9f78-8269-4ef8-a622-a6a2ad27b7ab)

Filter section "Video Quality" also contains these entries:

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/58258ddb-58bd-49b1-bc9a-1340cd746c03)

### Misc / Fixes (v1.4.0-b4)

The IMDB entry detection (Media Hoarder trying to find the correct IMDB entry for a movie / tv show based on its name and release year) can fail due to different circumstances. Until now, Media Hoarder did not show errors prominently enough.

- [x] SCRAPER: add testIMDBFindPageSearch to testset in UI

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/922bc341-d4ff-4198-9788-36885fbee140)

- [x] SCRAPER: during the phase of IMDB entry detection, if something fails, the error will be stored in the scraper errors

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/9b818ea3-db29-443e-8f1b-ced30ac45bc3)

</details>

<details>
  <summary>v1.4.0-b3</summary>

### Features (v1.4.0-b3)

- [x] FEAT: calculate collection sizes (movies, series, total) before and after a re-scan, show current collection sizes in the home screen (which also now has a link in the navigation bar on the left)

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/d7fe9d5f-3344-4e6d-9b3a-1f3121b731e4)

- [x] FEAT: enhanced rescan summary

  - [x] related ticket: #45
  - [x] show how many movies/series/episodes have been added/updated/removed

![Media_Hoarder_v1 4 0-New_Scan_Summary](https://github.com/theMK2k/Media-Hoarder/assets/16878526/ce45a98d-b593-4d04-8b79-05e5d29cb7bb)

- [x] details dialog where the user can check individual files

![Media_Hoarder_v1 4 0-New_Scan_Details_Dialog](https://github.com/theMK2k/Media-Hoarder/assets/16878526/5277e7ea-0338-4a37-b921-cbed188f7c69)

- [x] new tab in Settings where past scan sessions are listed (detail dialog on click)

![Media_Hoarder_v1 4 0-Scan_History](https://github.com/theMK2k/Media-Hoarder/assets/16878526/e9efd0fa-b4fe-4ea1-890e-05478180d9c0)

- [x] UI: add "w2wTV" button for Series and Episodes which opens up <https://whattowatchon.tv> with the series pre-selected

### Misc / Fixes (v1.4.0-b3)

- [x] SCRAPER: stop imdb scraping when the tconst is obviously not working
- [x] reworked relative time and duration i18n
</details>

<details>
  <summary>v1.4.0-b2</summary>

### Features (v1.4.0-b2)

- [x] FEAT: Search Data Dialog: show role of person/company

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/34d52613-4f72-4a03-a615-b6a287ca1f75)

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/a753ddba-d6da-411b-a80e-6e369e3217a5)

### Misc / Fixes (v1.4.0-b2)

- [x] UX: only load filters that are actually shown
  - [x] reload filters when "edit filters" is done (only reload those filters that have changed visibility from false to true)
- [x] FIX: series/movies filters are not stored when switching to movies/series and back
  - [x] related bug: switching movies <> series may lead to 0 media items, even when pressing reload button
- [x] FIX: clicking on plot keyword in "find plot keyword dialog" does nothing
- [x] FIX: hide items in dialogs that have 0 media (e.g. plot keywords for movies that can only be found in series)
- [x] FIX: prevent filtering and highlighting of searchText in Episodes listing
- [x] DECISION: bring back filters for episodes?
  - NOT NOW! this introduces more problems than solutions
- [x] FIX: include description text in search space
- [x] FIX: fast switching during trailer show lags behind
</details>

<details>
  <summary>v1.4.0-b1</summary>

### Features (v1.4.0-b1)

- [x] FEAT: when clicking a media item in one of the smaller lists, show the item's card
  - [x] Media Property Dialog
  - [x] Trailer Show (LocalVideoPlayerDialog, VideoPlayerDialog)
  - [x] Chat GPT Dialog

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/b23db3ce-e8b5-4607-94db-dc5888247e49)

### Misc / Fixes (v1.4.0-b1)

- [x] UX: MediaList: as soon as "sort by" was changed by the user, reset page to 1
</details>

<details>
  <summary>v1.3.37-a8</summary>

### Misc / Fixes (v1.3.37-a8)

- [x] FIX: sort by Season and Episode didn't work anymore
- [x] SCRAPER: Update Plotsummary IMDB Scraper Test
</details>

<details>
  <summary>v1.3.37-a7</summary>

### Features (v1.3.37-a7)

- [x] UX/SCRAPER: use imdb-graphql-urls.json (also try to fetch them from master in github, this way we can update the urls if imdb changes them - without creating a new release)

  - <https://raw.githubusercontent.com/theMK2k/Media-Hoarder/master/src/data/imdb-graphql-urls.json>

- [x] UX/SCRAPER: propagate actual errors of imdb scraping to the test result (i.e. errors in graphql querying instead of $IMDB_something is NULL)
</details>

<details>
  <summary>v1.3.37-a6</summary>

### Features (v1.3.37-a6)

#### Series: Media Property Dialog

- [x] FEAT: make series clickable and expand to episodes listing for the selected series, show affected number of episodes vs. total number of episodes
- [x] UX: remove the episodes section (in favor of episodes sections for all listed series)

#### Series: IMDB Rating Dialog

- [x] FEAT: IMDB Rating heatmap like <https://whattowatchon.tv>
  - [x] make medialist item card a shared component (now used in medialist as well as SeriesIMDBRatingDialog)main list "jumps" and THEN reloads with the filter applied (possibly a fix for another issue)
  - [x] prevent certain activities while in IMDB Rating Dialog mode

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/998bf433-05d6-4f19-a573-83d62f78bc75)

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/ed06025f-ce16-42f5-be2b-e14d5a2ae5af)

- [x] UI: fix z-index for other dialogs on top of the SeriesIMDBRatingDialog

- [x] UX: globally track MediaPropertyDialog's visibility in order to allow closing of SeriesIMDBRatingDialog on outside-click if MediaPropertyDialog is not open

- [x] UI: also provide clickable area for episodes we have but is missing an IMDB rating

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/78163da9-eb5c-47a4-82d9-2eaa8eecf47d)

- [x] MediaList: provide Series_id_Movies_Owner explicitly to MediaPropertyDialog

#### Series: Edit Media Dialog

- [x] FEAT: Allow user to define audio / subtitle languages
  - [x] implement EditMediaItemDialog controls
  - [x] save on diff

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/ae1fb019-1cb8-4c06-b8e6-913c671d38ce)

![image](https://github.com/theMK2k/Media-Hoarder/assets/16878526/c5a031ac-bd41-4cfe-a9fa-6e09b6197d7c)

- [x] DB: tbl_Movies_MI_Qualities: also use for editing the series entry
</details>

<details>
  <summary>v1.3.37-a5</summary>

### Misc / Fixes (v1.3.37-a5)

- [x] SCRAPER: imdb-graphql-urls: update seriesEpisodes (new persisted query)
- [x] FIX: series episodes matching: don't assume E01 if neither season nor episode are set
</details>

<details>
  <summary>v1.3.37-a4</summary>

### Misc / Fixes (v1.3.37-a4)

- [x] UX: MediaList: store currentPage for Movies, Series and Episodes (episodes in tbl_Movies.Series_currentPage)
- [x] UX: MediaList: optimize fetchSortValues before fetchFilters
- [x] SCRAPER/UX: findIMDBtconst for episodes:
  - [x] tt\* override
  - [x] by season and episode numbers
  </details>

<details>
  <summary>v1.3.37-a3</summary>

### Misc / Fixes

- [x] UX: use tt\* in the filename to override the tconst of an episode
- [x] UX: unlink IMDB on series: also unlink all episodes, which
  - [x] don't have the tt\* as part of their file name
  - [x] haven't been user-set tt\* (do we even track this?)
  </details>

<details>
  <summary>v1.3.37-a</summary>

### Misc / Fixes

- [x] CHORE: Windows: update bundled VLC to 3.0.20
- [x] CHORE: Windows: update bundled Mediainfo CLI to 23.11
- [x] CHORE: refactor store.fetchMedia to only accept a single object containing the options
- [x] CHORE: check sqlite version for json support - _The JSON functions and operators are built into SQLite by default, as of SQLite version 3.38.0 (2022-02-22)._
  - specs see [data/devdocs/series.md](data/devdocs/series.md), [docs/01-Media-Storage.md](01-Media-Storage.md)
- [x] DB: ensure that MI Tracks table is cleaned up when a movie gets removed
- [x] FIX: store.mergeExtraFileBased 713 TypeError: Cannot read property 'length' of undefined
- [x] FIX: delete series actually deleted the source path
- [x] FIX: in Series, where Video Quality filter resets from "ALL" to some being checked just by switching back and forth (series <> episodes)
- [x] TEST: create a test set with series name and year (see: <https://github.com/theMK2k/media-hoarder-testset-generator>)
  - [x] enumerate series names
  - [x] enumerate episodes for each series
  - [x] benchmark series name detection (success: 98% hits on 1799 english series names)
  - [x] also benchmark the english movies test set

## TV Series Support (MVP)

These items track the series feature in general.

- [x] Remove mediaItem Dialog:
  - [x] always show the affected location full path
  - [x] differentiate Movies, Series and Episodes
- [x] update "lastAccessAt" also for the series as well as any duplicate (and not only for the episode)
- [x] function: updateSeriesMetadataFromEpisodes
  - [x] Audio Formats
  - [x] Release Attributes
  - [x] Audio Languages
  - [x] Subtitle Languages
  - [x] Video Encoders
  - [x] Video Qualities (multiple!)
    - [x] tbl_Movies_MI_Qualities: also use for filtering!
- [x] Medialist: check if the image for episodes can be set to "fit height"
- [x] Filters - the numbers should represent either movies or series
- [x] Dialogs: most of them do not utilize mediaType
  - Generalize to MediaPropertyDialog:
    - [x] provide movies _and_ series lists (and episodes lists)? it's probably interesting to see these even if a person etc. has been opened from a series...
    - [x] act as a dialog for movies
    - [x] act as a dialog for series
    - [x] act as a dialog for episodes (of a certain series)
    - [x] debounce the init() function and call it on any property change, with 10ms debounce
- [x] find IMDB tconst and provide metadata for the series and episodes
- [x] provide series in a different route
  - [x] integrate old dialogs:
    - [x] AgeRatingDialog
    - [x] AudioFormatDialog
    - [x] CompanyDialog
    - [x] FilmingLocationDialog
    - [x] GenreDialog
    - [x] LanguageDialog -> audioLanguageDialog + subtitleLanguageDialog
    - [x] PlotKeywordDialog
    - [x] ReleaseAttributeDialog
    - [x] VideoEncoderDialog
    - [x] VideoQualityDialog
    - [x] PersonDialog
- [x] new symbol for "opening" a series and changing the screen to its eposiodes
- [x] Series / Episode detection in directory/filenames, examples:
  - [x] "S01E01" - the default
  - [x] "Ep01" - as seen with some anime stuff
  - [x] "E01" - episode without season - assume S01
  - [x] "1x5" - same as S01E05
  - [x] "S01E01E02" - multiple episodes
  - [x] "S01E01-E03" - multiple episodes
  - [x] "S01E01E02E03" - multiple episodes
  - [x] "S01E01-03" - multiple episodes
- [x] assign series episode imdb tconst when episode number is 0 (imdb provides null in this case)
- [x] add "Season and Episode" sort order (only for Episodes specificMediaType)
- [x] store filters and sort values by specificMediaType ("Movies", "Series", "Episodes")
- [x] update Series_Num_Episodes and Series_Num_Seasons after an episode has been removed
</summary>
