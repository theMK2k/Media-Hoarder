# IMDB ID detection

In order to retrieve metadata from IMDB, **Media Hoarder** needs to find out the IMDB ID for each movie.

## IMDB ID as part of the file- or directory name

If the IMDB ID is part of the file- or directory name, **Media Hoarder** will immediately use it. The ID must be of the format "tt0000000".

Examples:

```text
The Godfather [tt0068646].mkv
```

```text
/movies/Avengers Endgame (2019)(tt4154796)
```

## IMDB ID is referenced in an .nfo file

**Media Hoarder** parses .nfo files and checks if an IMDB ID is available. For this, the movie must be in the **same directory** as the .nfo file. The .nfo filename is irrelevant.

### IMDB ID is neither part of the file- nor the directory name

If the IMDB ID is neither part of the file- nor the directory name and cannot be found within an .nfo file, **Media Hoarder** tries to detect the correct IMDB entry by performing an IMDB search with parts of the filename.

It is greatly beneficial if the file name also provides the movie's **release year**.

#### Testing the IMDB ID Detection

We generated a controlled test set of 7576 movies, for details see <https://github.com/theMK2k/media-hoarder-testset-generator>. The testset and the benchmark results can be viewed at [../src/tests/testdata](../src/tests/testdata).

We ran tests on the following sets:

- 01 English movie titles including year
- 02 English movie titles without year
- 11 German movie titles (if applicable, else the original title) including year
- 12 German movie titles without year

Result of the tests:

- 01 (English w/ year)
  - 7568 of 7576 movies correctly detected (99.9%)
  - 8 of 7576 movies incorrectly detected (0.1%)
- 01 (English w/o year)
  - 7497 of 7576 movies correctly detected (99%)
  - 79 of 7576 movies incorrectly detected (1%)

**Media Hoarder's Search Algorithm** is as follows:

1. Take the file- or directory name
2. Create the filtered name by removing unnecessary characters (`. , _ -`) and replace them with space
3. Extract possible mentions of a year from the filtered name, i.e. substrings containing extactly 4 digits
4. Furthermore remove anything enclosed in brackets from filtered name, we assume attributes like (HD), [BluRay] etc. within brackets
5. Feed the filtered name into a search query to IMDB

- the search returns no result: remove the last word from the filtered name and run 5. again
- the search returns exactly one result: use this result's IMDB ID
- the search returns more than one result:
  - if possible exclude entries from the result that don't match the years extracted from the file- or directory name (see 3.)
  - if possible match the result's entries runtime to the actual runtime of the movie, sort the result accordingly
  - take the best match (by year and/or runtime) or just take the first element in the result
