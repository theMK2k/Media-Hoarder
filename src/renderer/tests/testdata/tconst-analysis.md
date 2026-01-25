# IMDB ID (tconst) Detection Analysis

## Introduction

We strive to improve the IMDB ID detection by utilizing a test set comprised of all movies with IMDB rating >= 6.

All test sets below have 7,576 entries if not otherwise stated.

- **tconst-01-english-full.txt**: movie name, release year, bogus release attributes, actual tconst for comparison
- **tconst-02-english-noyear.txt**: same as 01 but without the year, we assume significant lower hits
- **TODO: tconst-11-german-full.txt**: same as 01 but with German localized movie titles where applicable
- **TODO: tconst-12-german-noyear.txt**: same as 11 but without the year, we assume significant lower hits

## Analysis of tconst-01-english-full

- Hits: 7,349 (97%)
  - API.find: 7,349 (100%)                REQ: [x] don't use suggestion search
  - choiceType.optimum: 231 (3%)
  - choiceType.yearmatch: 7,118 (97%)
  - result_title.(TV Movie): 64 (1%)
- Misses: 227 (3%)
  - API.find: 227 (100%)
  - choiceType.fallback: 108 (48%)
  - choiceType.yearmatch: 118 (52%)
  - resultType.title: 180 (79%)
  - resultType.name: 46 (20%)             REQ: [x] call API with category = title
  - result_title.(TV Series): 80 (35%)    REQ: [x] optionally filter "TV Series" (this excludes TV Series and Episodes but not TV Mini Series, which is good!)
  - result_title.(TV Episode): 34 (15%)

## Analysis of tconst-series-01-english-full

- Total: 1799
- Hits: 1763 (98%)
  - choiceType optimum|immediateOptimum: 12 (1%)
  - choiceType optimum|year(exact): 243 (14%)
  - choiceType optimum|year(exact)|runtime: 1508 (84%)
- Misses: 36 (2%)

## Analysis of new features

### Use category (title)

- tconst-01-english-full-500: 12 Misses down to 9

### Use category (title) and Filtering out (TV Series) and (TV Episode)

- tconst-01-english-full-500: 