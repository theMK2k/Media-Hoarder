import path from 'path'

const isBuild = process.env.NODE_ENV === 'production';

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

export {
	getPath,
	getTimeString
}