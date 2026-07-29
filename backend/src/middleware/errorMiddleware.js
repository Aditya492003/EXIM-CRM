const errorMiddleware = (err, req, res, next) => {
    console.error("Unhandled API Error:", err);

    const statusCode = err.statusCode || err.http_code || 500;

    res.status(statusCode).json({
        success: false,
        message: err.message || err.error?.message || "Internal Server Error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
};

export default errorMiddleware;