# Media Hoarder v1.5.0 Changelog

The v1.5 releases concentrate on optimization of the features that are already present in Media Hoarder with a strong focus on optimizing longer running processes like rescanning media items and fetching filters.

## Updates in 1.5.0

### Optimizing Metadata Rescans

Until now, when you ran a global rescan of your media, every new found item (no matter if it was just a movie file moved to a different location or a copy of a tv series) would mean that all the IMDB meta data is scraped again from scratch. With v1.5.0, Media Hoarder detects if a file has been moved or copied and re-uses the existing meta data which leads to much improved rescan times. This behavior is enabled by default and can be disabled with the `re-use already scraped IMDB metadata` option in Settings | Duplicates.
