import path from 'path'

const logger = require('loglevel');

const isBuild = process.env.NODE_ENV === 'production';
const isWindows = process.platform === 'win32';

function getPath(relativePath) {
	/* eslint-disable no-undef */
	return path.join(
		(isBuild ? __dirname : __static),
		'../',
		relativePath,
	);
	/* eslint-enable no-undef */
}

function getTimeString(runtimeSeconds) {
	let result = '';
	
	const hours = Math.floor(runtimeSeconds / (60*60));
	if (hours > 0) {
		result += `${hours}:`;
	}

	const minutes = Math.floor(runtimeSeconds / 60) % 60;
	result += `${(minutes < 10) ? '0' + minutes : minutes}:`;

	const seconds = runtimeSeconds % 60;
	result += (seconds < 10) ? '0' + seconds : seconds;

	return result;
}

function uppercaseEachWord(input) {
	logger.log('uppercaseEachWord:', input);

	let isNewBeginning = true;
	let text = input;

	for (let i = 0; i < text.length; i++) {
		if (/[\s\-\,\.\:\"\'\!\§\$\%\&\/\(\)\=\?\*\+\~\#\;\_]/.test(text[i])) {
			isNewBeginning = true;
		} else {
			if (isNewBeginning) {
				text = text.substr(0, i) + text[i].toUpperCase() + text.substr(i+1);
				isNewBeginning = false;
			}
		}
	}

	logger.log('uppercaseEachWord result:', text);
	return text;
}

function getMovieNameFromFileName(filename) {
	let filenameFiltered = filename;

	if (filenameFiltered.includes('.')) {
		filenameFiltered = filenameFiltered.split('.').slice(0, -1).join('.')
	}

	filenameFiltered = filenameFiltered.replace(/\.\,\_/g, ' ');

	return filenameFiltered;
}

export {
	isWindows,
	getPath,
	getTimeString,
	uppercaseEachWord,
	getMovieNameFromFileName
}