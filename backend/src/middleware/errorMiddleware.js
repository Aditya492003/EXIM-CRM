const errorMiddleware = (err, req, res, next) => {
    console.error("Unhandled API Error:", err);

    if (req?.headers?.origin) {
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    const statusCode = err.statusCode || err.http_code || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || err.error?.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
};

export default errorMiddleware;