# Media Hoarder v1.2.0 - v1.2.1 Changelog

## Improved: AI Recommendations powered by ChatGPT

The integration of ChatGPT has been significantly improved. The dependency on IMDB IDs has been removed, so that you can ask the AI for lists of movies where the name and year suffices.

Examples:

- _Provide a list of christmas themed action movies_
- _Provide a list of mind bending movies_
- _Provide a list of Oscar winning best motion picture between 2000 and 2010_
- _Provide a list of classic Sci-Fi movies that were not made by Hollywood_

Watch this [short video](https://www.youtube.com/watch?v=Pi2vfPpOEGQ) to learn how it works.

**Note (v1.2.1)**: in v1.2.0 we relied on a release year being returned by ChatGPT, which is not always the case. So our ChatGPT parser has been updated to also try finding movies without a given release year.

## IMDB Scraper updated

A larger overhaul of how **Media Hoarder** scrapes IMDB metadata was necessary and has been implemented.

## List Actions

Perform actions on the current list (filtered or not). Currently the available actions only involve rescan of IMDB metadata but there is more to come in the future.

Access the list actions menu on the top right of the screen.

## Other Improvements and Fixes

- the embedded trailer player has been improved, it doesn't load the imdb.com site's complete frame but directly plays the video
- Windows: distribution of VLC and MediaInfo CLI upated to their latest versions (VLC: 3.0.18, MediaInfo: v22.12)
