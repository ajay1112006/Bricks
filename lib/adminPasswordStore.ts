import fs from "fs";
import path from "path";
import { setRuntimeAdminPassword } from "./adminAuth";
import { connectToDatabase } from "./db";
import { AdminSettingModel } from "./models";

/**
 * Persists the new admin password across both the runtime memory,
 * the local environment configuration (.env.local), and MongoDB (if reachable).
 */
export async function persistNewAdminPassword(newPassword: string): Promise<void> {
  // 1. Immediately update runtime state and process.env
  setRuntimeAdminPassword(newPassword);

  // 2. Persist to .env.local
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf8");
    }

    const formattedValue = /[\s#"'\\]/.test(newPassword)
      ? `"${newPassword.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
      : newPassword;

    const regex = /^ADMIN_PASSWORD=.*$/m;
    if (regex.test(content)) {
      content = content.replace(regex, `ADMIN_PASSWORD=${formattedValue}`);
    } else {
      const separator = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
      content = `${content}${separator}ADMIN_PASSWORD=${formattedValue}\n`;
    }

    fs.writeFileSync(envPath, content, "utf8");
  } catch (err) {
    console.warn("Failed to persist ADMIN_PASSWORD to .env.local:", err);
  }

  // 3. Persist to MongoDB if reachable
  try {
    const db = await connectToDatabase();
    if (db.isConnected) {
      await AdminSettingModel.findOneAndUpdate(
        { key: "admin_password" },
        { key: "admin_password", value: newPassword, updatedAt: new Date() },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn("Failed to persist admin password to MongoDB:", err);
  }
}
