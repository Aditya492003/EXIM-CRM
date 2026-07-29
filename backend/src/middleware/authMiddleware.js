import { verifyToken, clerkClient } from "@clerk/clerk-sdk-node";
import Employee from "../models/Employee.js";

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authorization token missing",
            });
        }

        const token = authHeader.split(" ")[1];

        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        // 1. Direct check by clerkUserId
        let employee = await Employee.findOne({ clerkUserId: payload.sub });

        // 2. Fallback: If not found by clerkUserId, look up Clerk user email / metadata and link
        if (!employee && payload.sub) {
            try {
                const clerkUser = await clerkClient.users.getUser(payload.sub);
                const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
                const employeeIdFromMeta = clerkUser?.publicMetadata?.employeeId;

                if (employeeIdFromMeta) {
                    employee = await Employee.findByIdAndUpdate(
                        employeeIdFromMeta,
                        { clerkUserId: payload.sub },
                        { returnDocument: 'after' }
                    );
                } else if (userEmail) {
                    employee = await Employee.findOneAndUpdate(
                        { email: userEmail },
                        { clerkUserId: payload.sub },
                        { returnDocument: 'after' }
                    );
                }
            } catch (err) {
                // If Clerk SDK lookup fails, fallback silently
            }
        }

        req.user = {
            clerkId: payload.sub,
            sessionId: payload.sid,
            role: employee ? "employee" : "manager",
            name: employee ? employee.name : null,
            employeeId: employee ? employee._id : null,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
};

export default requireAuth;