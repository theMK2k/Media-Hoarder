# MediaBox
MediaBox is THE frontend for your movie and tv series collection if you love metadata, filter abilities and easy management.

## Features
- Tons of metadata from imdb.com including poster images
- Metadata from mediainfo analysis
- Filter by:
	- Source Paths (e.g. distinguish between files on your NAS and locally available ones)
	- Video Quality (e.g. 720p, HD, 4k etc.)
	- Audio Languages
	- Subtitle Languages
	- Your Lists
	- Your Rating (5-star)
	- Metacritic Score
	- IMDB Rating (10-star)
	- Genres
	- Ages
	- Content Advisory
		- Sex & Nudity
		- Violence & Gore
		- Profanity
		- Alcohol, Drugs & Smoking
		- Frightening & Intense Scenes
	- Individual Persons (e.g. Directors, Actors etc.)
	- Individual Companies (e.g. Production, Visual Effects etc.)
	- Year of Release
- Sort by
	- Name
	- IMDB Rating
	- Metascore
	- Your Rating (5-star)
	- Year
	- Date/Time of import
- Embedded Trailer Player
- List Management (create lists and add/remove movies)
- Copy Info (for easy sharing with social media, includes your 5-star rating)

		example:

		★★★★☆ Beats (2019)
		https://www.imdb.com/title/tt7524414
- (re-)assign IMDB entry including embedded IMDB search dialog

## Current Caveats - pull requests welcome!
- Only movies, TV series coming real soon
- No fuzzy "file name to IMDB ID" detection, currently the IMDB ID, e.g. "tt7524414" must be part of the file name

## Getting started from source

### Install nodejs
Visit https://nodejs.org and download/install it for your OS. MediaBox is developed with node v10 but should be also compatible with newer versions.

### Clone the repository
```
git clone https://github.com/theMK2k/MediaBox.git
```

### Project setup
```
npm install
```

### Invoke Builder
```
npm run invokebuilder
```

### Compiles and hot-reloads for development
```
npm start
```

### Compiles and minifies for production
```
npm run electron:build
```
