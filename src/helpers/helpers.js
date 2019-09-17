import path from 'path'

const isBuild = process.env.NODE_ENV === 'production'

module.exports = {
	getDBPath: () => {
		return path.join(
			(isBuild ? __dirname : __static),
			(isBuild ? '../../' : ''),
			'../data/mediabox.db'
		);
	},

	getInitialDBPath: () => {
		return path.join(
			(isBuild ? __dirname : __static),
			(isBuild ? '../../' : ''),
			'../data/mediabox.db_initial'
		);
	},
}