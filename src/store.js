const fs = require('fs')
const util = require('util');
const { dialog } = require("electron").remote;
const logger = require('loglevel');
const child_process = require('child_process');
const xml2js = require('xml2js');
const request = require('request');
// const textVersion = require("textversionjs");
const htmlToText = require('html-to-text');

const readdirAsync = util.promisify(fs.readdir);
const writeFileAsync = util.promisify(fs.writeFile);
const existsAsync = util.promisify(fs.exists);
// const lstatAsync = util.promisify(fs.lstat);
const execAsync = util.promisify(child_process.exec);
const requestGetAsync = util.promisify(request.get);

import path from 'path';

import { eventBus } from "@/main";

import * as db from '@/helpers/db';
import * as dbsyncSQLite from '@/helpers/dbsync-sqlite';
import * as helpers from '@/helpers/helpers';
import { languages } from '@/languages';

const isBuild = process.env.NODE_ENV === 'production';

if (!isBuild) {
	logger.setLevel(0);
}

// eslint-disable-next-line no-console
console.log('logLevel:', logger.getLevel());

let isScanning = false;
let doAbortRescan = false;

let currentScanInfoHeader = '';

let dbsync = dbsyncSQLite;

dbsync.runSync(helpers.getPath('data/mediabox.db_initial'), helpers.getPath('data/mediabox.db'), { doCreateTables: true, doCreateColumns: true, doCopyContent: true }, (err) => {
	if (err) {
		if (err.error && err.error.errorCode == 'SYNCERR') {
			dialog.showMessageBox(null, {
				type: 'error',
				title: 'MediaBox - DB Sync Error',
				message: err.error.message
			});
			logger.error('ERROR:', err);
			return;
		}

		logger.log('WARN:', err);
	}

	db.initDbCB((err) => {
		if (err) {
			return logger.error(err);
		}

		createIndexes(db);
	})
});

function generateIndexQuery(tableName, ColumnName, isUnique) {
	return `CREATE ${isUnique ? 'UNIQUE ' : ''} INDEX IF NOT EXISTS main.IDX_${tableName}_${ColumnName} ON ${tableName} (${ColumnName})`
}

async function createIndexes(db) {
	logger.log('creating indexes...');

	const queries = [
		generateIndexQuery('tbl_Genres', 'GenreID', true),
		generateIndexQuery('tbl_Movies', 'id_SourcePaths', false),
		generateIndexQuery('tbl_Movies', 'MI_Duration_Seconds', false),
		generateIndexQuery('tbl_Movies', 'MI_Quality', false),
		generateIndexQuery('tbl_Movies', 'MI_Aspect_Ratio', false),
		generateIndexQuery('tbl_Movies', 'IMDB_tconst', false),
		generateIndexQuery('tbl_Movies', 'IMDB_releaseType', false),
		generateIndexQuery('tbl_Movies', 'IMDB_startYear', false),
		generateIndexQuery('tbl_Movies', 'IMDB_runtimeMinutes', false),
		generateIndexQuery('tbl_Movies', 'IMDB_rating', false),
		generateIndexQuery('tbl_Movies', 'IMDB_numVotes', false),
		generateIndexQuery('tbl_Movies', 'IMDB_metacriticScore', false),
		generateIndexQuery('tbl_Movies_Genres', 'id_Movies', false),
		generateIndexQuery('tbl_Movies_Genres', 'id_Genres', false),
		generateIndexQuery('tbl_Settings', 'Key', true),
		generateIndexQuery('tbl_SourcePaths', 'MediaType', false),
		generateIndexQuery('tbl_SourcePaths', 'Description', false),
	]

	for (let i = 0; i < queries.length; i++) {
		logger.log('.');
		await db.fireProcedure(queries[i]);
	}

	logger.log('index creation done');
}

async function fetchSourcePaths() {
	const result = await db.fireProcedureReturnAll(`
			SELECT 
			id_SourcePaths
			, MediaType
			, Path
			, Description
			, created_at
		FROM tbl_SourcePaths`,
		[]);

	return result;
}

async function rescan(onlyNew) {
	isScanning = true;
	eventBus.rescanStarted();
	
	// await filescanMovies(onlyNew);	// KILLME
	await rescanMoviesMetaData(true);	// KILLME -> onlyNew
	await applyIMDBMetaData();
	// await rescanTV();

	isScanning = false;
	doAbortRescan = false;
	eventBus.rescanStopped();
}

async function filescanMovies(onlyNew) {
	logger.log('### filescanMovies started');

	eventBus.scanInfoShow('Rescanning Movies', 'Rescan started');

	try {
		const moviesHave = await db.fireProcedureReturnAll(`
			SELECT
				LOWER(Path) AS tmp_PathLower
			FROM tbl_Movies
		`);

		logger.log('moviesHave:', moviesHave);

		const moviesSourcePaths = await db.fireProcedureReturnAll(`
			SELECT
				id_SourcePaths
				, MediaType
				, Path
				, Description
			FROM tbl_SourcePaths WHERE MediaType = 'movies'
		`);

		for (let i = 0; i < moviesSourcePaths.length; i++) {
			const movieSourcePath = moviesSourcePaths[i];
			logger.log(`  scanning Source Path ${movieSourcePath.Path} (${movieSourcePath.Description})`);

			currentScanInfoHeader = `Rescanning Movies - ${movieSourcePath.Description}`;

			eventBus.scanInfoShow(currentScanInfoHeader, '');

			await filescanMoviesPath(onlyNew, moviesHave, movieSourcePath.id_SourcePaths, movieSourcePath.Path);
		}

		eventBus.scanInfoOff();

		logger.log('### filescanMovies END');
	} catch (err) {
		throw err;
	}
}

async function filescanMoviesPath(onlyNew, moviesHave, id_SourcePaths, scanPath) {
	logger.log('scan', scanPath);

	try {
		const pathItems = await listPath(scanPath);

		// add files
		for (let i = 0; i < pathItems.length; i++) {
			const pathItem = pathItems[i];
			const pathLower = pathItem.Path.toLowerCase();

			if (pathItem.isFile) {
				if (moviesHave.find(have => {
					return (have.tmp_PathLower === pathLower)
				})) {
					continue;
				}

				if (!['.avi', '.mp4', '.mkv', '.m2ts'].find(ext => {
					return (ext === pathItem.ExtensionLower)
				})) {
					continue;
				}

				await addMovie(id_SourcePaths, pathItem);
			}
		}

		// recurse directories
		for (let i = 0; i < pathItems.length; i++) {
			const pathItem = pathItems[i];

			if (pathItem.isDirectory) {
				await filescanMoviesPath(onlyNew, moviesHave, id_SourcePaths, pathItem.Path);
			}
		}
	} catch (err) {
		return;
	}
}

async function addMovie(id_SourcePaths, pathItem) {
	logger.log('add file:', pathItem);
	// currentScanInfoHeader
	eventBus.scanInfoShow(currentScanInfoHeader, `adding ${pathItem.Name}`);

	await db.fireProcedure(
		`INSERT INTO tbl_Movies (id_SourcePaths, Path, Directory, Filename, created_at) VALUES ($id_SourcePaths, $Path, $Directory, $Filename, DATETIME('now'))`,
		{
			$id_SourcePaths: id_SourcePaths,
			$Path: pathItem.Path,
			$Directory: pathItem.Directory,
			$Filename: pathItem.Name
		}
	);
}

async function listPath(scanPath) {
	const readdirResult = await readdirAsync(scanPath, { withFileTypes: true });

	const arrResult = [];

	// logger.log('listPath result:', result);

	for (let i = 0; i < readdirResult.length; i++) {
		const dirent = readdirResult[i];

		arrResult.push({
			Path: path.join(scanPath, dirent.name),
			Name: dirent.name,
			Directory: scanPath,
			ExtensionLower: path.extname(dirent.name).toLowerCase(),
			isFile: dirent.isFile(),
			isDirectory: dirent.isDirectory()
		})
	}

	logger.log('listPath arrResult:', arrResult);
	return arrResult;
}

async function applyIMDBMetaData() {
	// create Name, Name2 etc. from IMDBData for each movie
	// TODO: add this to fetchIMDBData

	logger.log('applying IMDB Metadata...');

	const movies = await db.fireProcedureReturnAll(`
			SELECT
				id_Movies
				, Filename
				, IFNULL(IMDB_localTitle, '') AS IMDB_localTitle
				, IFNULL(IMDB_originalTitle, '') AS IMDB_originalTitle
				, IFNULL(IMDB_primaryTitle, '') AS IMDB_primaryTitle
				, IMDB_startYear
				, IMDB_endYear
			FROM tbl_Movies`,
		[]);

	for (let i = 0; i < movies.length; i++) {
		if (doAbortRescan) {
			break;
		}
		
		const movie = movies[i];

		let Name = movie.IMDB_localTitle;
		let Name2 = null;

		if (movie.IMDB_originalTitle && !movie.IMDB_localTitle.toLowerCase().includes(movie.IMDB_originalTitle.toLowerCase())) {
			if (Name) {
				Name2 = movie.IMDB_originalTitle;
			} else {
				Name = movie.IMDB_originalTitle;
			}
		}

		if (movie.IMDB_primaryTitle && !movie.IMDB_localTitle && !movie.IMDB_originalTitle.toLowerCase().includes(movie.IMDB_primaryTitle.toLowerCase())) {
			if (Name) {
				Name2 = movie.IMDB_originalTitle;
			} else {
				Name = movie.IMDB_originalTitle;
			}
		}

		if (!Name) {
			Name = movie.Filename.split('~')[0].split('(')[0].replace(/_/g, ' ').replace(/\./g, ' ');
		}

		const startYear = movie.IMDB_startYear;
		const endYear = movie.IMDB_endYear;

		await db.fireProcedure(`UPDATE tbl_Movies Set Name = $Name, Name2 = $Name2, startYear = $startYear, endYear = $endYear WHERE id_Movies = $id_Movies`, { $Name: Name, $Name2: Name2, $id_Movies: movie.id_Movies, $startYear: startYear, $endYear: endYear });
	}

	logger.log('applying IMDB Titles DONE');
}

async function rescanMoviesMetaData(onlyNew) {
	const movies = await db.fireProcedureReturnAll(`
			SELECT
				id_Movies
				, id_SourcePaths
				, Path
				, Directory
				, Filename
				, MI_Done
				, IMDB_Done
				, IMDB_tconst
			FROM tbl_Movies
			WHERE id_SourcePaths = 5 -- KILLME`,
		[]);

	for (let i = 0; i < movies.length; i++) {
		if (doAbortRescan) {
			break;
		}
		
		const movie = movies[i];

		// KILLME
		if (i > 5) break;

		// eventBus.scanInfoOff();
		eventBus.scanInfoShow('Rescanning Movies', `${movie.Name || movie.Filename}`);

		await applyMediaInfo(movie, onlyNew);
		await findIMDBtconst(movie, onlyNew);
		await fetchIMDBMetaData(movie, false);	// KILLME: onlyNew
	}

	eventBus.scanInfoOff();
}

async function applyMediaInfo(movie, onlyNew) {
	// TODO:	run mediainfo on movie file
	//				parse mediainfo result and save to db
	if (onlyNew && movie.MI_Done) {
		return;
	}

	const mi_task = `${helpers.getPath('data/mediainfo/win/mediainfo-rar.exe')} --Output=XML "${movie.Path}"`;
	logger.log('running mediainfo:', mi_task);

	try {
		const { stdout, stderr } = await execAsync(mi_task);

		if (stderr) {
			logger.error(stderr);
			return;
		}

		const MI = {
			$id_Movies: movie.id_Movies,
			$MI_Duration: null,
			$MI_Duration_Seconds: null,
			$MI_Duration_Formatted: null,
			$MI_Quality: null,
			$MI_Aspect_Ratio: null,
			$MI_Audio_Languages: '',
			$MI_Subtitle_Languages: '',
		}

		const miObj = await xml2js.parseStringPromise(stdout);

		logger.log('miObj:', miObj);

		miObj.File.track.forEach(track => {
			if (track.$.type === 'Video') {
				if (track.Duration && track.Duration.length > 0) {
					MI.$MI_Duration = track.Duration[0];

					// eslint-disable-next-line no-unused-vars
					let durationSeconds = 0;
					if (/(\d*)h/.test(MI.$MI_Duration)) {
						durationSeconds += 60 * 60 * parseInt(MI.$MI_Duration.match(/(\d*)h/)[1]);
					}
					if (/(\d*)mn/.test(MI.$MI_Duration)) {
						durationSeconds += 60 * parseInt(MI.$MI_Duration.match(/(\d*)mn/)[1]);
					}
					if (/(\d*)s/.test(MI.$MI_Duration)) {
						durationSeconds += parseInt(MI.$MI_Duration.match(/(\d*)s/)[1]);
					}

					if (durationSeconds > 0) {
						MI.$MI_Duration_Seconds = durationSeconds;

						MI.$MI_Duration_Formatted = helpers.getTimeString(MI.$MI_Duration_Seconds);
					}
				}

				if (track.Width && track.Width.length > 0) {
					const width = track.Width[0].replace(/\s/g, '');
					const iWidth = parseInt(width);

					MI.$MI_Quality = 'SD';

					if (iWidth > 1200) {
						MI.$MI_Quality = '720p';
					}
					if (iWidth > 1900) {
						MI.$MI_Quality = 'HD';
					}
					if (iWidth > 3000) {
						MI.$MI_Quality = '2k';
					}
					if (iWidth > 3800) {
						MI.$MI_Quality = 'UHD';
					}
				}

				if (track.Display_aspect_ratio && track.Display_aspect_ratio.length > 0) {
					MI.$MI_Aspect_Ratio = track.Display_aspect_ratio[0];
				}
			}

			if (track.$.type === 'Audio') {
				if (track.Language && track.Language.length > 0) {
					const lang = track.Language[0];
					if (languages[lang]) {
						MI.$MI_Audio_Languages += (MI.$MI_Audio_Languages ? ', ' : '') + languages[lang];
					}
				}
			}

			if (track.$.type === 'Text') {
				if (track.Language && track.Language.length > 0) {
					const lang = track.Language[0];
					if (languages[lang]) {
						MI.$MI_Subtitle_Languages += (MI.$MI_Subtitle_Languages ? ', ' : '') + languages[lang];
					}
				}
			}
		})

		logger.log('MI:', MI);

		await db.fireProcedure(
			`UPDATE tbl_Movies
				SET
				MI_Done = 1
				, MI_Duration = $MI_Duration
				, MI_Duration_Seconds = $MI_Duration_Seconds
				, MI_Duration_Formatted = $MI_Duration_Formatted
				, MI_Quality = $MI_Quality
				, MI_Aspect_Ratio = $MI_Aspect_Ratio
				, MI_Audio_Languages = $MI_Audio_Languages
				, MI_Subtitle_Languages = $MI_Subtitle_Languages
			WHERE id_Movies = $id_Movies
			`,
			MI
		);
	} catch (err) {
		logger.error(err);
	}

}

async function findIMDBtconst(movie, onlyNew) {
	// TODO:	find IMDB tconst (currently just from filename)
	//				save IMDB_tconst to db
	if (onlyNew && movie.IMDB_Done) {
		return;
	}

	// TODO: currently we just use the tconst contained in the filename
	if (/\[tt\d*?\]/.test(movie.Filename)) {
		movie.IMDB_tconst = movie.Filename.match(/\[(tt\d*?)\]/)[1];

		await db.fireProcedure(
			`UPDATE tbl_Movies
				SET
				IMDB_tconst = $IMDB_tconst
			WHERE id_Movies = $id_Movies
			`,
			{
				$id_Movies: movie.id_Movies,
				$IMDB_tconst: movie.IMDB_tconst
			}
		);
	}
}

async function fetchIMDBMetaData(movie, onlyNew) {
	// TODO:	fetch IMDB data from imdb.com (incl. images)
	//				save IMDB data to db
	if (onlyNew && movie.IMDB_Done) {
		return;
	}

	if (!movie.IMDB_tconst) {
		return;
	}

	let IMDBdata = {};

	try {
		const mainPageData = await getIMDBmainPageData(movie);
		IMDBdata = Object.assign(IMDBdata, mainPageData);

		const releaseinfo = await getIMDBreleaseinfo(movie);
		IMDBdata = Object.assign(IMDBdata, releaseinfo);

		const technicalData = await getIMDBtechnicalData(movie);
		IMDBdata = Object.assign(IMDBdata, technicalData);

		const parentalguideData = await getIMDBParentalGuideData(movie);
		IMDBdata = Object.assign(IMDBdata, parentalguideData);

		logger.log('IMDBdata:', IMDBdata);

		const genres = await db.fireProcedureReturnAll('SELECT id_Genres, GenreID, Name FROM tbl_Genres', []);
		await saveIMDBData(movie, IMDBdata, genres);
	} catch (err) {
		logger.error(err);
		return;
	}
}

async function getIMDBmainPageData(movie) {
	const url = `https://www.imdb.com/title/${movie.IMDB_tconst}`;
	// logger.log('getIMDBmainPageData url:', url);
	const response = await requestGetAsync(url);
	const html = response.body;

	// TODO
	let $IMDB_releaseType = 'movie';
	/*
	short			-- tt0000006 -> "/search/title?genres=short"
	tvMovie 		-- tt9915546 -> ">TV Movie" 
	tvEpisode		-- tt8709982 -> ">Episode"
	tvShort			-- tt9901788 -> ">TV Short"
	tvMiniSeries	-- tt8916384 -> ">TV Mini-Series"
	tvSpecial		-- tt8019378 -> ">TV Special"
	video			-- tt8650100 -> ">Video"
	videoGame		-- tt8848200 -> ">Video game"
	*/
	if (/\/search\/title\?genres=short/.test(html)) $IMDB_releaseType = '';
	if (/>TV Movie/.test(html)) $IMDB_releaseType = 'tvMovie';
	if (/>Episode/.test(html)) $IMDB_releaseType = 'tvEpisode';
	if (/>TV Short/.test(html)) $IMDB_releaseType = 'tvShort';
	if (/>TV Mini-Series/.test(html)) $IMDB_releaseType = 'tvMiniSeries';
	if (/>TV Special/.test(html)) $IMDB_releaseType = 'tvSpecial';
	if (/>Video\s/.test(html)) $IMDB_releaseType = 'video';
	if (/>Video game/.test(html)) $IMDB_releaseType = 'videoGame';

	const $IMDB_genres = [];

	const rxGenres = /genres=(.*?)&/g;
	let match = null;

	// eslint-disable-next-line no-cond-assign
	while (match = rxGenres.exec(html)) {
		const genre = match[1];
		if (!$IMDB_genres.find(genreFind => genreFind == genre)) {
			$IMDB_genres.push(genre);
		}
	}

	let $IMDB_rating = null;
	let $IMDB_numVotes = null;

	const rxRating = /<span itemprop="ratingValue">(.*?)<\/span>/
	if (rxRating.test(html)) {
		const strRating = html.match(rxRating)[1].replace(',', '.');
		$IMDB_rating = parseFloat(strRating);

		const matchVotes = html.match(/itemprop="ratingCount">(.*?)<\/span>/)[1];
		logger.log('matchVotes:', matchVotes);

		const strVotes = html.match(/itemprop="ratingCount">(.*?)<\/span>/)[1].replace(/,/g, '');
		logger.log('strVotes:', strVotes);
		$IMDB_numVotes = parseInt(strVotes);
	}

	let $IMDB_metacriticScore = null;

	const rxMetacriticScore = /<div class="metacriticScore score_favorable titleReviewBarSubItem">[\s\S]*?<span>(\d*)<\/span>/;
	if (rxMetacriticScore.test(html)) {
		$IMDB_metacriticScore = parseInt(html.match(rxMetacriticScore)[1]);
	}

	let $IMDB_posterSmall_URL = null;
	let $IMDB_posterLarge_URL = null;
	const rxPosterMediaViewerURL = /<div class="poster">[\s\S]*?<a href="(.*?)"[\s\S]*?>/;	// "/title/tt0130827/mediaviewer/rm215942400"
	if (rxPosterMediaViewerURL.test(html)) {
		const posterURLs = await getIMDBposterURLs(html.match(rxPosterMediaViewerURL)[1]);

		const posterSmallPath = `data/extras/${movie.IMDB_tconst}_posterSmall.jpg`;
		const posterSmallSuccess = await downloadFile(posterURLs.$IMDB_posterSmall_URL, posterSmallPath, false);
		if (posterSmallSuccess) {
			$IMDB_posterSmall_URL = posterSmallPath;
		}

		const posterLargePath = `data/extras/${movie.IMDB_tconst}_posterLarge.jpg`;
		const posterLargeSuccess = await downloadFile(posterURLs.$IMDB_posterLarge_URL, posterLargePath, false);
		if (posterLargeSuccess) {
			$IMDB_posterLarge_URL = posterLargePath;
		}
	}

	let $IMDB_plotSummary = null;
	const rxPlotSummary = /<div class="summary_text">([\s\S]*?)<\/div>/;
	if (rxPlotSummary.test(html)) {
		$IMDB_plotSummary = unescape(htmlToText.fromString(html.match(rxPlotSummary)[1], { wordwrap: null, ignoreImage: true, ignoreHref: true }).trim());
	}

	return {
		$IMDB_releaseType,
		$IMDB_genres,
		$IMDB_rating,
		$IMDB_numVotes,
		$IMDB_metacriticScore,
		$IMDB_posterSmall_URL,
		$IMDB_posterLarge_URL,
		$IMDB_plotSummary
	}
}

async function getIMDBposterURLs(posterMediaViewerURL) {
	let $IMDB_posterSmall_URL = null;
	let $IMDB_posterLarge_URL = null;

	const url = `https://www.imdb.com${posterMediaViewerURL}`;
	const response = await requestGetAsync(url);
	const html = response.body;

	const rxID = /(rm\d*)\?ref/;
	if (rxID.test(html)) {
		const ID = html.match(rxID)[1];

		const rxString = `"id":"${ID}","h":\\d*,"msrc":"(.*?)","src":"(.*?)"`;
		const rxURLs = new RegExp(rxString);

		$IMDB_posterSmall_URL = html.match(rxURLs)[1];
		$IMDB_posterLarge_URL = html.match(rxURLs)[2];
	}

	return {
		$IMDB_posterSmall_URL,
		$IMDB_posterLarge_URL
	}
}

async function getIMDBreleaseinfo(movie) {
	const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/releaseinfo`;
	logger.log('getIMDBreleaseinfo url:', url);
	const response = await requestGetAsync(url);
	const html = response.body;
	// logger.log('imdbReleaseinfoHTML', imdbReleaseinfoHTML);

	let $IMDB_originalTitle = null;
	const rxOriginalTitle = /td class="aka-item__name"> \(original title\)<\/td>[\s\S]*?<td class="aka-item__title">(.*?)<\/td>/;
	if (rxOriginalTitle.test(html)) $IMDB_originalTitle = html.match(rxOriginalTitle)[1];

	let $IMDB_localTitle = null;
	const rxGermanTitle = /td class="aka-item__name">Germany<\/td>[\s\S]*?<td class="aka-item__title">(.*?)<\/td>/;
	if (rxGermanTitle.test(html)) $IMDB_localTitle = html.match(rxGermanTitle)[1];

	let $IMDB_primaryTitle = null;
	let $IMDB_startYear = null;
	let $IMDB_endYear = null;
	const rxPrimaryTitleYear = /ref_=ttrel_rel_tt"[\s\S]itemprop='url'>(.*?)<\/a>\s*?<span class="nobr">[\s\S]*?\((\d\d\d\d.*?)\)/;
	if (rxPrimaryTitleYear.test(html)) {
		$IMDB_primaryTitle = html.match(rxPrimaryTitleYear)[1];
		const yearRange = html.match(rxPrimaryTitleYear)[2];

		logger.log('yearRange:', yearRange);
		$IMDB_startYear = yearRange.match(/(\d\d\d\d)/)[1];
		if (/\d\d\d\d-\d\d\d\d/.test(yearRange)) {
			$IMDB_endYear = yearRange.match(/\d\d\d\d-(\d\d\d\d)/)
		}
	}

	return {
		$IMDB_originalTitle,
		$IMDB_localTitle,
		$IMDB_primaryTitle,
		$IMDB_startYear,
		$IMDB_endYear
	}
}

async function getIMDBtechnicalData(movie) {
	const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/technical`;
	logger.log('getIMDBtechnicalData url:', url);
	const response = await requestGetAsync(url);
	const html = response.body;

	let $IMDB_runtimeMinutes = null;
	const rxRuntimeValue = /<td class="label"> Runtime <\/td>[\s\S]*?<td>([\s\S]*?)<\/td>/;

	if (rxRuntimeValue.test(html)) {
		const rxRuntimeMinutesTotal = /\((\d*?) min\)/;
		const rxRuntimeMinutes = /\s(\d*?) min/;

		if (rxRuntimeMinutesTotal.test(html)) {
			$IMDB_runtimeMinutes = html.match(rxRuntimeMinutesTotal)[1];
		} else if (rxRuntimeMinutes.test(html)) {
			$IMDB_runtimeMinutes = html.match(rxRuntimeMinutes)[1];
		}
	}

	return {
		$IMDB_runtimeMinutes
	}
}

let cacheAgeRatings = null;
let ageRatingChosenCountry = 'none';

async function getIMDBParentalGuideData(movie) {
	if (!cacheAgeRatings) {
		cacheAgeRatings = await db.fireProcedureReturnAll(`SELECT id_AgeRating, Country, Code, Age FROM tbl_AgeRating`);
		logger.log('cacheAgeRatings:', cacheAgeRatings);
	}

	if (ageRatingChosenCountry === 'none') {
		ageRatingChosenCountry = await getSetting('AgeRatingChosenCountry');
		logger.log('AgeRating chosen country:', ageRatingChosenCountry);
	}

	const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/parentalguide`;
	logger.log('getIMDBParentalGuideData url:', url);
	const response = await requestGetAsync(url);
	const html = response.body;

	logger.log('parentalguide html:', { html });

	const rxAgeRating = /a href="\/search\/title\?certificates=(.*?):(.*?)"/g;

	let matchAgeRating = null;

	const ageRatings = [];

	// eslint-disable-next-line no-cond-assign
	while (matchAgeRating = rxAgeRating.exec(html)) {
		const Country = matchAgeRating[1];
		const Code = unescape(matchAgeRating[2]);

		logger.log('rating found:', Country, Code);

		const cachedRating = cacheAgeRatings.find(cache => (cache.Country === Country && cache.Code === Code));

		let Age = null;
		if (cachedRating) {
			Age = cachedRating.Age;
			logger.log('Age (cached):', Age);
		} else {
			if (/\d+/.test(Code)) {
				Age = parseInt(Code.match(/\d+/)[0]);
				logger.log('Age (parsed):', Age);
			}
		}

		ageRatings.push({ Country, Code, Age });
		logger.log('ageRatings:', ageRatings);
	}

	let $IMDB_MinAge = null;
	let $IMDB_MaxAge = null;
	let $IMDB_id_AgeRating_Chosen_Country = null;

	for (let i = 0; i < ageRatings.length; i++) {
		const rating = ageRatings[i];
		const cachedRating = cacheAgeRatings.find(cache => (cache.Country === rating.Country && cache.Code === rating.Code));

		if (!cachedRating) {
			await db.fireProcedure(`INSERT INTO tbl_AgeRating (Country, Code, Age) VALUES ($Country, $Code, $Age)`, { $Country: rating.Country, $Code: rating.Code, $Age: rating.Age });
			rating.id_AgeRating = await db.fireProcedureReturnScalar(`SELECT id_AgeRating FROM tbl_AgeRating WHERE Country = $Country AND Code = $Code`, { $Country: rating.Country, $Code: rating.Code });

			cacheAgeRatings.push({ id_AgeRating: rating.id_AgeRating, Country: rating.Country, Code: rating.Code, Age: rating.Age });
		} else {
			rating.id_AgeRating = cachedRating.id_AgeRating;
		}

		if (rating.id_AgeRating && rating.Country === ageRatingChosenCountry) {
			// logger.log('rating for chosen country found:', rating);
			$IMDB_id_AgeRating_Chosen_Country = rating.id_AgeRating;
		}

		if (rating.Age || rating.Age === 0) {
			if (!$IMDB_MinAge) {
				$IMDB_MinAge = rating.Age;
			}

			if (!$IMDB_MaxAge) {
				$IMDB_MaxAge = rating.Age;
			}

			if ($IMDB_MinAge > rating.Age) {
				$IMDB_MinAge = rating.Age;
			}
			if ($IMDB_MaxAge < rating.Age) {
				$IMDB_MaxAge = rating.Age;
			}
		}
	}

	logger.log('found age ratings:', ageRatings);

	return {
		$IMDB_MinAge,
		$IMDB_MaxAge,
		$IMDB_id_AgeRating_Chosen_Country
	}
}

async function saveIMDBData(movie, IMDBdata, genres) {
	const IMDB_genres = IMDBdata.$IMDB_genres;
	delete IMDBdata.$IMDB_genres;

	let sql = 'IMDB_Done = 1';
	Object.keys(IMDBdata).forEach(key => {
		sql += `, [${key.replace('$', '')}] = ${key}`
	})
	sql = `UPDATE tbl_Movies SET ${sql} WHERE id_Movies = $id_Movies`;

	const movieGenres = await db.fireProcedureReturnAll('SELECT MG.id_Genres, G.GenreID, G.Name FROM tbl_Movies_Genres MG INNER JOIN tbl_Genres G ON MG.id_Genres = G.id_Genres WHERE MG.id_Movies = $id_Movies', { $id_Movies: movie.id_Movies });

	for (let i = 0; i < IMDB_genres.length; i++) {
		const genre = IMDB_genres[i];

		if (!movieGenres.find(mg => mg.GenreID === genre)) {
			// genre needs to be added for the movie
			if (!genres.find(g => g.GenreID === genre)) {
				// genre needs to be added to main list of genres (we need id_Genres later)
				await db.fireProcedure('INSERT INTO tbl_Genres (GenreID, Name) VALUES ($GenreID, $Name)', { $GenreID: genre, $Name: genre });
				const id_Genres = await db.fireProcedureReturnScalar('SELECT id_Genres FROM tbl_Genres WHERE GenreID = $GenreID', { $GenreID: genre });
				genres.push({
					id_Genres: id_Genres,
					GenreID: genre,
					Name: genre
				});
			}

			const id_Genres = genres.find(g => g.GenreID === genre).id_Genres;
			await db.fireProcedure('INSERT INTO tbl_Movies_Genres (id_Movies, id_Genres) VALUES ($id_Movies, $id_Genres)', { $id_Movies: movie.id_Movies, $id_Genres: id_Genres });
		}
	}

	await db.fireProcedure(sql, Object.assign(IMDBdata, { $id_Movies: movie.id_Movies }));
}

async function downloadFile(url, targetPath, redownload) {
	try {
		logger.log('downloadFile url:', url);

		const fullPath = helpers.getPath(targetPath);

		if (!redownload) {
			const exists = await existsAsync(targetPath);
			if (exists) {
				logger.log('  target file already exists, abort');
				return true;
			}
		}

		logger.log('  fetching from web');
		const response = await requestGetAsync({ url, encoding: null });
		const data = response.body;

		await writeFileAsync(fullPath, data, 'binary');

		return true;
	} catch (err) {
		logger.error(err);
		return false;
	}
}

async function fetchMedia($MediaType) {
	try {
		const result = await db.fireProcedureReturnAll(`
			SELECT
				MOV.id_Movies
				, MOV.Path
				, MOV.FileName
				, MOV.Name
				, MOV.Name2
				, MOV.startYear
				, MOV.endYear
				, MOV.MI_Duration
				, MOV.MI_Quality
				, MOV.MI_Audio_Languages
				, MOV.MI_Subtitle_Languages
				, IFNULL(MOV.Rating, 0) AS Rating
				, MOV.IMDB_posterSmall_URL
				, MOV.IMDB_posterLarge_URL
				, MOV.IMDB_rating
				, MOV.IMDB_numVotes
				, MOV.IMDB_metacriticScore
				, MOV.IMDB_plotSummary
				, (SELECT GROUP_CONCAT(G.Name, ', ') FROM tbl_Movies_Genres MG INNER JOIN tbl_Genres G ON MG.id_Genres = G.id_Genres AND MG.id_Movies = MOV.id_Movies) AS Genres
				, MOV.IMDB_MinAge
				, MOV.IMDB_MaxAge
				, AR.Age
			FROM tbl_Movies MOV
			LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
			WHERE id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths WHERE MediaType = $MediaType)
			-- AND MOV.IMDB_posterSmall_URL IS NOT NULL	-- KILLME
			AND MOV.id_SourcePaths = 5								-- KILLME
		`, { $MediaType });

		result.forEach(item => {
			logger.log(item.Name);
			item.IMDB_posterSmall_URL = item.IMDB_posterSmall_URL ? helpers.getPath(item.IMDB_posterSmall_URL) : item.IMDB_posterSmall_URL;
			item.IMDB_posterLarge_URL = item.IMDB_posterLarge_URL ? helpers.getPath(item.IMDB_posterLarge_URL) : item.IMDB_posterLarge_URL;
			item.yearDisplay = (item.startYear ? '(' + item.startYear + (item.endYear ? `-${item.endYear}` : '') + ')' : '');
			item.IMDB_ratingDisplay = (item.IMDB_rating ? `${item.IMDB_rating.toLocaleString()} (${item.IMDB_numVotes.toLocaleString()})` : '');
			item.AudioLanguages = generateLanguageString(item.MI_Audio_Languages, ['De', 'En']);
			item.SubtitleLanguages = generateLanguageString(item.MI_Subtitle_Languages, ['De', 'En']);

			if (item.Age) {
				item.AgeRating = item.Age + '+';
			} else {
				if (item.IMDB_MinAge || item.IMDB_MinAge === 0) {
					item.AgeRating = `${item.IMDB_MinAge}${((item.IMDB_MaxAge && item.IMDB_MaxAge > item.IMDB_MinAge) ? '-' + item.IMDB_MaxAge : '')}+`;
				}
			}

			item.SearchSpace = (item.Name || '').toLowerCase() + ' ' + (item.Name2 || '').toLowerCase() + ' ' + (item.IMDB_plotSummary || '').toLowerCase() + ' ' + (item.Genres.toLowerCase());
		})

		return result;
	} catch (err) {
		logger.error(err);
		return;
	}
}

function generateLanguageString(languages, preferredLanguages) {
	const maxLangDisplay = 2;
	const languagesSplit = languages.split(',');
	const preferredLanguagesJoinLower = preferredLanguages.join(', ').toLowerCase();

	const languagesFiltered = [];
	languagesSplit.forEach(lang => {
		lang = lang.trim();
		if (!languagesFiltered.find(l => lang === l)) {
			languagesFiltered.push(lang);
		}
	});

	let result = [];

	preferredLanguages.forEach(lang => {
		lang = lang.trim();
		if (languages.toLowerCase().includes(lang.toLowerCase())) {
			if (result.length < maxLangDisplay) {
				result.push(lang.toUpperCase());
			}
		}
	});

	let lastOvershotLanguage = null;
	languagesFiltered.forEach(lang => {
		lang = lang.trim();
		const langTrimLower = lang.trim().toLowerCase();
		if (!preferredLanguagesJoinLower.includes(langTrimLower)) {
			if (result.length < maxLangDisplay) {
				result.push(langTrimLower.toUpperCase());
			} else {
				lastOvershotLanguage = langTrimLower.toUpperCase();
			}
		}
	});

	if (languages && result.length < languagesFiltered.length) {
		logger.log('overshot languagesFiltered:', languagesFiltered);

		if ((languagesFiltered.length - result.length) < 2) {
			result.push(lastOvershotLanguage);
		} else {
			result.push('+' + (languagesFiltered.length - result.length));
		}

		logger.log('result:', result);
	}

	if (!result) {
		result = languages;
	}

	// TODO: provide non-preferred Languages (max. 2) if result's entries are lower than 2
	// TODO: implement +x info (e.g. De, En, +21)

	return result.join(', ');
}

async function clearRating($id_Movies) {
	await db.fireProcedure(`UPDATE tbl_Movies SET Rating = NULL WHERE id_Movies = $id_Movies`, { $id_Movies });
}

async function setRating($id_Movies, $Rating) {
	logger.log('setRating id_Movies:', $id_Movies, 'Rating:', $Rating);
	try {
		await db.fireProcedure(`UPDATE tbl_Movies SET Rating = $Rating WHERE id_Movies = $id_Movies`, { $id_Movies, $Rating });
		return true;
	} catch (err) {
		return false;
	}
}

async function getSetting($Key) {
	try {
		return await db.fireProcedureReturnScalar(`SELECT Value FROM tbl_Settings WHERE Key = $Key`, { $Key });
	} catch (err) {
		logger.error(err);
		return null;
	}
}

async function setSetting($Key, $Value) {
	try {
		const mustUpdate = await db.fireProcedureReturnScalar(`SELECT COUNT(1) FROM tbl_Settings WHERE Key = $Key`, { $Key });

		if (mustUpdate) {
			await db.fireProcedure(`UPDATE tbl_Settings SET Value = $Value WHERE Key = $Key`, { $Value, $Key });
		} else {
			await db.fireProcedure(`INSERT INTO tbl_Settings (Key, Value) VALUES ($Key, $Value)`, { $Value, $Key });
		}
		return true;
	} catch (err) {
		logger.error(err);
		return false;
	}
}

async function launchMovie(movie) {
	// TODO:
	// - measure time elapsed during launch
	// - add measured time to (TODO) watchedSeconds
	// - watchedSeconds to runtime
	// - if watchedSeconds > runtime set (TODO) watched to true and show snack bar

	const VLCPath = await getSetting('VLCPath');

	if (!VLCPath) {
		eventBus.showSnackBar('error', 6000, 'Unable to launch: VLC path is not set');
	}

	const task = `${VLCPath} "${movie.Path}"`;
	logger.log('launching:', task);
	await execAsync(task);
	logger.log('end launching:', task);
}

const filters = {
	sourcePaths: []
}

async function fetchSourcePathFilter($MediaType) {
	logger.log('fetchSourcePathFilter MediaType:', $MediaType);
	const result = await db.fireProcedureReturnAll(`
			SELECT DISTINCT
			1 AS Selected
			, Description
		FROM tbl_SourcePaths WHERE MediaType = $MediaType`,
		{ $MediaType });

	logger.log('fetchSourcePathFilter result:', result);

	filters.sourcePaths = result;
}

function abortRescan() {
	doAbortRescan = true;
}

export {
	db,
	fetchSourcePaths,
	rescan,
	fetchMedia,
	clearRating,
	setRating,
	getSetting,
	setSetting,
	launchMovie,

	filters,
	fetchSourcePathFilter,
	isScanning,
	abortRescan
}