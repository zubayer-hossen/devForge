import "dotenv/config";
import bcrypt from "bcryptjs";

import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/index.js";
import { ROLES, ACCOUNT_STATUS } from "../constants/index.js";

const BCRYPT_COST = 12;

async function seedSuperAdmin() {
  let connected = false;

  try {
    // 1. Read environment variables
    const fullName = process.env.ADMIN_NAME?.trim();
    const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!fullName || !username || !email || !password) {
      throw new Error(
        "ADMIN_NAME, ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD are required in .env",
      );
    }

    if (password.length < 12) {
      throw new Error("Admin password must be at least 12 characters.");
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      throw new Error("Invalid ADMIN_USERNAME format.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid ADMIN_EMAIL.");
    }

    // 2. Connect MongoDB
    await connectDB();
    connected = true;

    // 3. Check existing Super Admin
    const existingSuperAdmin = await User.findOne({
      role: ROLES.SUPER_ADMIN,
    }).select("_id email username");

    if (existingSuperAdmin) {
      console.log("Super Admin already exists.");
      console.log("No duplicate account created.");
      return;
    }

    // 4. Check email and username conflicts
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).select("_id email username role");

    if (existingUser) {
      throw new Error(
        "Admin email or username already belongs to another account. No account was modified.",
      );
    }

    // 5. Hash password using existing auth configuration
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    // 6. Create first Super Admin
    const admin = await User.create({
      fullName,
      username,
      email,
      passwordHash,

      role: ROLES.SUPER_ADMIN,
      status: ACCOUNT_STATUS.APPROVED,

      emailVerified: true,
      approvedAt: new Date(),

      points: 0,
      streak: {
        current: 0,
        longest: 0,
      },
    });

    console.log("\n================================");
    console.log("SUPER ADMIN CREATED SUCCESSFULLY");
    console.log("================================");
    console.log(`Name: ${admin.fullName}`);
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Status: ${admin.status}`);
    console.log("Password: Securely hashed");
    console.log("================================\n");
  } catch (error) {
    console.error("\nSUPER ADMIN SEED FAILED:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    if (connected) {
      await disconnectDB();
      console.log("MongoDB connection closed.");
    }
  }
}

seedSuperAdmin();
