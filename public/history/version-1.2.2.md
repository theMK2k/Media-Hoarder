# Media Hoarder v1.2.0 - v1.2.2 Changelog

## Improved: AI Recommendations powered by ChatGPT

The integration of ChatGPT has been significantly improved. The dependency on IMDB IDs has been removed, so that you can ask the AI for lists of movies where the name and year suffices.

Examples:

- _Provide a list of christmas themed action movies_
- _Provide a list of mind bending movies_
- _Provide a list of Oscar winning best motion picture between 2000 and 2010_
- _Provide a list of classic Sci-Fi movies that were not made by Hollywood_

**Note (v1.2.1)**: in v1.2.0 we relied on a release year being returned by ChatGPT, which is not always the case. So our ChatGPT parser has been updated to also try finding movies without a given release year.

## IMDB Scraper updated

A larger overhaul of how **Media Hoarder** scrapes IMDB metadata was necessary and has been implemented.

**Since v1.2.2**:

- IMDB Plot Keywords updated
- IMDB Filming Locations updated

Unfortunately IMDB axed the rating demographics which provided ratings and number of votes for:

- genders
- US/non-US
- age ranges

At least the ratings by age ranges were quite helpful in order to find out if a movie targets a more mature demographic.

But, oh well, now they are gone and **Media Hoarder** had to remove that feature. We'll keep an eye out if the rating demographics return in a similar fashion.

## List Actions

Perform actions on the current list (filtered and sorted as is).

Access the list actions menu on the top right of the screen.

Currently the available actions involve:

- rescan of IMDB metadata
- **(v1.2.2)** copy info - _copies informations about the complete filtered and sorted list including your rating, title and imdb link_

## Other Improvements and Fixes

- the embedded trailer player has been improved, it doesn't load the imdb.com site's complete frame but directly plays the video
- Windows: distribution of VLC and MediaInfo CLI upated to their latest versions (VLC: 3.0.18, MediaInfo: v22.12)
- **(v1.2.2)** enhanced IMDB scraper checks
- **(v1.2.2)** Settings - Movies: source paths are now ordered by their given name
