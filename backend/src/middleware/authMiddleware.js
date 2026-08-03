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

        let managerName = null;
        let managerEmail = null;

        // 2. Lookup Clerk user details for Manager or unlinked Employee
        if (payload.sub) {
            try {
                const clerkUser = await clerkClient.users.getUser(payload.sub);
                const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
                const firstName = clerkUser?.firstName || "";
                const lastName = clerkUser?.lastName || "";
                const fullName = `${firstName} ${lastName}`.trim() || clerkUser?.username || userEmail;
                managerName = fullName || null;
                managerEmail = userEmail || null;

                if (!employee) {
                    const employeeIdFromMeta = clerkUser?.publicMetadata?.employeeId;
                    const managerClerkIdFromMeta = clerkUser?.publicMetadata?.managerClerkId || clerkUser?.publicMetadata?.invitedBy;

                    if (employeeIdFromMeta) {
                        employee = await Employee.findByIdAndUpdate(
                            employeeIdFromMeta,
                            { clerkUserId: payload.sub, ...(managerClerkIdFromMeta ? { managerClerkId: managerClerkIdFromMeta } : {}) },
                            { returnDocument: 'after' }
                        );
                    } else if (userEmail) {
                        employee = await Employee.findOneAndUpdate(
                            { email: userEmail },
                            { clerkUserId: payload.sub, ...(managerClerkIdFromMeta ? { managerClerkId: managerClerkIdFromMeta } : {}) },
                            { returnDocument: 'after' }
                        );
                    }
                } else if (!employee.managerClerkId) {
                    const managerClerkIdFromMeta = clerkUser?.publicMetadata?.managerClerkId || clerkUser?.publicMetadata?.invitedBy;
                    if (managerClerkIdFromMeta) {
                        employee.managerClerkId = managerClerkIdFromMeta;
                        await employee.save();
                    }
                }
            } catch (err) {
                // If Clerk SDK lookup fails, fallback silently
            }
        }

        const isEmployee = !!employee;
        const workspaceManagerId = isEmployee
            ? (employee.managerClerkId || employee.invitedBy || payload.sub)
            : payload.sub;

        req.user = {
            clerkId: payload.sub,
            sessionId: payload.sid,
            role: isEmployee ? "employee" : "manager",
            name: isEmployee ? employee.name : (managerName || "Manager"),
            email: isEmployee ? employee.email : managerEmail,
            employeeId: isEmployee ? employee._id : null,
            managerClerkId: isEmployee ? (employee.managerClerkId || employee.invitedBy) : null,
            workspaceManagerId: workspaceManagerId,
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