function create(message, details, errorCode, statusCode) {
	return {
		error: {
			message: message,
			details: details,
			errorCode: errorCode,
			statusCode: statusCode,
		}
	}
}

export {
	create
}