# DONE

## v1.3.37-a6

### Series: IMDB Rating Dialog

- [x] IMDB Rating heatmap like <https://whattowatchon.tv>
  - [x] make medialist item card a shared component (now used in medialist as well as SeriesIMDBRatingDialog)main list "jumps" and THEN reloads with the filter applied (possibly a fix for another issue)
  - [x] prevent certain activities while in IMDB Rating Dialog mode
- [x] fix z-index for other dialogs on top of the SeriesIMDBRatingDialog
- [x] globally track MediaPropertyDialog's visibility in order to allow closing of SeriesIMDBRatingDialog on outside-click if MediaPropertyDialog is not open
- [x] MediaList: provide Series_id_Movies_Owner explicitly to MediaPropertyDialog
- [x] also provide clickable area for episodes we have but is missing an IMDB rating

### Series: Edit Media Dialog

- [x] tbl_Movies_MI_Qualities: also use for editing the series entry
- [x] Allow user to define audio / subtitle languages
  - [x] implement EditMediaItemDialog controls
  - [x] save on diff

## v1.3.37-a5

- [x] imdb-graphql-urls: update seriesEpisodes (new persisted query)
- [x] fix: series episodes matching: don't assume E01 if neither season nor episode are set

## v1.3.37-a4

- [x] MediaList: store currentPage for Movies, Series and Episodes (episodes in tbl_Movies.Series_currentPage)
- [x] MediaList: optimize fetchSortValues before fetchFilters
- [x] findIMDBtconst for episodes:
  - [x] tt\* override
  - [x] by season and episode numbers

## v1.3.37-a3

- [x] use tt\* in the filename to override the tconst of an episode
- [x] unlink IMDB on series: also unlink all episodes, which
  - [x] don't have the tt\* as part of their file name
  - [x] haven't been user-set tt\* (do we even track this?)

## v1.3.37-a2

## v1.3.37-a (later: v1.4.0)

- [x] Windows: update bundled VLC to 3.0.20
- [x] Windows: update bundled Mediainfo CLI to 23.11
- [x] refactor store.fetchMedia to only accept a single object containing the options
- [x] check sqlite version for json support - _The JSON functions and operators are built into SQLite by default, as of SQLite version 3.38.0 (2022-02-22)._
  - specs see [data/devdocs/series.md](data/devdocs/series.md), [docs/01-Media-Storage.md](01-Media-Storage.md)
- [x] ensure that MI Tracks table is cleaned up when a movie gets removed
- [x] bugfix: store.mergeExtraFileBased 713 TypeError: Cannot read property 'length' of undefined
- [x] bugfix: delete series actually deleted the source path
- [x] bugfix: in Series, where Video Quality filter resets from "ALL" to some being checked just by switching back and forth (series <> episodes)
- [x] create a test set with series name and year (see: <https://github.com/theMK2k/media-hoarder-testset-generator>)
  - [x] enumerate series names
  - [x] enumerate episodes for each series
  - [x] benchmark series name detection (success: 98% hits on 1799 english series names)
  - [x] also benchmark the english movies test set

### TV Series Support (MVP)

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

## v1.3.2

- [x] Link IMDB Dialog:
  - [x] with paginated search results (20 per page)
  - [x] Fix: IMDB Advanced Title Search
  - [x] Fix: IMDB Find Page Search
- [x] updated IMDB detection

## v1.3.1

- [x] excluded genre filters option (e.g. "not Horror")

## v1.3.0

- [x] new list action: "Start Trailer Show"
  - generate a list of distinct movies with available trailers from the current list
  - show trailer dialog beginning with the first
    - show [1/123]
    - provide "prev", "next", "add movie to list" buttons
  - [x] implement trailer show in non-local player dialog
  - [x] load next trailer in trailer show when previous ended
  - [x] "Close and Show this Movie"
- imdb scraper fixes
  - metacritic score (V2.1)
  - trailer urls (V3)
- [x] re-scrape IMDB Main Page if Trailer URL is 404
- [x] remove rounded corners in LocalVideoPlayerDialog
- [x] ensure both video player dialog types are closed before the next opens

## v1.2.3

- [x] take over release attributes and description / plotSummary when moving a file
  - [x] add shared.duplicatesHandling.updateDescription
  - [x] add shared.duplicatesHandling.updateReleaseAttributes

## v1.2.2

- [x] #rip-rating-demographics (see <https://www.imdb.com/title/tt4154796/ratings>)

  - [x] remove rating demographics (also: don't utilize chosen default demographic)
  - [x] remove tests (watchdog, in-ui)
  - [x] remove during scrape
  - [x] remove on-click dialog in MediaList
  - [x] test with scan

- [x] imdb scraper: v3 plotkeywords
- [x] imdb scraper: v3 locations

- [x] Settings: sort list of source paths by name

## v1.2.0

- [x] WIN: update VLC, mediainfo-cli
- [x] The integration of ChatGPT to query AI suggestions has been significantly improved. There is no longer a dependency on IMDB IDs.
- [x] Improved Trailer experience with embedded player
- [x] Media List: "rescan this list" (operations on the currently shown list w/ menu)
  - [x] onListActionsRescanMetaData - show dialog before rescan
  - [x] properly handle array for the rescan (total time etc.)
  - [x] after cancel: set isScanning to false

### Fix IMDB Scraper

#### / (mainPageData)

- [x] add $IMDB_startYear and $IMDB_endYear (we cannot provide them from /releaseinfo anymore)
- [x] test V1, V2 and V3 mainPageData
- [x] check calling functions!

#### /releaseinfo

- [x] implement V2 (`__NEXT_DATA__`)
- [x] test V1
- [x] we had to remove $IMDB_startYear and $IMDB_endYear, check calling functions!

#### technicalData

- [x] V2 (`__NEXT_DATA__`)

#### companiesData

- [x] implement V3 GQL-based
- [x] dump/usedump: if filename exceeds 160 characters, make a hash of it and use this at the end of truncated filename

#### personData

#### plotSummary

### Other

## v1.1.0

- [x] AI Recommendations
- [x] PersonDialog: add button for (re-)fetching data from web
- [x] UI: MediaList: minor positioning correction for action icons in media items

## v1.0.1

- [x] fix breaking IMDB captcha
- [x] Search Data Dialog: fix numMovies
- [x] Show IMDB and MetaCritic scores in compact movie lists (dialogs):
  - [x] Person Dialog
  - [x] Company Dialog
  - [x] Age Rating Dialog
  - [x] Audio Format Dialog
  - [x] Filming Location Dialog
  - [x] Genre Dialog
  - [x] Language Dialog
  - [x] Person Dialog
  - [x] Plot Keyword Dialog
  - [x] Release Attribute Dialog
  - [x] Video Encoding Dialog
  - [x] Video Quality Dialog

## v1.0.0

### Road to Release (Win/Linux/Mac)

- [x] optimize rescan
- [x] make markdown links in history entries clickable
- [x] fix: "file created at" not always with value
- [x] check-package.json.sh (should prevent build)
- [x] delete media from main list
- [x] filter imdb tconst in search, so that a complete imdb.com url leads to search results
- [x] fix: missing metadata on scan (IMDB_runtimeMinutes, IMDB_plotSummaryFull, MI_Duration\*)
- [x] fix: plot keyword casing ex. "New Year'S Eve"
- [x] fix: number of media in filters for persons, companies, keywords, filming locations
- [x] higher resolution for IMDB Rating filtering (0.1 steps); correct local decimal character
- [x] remove scanErrors when unlinking
- [x] in \*Dialog click on "filter by this ..." should only reload the one filter and then the movies
- [x] Fix: MediaInfo (video): use the highest res if multiple video streams are present (also in MovieManager)
- [x] more MediaInfo

  - In quick info area:

    - [x] Video Encoder (x264, x265, XviD ...)
    - [x] Audio Format/Codec
          Example:
    - current: 8K | 14-18+ | Action, Drama, Horror, Thriller | DE, EN | DE, EN, FR | BD
    - new: 8K | 14-18+ | Action, Drama, Horror, Thriller | DE, EN | DE, EN, FR | x264 | EAC3, PCM | BD
      - [x] video: tbl_Movies_MI_Tracks
        - Encoded_Library_Name_Trimmed (x264, x265, XviD)
        - ?Format (AVC, HEVC)?
      - [x] audio: tbl_Movies_MI_Tracks.Format

  - show in MediaList Quick Info Area (Video Codec/Format, Audio Codecs/Formats)
  - new Filters + Dialog:
    - [x] Video Codec
    - [x] Audio Formats

- [x] Fix: "applying MediaInfo" doesn't show countdown timer
- introduce Audio Metadata

  - [x] see below: use Movie Manager to mass-scan a movie folder and find out the different audio codecs
  - [x] new table tbl_Movies_MI_Tracks

    - [x] scan all media info data to find out which fields are populated by each track type
      - see: [data/devdocs/mediainfo/](data/devdocs/mediainfo/)
    - [x] investigate how to enforce numeric values

      - [x] does it suffice to set the fieldtype in the db? -> test with a SELECT query
            -> plan: mass import and analyze later
      - Integer fields:

        - AlternateGroup?
        - AudioCount
        - BitDepth
        - BitDepth_Detected
        - BitRate
        - BitRate_Maximum
        - BitRate_Minimum
        - Channels
        - FileSize
        - FooterSize
        - FrameCount
        - HeaderSize
        - Height
        - MenuCount
        - MenuID
        - MultiView_Count
        - OverallBitRate
        - OverallBitRate_Maximum
        - Sampled_Height
        - Sampled_Width
        - SamplesPerFrame
        - SamplingCount
        - SamplingRate
        - Source_FrameCount
        - Source_StreamSize
        - Stored_Height
        - Stored_Width
        - StreamOrder
        - StreamSize
        - TextCount
        - VideoCount
        - Width

      - NUMERIC fields:
        - Delay
        - Delay_Original
        - DisplayAspectRatio
        - DisplayAspectRatio_Original
        - Duration
        - Duration_LastFrame
        - FrameRate
        - FrameRate_Maximum
        - FrameRate_Minimum
        - FrameRate_Original
        - Interleave_Duration
        - Interleave_Preload
        - Interleave_VideoFrames
        - PixelAspectRatio
        - PixelAspectRatio_Original
        - Source_Duration
        - Source_StreamSize_Proportion
        - StreamSize_Proportion- [x] remove MediaInfoObject from tbl_Movies

- [x] defect: rescan with deselected IMDB options removes metadata (persons, companies, etc.)

  - react to userScanOptions!
  - dont merge everything directly in IMDBdata with Object.assign, instead build up:
    imdbData = {
    mainPageData: null,
    ratingDemographics: null,
    plotSummaryFull: null,
    plotKeywords: null,
    releaseinfo: null,
    technicalData: null,
    parentalguideData: null,
    creditsData: null,
    companiesData: null,
    filmingLocations: null,
    }
  - rescanMoviesMetaData_fetchIMDBMetaData_mainPageData
    - scrapeIMDBmainPageData()
    - imdbData.mainPageData:
      {
      $IMDB_releaseType: string;
      $IMDB_genres: string[];
      $IMDB_rating: number;
      $IMDB_numVotes: number;
      $IMDB_metacriticScore: number;
      $IMDB_posterSmall_URL: string;
      $IMDB_posterLarge_URL: string;
      $IMDB_plotSummary: string;
      $IMDB_Trailer_URL: any;
      }
  - rescanMoviesMetaData_fetchIMDBMetaData_ratingDemographics

    - scrapeIMDBRatingDemographics()
    - imdbData.ratingDemographics:

    ```js
        {
          $IMDB_rating_*: number;  (except $IMDB_rating_imdb_users)
          $IMDB_numVotes_*: number; (except $IMDB_numVotes_imdb_users)
        }
    ```

  - rescanMoviesMetaData_fetchIMDBMetaData_plotSummary

    - scrapeIMDBplotSummary()
    - imdbData.plotSummaryFull:

    ```js
    {
      $IMDB_plotSummaryFull: string;
    }
    ```

  - rescanMoviesMetaData_fetchIMDBMetaData_plotKeywords

    - WAS: plotkeywords (param in saveIMDBData)
    - NOW: imdbData.plotKeywords (only if userScanOption is set)

  - rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo

    - scrapeIMDBreleaseinfo()
    - imdbData.releaseinfo:

    ```js
    {
      $IMDB_originalTitle: any;
      $IMDB_localTitle: string;
      $IMDB_primaryTitle: any;
      $IMDB_startYear: any;
      $IMDB_endYear: any;
    }
    ```

  - rescanMoviesMetaData_fetchIMDBMetaData_technicalData

    - scrapeIMDBtechnicalData()
    - imdbData.technicalData: {
      $IMDB_runtimeMinutes
      }

  - rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData

    - scrapeIMDBParentalGuideData()
    - imdbData.parentalguideData: {
      $IMDB_MinAge
      $IMDB_MaxAge
      $IMDB_id_AgeRating_Chosen_Country
      $IMDB_Parental_Advisory_Nudity
      $IMDB_Parental_Advisory_Violence
      $IMDB_Parental_Advisory_Profanity
      $IMDB_Parental_Advisory_Alcohol
      $IMDB_Parental_Advisory_Frightening
      }

  - rescanMoviesMetaData_fetchIMDBMetaData_creditsData

    - scrapeIMDBFullCreditsData()
    - imdbData.creditsData: {
      topCredits: {
      $IMDB_Top_Directors: string;
      $IMDB_Top_Writers: string;
      $IMDB_Top_Producers: string;
      $IMDB_Top_Cast: string;
      };
      credits: {
      category: string;
      id: string;
      name: string;
      credit: any;
      }[];  
      }
    - WAS: credits (param to saveIMDBdata)
    - NOW: imdbData.creditsData.credits

  - rescanMoviesMetaData_fetchIMDBMetaData_companiesData

    - scrapeIMDBCompaniesData()
    - imdbData.companiesData: {
      topProductionCompanies: {
      $IMDB_Top_Production_Companies: string;
      };
      companies: any[];  
      }
    - WAS: companies (param to saveIMDBdata)
    - NOW: imdbData.companiesData.companies

  - rescanMoviesMetaData_fetchIMDBMetaData_filmingLocations
    - WAS: filmingLocations (param in saveIMDBData)
    - NOW: imdbData.filmingLocations

- [x] (already fixed) companies: duplicates in topcompanies; non-dupes in companies list?
- [x] on forced rescan also do MediaInfo
- [x] highlight hidden filtered languages
  - [x] Audio Languages: color the +7 if the language is behind it
  - [x] Subtitle Languages: color the +7 if the language is behind it
- [x] sidebar: for each filter (where applicable) provide switchable icon with tooltip for sort mode (alphabetically or by number of movies)
  - [x] merge filterGroups after load, so that new features in code are still present
  - [x] filterSourcePaths
  - [x] filterQualities
  - [x] filterAudioLanguages
  - [x] filterSubtitleLanguages
  - [x] filterReleaseAttributes
  - [x] filterLists
  - [x] filterGenres
  - [x] filterPersons
  - [x] filterCompanies
  - [x] filterYears
  - [x] filterIMDBPlotKeywords
  - [x] filterIMDBFilmingLocations
  - [x] NOT filterRatings
  - [x] NOT filterMetacriticScore
  - [x] NOT filterIMDBRating
  - [x] NOT filterAgeRatings
  - [x] NOT filterParentalAdvisory
  - [x] NOT filterDataQuality
- [x] Sidebar: colorize also the caret
- [x] Sidebar: colorize also the spinner
- [x] reload the filters first that have been modified (e.g. change in genres reloads genres first)
- [x] calculation of numMovies for AND-connected filters should be different than OR-connected filters of the same category
  - [x] filterGenres
  - [x] filterPersons
  - [x] filterCompanies
  - [x] filterIMDBPlotKeywords
  - [x] filterIMDBFilmingLocations
  - [x] filterReleaseAttributes
  - [x] filterDataQuality
- [x] colored active filters on the sidebar
- [x] MediaList: move `*Applied` and `*AppliedContains` to $shared, so that App can also use them
- [x] shared: introduce filter\*Active (true|false), reuse this info in MediaList.filtersList and App
- [x] highlight filtered people, companies etc. (same as search highlight)
  - [x] People
  - [x] Companies
  - [x] SourcePaths
  - [x] Video Quality
  - [x] Audio Languages
  - [x] Subtitle Languages
  - [x] Release Attributes
    - [x] defect: Lego Batman: The Movie - DC Super Heroes Unite fulfills "Director's Cut" filter
    - [x] defect: "Director's Cut" filter with "all selected must apply" only shows 1, expected: 86
  - [x] My Lists
  - [x] Genres
  - [x] Age Ratings
  - [x] Content/Parental Advisories
  - [x] Release Years
  - [x] Plot Keywords
  - [x] Filming Locations
  - [x] ALL Categories: if there is a mk-clickable expandable section title, color it if the list is non-empty
- [x] optimize movie credits handling (duplicate person in different roles per category, e.g. Aaron Sorkin in Few Good Men)
- [x] remove sqlite indexes that don't exist anymore
- [x] eliminate TODO/KILLME entries in code
- [x] store media info object as MI_Object in tbl_Movies
- [x] allow unlinking in relink dialog
  - tbl_Movies.isUnlinkedIMDB (make use of this field, where appropriate)
    - unlinked movies should not detect tconst automatically (also check handling of real duplicates!)
    - on explicit rescan (at the movie): don't use it
    - on fast/complete rescan of multiple movies: use it
- [x] first scanned item shows 1s of remaining time (better not show anything or guesstimate)
- [x] some log groups do not close before the next opens
- [x] write cli tests and optimize findIMDBtconst
  - [x] do a hybrid search to find imdb tconst (advanced title search, find etc.)
    - it turns out that the find API suffices
  - [x] check if scrapeIMDBSuggestion is still necessary
        -> suggestion is not necessary anymore
  - [x] optimize scrapeIMDBFind by utilizing categories:
    - [x] Titles (movies, series, episodes): &s=tt
    - [x] optionally filter "(TV Series)": this exludes TV Series and Episodes but not TV Mini Series (which is good!)
    - [x] filter losely by year
    - [x] filter strictly by year
    - [x] take the runtime (MediaInfo vs. IMDB) into account if multiple results come up
- [x] Filters: "Select All", "Clear Selection", "Search": use icons
- [x] Layout: delete button in sidebar filters
- [x] (My) List Dialog: preselection should be the last selected list
- [x] languages from tbl_Movies_Languages are not taken into account for the Media List
- [x] Fix: Scan Media: cancel in early stage leads to mass removal!
- [x] Bottom Bar: show marquee or steps progress
- [x] (electron) The remote module is deprecated. Use <https://github.com/electron/remote> instead.
- [x] update ETA in scan message every second
- [x] use logger.group/groupCollapsed, logger.groupEnd throughout the app
- [x] add IMDB ID to MediaList
- [x] Highlight search results (Name, Name2, IMDB_plotSummary, fullPath, IMDB_tconst)
- [x] "long click" checkbox filter isolation
- [x] Fix: Crash/White Screen on startup when malformed i18n file is present
- [x] "Add to list" takes considerable time to finally show the list entry in the movie's entry
- [x] App: filter item isolation (click a filter item where all other items are true: Select All items false but the clicked one)
- [x] Search Data Dialog: do in-client sort by numMovies
- [x] Search Data Dialog: use "\*" as placeholder
- [x] "load animate" only the filter that is currently loading
  - [x] fetch the filter that has been modified first (added items, removed items)
  - [x] kill previously started fetching of filters (else we clash)
- [x] reload filters after saving user edited entry
- [x] LinkIMDBDialog: use Find and merge with AdvancedTitleSearch
- [x] implement <https://github.com/mawie81/electron-window-state>
  - [x] debug node_modules/electron-window-state (it's unmaintained)
- [x] KILLME checker script
  - [x] prevent build
- [x] Medialist: fix layout if movie name overflows
- [x] check layouts of sidebar filters
- [x] Drag/Drop Rearrange:
  - [x] Settings - Regions
  - [x] Settings - Languages
  - [x] Settings - Release Attributes
  - [x] App - Sidebar Filter Menu (Genres, Years ...)
    - [x] when a filter is applied, set the filterGroup visible = true
    - [x] show "RESET" and "EDIT" buttons only on hover
- optimize text about removal of known missing file in ScanMedia Dialog (it is dependant on the setting of the source path)
- i18n
  - [x] IMDB Scraper Test Dialog
  - [x] IMDB Options in ScanMedia Dialog
  - [x] Scan Errors (all of the keys, and the value for verifyIMDBtconst)
- [x] introduce a scan error (more like scan warning) when:
  - actual runtime differs from imdb runtime
  - release year differs from imdb year
  - provide text button to explicitly clear the error message
- [x] placeholder icon for Person Dialog, also circular progress while scraping
- [x] placeholder icon for movies
- [x] rework video quality detection (1085p is not UHD)
- [x] provide VLC and MediaInfo CLI alongside the App (use ./bin/%platform%/mediainfo-cli/) - use the location as default location of mediainfo cli - currently only for Windows
- [x] IMDB Rating and Metacritic filters fixed
- [x] New Filter: Data Quality
  - missing IMDB Link
  - has Scan Errors
  - missing Secondary Title
  - missing Poster
  - missing Plot Summary
  - [x] fill the asterisk in MediaList
  - [x] i18n
- [x] writing credits are sometimes not fetched at all, see Arlington Road
- [x] on Cancelling (re-scan): dont display button but show "cancelling..."
- [x] imdb scraper: support "new" main page
- [x] fix in imdb scraper where genres were duplicated
- [x] fix in imdb scraper where metadata was missing (poster, plot summary)
- [x] sort by Name as secondary criteria when sorting by anything else as first (e.g. year -> name)
- [x] IMDB detection
- [x] -> improve by utilizing year (162 of 170 matched, 2553 of 2648 matched)
- [x] "Browse" VLC path -> depending on OS type provide default path / default extension
- [x] -> provide mediainfo-rar or similar for Linux/Mac - or better yet let the user provide a path?

  - [x] -> user must provide

- [x] preferred Regions
- [x] let user define preferred (local) Regions to identify the primary title
- [x] -> fetch Countries from `https://www.imdb.com/search/title/` and provide as list
- [x] -> Auto set region by user's localization setting?

## How long does it take to import 7,600 movies?

- start: 2021-10-09 15:30
- end: 2021-10-11 6:30
  => 39h / 7600
  => 18s / Movie

## Vuetify Upgrade to 2.5.8

### Layout Fixes

- [?] Dialog.vue

- [x] MediaList
- [x] Pagination.vue
- [x] Home.vue
- [x] VersionDialog.vue
- [x] Settings.vue
- [x] CheckIMDBScraperDialog.vue
- [x] AddLanguagesDialog.vue
- [x] AddRegionsDialog.vue
- [x] AddTitleTypeDialog.vue
- [x] AgeRatingDialog.vue
- [x] App.vue
- [x] CompanyDialog.vue
- [x] EditMediaItemDialog.vue
- [x] EditReleaseAttributeDialog.vue
- [x] FilmingLocationDialog.vue
- [x] GenreDialog.vue
- [x] LanguageDialog.vue
- [x] LinkIMDBDialog.vue
- [x] ListDialog.vue
- [.] LocalVideoPlayerDialog.vue (not in use)
- [x] PersonDialog.vue
- [x] PlotKeywordDialog.vue
- [x] RatingDemographicsDialog.vue
- [x] ReleaseAttributeDialog.vue
- [x] ScanOptionsDialog.vue
- [x] SearchDataDialog.vue
- [x] SourcePath.vue
- [x] TitleType.vue
- [x] VideoPlayerDialog.vue
- [x] VideoQualityDialog.vue
- [x] App.vue BOTTOM BAR

### Proper Portable Mode

- [x] use pre-build step to set portable mode explicitly
- [x] implement pre-build step in all build tasks
- [x] target: RELEASE directory with media-hoarder-VERSION-... files
- [x] create set-release-version.js which renames the media-hoarder-VERSION-... files to media-hoarder-1.2.3-... files

### Create Movie Editor

- Primary Title
- Secondary Title
- Year
- Description
- Genres
- Release Attributes
- on (re-)scan: don't overwrite user-defined data (see tbl_Movies.DefinedByUser field definitions)

### Implement Home Screen Cards

- bigger cards
- some info (number of movies)

### Use User's Home dir for storing data

isBuild: use APPDIR/data
!isBuild: use ~/.media-hoarder

- Linux: after .deb install, a normal user can't write to /opt/media-hoarder/...
- Windows: not so problematic, as the app is installed in a user writable location

-> use a ~/.media-hoarder directory
-> this is the default location, we should be able to overwrite that via media-hoarder.json { "portable": true }

-> don't store "/data" in:

- tbl_Movies IMDB_posterSmall_URL and IMDB_posterLarge_URL
- tbl_IMDB_Persons.Photo_URLgetStaticPath

helpers:

- getStaticPath: formerly known as getPath - returns absolute path to APPDIR/data
- getDataPath: returns ~/.media-hoarder in !portable mode, else APPDIR/data

### From electron builder

#### Linux

```text
  • application Linux category is set to default "Utility"  reason=linux.category is not set and cannot map from macOS docs=https://www.electron.build/configuration/linux
  • default Electron icon is used  reason=application icon is not set
  • application Linux category is set to default "Utility"  reason=linux.category is not set and cannot map from macOS docs=https://www.electron.build/configuration/linux
```

#### Windows

```text
  • default Electron icon is used  reason=application icon is not set
```

as per <https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/recipes.html#icons>

### Automatically find mediainfo and vlc

- Linux "which"
- Windows "where"
  -> test in Linux (success)

### Relative movie directories (#relpath)

tbl_Movies:
Path -> RelativePath
Directory -> RelativeDirectory

store.listPath now with basePath

- a movie's directory and path should always be relative to the sourcePath definition
  -> use path.resolve etc. to work with them
  -> this way, a whole sourcePath can move to another location

check:

- [x] extras merging (by directory)
- anything else?

### support Movies in directories (also .nfo parsing)

- we currently expect the whole movie name and release attributes being included in the filename, this is not always the case
- [x] find a way to decide if a movie file belongs to a dir-release or is standalone
- [x] if handling .rar files, summarize all individual filesizes
- [x] use isDirectoryBased in findIMDBtconstIncluded (tt12345 in file- or directory name)
- [x] use isDirectoryBased in findIMDBtconstInNFO (by .nfo file content)
- [x] use isDirectoryBased in finding findIMDBtconstByFileOrDirname (by File/Dirname)
- [x] use isDirectoryBased in finding Release attributes (DUBBED, BDRip etc.)
- [x] handle extras in "Extras" directory
- [x] check AssignIMDB (individual rescan)
- [x] update /docs

#### A directory-based media file is

- a media file alongside an .nfo file (scene release)
  -> also don't expect any other media files in the directory
- a media file inside an "extra" or "extras" directory (this is our own definition!)
  -> use the full filename as Extra Name

-> set isDirectoryBased = 1
-> ignore the filename and use the directory's name instead
-> parse the .nfo for IMDB tconst

=> anything else: treat it as file-based media file (isDirectoryBased = 0)

#### ignored files are

- a media file inside a "sample" directory
- a media file inside a "proof" directory

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

### IMDB Scraper Checks / Watchdog

- [x] create a watchdog CLI which tests imdb-scraper.js

  - [x] scrape different IMDB pages
  - [x] compare with expected result (json suffices)
  - [x] creates an error report
  - [x] sends an email on error
  - [x] start with "npm run imdb-scraper-watchdog"

- [x] put all IMDB scraping functions from store.js into imdb-scraper.js
- [x] Implement test-framework callable in app and also in imdb-scraper-watchdog
- [x] Implement IMDB Scraper Checks Dialog, usable from
  - [x] Settings (via Button)
  - [x] after Scan Options Dialog and before actual Scan

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

### Filter Reset Button

- [x] implement filter reset button in side bar menu

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

### MediaInfo: alternatively use track.DURATION if track.Duration is not available

- [x] Blues Brothers
- [x] -> mediainfo-rar

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
- [x] -> Create tbl_IMDB\"Regions\"Languages (mapping)
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
- [x] Update on Twins by filename + filesize
- [x] Update on Twins by IMDB ID

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

- [x] sort by last_access faulty after introduction of 2nd sort criteria (name)
- [x] \*Dialog movie list: don't use mk-clickable on the whole list
- [x] use " »" indicator on MediaList for expandable sections of text (e.g. plot keywords, people etc.)
- [x] Show movie list in dialogs, e.g. PersonDialog
- [x] remove "SEE" from attributes, check other candidates
- [x] update 5-star rating to 5-star with half-steps rating, see also: <https://www.npmjs.com/package/vue-star-rating> <https://jsfiddle.net/craig_h_411/992o7cq5/>
  - [x] update "copy info"
  - [x] update "my ratings" filter
- [x] calculate and show ETA during rescan
- [x] cancel during rescan (also cancel MediaInfo activity)
- [x] include IMDB ID in search space (i.e. you can type/copy an IMDB ID in the search field and get results)
- [x] enhance scrapeIMDBParentalGuideData with PG-Codes (use tbl_AgeRatings)
- [x] FullScreen toggle
  - [x] via button + tooltip
  - [x] via F11 key
- [x] add button for Years filter "SET RANGE"
- [x] implement store.setSetting with SQLite's `ON CONFLICT` method
- [x] use user-defined language for localized numbers
- [x] provide scraping details in snackbar during rescan
- [x] use markdown for history
  - [x] update preparation notes
- [x] App: show search only when in medialist
- [x] App: show filters only when in medialist
- [x] App: ask before delete (mdi-delete items)
- [x] re-browse Source Path
- [x] calculate video resolution by multiplying width and height and use the megapixels
- [x] review <https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html>
  - [x] re-enable websecurity
- [x] Settings: allow writeable text fields for VLC and Mediainfo (or edit button)
- [x] Settings: IMDB Demographics are not translated
- [x] autodetect mediaplayer: MacOS: check if /Applications/VLC.app/Contents/MacOS/VLC exists, and use this
- [x] investigate binary signing for MacOS release
- [x] pin versions
- [x] translate eventBus.scanInfoShow
- [x] block any IMDB scan when one is already in progress
- [x] check if built release also opens up a port (it doesn't)
- [x] check AppImage usage (storing to ~/.media-hoarder should be possible)
- [x] remove Series in menus and Settings (it will be implemented later)
- [x] Settings: user-defined log level (stored in db)
- [x] Fine-tune some text colors
- [x] Dialogs: define v-dialog as scrollable where applicable
- [x] Settings: provide dialog before removal for
  - [x] Regions
  - [x] Languages
  - [x] Title Types
  - [x] Release Attributes
- [x] List Dialog layout
- [x] Optimize Dialogs: scrollable content, fixed header and footer
- [x] implement minimumWaitForSetAccess with a defaut value of 60 (seconds)
- [x] mediainfo-rar not needed anymore: Mediainfo is also able to scan inside .rar files
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

### Bugs

- [x] person dialog: fix photo url
- [x] (hot reload) search filter is active but not shown in search text box
- [x] MediaList: disable "IMDB relink" button when scan is in progress
- [x] IMDB Scraper: on a German IP, we still get the German title as Primary Title even though we Select All languages to English
  - [x] use "Accept-Language": "en" header on all calls to IMDB
- [x] Linux version doesn't fetch data / endless loop? (in our test VM)
  - [x] test in livecd (successful, fetch from web is working as expected)
        -> we assume there is an issue with the VM
- [x] Title determination (Regional, Primary, Secondary)
- [x] vue-i18n: Value of key 'LanguageNames.N'Ko' is not a string!
- [x] duplicate detection fails at special characters: e.g. "adams aebler"n
- [x] Settings -> Languages: languages aren't translated in the list
- [x] Settings -> Regions: regions aren't translated in the list
- [x] Settings -> Release Attributes: don't allow sorting
- [x] imdb scraper: make sure, all texts are treated with html2text, see "Robot &amp; Frank"
- [x] single-item rescan doesn't update IMDB data? -> "Robot & Frank"
      -> misconcenption: actually an already removed duplicate provided the false names
- [x] complete rescan of movie with extras leads to multiple duplicates and extras added to main list
- [x] filescan: extras naming (see: "Die Üblichen Verdächtigen", "Vertigo")
  - we now derive the Extra name from the filename and assign it to the primary name
- [x] filescan: skip IMDB metadata retrieval for Extras, i.e. filename contains " - extra"
- [x] Remove Source Path: Do you really want to remove the source path {Path} ({MediaTypeUpper}) including all associated media? (This does not delete any actual files)
- [x] delete entries with isRemoved = 1 after successful rescan
- [x] i18n: mixed up languages with i18n and moment
- re-assigning IMDB doesn't clean up some metadata
  - [x] tbl_Movies_Genres
  - [x] tbl_Movies_IMDB_Companies
  - [x] tbl_Movies_IMDB_Credits
  - [x] tbl_Movies_IMDB_Filming_Locations
  - [x] tbl_Movies_IMDB_Plot_Keywords
