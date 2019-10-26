const fs = require('fs')
const util = require('util');
const { dialog } = require("electron").remote;
const logger = require('loglevel');
const child_process = require('child_process');
const xml2js = require('xml2js');
const request = require('request');
// const textVersion = require("textversionjs");
const htmlToText = require('html-to-text');
const moment = require('moment');

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
import { shared } from '@/shared';

const scanOptions = {
	filescanMovies: true,
	rescanMoviesMetaData: true,											// default: true
	// rescanMoviesMetaData_id_SourcePaths_IN: '(5, 10)',					// ex: '(5, 10)', default: null
	// rescanMoviesMetaData_id_Movies: null,								// ex: 277, default: null
	// rescanMoviesMetaData_maxEntries: 10,								// ex: 10, default: null
	rescanMoviesMetaData_applyMediaInfo: true,							// default: true
	rescanMoviesMetaData_findIMDBtconst: true,							// default: true
	rescanMoviesMetaData_fetchIMDBMetaData: true,						// default: true
	rescanMoviesMetaData_fetchIMDBMetaData_mainPageData: true,			// default: true
	rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo: true,			// default: true
	rescanMoviesMetaData_fetchIMDBMetaData_technicalData: true,		// default: true
	rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData: true,	// default: true
	rescanMoviesMetaData_fetchIMDBMetaData_creditsData: true,			// default: true

	applyIMDBMetaData: true,		// default: true
}

const definedError = require('@/helpers/defined-error');

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

function generateIndexQuery(tableName, ColumnNames, isUnique) {
	const columnNamesString = ColumnNames.reduce((prev, current) => {
		return prev + (prev ? ', ' : '') + `${current}`;
	}, '');

	return `CREATE ${isUnique ? 'UNIQUE ' : ''} INDEX IF NOT EXISTS main.IDX_${tableName}_${columnNamesString.replace(/, /g, '_')} ON ${tableName} (${columnNamesString})`
}

async function createIndexes(db) {
	logger.log('creating indexes...');

	const queries = [
		generateIndexQuery('tbl_Genres', ['GenreID'], true),
		generateIndexQuery('tbl_Movies', ['id_SourcePaths'], false),
		generateIndexQuery('tbl_Movies', ['MI_Duration_Seconds'], false),
		generateIndexQuery('tbl_Movies', ['MI_Quality'], false),
		generateIndexQuery('tbl_Movies', ['MI_Aspect_Ratio'], false),
		generateIndexQuery('tbl_Movies', ['IMDB_tconst'], false),
		generateIndexQuery('tbl_Movies', ['IMDB_releaseType'], false),
		generateIndexQuery('tbl_Movies', ['IMDB_startYear'], false),
		generateIndexQuery('tbl_Movies', ['IMDB_runtimeMinutes'], false),
		generateIndexQuery('tbl_Movies', ['IMDB_rating'], false),
		generateIndexQuery('tbl_Movies', ['IMDB_numVotes'], false),
		generateIndexQuery('tbl_Movies', ['IMDB_metacriticScore'], false),
		generateIndexQuery('tbl_Movies_Genres', ['id_Movies'], false),
		generateIndexQuery('tbl_Movies_Genres', ['id_Genres'], false),
		generateIndexQuery('tbl_Settings', ['Key'], true),
		generateIndexQuery('tbl_SourcePaths', ['MediaType'], false),
		generateIndexQuery('tbl_SourcePaths', ['Description'], false),
		generateIndexQuery('tbl_Movies_IMDB_Credits', ['id_Movies'], false),
		generateIndexQuery('tbl_Movies_IMDB_Credits', ['IMDB_Person_ID'], false),
		generateIndexQuery('tbl_Movies_IMDB_Credits', ['id_Movies', 'Category', 'IMDB_Person_ID'], true),
		generateIndexQuery('tbl_IMDB_Persons', ['IMDB_Person_ID'], true),
	]

	logger.log('queries:', queries);

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
			, checkRemovedFiles
		FROM tbl_SourcePaths`,
		[]);

	return result;
}

async function rescan(onlyNew) {
	isScanning = true;
	eventBus.rescanStarted();

	if (scanOptions.filescanMovies) await filescanMovies(onlyNew);
	if (scanOptions.rescanMoviesMetaData) await rescanMoviesMetaData(onlyNew);
	if (scanOptions.applyIMDBMetaData) await applyIMDBMetaData(onlyNew);

	// await rescanTV();								// TODO

	// clear isNew flag from all entries
	await db.fireProcedure(`UPDATE tbl_Movies SET isNew = 0`, []);

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
				id_Movies
				, LOWER(Path) AS tmp_PathLower
			FROM tbl_Movies
		`);

		moviesHave.forEach(movie => {
			movie.tmp_PathLower = movie.tmp_PathLower.toLowerCase();
		});

		logger.log('moviesHave:', moviesHave);

		const moviesSourcePaths = await db.fireProcedureReturnAll(`
			SELECT
				id_SourcePaths
				, MediaType
				, Path
				, Description
				, checkRemovedFiles
			FROM tbl_SourcePaths WHERE MediaType = 'movies'
		`);

		for (let i = 0; i < moviesSourcePaths.length; i++) {
			const movieSourcePath = moviesSourcePaths[i];
			logger.log(`  scanning Source Path ${movieSourcePath.Path} (${movieSourcePath.Description})`);

			if (movieSourcePath.checkRemovedFiles) {
				await db.fireProcedure(`UPDATE tbl_Movies SET isRemoved = 1 WHERE id_SourcePaths = $id_SourcePaths`, { $id_SourcePaths: movieSourcePath.id_SourcePaths });
			}

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
				const movieHave = moviesHave.find(have => have.tmp_PathLower === pathLower);

				if (movieHave) {
					logger.log('HAVE:', pathLower, 'movieHave:', movieHave);
					await db.fireProcedure(`UPDATE tbl_Movies SET isRemoved = 0 WHERE id_Movies = $id_Movies`, { $id_Movies: movieHave.id_Movies });
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

	await db.fireProcedure(`INSERT INTO tbl_Movies (
			id_SourcePaths
			, Path
			, Directory
			, Filename
			, created_at
			, isNew
		) VALUES (
			$id_SourcePaths
			, $Path
			, $Directory
			, $Filename
			, DATETIME('now')
			, 1
		)`,
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

async function applyIMDBMetaData(onlyNew) {
	// create Name, Name2 etc. from IMDBData for each movie
	// TODO: add this to fetchIMDBData

	logger.log('applying IMDB Metadata...');

	const movies = await db.fireProcedureReturnAll(`
			SELECT
				MOV.id_Movies
				, MOV.Filename
				, IFNULL(MOV.IMDB_localTitle, '') AS IMDB_localTitle
				, IFNULL(MOV.IMDB_originalTitle, '') AS IMDB_originalTitle
				, IFNULL(MOV.IMDB_primaryTitle, '') AS IMDB_primaryTitle
				, MOV.IMDB_startYear
				, MOV.IMDB_endYear
			FROM tbl_Movies MOV
			WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
			${onlyNew ? 'AND MOV.isNew = 1' : ''}
			`,
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
			WHERE 
				(isRemoved IS NULL OR isRemoved = 0)
				${onlyNew ? 'AND isNew = 1' : ''}
				${scanOptions.rescanMoviesMetaData_id_SourcePaths_IN ? 'AND id_SourcePaths IN ' + scanOptions.rescanMoviesMetaData_id_SourcePaths_IN : ''}
				${scanOptions.rescanMoviesMetaData_id_Movies ? 'AND id_Movies = ' + scanOptions.rescanMoviesMetaData_id_Movies : ''}
			`,
		[]);

	for (let i = 0; i < movies.length; i++) {
		if (doAbortRescan) {
			break;
		}

		const movie = movies[i];

		if (scanOptions.rescanMoviesMetaData_maxEntries && i > scanOptions.rescanMoviesMetaData_maxEntries) break;

		// eventBus.scanInfoOff();
		eventBus.scanInfoShow('Rescanning Movies', `${movie.Name || movie.Filename}`);

		if (scanOptions.rescanMoviesMetaData_applyMediaInfo) await applyMediaInfo(movie, onlyNew);
		if (scanOptions.rescanMoviesMetaData_findIMDBtconst) await findIMDBtconst(movie, onlyNew);

		if (scanOptions.rescanMoviesMetaData_fetchIMDBMetaData) await fetchIMDBMetaData(movie, onlyNew);
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

		await db.fireProcedure(`
			UPDATE tbl_Movies
				SET	IMDB_tconst = $IMDB_tconst
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
		if (scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_mainPageData) {
			const mainPageData = await scrapeIMDBmainPageData(movie);
			IMDBdata = Object.assign(IMDBdata, mainPageData);
		}

		if (scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_releaseinfo) {
			const releaseinfo = await scrapeIMDBreleaseinfo(movie);
			IMDBdata = Object.assign(IMDBdata, releaseinfo);
		}

		if (scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_technicalData) {
			const technicalData = await scrapeIMDBtechnicalData(movie);
			IMDBdata = Object.assign(IMDBdata, technicalData);
		}

		if (scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_parentalguideData) {
			const parentalguideData = await scrapeIMDBParentalGuideData(movie);
			IMDBdata = Object.assign(IMDBdata, parentalguideData);
		}

		let credits = [];
		if (scanOptions.rescanMoviesMetaData_fetchIMDBMetaData_creditsData) {
			const creditsData = await scrapeIMDBFullCreditsData(movie);
			IMDBdata = Object.assign(IMDBdata, creditsData.topCredits);
			credits = creditsData.credits;
		}

		logger.log('IMDBdata:', IMDBdata);

		const genres = await db.fireProcedureReturnAll('SELECT id_Genres, GenreID, Name FROM tbl_Genres', []);

		await saveIMDBData(movie, IMDBdata, genres, credits);
	} catch (err) {
		logger.error(err);
		return;
	}
}

async function scrapeIMDBmainPageData(movie) {
	const url = `https://www.imdb.com/title/${movie.IMDB_tconst}`;
	// logger.log('scrapeIMDBmainPageData url:', url);
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
		const posterURLs = await scrapeIMDBposterURLs(html.match(rxPosterMediaViewerURL)[1]);

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

	let $IMDB_Trailer_URL = null;
	const rxTrailerUrl = /<a href="(\/video\/imdb\/vi\d*)\?playlistId=tt\d*&ref_=tt_ov_vi"[\s\S][\s\S].*?alt="Trailer"/;
	if (rxTrailerUrl.test(html)) {
		$IMDB_Trailer_URL = html.match(rxTrailerUrl)[1];
	}

	logger.log('$IMDB_Trailer_URL:', $IMDB_Trailer_URL);

	return {
		$IMDB_releaseType,
		$IMDB_genres,
		$IMDB_rating,
		$IMDB_numVotes,
		$IMDB_metacriticScore,
		$IMDB_posterSmall_URL,
		$IMDB_posterLarge_URL,
		$IMDB_plotSummary,
		$IMDB_Trailer_URL
	}
}

async function scrapeIMDBposterURLs(posterMediaViewerURL) {
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

async function scrapeIMDBreleaseinfo(movie) {
	const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/releaseinfo`;
	logger.log('scrapeIMDBreleaseinfo url:', url);
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

async function scrapeIMDBtechnicalData(movie) {
	const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/technical`;
	logger.log('scrapeIMDBtechnicalData url:', url);
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

async function scrapeIMDBParentalGuideData(movie) {
	if (!cacheAgeRatings) {
		cacheAgeRatings = await db.fireProcedureReturnAll(`SELECT id_AgeRating, Country, Code, Age FROM tbl_AgeRating`);
		logger.log('cacheAgeRatings:', cacheAgeRatings);
	}

	if (ageRatingChosenCountry === 'none') {
		ageRatingChosenCountry = await getSetting('AgeRatingChosenCountry');
		logger.log('AgeRating chosen country:', ageRatingChosenCountry);
	}

	const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/parentalguide`;
	logger.log('scrapeIMDBParentalGuideData url:', url);
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

	const rx_Parental_Advisory_Nudity = /<section id="advisory-nudity">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
	let $IMDB_Parental_Advisory_Nudity = null;

	if (rx_Parental_Advisory_Nudity.test(html)) {
		const severity = html.match(rx_Parental_Advisory_Nudity)[1].trim().toLowerCase();

		if (severity == 'none') {
			$IMDB_Parental_Advisory_Nudity = 0;
		} else if (severity == 'mild') {
			$IMDB_Parental_Advisory_Nudity = 1;
		} else if (severity == 'moderate') {
			$IMDB_Parental_Advisory_Nudity = 2;
		} else if (severity == 'severe') {
			$IMDB_Parental_Advisory_Nudity = 3;
		}
	}

	const rx_Parental_Advisory_Violence = /<section id="advisory-violence">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
	let $IMDB_Parental_Advisory_Violence = null;

	if (rx_Parental_Advisory_Violence.test(html)) {
		const severity = html.match(rx_Parental_Advisory_Violence)[1].trim().toLowerCase();

		if (severity == 'none') {
			$IMDB_Parental_Advisory_Violence = 0;
		} else if (severity == 'mild') {
			$IMDB_Parental_Advisory_Violence = 1;
		} else if (severity == 'moderate') {
			$IMDB_Parental_Advisory_Violence = 2;
		} else if (severity == 'severe') {
			$IMDB_Parental_Advisory_Violence = 3;
		}
	}

	const rx_Parental_Advisory_Profanity = /<section id="advisory-profanity">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
	let $IMDB_Parental_Advisory_Profanity = null;

	if (rx_Parental_Advisory_Profanity.test(html)) {
		const severity = html.match(rx_Parental_Advisory_Profanity)[1].trim().toLowerCase();

		if (severity == 'none') {
			$IMDB_Parental_Advisory_Profanity = 0;
		} else if (severity == 'mild') {
			$IMDB_Parental_Advisory_Profanity = 1;
		} else if (severity == 'moderate') {
			$IMDB_Parental_Advisory_Profanity = 2;
		} else if (severity == 'severe') {
			$IMDB_Parental_Advisory_Profanity = 3;
		}
	}

	const rx_Parental_Advisory_Alcohol = /<section id="advisory-alcohol">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
	let $IMDB_Parental_Advisory_Alcohol = null;

	if (rx_Parental_Advisory_Alcohol.test(html)) {
		const severity = html.match(rx_Parental_Advisory_Alcohol)[1].trim().toLowerCase();

		if (severity == 'none') {
			$IMDB_Parental_Advisory_Alcohol = 0;
		} else if (severity == 'mild') {
			$IMDB_Parental_Advisory_Alcohol = 1;
		} else if (severity == 'moderate') {
			$IMDB_Parental_Advisory_Alcohol = 2;
		} else if (severity == 'severe') {
			$IMDB_Parental_Advisory_Alcohol = 3;
		}
	}

	const rx_Parental_Advisory_Frightening = /<section id="advisory-frightening">[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>[\s\S][\s\S].*?>(.*?)<\/span>/;
	let $IMDB_Parental_Advisory_Frightening = null;

	if (rx_Parental_Advisory_Frightening.test(html)) {
		const severity = html.match(rx_Parental_Advisory_Frightening)[1].trim().toLowerCase();

		if (severity == 'none') {
			$IMDB_Parental_Advisory_Frightening = 0;
		} else if (severity == 'mild') {
			$IMDB_Parental_Advisory_Frightening = 1;
		} else if (severity == 'moderate') {
			$IMDB_Parental_Advisory_Frightening = 2;
		} else if (severity == 'severe') {
			$IMDB_Parental_Advisory_Frightening = 3;
		}
	}

	return {
		$IMDB_MinAge,
		$IMDB_MaxAge,
		$IMDB_id_AgeRating_Chosen_Country,
		$IMDB_Parental_Advisory_Nudity,
		$IMDB_Parental_Advisory_Violence,
		$IMDB_Parental_Advisory_Profanity,
		$IMDB_Parental_Advisory_Alcohol,
		$IMDB_Parental_Advisory_Frightening
	}
}

async function scrapeIMDBFullCreditsData(movie) {
	const url = `https://www.imdb.com/title/${movie.IMDB_tconst}/fullcredits`;
	logger.log('scrapeIMDBFullCreditsData url:', url);
	const response = await requestGetAsync(url);
	const html = response.body;

	const topMax = 5;

	const topCast = [];
	const topDirector = [];
	const topProducer = [];
	const topWriter = [];

	const credits = [];

	const rx_castTable = /<h4 name="cast"[\s\S]*?<\/table>/;

	if (rx_castTable.test(html)) {
		const castTable = html.match(rx_castTable)[0];

		const rx_castEntry = /<tr class.*?>[\s\S]*?<a href="\/name\/(nm\d*)\/[\s\S]*?>\s([\s\S]*?)<\/a>[\s\S]*?<\/tr>/g;

		let match = null;

		// eslint-disable-next-line no-cond-assign
		while (match = rx_castEntry.exec(castTable)) {
			// const entry = { id: match[1], name: match[2].replace(/^\s*/, '').replace(/\s*$/, ''), character: null };
			const entry = { category: 'Cast', id: match[1], name: unescape(htmlToText.fromString(match[2], { wordwrap: null, ignoreImage: true, ignoreHref: true }).trim()), credit: null };

			const rx_character = /<td class="character">([\s\S]*?)<\/td>/;
			if (rx_character.test(match[0])) {
				entry.credit = unescape(htmlToText.fromString(match[0].match(rx_character)[1], { wordwrap: null, ignoreImage: true, ignoreHref: true }).trim());
			}

			credits.push(entry);
			if (topCast.length < topMax) {
				topCast.push(entry);
			}
		}
	}

	const rx_creditsCategories = /<h4 class="dataHeaderWithBorder">([\s\S]*?)&nbsp/g;

	let ccMatch = null;

	// eslint-disable-next-line no-cond-assign
	while (ccMatch = rx_creditsCategories.exec(html)) {
		const creditsCategory = ccMatch[1].trim();
		logger.log(creditsCategory);

		const result = parseCreditsCategory(html, creditsCategory, credits);

		if (creditsCategory === 'Directed by') {
			result.forEach(entry => {
				if (topDirector.length < topMax) {
					topDirector.push(entry);
				}
			})
		}
		if (creditsCategory === 'Produced by') {
			result.forEach(entry => {
				if (topProducer.length < topMax) {
					topProducer.push(entry);
				}
			})
		}
		if (creditsCategory === 'Writing Credits') {
			result.forEach(entry => {
				if (topWriter.length < topMax) {
					topWriter.push(entry);
				}
			})
		}
	}

	logger.log('credits:', credits);

	let $IMDB_Top_Cast = topCast.length > 0 ? JSON.stringify(topCast) : null;
	let $IMDB_Top_Writers = topWriter.length > 0 ? JSON.stringify(topWriter) : null;
	let $IMDB_Top_Directors = topDirector.length > 0 ? JSON.stringify(topDirector) : null;
	let $IMDB_Top_Producers = topProducer.length > 0 ? JSON.stringify(topProducer) : null;

	return {
		topCredits: {
			$IMDB_Top_Directors,
			$IMDB_Top_Writers,
			$IMDB_Top_Producers,
			$IMDB_Top_Cast
		},
		credits
	}
}

function parseCreditsCategory(html, tableHeader, credits) {
	const rx_table = new RegExp(`<h4 class="dataHeaderWithBorder">${tableHeader}[\\s\\S]*?<\\/table>`);

	const result = [];

	if (rx_table.test(html)) {
		const table = html.match(rx_table)[0];

		const rx_entry = /<tr>[\s\S]*?<a href="\/name\/(nm\d*)\/[\s\S]*?>([\s\S]*?)<\/a>[\s\S]*?<\/tr>/g;

		let match = null;

		// eslint-disable-next-line no-cond-assign
		while (match = rx_entry.exec(table)) {
			const entry = { category: tableHeader, id: match[1], name: match[2].trim(), credit: null };

			const rx_credit = /<td class="credit">([\s\S]*?)<\/td>/;
			if (rx_credit.test(match[0])) {
				entry.credit = match[0].match(rx_credit)[1].trim();
			}

			credits.push(entry);
			result.push(entry);
		}
	}

	return result;
}

async function saveIMDBData(movie, IMDBdata, genres, credits) {
	const IMDB_genres = IMDBdata.$IMDB_genres;
	delete IMDBdata.$IMDB_genres;

	let sql = 'IMDB_Done = 1';
	Object.keys(IMDBdata).forEach(key => {
		sql += `, [${key.replace('$', '')}] = ${key}`
	})
	sql = `UPDATE tbl_Movies SET ${sql} WHERE id_Movies = $id_Movies`;

	await db.fireProcedure(sql, Object.assign(IMDBdata, { $id_Movies: movie.id_Movies }));

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

	for (let i = 0; i < credits.length; i++) {
		const credit = credits[i];

		await db.fireProcedure(`
			INSERT INTO tbl_Movies_IMDB_Credits (
				id_Movies
				, Category
				, IMDB_Person_ID
				, Person_Name
				, Credit
			) VALUES (
				$id_Movies
				, $Category
				, $IMDB_Person_ID
				, $Person_Name
				, $Credit
			)
			ON CONFLICT(id_Movies, Category, IMDB_Person_ID)
			DO UPDATE SET
				Person_Name = excluded.Person_Name
				, Credit = excluded.Credit`, { $id_Movies: movie.id_Movies, $Category: credit.category, $IMDB_Person_ID: credit.id, $Person_Name: credit.name, $Credit: credit.credit });
	}
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

		let filterSourcePaths = '';
		logger.log('shared.filterSourcePaths:', shared.filterSourcePaths);
		if (shared.filterSourcePaths && shared.filterSourcePaths.find(filter => !filter.Selected)) {
			filterSourcePaths = 'AND MOV.id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths WHERE Description IN (';

			filterSourcePaths += shared.filterSourcePaths.filter(filter => filter.Selected).map(filter => filter.Description).reduce((prev, current) => {
				return prev + (prev ? ', ' : '') + `'${current}'`;
			}, '');

			filterSourcePaths += '))'
		}

		let filterGenres = '';
		if (shared.filterGenres && shared.filterGenres.find(filter => !filter.Selected)) {
			filterGenres = 'AND MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_Genres WHERE id_Genres IN (';

			filterGenres += shared.filterGenres.filter(filter => filter.Selected).map(filter => filter.id_Genres).reduce((prev, current) => {
				return prev + (prev ? ', ' : '') + current;
			}, '');

			filterGenres += '))'
		}

		let filterAgeRatings = '';
		logger.log('shared.filterAgeRatings:', shared.filterAgeRatings);
		if (shared.filterAgeRatings && shared.filterAgeRatings.find(filter => !filter.Selected)) {

			if (shared.filterAgeRatings.find(filter => (filter.Selected && filter.Age == -1))) {
				filterAgeRatings = `AND (AR.Age IS NULL `;
			} else {
				filterAgeRatings = `AND (1=0 `;
			}

			if (shared.filterAgeRatings.find(filter => (filter.Selected && filter.Age >= 0))) {
				filterAgeRatings += `OR AR.Age IN (`;

				filterAgeRatings += shared.filterAgeRatings.filter(filter => filter.Selected && filter.Age >= 0).map(filter => filter.Age).reduce((prev, current) => {
					return prev + (prev ? ', ' : '') + current;
				}, '');

				filterAgeRatings += ')';
			}

			filterAgeRatings += ')';
		}

		// if (shared.filterAgeRatings && shared.filterAgeRatings.find(filter => !filter.Selected)) {
		// 	filterAgeRatings = 'AND AR.Age IN (';

		// 	filterAgeRatings += shared.filterAgeRatings.filter(filter => filter.Selected).map(filter => filter.Age).reduce((prev, current) => {
		// 		return prev + (prev ? ', ' : '') + current;
		// 	}, '');

		// 	filterAgeRatings += ')'
		// }

		let filterRatings = '';
		logger.log('shared.filterRatings:', shared.filterRatings);
		if (shared.filterRatings && shared.filterRatings.find(filter => !filter.Selected)) {
			if (shared.filterRatings.find(filter => (filter.Selected && !filter.Rating))) {
				filterRatings = 'AND (MOV.Rating IS NULL OR MOV.Rating = 0 ';
			} else {
				filterRatings = 'AND (0=1 '
			}

			if (shared.filterRatings.find(filter => (filter.Selected && filter.Rating))) {
				filterRatings += 'OR MOV.Rating IN (' + shared.filterRatings.filter(filter => (filter.Selected && filter.Rating)).map(filter => filter.Rating).reduce((prev, current) => {
					return prev + (prev ? ', ' : '') + current;
				}, '');

				filterRatings += ')';
			}

			filterRatings += ')';
		}

		let filterLists = '';
		if (shared.filterLists && shared.filterLists.find(filter => !filter.Selected)) {

			if (shared.filterLists.find(filter => (filter.Selected && !filter.id_Lists))) {
				filterLists = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Lists_Movies) `;
			} else {
				filterLists = `AND (1=0 `;
			}

			if (shared.filterLists.find(filter => (filter.Selected && filter.id_Lists))) {
				filterLists += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Lists_Movies WHERE id_Lists IN (`;

				filterLists += shared.filterLists.filter(filter => filter.Selected).map(filter => filter.id_Lists).reduce((prev, current) => {
					return prev + (prev ? ', ' : '') + current;
				}, '');

				filterLists += '))';
			}

			filterLists += ')';
		}

		let filterParentalAdvisory = '';
		Object.keys(shared.filterParentalAdvisory).forEach(category => {
			let filterPACategory = '';

			if (shared.filterParentalAdvisory[category] && shared.filterParentalAdvisory[category].find(filter => !filter.Selected)) {

				if (shared.filterParentalAdvisory[category].find(filter => (filter.Selected && filter.Severity == -1))) {
					filterPACategory = `AND (MOV.IMDB_Parental_Advisory_${category} IS NULL `;
				} else {
					filterPACategory = `AND (1=0 `;
				}

				if (shared.filterParentalAdvisory[category].find(filter => (filter.Selected && filter.Severity >= 0))) {
					filterPACategory += `OR MOV.IMDB_Parental_Advisory_${category} IN (`;

					filterPACategory += shared.filterParentalAdvisory[category].filter(filter => filter.Selected).map(filter => filter.Severity).reduce((prev, current) => {
						return prev + (prev ? ', ' : '') + current;
					}, '');

					filterPACategory += ')';
				}

				filterPACategory += ')';
			}

			if (filterPACategory) {
				filterParentalAdvisory += `${filterPACategory}
				`;
			}
		})

		let filterPersons = '';
		if (shared.filterPersons && shared.filterPersons.find(filter => !filter.Selected)) {

			if (shared.filterPersons.find(filter => (filter.Selected && !filter.id_Filter_Persons))) {
				filterPersons = `AND (MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID IN (SELECT IMDB_Person_ID FROM tbl_Filter_Persons)) `;
			} else {
				filterPersons = `AND (1=0 `;
			}

			if (shared.filterPersons.find(filter => (filter.Selected && filter.id_Filter_Persons))) {
				filterPersons += `OR MOV.id_Movies IN (SELECT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID IN (`;

				filterPersons += shared.filterPersons.filter(filter => filter.Selected).map(filter => filter.IMDB_Person_ID).reduce((prev, current) => {
					return prev + (prev ? ', ' : '') + `'${current}'`;
				}, '');

				filterPersons += '))';
			}

			filterPersons += ')';
		}

		let filterYears = '';
		logger.log('shared.filterYears:', shared.filterYears);
		if (shared.filterYears && shared.filterYears.find(filter => !filter.Selected)) {

			if (shared.filterYears.find(filter => (filter.Selected && filter.startYear == -1))) {
				filterYears = `AND (MOV.startYear IS NULL `;
			} else {
				filterYears = `AND (1=0 `;
			}

			if (shared.filterYears.find(filter => (filter.Selected && filter.startYear >= 0))) {
				filterYears += `OR MOV.startYear IN (`;

				filterYears += shared.filterYears.filter(filter => filter.Selected).map(filter => filter.startYear).reduce((prev, current) => {
					return prev + (prev ? ', ' : '') + current;
				}, '');

				filterYears += ')';
			}

			filterYears += ')';
		}

		let filterQualities = '';
		logger.log('shared.filterQualities:', shared.filterQualities);
		if (shared.filterQualities && shared.filterQualities.find(filter => !filter.Selected)) {

			if (shared.filterQualities.find(filter => (filter.Selected && !filter.MI_Quality))) {
				filterQualities = `AND (MOV.MI_Quality IS NULL `;
			} else {
				filterQualities = `AND (1=0 `;
			}

			if (shared.filterQualities.find(filter => (filter.Selected && filter.MI_Quality))) {
				filterQualities += `OR MOV.MI_Quality IN (`;

				filterQualities += shared.filterQualities.filter(filter => filter.Selected).map(filter => filter.MI_Quality).reduce((prev, current) => {
					return prev + (prev ? ', ' : '') + `'${current}'`;
				}, '');

				filterQualities += ')';
			}

			filterQualities += ')';
		}

		logger.log('fetchMedia filterSourcePaths:', filterSourcePaths);
		logger.log('fetchMedia filterGenres:', filterGenres);
		logger.log('fetchMedia filterAgeRatings:', filterAgeRatings);
		logger.log('fetchMedia filterRatings:', filterRatings);
		logger.log('fetchMedia filterLists:', filterLists);
		logger.log('fetchMedia filterParentalAdvisory:', filterParentalAdvisory);
		logger.log('fetchMedia filterPersons:', filterPersons);

		const query = `
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
			, MOV.IMDB_tconst
			, MOV.IMDB_posterSmall_URL
			, MOV.IMDB_posterLarge_URL
			, MOV.IMDB_rating
			, MOV.IMDB_numVotes
			, MOV.IMDB_metacriticScore
			, MOV.IMDB_plotSummary
			, (SELECT GROUP_CONCAT(G.Name, ', ') FROM tbl_Movies_Genres MG INNER JOIN tbl_Genres G ON MG.id_Genres = G.id_Genres AND MG.id_Movies = MOV.id_Movies) AS Genres
			, MOV.IMDB_MinAge
			, MOV.IMDB_MaxAge
			, MOV.IMDB_Parental_Advisory_Nudity
			, MOV.IMDB_Parental_Advisory_Violence
			, MOV.IMDB_Parental_Advisory_Profanity
			, MOV.IMDB_Parental_Advisory_Alcohol
			, MOV.IMDB_Parental_Advisory_Frightening
			, MOV.IMDB_Top_Directors
			, MOV.IMDB_Top_Writers
			, MOV.IMDB_Top_Producers
			, MOV.IMDB_Top_Cast
			, MOV.IMDB_Trailer_URL
			, AR.Age
			, MOV.created_at
			, MOV.last_access_at
		FROM tbl_Movies MOV
		LEFT JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating
		WHERE	(MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
					AND id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths WHERE MediaType = $MediaType)
		${filterSourcePaths}
		${filterGenres}
		${filterAgeRatings}
		${filterRatings}
		${filterLists}
		${filterParentalAdvisory}
		${filterPersons}
		${filterYears}
		${filterQualities}
	`;

		logger.log('fetchMedia query:', query);

		const result = await db.fireProcedureReturnAll(query, { $MediaType });


		if (result && result.length > 0) {
			saveFilterValues($MediaType);
		}

		result.forEach(item => {
			// logger.log(item.Name);
			item.IMDB_posterSmall_URL = item.IMDB_posterSmall_URL ? helpers.getPath(item.IMDB_posterSmall_URL) : item.IMDB_posterSmall_URL;
			item.IMDB_posterLarge_URL = item.IMDB_posterLarge_URL ? helpers.getPath(item.IMDB_posterLarge_URL) : item.IMDB_posterLarge_URL;
			item.yearDisplay = (item.startYear ? '(' + item.startYear + (item.endYear ? `-${item.endYear}` : '') + ')' : '');
			item.IMDB_ratingDisplay = (item.IMDB_rating ? `${item.IMDB_rating.toLocaleString(undefined, { minimumFractionDigits: 1 })} (${item.IMDB_numVotes.toLocaleString()})` : '');
			item.AudioLanguages = generateLanguageString(item.MI_Audio_Languages, ['De', 'En']);
			item.SubtitleLanguages = generateLanguageString(item.MI_Subtitle_Languages, ['De', 'En']);

			if (item.Age || item.Age === 0) {
				item.AgeRating = item.Age + '+';
			} else {
				if (item.IMDB_MinAge || item.IMDB_MinAge === 0) {
					item.AgeRating = `${item.IMDB_MinAge}${((item.IMDB_MaxAge && item.IMDB_MaxAge > item.IMDB_MinAge) ? '-' + item.IMDB_MaxAge : '')}+`;
				}
			}

			item.SearchSpace = (item.Name || '').toLowerCase() + ' ' + (item.Name2 || '').toLowerCase() + ' ' + (item.IMDB_plotSummary || '').toLowerCase() + ' ' + (item.Genres || '').toLowerCase();

			item.IMDB_Top_Directors = item.IMDB_Top_Directors ? JSON.parse(item.IMDB_Top_Directors) : null;
			item.IMDB_Top_Writers = item.IMDB_Top_Writers ? JSON.parse(item.IMDB_Top_Writers) : null;
			item.IMDB_Top_Producers = item.IMDB_Top_Producers ? JSON.parse(item.IMDB_Top_Producers) : null;
			item.IMDB_Top_Cast = item.IMDB_Top_Cast ? JSON.parse(item.IMDB_Top_Cast) : null;
		});

		return result;
	} catch (err) {
		logger.error(err);
		return;
	}
}

function generateLanguageString(languages, preferredLanguages) {
	if (!languages) {
		return null;
	}

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
		// logger.log('overshot languagesFiltered:', languagesFiltered);

		if ((languagesFiltered.length - result.length) < 2) {
			result.push(lastOvershotLanguage);
		} else {
			result.push('+' + (languagesFiltered.length - result.length));
		}

		// logger.log('result:', result);
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
	const VLCPath = await getSetting('VLCPath');

	if (!VLCPath) {
		eventBus.showSnackbar('error', 6000, 'Unable to launch: VLC path is not set');
	}

	const fileExists = await existsAsync(movie.Path);

	if (!fileExists) {
		eventBus.showSnackbar('error', 6000, `Cannot access ${movie.Path}`);
		return;
	}

	const task = `${VLCPath} "${movie.Path}"`;
	logger.log('launching:', task);
	await execAsync(task);
	logger.log('end launching:', task);
}

async function fetchFilterValues($MediaType) {
	const result = await getSetting(`filtersMediaType${$MediaType}`);
	if (!result) {
		return null;
	}

	return JSON.parse(result);
}

async function fetchFilterSourcePaths($MediaType) {
	logger.log('fetchFilterSourcePaths MediaType:', $MediaType);

	const filterValues = await fetchFilterValues($MediaType);

	logger.log('fetchFilterSourcePaths filterValues:', filterValues);

	const results = await db.fireProcedureReturnAll(`
			SELECT DISTINCT
			1 AS Selected
			, SP.Description
			, (SELECT COUNT(1) FROM tbl_Movies MOV WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND id_SourcePaths IN (SELECT id_SourcePaths FROM tbl_SourcePaths SP2 WHERE SP2.Description = SP.Description)) AS NumMovies
		FROM tbl_SourcePaths SP WHERE MediaType = $MediaType`,
		{ $MediaType });

	if (filterValues && filterValues.filterSourcePaths) {
		results.forEach(result => {
			const filterValue = filterValues.filterSourcePaths.find(value => value.Description === result.Description);

			if (filterValue) {
				result.Selected = filterValue.Selected;
			}

			result.NumMovies = result.NumMovies.toLocaleString();
		})
	}

	logger.log('fetchFilterSourcePaths result:', results);

	shared.filterSourcePaths = results;
}

async function fetchFilterGenres($MediaType) {
	logger.log('fetchFilterGenres MediaType:', $MediaType);

	const filterValues = await fetchFilterValues($MediaType);

	logger.log('fetchFilterGenres filterValues:', filterValues);

	const results = await db.fireProcedureReturnAll(`
			SELECT
			id_Genres
			, GenreID
			, Name
			, 1 AS Selected
			, (
				SELECT COUNT(1)
				FROM tbl_Movies_Genres MG
				INNER JOIN tbl_Movies MOV ON MG.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
				INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
				WHERE MG.id_Genres = G.id_Genres
			) AS NumMovies
		FROM tbl_Genres G
		ORDER BY Name`,
		{ $MediaType });

	const resultsFiltered = results.filter(result => result.NumMovies > 0);

	if (filterValues && filterValues.filterGenres) {
		resultsFiltered.forEach(result => {
			const filterValue = filterValues.filterGenres.find(value => value.GenreID === result.GenreID);

			if (filterValue) {
				result.Selected = filterValue.Selected;
			}

			result.NumMovies = result.NumMovies.toLocaleString();
		})
	}

	logger.log('fetchFilterGenres resultsFiltered:', resultsFiltered);

	shared.filterGenres = resultsFiltered;
}

async function fetchFilterAgeRatings($MediaType) {
	logger.log('fetchFilterAgeRatings MediaType:', $MediaType);

	const filterValues = await fetchFilterValues($MediaType);

	logger.log('fetchFilterAgeRatings filterValues:', filterValues);

	const results = await db.fireProcedureReturnAll(`
		SELECT
			-1 AS Age
			, (SELECT COUNT(1) FROM tbl_Movies MOV INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.IMDB_id_AgeRating_Chosen_Country IS NULL) AS NumMovies
			, 1 AS Selected
		UNION
		SELECT
			Age
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM (
			SELECT
				AR.Age
			FROM tbl_Movies MOV
			INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
			INNER JOIN tbl_AgeRating AR ON MOV.IMDB_id_AgeRating_Chosen_Country = AR.id_AgeRating AND AR.Age IS NOT NULL
			WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
		)
		GROUP BY (Age)`,
		{ $MediaType });

	const resultsFiltered = results.filter(result => result.NumMovies > 0);

	if (filterValues && filterValues.filterAgeRatings) {
		resultsFiltered.forEach(result => {
			const filterValue = filterValues.filterAgeRatings.find(value => value.Age === result.Age);

			if (filterValue) {
				result.Selected = filterValue.Selected;
			}

			result.NumMovies = result.NumMovies.toLocaleString();
		})
	}

	logger.log('fetchFilterAgeRatings resultsFiltered:', resultsFiltered);

	shared.filterAgeRatings = resultsFiltered;
}

async function fetchFilterRatings($MediaType) {
	logger.log('fetchFilterRatings MediaType:', $MediaType);

	const filterValues = await fetchFilterValues($MediaType);

	logger.log('fetchFilterRatings filterValues:', filterValues);

	const results = await db.fireProcedureReturnAll(`
			SELECT
				0 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
								AND (MOV.Rating IS NULL OR MOV.Rating = 0)
				) AS NumMovies
			UNION
			SELECT
				1 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Rating = 1
				) AS NumMovies
			UNION
			SELECT
				2 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Rating = 2
				) AS NumMovies
			UNION
			SELECT
				3 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Rating = 3
				) AS NumMovies
			UNION
			SELECT
				4 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Rating = 4
				) AS NumMovies
			UNION
			SELECT
				5 AS Rating
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.Rating = 5
				) AS NumMovies
				`,
		{ $MediaType });

	if (filterValues && filterValues.filterRatings) {
		results.forEach(result => {
			const filterValue = filterValues.filterRatings.find(value => value.Rating === result.Rating);

			if (filterValue) {
				result.Selected = filterValue.Selected;
			}

			result.NumMovies = result.NumMovies.toLocaleString();
		})
	}

	logger.log('fetchFilterRatings results:', results);

	shared.filterRatings = results;
}

async function fetchFilterParentalAdvisory($MediaType) {
	const Nudity = await fetchFilterParentalAdvisoryCategory($MediaType, 'Nudity');
	const Violence = await fetchFilterParentalAdvisoryCategory($MediaType, 'Violence');
	const Profanity = await fetchFilterParentalAdvisoryCategory($MediaType, 'Profanity');
	const Alcohol = await fetchFilterParentalAdvisoryCategory($MediaType, 'Alcohol');
	const Frightening = await fetchFilterParentalAdvisoryCategory($MediaType, 'Frightening');

	shared.filterParentalAdvisory = {
		Nudity,
		Violence,
		Profanity,
		Alcohol,
		Frightening
	}
}

async function fetchFilterParentalAdvisoryCategory($MediaType, PA_Category) {
	logger.log(`fetchFilterParentalAdvisory${PA_Category} MediaType:`, $MediaType);

	const filterValues = await fetchFilterValues($MediaType);

	logger.log(`fetchFilterParentalAdvisory${PA_Category} filterValues:`, filterValues);

	const results = await db.fireProcedureReturnAll(`
			SELECT
				-1 AS Severity
				, '<not available>' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.IMDB_Parental_Advisory_${PA_Category} IS NULL
				) AS NumMovies
			UNION
			SELECT
				0 AS Severity
				, 'None' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.IMDB_Parental_Advisory_${PA_Category} = 0
				) AS NumMovies
			UNION
			SELECT
				1 AS Severity
				, 'Mild' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.IMDB_Parental_Advisory_${PA_Category} = 1
				) AS NumMovies
			UNION
			SELECT
				2 AS Severity
				, 'Moderate' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.IMDB_Parental_Advisory_${PA_Category} = 2
				) AS NumMovies
			UNION
			SELECT
				3 AS Severity
				, 'Severe' AS DisplayText
				, 1 AS Selected
				, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.IMDB_Parental_Advisory_${PA_Category} = 3
				) AS NumMovies
				`,
		{ $MediaType });

	if (filterValues && filterValues.filterParentalAdvisory && filterValues.filterParentalAdvisory[PA_Category]) {
		results.forEach(result => {
			const filterValue = filterValues.filterParentalAdvisory[PA_Category].find(value => value.Severity === result.Severity);

			if (filterValue) {
				result.Selected = filterValue.Selected;
			}

			result.NumMovies = result.NumMovies.toLocaleString();
		})
	}

	logger.log(`fetchFilterParentalAdvisory${PA_Category} results:`, results);

	return results;
}

async function fetchFilterPersons($MediaType) {
	const filterValues = await fetchFilterValues($MediaType);

	const results = await db.fireProcedureReturnAll(`
		SELECT
			0 AS id_Filter_Persons
			, NULL AS IMDB_Person_ID
			, '<any other person>' AS Person_Name
			, 1 AS Selected
			, (
					SELECT COUNT(1)
					FROM tbl_Movies MOV
					INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
					WHERE
						(MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
						AND MOV.id_Movies NOT IN (
						SELECT DISTINCT MC.id_Movies
						FROM tbl_Movies_IMDB_Credits MC
						INNER JOIN tbl_Movies MOV2 ON MC.id_Movies = MOV2.id_Movies
						INNER JOIN tbl_SourcePaths SP2 ON MOV2.id_SourcePaths = SP2.id_SourcePaths AND SP2.MediaType = $MediaType
						WHERE MC.IMDB_Person_ID IN (SELECT IMDB_Person_ID FROM tbl_Filter_Persons)
					)
				)
			AS NumMovies
		UNION
		SELECT
			id_Filter_Persons
			, IMDB_Person_ID
			, Person_Name
			, 1 AS Selected
			, (
					SELECT COUNT(1) FROM (
						SELECT DISTINCT MC.id_Movies
						FROM tbl_Movies_IMDB_Credits MC
						INNER JOIN tbl_Movies MOV ON MC.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
						INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
						WHERE MC.IMDB_Person_ID = FILTERPERSON.IMDB_Person_ID
					)
			) AS NumMovies
		FROM tbl_Filter_Persons FILTERPERSON
	`, { $MediaType });

	// logger.log('fetchFilterPersons QUERY:', )

	if (filterValues && filterValues.filterLists) {
		results.forEach(result => {
			const filterValue = filterValues.filterLists.find(value => value.id_Filter_Persons === result.id_Filter_Persons);

			if (filterValue) {
				result.Selected = filterValue.Selected;
			}

			result.NumMovies = result.NumMovies.toLocaleString();
		})
	}

	logger.log('fetchFilterPersons result:', results);

	shared.filterPersons = results;
}

async function fetchFilterYears($MediaType) {
	logger.log('fetchFilterYears MediaType:', $MediaType);

	const filterValues = await fetchFilterValues($MediaType);

	logger.log('fetchFilterYears filterValues:', filterValues);

	const results = await db.fireProcedureReturnAll(`
		SELECT
			'-1' AS startYear
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM tbl_Movies MOV
		INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.startYear IS NULL
		UNION
		SELECT
			startYear
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM tbl_Movies MOV
		INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.startYear IS NOT NULL
		GROUP BY (startYear)
		ORDER BY startYear DESC`,
		{ $MediaType });

	const resultsFiltered = results.filter(result => result.NumMovies > 0);

	results.forEach(result => {
		result.startYear = parseInt(result.startYear);
	})

	if (filterValues && filterValues.filterYear) {
		resultsFiltered.forEach(result => {
			const filterValue = filterValues.filterYear.find(value => value.startYear == result.startYear);

			if (filterValue) {
				result.Selected = filterValue.Selected;
			}

			result.NumMovies = result.NumMovies.toLocaleString();
		})
	}

	logger.log('fetchFilterYears resultsFiltered:', resultsFiltered);

	shared.filterYears = resultsFiltered;
}

async function fetchFilterQualities($MediaType) {
	logger.log('fetchFilterQualities MediaType:', $MediaType);

	const filterValues = await fetchFilterValues($MediaType);

	logger.log('fetchFilterQualities filterValues:', filterValues);

	const results = await db.fireProcedureReturnAll(`
		SELECT
			MI_Quality
			, COUNT(1) AS NumMovies
			, 1 AS Selected
		FROM tbl_Movies MOV
		INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND MediaType = $MediaType
		WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
		GROUP BY (MI_Quality)`,
		{ $MediaType });

	const resultsFiltered = results.filter(result => result.NumMovies > 0);

	if (filterValues && filterValues.filterQualities) {
		resultsFiltered.forEach(result => {
			const filterValue = filterValues.filterQualities.find(value => value.MI_Quality == result.MI_Quality);

			if (filterValue) {
				result.Selected = filterValue.Selected;
			}

			result.NumMovies = result.NumMovies.toLocaleString();
		})
	}

	logger.log('fetchFilterQualities resultsFiltered:', resultsFiltered);

	shared.filterQualities = resultsFiltered;
}

function abortRescan() {
	doAbortRescan = true;
}

function saveFilterValues($MediaType) {
	const filterValues = {
		filterSourcePaths: shared.filterSourcePaths,
		filterGenres: shared.filterGenres,
		filterAgeRatings: shared.filterAgeRatings,
		filterRatings: shared.filterRatings,
		filterLists: shared.filterLists,
		filterParentalAdvisory: shared.filterParentalAdvisory,
		filterPersons: shared.filterPersons,
		filterYears: shared.filterYears,
		filterQualities: shared.filterQualities
	}

	const filterValuesString = JSON.stringify(filterValues);

	// logger.log('saveFilterValues:', filterValuesString);

	setSetting(`filtersMediaType${$MediaType}`, JSON.stringify(filterValues));
}

async function createList($Name) {
	const id_Lists = await db.fireProcedureReturnScalar(`SELECT id_Lists FROM tbl_Lists WHERE Name = $Name`, { $Name });
	if (id_Lists) {
		throw definedError.create('a list with the same name already exists', null, null, null)
	}

	await db.fireProcedure(`INSERT INTO tbl_Lists (Name, created_at) VALUES ($Name, DATETIME('now'))`, { $Name });
	return await db.fireProcedureReturnScalar(`SELECT id_Lists FROM tbl_Lists WHERE Name = $Name`, { $Name });
}

async function addToList($id_Lists, $id_Movies) {
	const id_Lists = await db.fireProcedureReturnScalar(`SELECT id_Lists_Movies FROM tbl_Lists_Movies WHERE id_Lists = $id_Lists AND id_Movies = $id_Movies`, { $id_Lists, $id_Movies });
	if (id_Lists) {
		throw definedError.create('the item is already part of the list', null, null, null)
	}

	await db.fireProcedure(`INSERT INTO tbl_Lists_Movies (id_Lists, id_Movies, created_at) VALUES ($id_Lists, $id_Movies, DATETIME('now'))`, { $id_Lists, $id_Movies });
}

async function removeFromList($id_Lists, $id_Movies) {
	logger.log('removeFromList $id_Lists:', $id_Lists, '$id_Movies:', $id_Movies);
	return await db.fireProcedureReturnScalar(`DELETE FROM tbl_Lists_Movies WHERE id_Lists = $id_Lists AND id_Movies = $id_Movies`, { $id_Lists, $id_Movies });
}

async function fetchLists() {
	return await db.fireProcedureReturnAll(`
			SELECT
				id_Lists
				, Name
			FROM tbl_Lists LISTS
			ORDER BY Name
	`);
}

async function fetchFilterLists($MediaType) {
	const filterValues = await fetchFilterValues($MediaType);

	const results = await db.fireProcedureReturnAll(`
		SELECT
			0 AS id_Lists
			, '<not in any list>' AS Name
			, 1 AS Selected
			, (
				SELECT COUNT(1)
				FROM tbl_Movies MOV
				INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
				WHERE (MOV.isRemoved IS NULL OR MOV.isRemoved = 0) AND MOV.id_Movies NOT IN (SELECT id_Movies FROM tbl_Lists_Movies)
			) AS NumMovies
		UNION
		SELECT
			id_Lists
			, Name
			, 1 AS Selected
			, (
				SELECT COUNT(1)
				FROM tbl_Lists_Movies LM
				INNER JOIN tbl_Movies MOV ON LM.id_Movies = MOV.id_Movies AND (MOV.isRemoved IS NULL OR MOV.isRemoved = 0)
				INNER JOIN tbl_SourcePaths SP ON MOV.id_SourcePaths = SP.id_SourcePaths AND SP.MediaType = $MediaType
				WHERE LM.id_Lists = LISTS.id_Lists
			) AS NumMovies
		FROM tbl_Lists LISTS
		ORDER BY Name
	`, { $MediaType });

	if (filterValues && filterValues.filterLists) {
		results.forEach(result => {
			const filterValue = filterValues.filterLists.find(value => value.Description === result.Description);

			if (filterValue) {
				result.Selected = filterValue.Selected;
			}

			result.NumMovies = result.NumMovies.toLocaleString();
		})
	}

	logger.log('fetchFilterLists result:', results);

	shared.filterLists = results;
}

async function getMovieDetails($id_Movies) {
	const lists = await db.fireProcedureReturnAll(`SELECT id_Lists, Name FROM tbl_Lists WHERE id_Lists IN (SELECT id_Lists FROM tbl_Lists_Movies WHERE id_Movies = $id_Movies) ORDER BY Name`, { $id_Movies });

	return {
		lists
	}
}

async function setLastAccess($id_Movies) {
	return await db.fireProcedure(`UPDATE tbl_Movies SET last_access_at = DATETIME('now') WHERE id_Movies = $id_Movies`, { $id_Movies });
}

async function getCurrentTime() {
	return await db.fireProcedureReturnScalar(`SELECT DATETIME('now')`);
}

async function fetchMovieCredits($id_Movies) {
	const credits = await db.fireProcedureReturnAll(`
	SELECT
		id_Movies_IMDB_Credits
		, id_Movies
		, Category			AS category
		, IMDB_Person_ID	AS id
		, Person_Name		AS name
		, Credit			AS credit
	FROM tbl_Movies_IMDB_Credits WHERE id_Movies = $id_Movies`, { $id_Movies });

	const creditsCategorized = [];

	credits.forEach(credit => {
		if (!creditsCategorized.find(cc => cc.category === credit.category)) {
			creditsCategorized.push({
				category: credit.category,
				items: []
			})
		}

		creditsCategorized.find(cc => cc.category === credit.category).items.push(credit);
	})

	return creditsCategorized;
}

async function fetchIMDBPerson($IMDB_Person_ID) {
	return await db.fireProcedureReturnAll(`
	SELECT
		id_IMDB_Persons
		, IMDB_Person_ID
		, Photo_URL
		, ShortBio
		, LongBio
	FROM tbl_IMDB_Persons
	WHERE IMDB_Person_ID = $IMDB_Person_ID`, { $IMDB_Person_ID });
}

async function scrapeIMDBPersonData($IMDB_Person_ID) {
	const url = `https://www.imdb.com/name/${$IMDB_Person_ID}`;
	const response = await requestGetAsync(url);
	const html = response.body;

	logger.log('scraping:', url);

	const result = {
		$IMDB_Person_ID,
		$Photo_URL: null,
		$ShortBio: null,
		$LongBio: null
	};

	const rxShortBio = /<div class="name-trivia-bio-text">([\s\S]*?)<\/div>/;

	if (rxShortBio.test(html)) {
		logger.log('bio found');
		result.$ShortBio = unescape(htmlToText.fromString(html.match(rxShortBio)[1], { wordwrap: null, ignoreImage: true, ignoreHref: true }).replace('See full bio', '').trim());
	} else {
		logger.log('bio NOT found');
	}

	const rxPhotoURL = /<img id="name-poster"[\s\S]*?src="(.*?)"/;

	if (rxPhotoURL.test(html)) {
		const url = html.match(rxPhotoURL)[1];
		const photoPath = `data/extras/${$IMDB_Person_ID}_poster.jpg`;
		const success = await downloadFile(url, photoPath, false);

		if (success) {
			result.$Photo_URL = photoPath;
		}
	}

	const urlBio = `https://www.imdb.com/name/${$IMDB_Person_ID}/bio`;
	const responseBio = await requestGetAsync(urlBio);
	const htmlBio = responseBio.body;

	const rxLongBio = /<h4 class="li_group">Mini Bio[\s\S]*?(<div[\s\S]*?)<\/div>/

	if (rxLongBio.test(htmlBio)) {
		logger.log('LONG BIO FOUND!:', { longbio: htmlBio.match(rxLongBio)[1] });
		result.$LongBio = unescape(htmlToText.fromString(htmlBio.match(rxLongBio)[1], { wordwrap: null, ignoreImage: true, ignoreHref: true }).trim());
	}

	await saveIMDBPersonData(result);

	return result;
}

async function saveIMDBPersonData(data) {
	logger.log('saveIMDBPersonData data:', data);

	// return;

	return await db.fireProcedure(`INSERT INTO tbl_IMDB_Persons (
		IMDB_Person_ID
		, Photo_URL
		, ShortBio
		, LongBio
		, created_at
		, updated_at
	) VALUES (
		$IMDB_Person_ID
		, $Photo_URL
		, $ShortBio
		, $LongBio
		, DATETIME('now')
		, DATETIME('now')
	)
	ON CONFLICT(IMDB_Person_ID)
	DO UPDATE SET
		Photo_URL = excluded.Photo_URL
		, ShortBio = excluded.ShortBio
		, LongBio = excluded.LongBio
		, updated_at = DATETIME('now')
		`, data);
}

async function fetchNumMoviesForPerson($IMDB_Person_ID) {
	return await db.fireProcedureReturnScalar(`
		SELECT COUNT(1) FROM (
			SELECT DISTINCT id_Movies FROM tbl_Movies_IMDB_Credits WHERE IMDB_Person_ID = $IMDB_Person_ID
		)
	`, { $IMDB_Person_ID });
}

async function addFilterPerson($IMDB_Person_ID, $Person_Name) {
	const id_Filter_Persons = await db.fireProcedureReturnScalar(`SELECT id_Filter_Persons FROM tbl_Filter_Persons WHERE IMDB_Person_ID = $IMDB_Person_ID`, { $IMDB_Person_ID });
	if (id_Filter_Persons) {
		return;
	}

	await db.fireProcedure(`INSERT INTO tbl_Filter_persons (IMDB_Person_ID, Person_Name, created_at) VALUES ($IMDB_Person_ID, $Person_Name, DATETIME('now'))`, { $IMDB_Person_ID, $Person_Name });
}

async function deleteFiterPerson($id_Filter_Persons) {
	return await db.fireProcedureReturnScalar(`DELETE FROM tbl_Filter_Persons WHERE id_Filter_Persons = $id_Filter_Persons`, { $id_Filter_Persons });
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

	fetchFilterSourcePaths,
	fetchFilterGenres,
	fetchFilterAgeRatings,
	fetchFilterRatings,
	fetchFilterLists,
	fetchFilterParentalAdvisory,
	fetchFilterPersons,
	fetchFilterYears,
	fetchFilterQualities,
	isScanning,
	abortRescan,
	createList,
	addToList,
	removeFromList,
	fetchLists,
	getMovieDetails,
	setLastAccess,
	getCurrentTime,
	fetchMovieCredits,
	fetchIMDBPerson,
	scrapeIMDBPersonData,
	fetchNumMoviesForPerson,
	addFilterPerson,
	deleteFiterPerson
}