# Media Storage

This document describes how **Media Hoarder** expects media files to be stored.

## Supported Media File Types

During a (re-)scan **Media Hoarder** imports the following file types as media files:

- .avi, .mp4, .mkv, .m2ts - typical video file containers
- .rar - multi-part archive format (only the first file will be imported)

Exceptions:

- the file resides in a directory named `sample` or `proof`

**Media Hoarder** tries to distinguish between two storage modes, see below.

## Directory-based Storage

Directory-based storage means, a particular movie is contained in one directory, e.g.

directory:

```text
/movies/Alien.1979.Remastered.1080p.BluRay.x264-COLLECTORS
├── collectors-alien.1080p.nfo
├── collectors-alien.1080p.part01.rar
├── collectors-alien.1080p.part02.rar
├── collectors-alien.1080p.part03.rar
├── collectors-alien.1080p.part04.rar
├── collectors-alien.1080p.part05.rar
├── collectors-alien.1080p.part06.rar
├── Sample
    └── collectors-alien.1080p.mkv
├── Subs
    ├── collectors-alien.1080p.idx
    └── Subs/collectors-alien.1080p.sub
└── Extras
    ├── Making of Alien.mkv
    └── I love Chestbursters.mp4
```

**Media Hoarder** interprets the storage of a movie as directory-based if the follwing criteria hold true:

- the directory contains an .nfo file
- the directory contains max. 2 media files (multi-part archives are counted as one media file)

In case of a directory-based storage, **Media Hoarder** imports the following files:

- the main media file from the directory as movie entry
- (optional) media files inside the `Extras` directory as extras to the movie entry, **Note**: this is non-Standard

Read [02-IMDB-ID-Detection.md](02-IMDB-ID-Detection.md) for infos on how the IMDB ID is detected.

## File-based Storage

If the criteria for directory-based storage does not hold true, **Media Hoarder** expects the media file to be stand-alone in a directory of media files for other movies as well as their extras, e.g.

```text
/movies
├── Before Midnight (De, En)(BD)(HD)[2013][Drama, Romance][7.9 @ 126352][tt2209418].mkv
├── Before Midnight - Extra - Making of (De, En)(BD)(HD)[2013][Drama, Romance][7.9 @ 126352][tt2209418].mkv
├── Before Sunrise - Zwischenstopp in Wien (De, En)(BD)(HD)[1995][Drama, Romance][8.1 @ 241832][tt0112471].mkv
└── Before Sunset (De, En)(BD)(HD)[2004][Drama, Romance][8.0 @ 211372][tt0381681].mkv
```

- the media file from the directory as movie entry (except the ones containing `- extra` in their file name)
- media files containing `- extra` in their file name as extras to the movie entry having the same name before the `- extra` part, in our example: `Before Midnight`

Read [02-IMDB-ID-Detection.md](02-IMDB-ID-Detection.md) for infos on how the IMDB ID is detected.

## Series

**Media Hoarder** expects series to be contained in a directory per series, e.g. `The X-Files (1993-2006)`. If the series directory already contains the IMDB ID, **Media Hoarder** will directly be able to find the correct meta data for the series, e.g. `The X-Files (1993-2006) [tt0106179]`. Of course, **Media Hoarder** will try its best to find the correct IMDB data if the IMDB ID is not part of the directory name.

Further organization by seasons is optional. **Media Hoarder** supports both file-based and directory-based storage of episodes.

Example of a series organization:

```text
/series/The X Files (1993-2006)
├── Season01
    ├── The X Files S01E01 Pilot.mkv
    ├── The X Files S01E02 Deep Throat.mkv
    ...
    └── The X Files S01E24 The Erlenmeyer Flask.mkv
├── Season02
...
└── Season09
```



.......

**Media Hoarder** expects series source paths to be organized in the following way:

```text
/series
├── The X Files (1993-2006) [tt0106179]
    ├── Season01
        ├── The X Files S01E01 Pilot.mkv
        ├── The X Files S01E02 Deep Throat.mkv
        ...
        └── The X Files S01E24 The Erlenmeyer Flask.mkv
    ├── Season02
    ...
    └── Season09
├── Star Trek - The Next Generation (1987-1994)
    ├── Season01
    ...
    └── Season07
```

In the example above, the path `/series` is the source path. In Windows it would be something like `D:\Series`.

Any directory under the source path must be of a certain series, in this example `The X Files (1993-2006) [tt0106179]`.