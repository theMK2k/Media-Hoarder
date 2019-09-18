import path from 'path'

const isBuild = process.env.NODE_ENV === 'production';

export default {
	getPath: (relativePath) => {
		/* eslint-disable no-undef */
		return path.join(
			(isBuild ? __dirname : __static),
			(isBuild ? '../../' : '../'),
			relativePath,
		);
		/* eslint-enable no-undef */
	}
}