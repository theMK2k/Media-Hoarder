# Media Hoarder v1.5.1 Changelog

I'm happy to announce the new major update of Media Hoarder v1.5.0 which has been a work in progress for quite some weeks now. The biggest work has been done under the hood by updating vital libraries, like Electron, Vue and Vuetify.

Lots of optimizations and fixes are included already but more are on the roadmap for minor updates in the 1.5.x series. Actually, IMDB are once again forcing my hand so I have to relase 1.5.0 now because scraping the posters needed an immediate update, but that's ok :)

**With the updated Electron we now have the following changes:**

New Linux builds:

- Snap
- Flatpak
- Apk
- FreeBSD
- Pacman

Updated MacOS build: we can provide a universal build (x64 + Apple Silicon). Before, we only had an x64 build which could be run on Apple Silicon as well but it had to be emulated.

The Chrome browser engine is updated as well, so a previously broken AI (ChatGPT) integration is now working again.

The theme has been updated to a more darker one with higher contrast, the layouts have been updated and font sizes have been unified.

<img alt="screenshot of Media Hoarder with its darker theme" src="https://github.com/user-attachments/assets/d24c1a44-542b-4857-8f9e-4506ca8488f0" />

## Updates in 1.5.1

### Features

<details>

  <br/>

  <summary>Added "IMDB Votes" filter - you can now filter movies and series by their popularity</summary>

<img alt="image" src="https://github.com/user-attachments/assets/12a24b68-106f-4061-b5b1-ce4f479a5c3a" />

</details>

<br/>

<details>

  <br/>

  <summary>Media Hoarder now scrolls to the last watched episode and flashes it for a short time when a series is opened (this is also accessible via the list menu)</summary>

![media-hoarder-scroll-to-last-watched-episode](https://github.com/user-attachments/assets/360b982c-01b2-4c44-96dd-f009770a6c53)

</details>

<br/>

- Added "Clear Filter Cache" button to Settings | General (in case of filter issues)
- Media Hoarder now peforms database house keeping after rescans

### Fixes

- FIX: Settings Movies/Series Sourcepath checkboxes did not bind correctly
- FIX: rescan snackbar disappeared automatically
- FIX: Source path is clickable in media card, but needs to be translated to the path's name in order to work in the property dialog
- FIX: path handling for poster images on Linux
- FIX: remove "Open" functionality on series if shown as popup

## Updates in 1.5.0

### New Features

#### Optimized Metadata Rescans

Until now, when you ran a global rescan of your media, every new found item (no matter if it was just a movie file moved to a different location or a copy of a tv series) would mean that all the IMDB meta data is scraped again from scratch. With v1.5.0, Media Hoarder detects if a file has been moved or copied and re-uses the existing meta data which leads to much improved rescan times. This behavior is enabled by default and can be disabled with the `re-use already scraped IMDB metadata` option in **Settings | Duplicates**.

#### New Sidebar Features

<details>

  <br/>

  <summary>The sidebar can now be resized by dragging its right border.</summary>

![MediaHoarder-resize-sidebar](https://github.com/user-attachments/assets/f880a4c4-c4b7-4f99-8088-8597c087ff94)

</details>

<br/>

<details>

  <br/>

  <summary>Filter values now have an eye icon which when pressed shows the dialog listing the movies and series that contain the value (e.g.  "Year 2023", "Action genre", "3 star rating").</summary>

![MediaHoarder-filter-value-eye-icon](https://github.com/user-attachments/assets/8b285503-4c2b-4ad7-aeef-d099a8ce998f)

</details>

#### Media Property Dialogs and Media Item Cards

<details>

  <br/>

  <summary>Media property dialogs can now stack indefinitely on top of each other (e.g. actor on top of another actor on top of a director), filtering by the property is possible at any level.</summary>

<br/>

![MediaHoarder-media-property-dialog-stacking](https://github.com/user-attachments/assets/1eb7d57b-2ef5-4083-aa85-7d67b8abf435)

</details>

<br/>

<details>

  <br/>

  <summary>Series in compact lists (e.g. in person dialog) now allow to show the series.</summary>

![MediaHoarder-open-series-card-in-compact-list](https://github.com/user-attachments/assets/6848cddf-cf54-488b-9f0d-8aeb917a22ed)

</details>

<br/>

<details>

  <br/>

  <summary>Media Item Cards can now be expanded if they are popped in from dialogs.</summary>

![MediaHoarder-expand-floating-media-item-card](https://github.com/user-attachments/assets/d0b56896-4e05-4408-80f3-28ef441f502d)

</details>

### Optimizations

#### Cache for loading filter values

In many cases when using Media Hoarder, the media (movies, series, episodes) stay unchanged, at least until the next media scan. Also, oftentimes the filters are unchanged as well.

Before, the filters and especially the number of media per filter value were re-calculated every time the media list was loaded. This process takes significant time. With v1.5.0 a caching mechanism for the filters has been implemented which leads to much faster loading times in those cases.

#### Dialog for Rescanning Meta Data of Series

<details>

  <br/>

  <summary>When initiating a meta data rescan of a series, a dialog will ask if you just want to rescan the meta data of the series or if you also want to rescan the meta data of the episodes (which takes much more time). The dialog is also shown when the meta data rescan is initiated from the list actions menu (top right corner).</summary>

<img alt="Rescan Meta Data Dialog for Series" src="https://github.com/user-attachments/assets/02a677d6-acef-4438-983d-f9004cbe1055" />

</details>

<br/>

Series source paths are now sorted by their name in the Settings page.

### Fixes

- FIX: #94 IMDB detection for tv series
- FIX: broken loading of other filters (Source Paths, Genres and Data Quality) with an active filter on age ratings
- FIX: during scan the last added file info stayed in the footer even when the addition was already finished and other files are scanned
- SCRAPER: poster URLs needed an updated logic
