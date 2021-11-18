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
  - API.find: 7,349 (100%)
  - choiceType.optimum: 231 (3%)
  - choiceType.yearmatch: 7,118 (97%)
  - result_title.(TV Movie): 64 (1%)
- Misses: 227 (3%)
  - API.find: 227 (100%)
  - choiceType.fallback: 108 (48%)
  - choiceType.yearmatch: 118 (52%)
  - resultType.title: 180 (79%)
  - resultType.name: 46 (20%)
  - result_title.(TV Series): 80 (35%)
  - result_title.(TV Episode): 34 (15%)
