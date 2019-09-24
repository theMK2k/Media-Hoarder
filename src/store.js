const fs = require('fs')
const util = require('util');
const { dialog } = require("electron").remote;
const logger = require('loglevel');
const child_process = require('child_process');
const xml2js = require('xml2js');
const request = require('request');

const readdirAsync = util.promisify(fs.readdir);
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
	await filescanMovies(onlyNew);
	await rescanMoviesMetaData(true);
	// await rescanTV();
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

async function rescanMoviesMetaData(onlyNonDone) {
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
			FROM tbl_Movies`,
		[]);

	for (let i = 0; i < movies.length; i++) {
		const movie = movies[i];

		// KILLME
		if (i > 10) break;

		// eventBus.scanInfoOff();
		eventBus.scanInfoShow('Rescanning Movies', `${movie.Name || movie.Filename}`);

		await applyMediaInfo(movie, onlyNonDone);
		await findIMDBtconst(movie, onlyNonDone);
		await applyIMDBdata(movie, false);	// KILLME: onlyNonDone
	}

	eventBus.scanInfoOff();
}

async function applyMediaInfo(movie, onlyNonDone) {
	// TODO:	run mediainfo on movie file
	//				parse mediainfo result and save to db
	if (onlyNonDone && movie.MI_Done) {
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

async function findIMDBtconst(movie, onlyNonDone) {
	// TODO:	find IMDB tconst (currently just from filename)
	//				save IMDB_tconst to db
	if (onlyNonDone && movie.IMDB_Done) {
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

async function applyIMDBdata(movie, onlyNonDone) {
	// TODO:	fetch IMDB data from imdb.com (incl. images)
	//				save IMDB data to db
	if (onlyNonDone && movie.IMDB_Done) {
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
		$IMDB_posterSmall_URL = posterURLs.$IMDB_posterSmall_URL;
		$IMDB_posterLarge_URL = posterURLs.$IMDB_posterLarge_URL;
	}

	return {
		$IMDB_releaseType,
		$IMDB_genres,
		$IMDB_rating,
		$IMDB_numVotes,
		$IMDB_metacriticScore
	}
}

async function getIMDBposterURLs(posterMediaViewerURL) {
	logger.log('getting Poster URLs from', posterMediaViewerURL);

	let $IMDB_posterSmall_URL = null;
	let $IMDB_posterLarge_URL = null;

	const url = `https://www.imdb.com${posterMediaViewerURL}`;
	const response = await requestGetAsync(url);
	const html = response.body;

	const rxID = /(rm\d*)ref/;
	if (rxID.test(html)) {
		const ID = html.match(rxID)[1];

		logger.log('ID:', ID);

		const rxString = `"id":"${ID}","h":\\d*,"msrc":"(.*?)","src":".*?"`;
		logger.log('rxString:', rxString);
		const rxURLs = new RegExp(rxString);

		logger.log('URL Match:', html.match(rxURLs));
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

async function saveIMDBData(movie, IMDBdata, genres) {
	const IMDB_genres = IMDBdata.$IMDB_genres;
	delete IMDBdata.$IMDB_genres;

	let sql = 'IMDB_Done = 1';
	Object.keys(IMDBdata).forEach(key => {
		sql += `, [${key.replace('$', '')}] = ${key}`
	})
	sql = `UPDATE tbl_Movies SET ${sql} WHERE id_Movies = $id_Movies`;

	const movieGenres = await db.fireProcedureReturnAll('SELECT MG.id_Genres, G.GenreID, G.Name FROM tbl_Movies_Genres MG INNER JOIN tbl_Genres G ON MG.id_Genres = G.id_Genres WHERE MG.id_Movies = $id_Movies', {$id_Movies: movie.id_Movies});
	
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

export {
	db,
	fetchSourcePaths,
	rescan,
}