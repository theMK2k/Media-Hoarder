const imdbScraper = require("./imdb-scraper");

(async () => {
    const movie = {
        IMDB_tconst: 'tt4154796'
    }
       
    const result = imdbScraper.scrapeIMDBmainPageData(movie);

    console.log('result:', result);

})();

