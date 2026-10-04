import { Request, Response, NextFunction } from "express";

export const adminMiddleware = (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
) => {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });

    }

    if (req.user.role !== "admin") {

        return res.status(403).json({
            success: false,
            message: "Admin access required",
        });

    }

    next();
};