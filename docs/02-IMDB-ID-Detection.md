# IMDB ID detection

In order to retrieve metadata from IMDB, **Media Hoarder** needs to find out the IMDB ID for each movie.

## IMDB ID as part of the file- or directory name

If the actual IMDB ID is part of the file- or directory name, **Media Hoarder** will immediately use it. The ID must be of the format "tt0000000".

Examples:

```text
The Godfather [tt0068646].mkv
```

```text
/movies/Avengers Endgame (2019)(tt4154796)
```

## IMDB ID is referenced in an .nfo file

**Media Hoarder** parses .nfo files and checks if an IMDB ID is available. For this, the movie must be in the **same directory** as the .nfo file. The .nfo filename is irrelevant.

### IMDB ID is not part of the file- or directory name

If the actual IMDB ID is not part of the filename, **Media Hoarder** tries to detect the correct IMDB entry by performing an IMDB search with parts of the filename.

It is greatly beneficial if the file name also provides the movie's release year.

We ran tests utilizing the following constructed test set:

- mix of well-known and obscure movies
- movie title in German localization
- 2648 movies in total
- manually labelled with the correct IMDB ID for comparison

Result of the test:

- 2553 of 2648 movies correctly detected
- 95 of 2648 movies incorrectly detected

**Media Hoarder's Search Algorithm** is as follows:

1. Take the file- or directory name
2. Create the filtered name by removing unnecessary characters (`. , _ -`) and replace them with space
3. Extract possible mentions of a year from the filtered name, i.e. any substring containing extactly 4-digits
4. Furthermore remove anything enclosed in brackets from filtered name
5. Feed the filtered name into a search query to IMDB

- the search return no result: remove the last word from filtered name and run 5. again
- the search returns exactly one result: use this result's IMDB ID
- the search returns more than one result: check if the result's release year is included in the extracted years from 4.
  - a year matched: use this result's IMDB ID
  - no match: oh well, just take the first result
