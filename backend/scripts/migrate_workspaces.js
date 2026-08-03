import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from '../src/models/Company.js';
import Contact from '../src/models/Contact.js';
import Lead from '../src/models/Lead.js';
import Deal from '../src/models/Deal.js';
import Meeting from '../src/models/Meeting.js';
import Proposal from '../src/models/Proposal.js';
import Notification from '../src/models/Notification.js';
import Employee from '../src/models/Employee.js';

dotenv.config();

const runMigration = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGO_URI is not set in environment");
      process.exit(1);
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully!");

    // Default fallback manager clerkId if createdByClerkId is not set
    const defaultManagerClerkId = "user_2tmXbYfZM3VpT89gK6wQ1z2L0";

    const models = [
      { name: "Company", model: Company },
      { name: "Contact", model: Contact },
      { name: "Lead", model: Lead },
      { name: "Deal", model: Deal },
      { name: "Meeting", model: Meeting },
      { name: "Proposal", model: Proposal },
      { name: "Notification", model: Notification },
    ];

    for (const { name, model } of models) {
      const unmigrated = await model.find({
        $or: [
          { workspaceManagerId: { $exists: false } },
          { workspaceManagerId: null },
          { workspaceManagerId: "" }
        ]
      });

      console.log(`Found ${unmigrated.length} legacy ${name} documents to migrate.`);

      let updatedCount = 0;
      for (const doc of unmigrated) {
        const creatorId = doc.createdByClerkId || doc.organizedByClerkId || doc.senderClerkId;
        
        let targetWorkspaceId = creatorId;

        // If creator was an employee, look up their managerClerkId
        if (creatorId) {
          const emp = await Employee.findOne({ clerkUserId: creatorId });
          if (emp && emp.managerClerkId) {
            targetWorkspaceId = emp.managerClerkId;
          }
        }

        doc.workspaceManagerId = targetWorkspaceId || defaultManagerClerkId;
        await doc.save();
        updatedCount++;
      }

      console.log(`Successfully backfilled workspaceManagerId for ${updatedCount} ${name} documents.`);
    }

    console.log("\n🎉 CRM V2 Workspace Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
