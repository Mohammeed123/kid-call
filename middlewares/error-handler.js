export default function errorHandler(err, req, res, next){
    if(res.headersSent){
        return next(err);
    }

    const statusCode = err.statusCode ?? 500;
    const isServerError = statusCode >= 500;

    const body = {
        error: isServerError ? "Internal Server Error" : err.message
    }

    if(err.details) {
        body.details = err.details;
    }

    res.status(statusCode).json(body);
}