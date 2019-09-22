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
			logger.error(err);
		}
	})
});

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
		await applyIMDBdata(movie, onlyNonDone);
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

	try {
		const releaseinfo = await getIMDBreleaseinfo(movie);
	} catch(err) {
		logger.log(err);
		return;
	}
}

async function getIMDBreleaseinfo(movie) {
	const imdbReleaseinfoReponse = await requestGetAsync(`https://www.imdb.com/title/${movie.IMDB_tconst}/releaseinfo`)
	const imdbReleaseinfoHTML = imdbReleaseinfoReponse.body;
	// logger.log('imdbReleaseinfoHTML', imdbReleaseinfoHTML);

	const rxOriginalTitle = /td class="aka-item__name"> \(original title\)<\/td>[\s\S]*?<td class="aka-item__title">(.*?)<\/td>/;
	const originalTitle = null
	if (rxOriginalTitle.test(imdbReleaseinfoHTML)) {
		logger.log('is match!');
		logger.log(imdbReleaseinfoHTML.match(rxOriginalTitle));
	} else {
		logger.log('no match :(');
	}
}

export {
	db,
	fetchSourcePaths,
	rescan,
}