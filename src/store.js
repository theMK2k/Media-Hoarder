const fs = require('fs')
const util = require('util');
const { dialog } = require("electron").remote;
const logger = require('loglevel');

const readdirAsync = util.promisify(fs.readdir);
const lstatAsync = util.promisify(fs.lstat);

import path from 'path';

import { eventBus } from "@/main";

import * as db from '@/helpers/db';
import * as dbsyncSQLite from '@/helpers/dbsync-sqlite';
import * as helpers from '@/helpers/helpers';

const isBuild = process.env.NODE_ENV === 'production';

if (!isBuild) {
	logger.setLevel(0);
}

console.log('logLevel:', logger.getLevel());

let currentScanInfoHeader = '';

let dbsync = dbsyncSQLite;

dbsync.default.runSync(helpers.default.getPath('data/mediabox.db_initial'), helpers.default.getPath('data/mediabox.db'), { doCreateTables: true, doCreateColumns: true, doCopyContent: true }, (err) => {
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

	db.default.initDbCB((err) => {
		if (err) {
			logger.error(err);
		}
	})
});

async function fetchSourcePaths() {
	const result = await db.default.fireProcedureReturnAll(`
			SELECT 
			id_SourcePaths
			, MediaType
			, Path
			, Description
			, created_at
		FROM tbl_SourcePaths`,
		[]);

	return result;
};

async function rescan(onlyNew) {
	await rescanMovies();
	// await rescanTV();
}

async function rescanMovies(onlyNew) {
	logger.log('rescanMovies started');
	
	eventBus.scanInfoShow('Rescanning Movies', 'Rescan started');

	try {
		const moviesHave = await db.default.fireProcedureReturnAll(`
			SELECT
				LOWER(Path) AS tmp_PathLower
			FROM tbl_Movies
		`);

		logger.log('moviesHave:', moviesHave);

		const moviesSourcePaths = await db.default.fireProcedureReturnAll(`
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

			await rescanMoviesPath(onlyNew, moviesHave, movieSourcePath.id_SourcePaths, movieSourcePath.Path);
		}
	} catch (err) {
		throw err;
	}
}

async function rescanMoviesPath(onlyNew, moviesHave, id_SourcePaths, scanPath) {
	logger.log('scan', scanPath);

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
			await rescanMoviesPath(onlyNew, moviesHave, id_SourcePaths, pathItem.Path);
		}
	}
}

async function addMovie(id_SourcePaths, pathItem) {
	logger.log('add file:', pathItem);
	// currentScanInfoHeader
	eventBus.scanInfoShow(currentScanInfoHeader, `adding ${pathItem.Name}`);

	await db.default.fireProcedure(
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

export default {
	db,
	fetchSourcePaths,
	rescan,
}