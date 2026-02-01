import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

async function testConnection() {
  console.log("🔍 Testing database connection...\n");

  // Check if DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set in environment variables");
    console.log("\nMake sure you have a .env.local file with:");
    console.log("DATABASE_URL=postgresql://...");
    process.exit(1);
  }

  console.log("✅ DATABASE_URL is set");
  console.log(`   URL: ${databaseUrl.substring(0, 30)}...`);

  // Create connection (prepare: false for Supabase Transaction pool mode)
  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  try {
    // Test basic query
    console.log("\n🔄 Testing connection with simple query...");
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log("✅ Connection successful!");
    console.log(`   Server time: ${result[0]?.current_time || "retrieved"}`);

    // Check if tables exist
    console.log("\n🔄 Checking for EasyTalk tables...");
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'sessions', 'session_participants', 'messages', 'translations')
      ORDER BY table_name
    `);

    const existingTables = tables.map((r) => r.table_name);
    const expectedTables = [
      "users",
      "sessions",
      "session_participants",
      "messages",
      "translations",
    ];

    console.log("\n📋 Table status:");
    for (const table of expectedTables) {
      const exists = existingTables.includes(table);
      console.log(`   ${exists ? "✅" : "❌"} ${table}`);
    }

    const missingTables = expectedTables.filter(
      (t) => !existingTables.includes(t)
    );

    if (missingTables.length > 0) {
      console.log(
        "\n⚠️  Some tables are missing. Run this command to create them:"
      );
      console.log("   bunx drizzle-kit push");
    } else {
      console.log("\n✅ All tables exist!");

      // Count records in each table
      console.log("\n📊 Record counts:");
      for (const table of expectedTables) {
        const count = await db.execute(
          sql.raw(`SELECT COUNT(*) as count FROM "${table}"`)
        );
        console.log(`   ${table}: ${count[0]?.count || 0} records`);
      }
    }

    console.log("\n✨ Database test completed successfully!");
  } catch (error) {
    console.error("\n❌ Database connection failed:");
    console.error(error);

    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        console.log("\n💡 Tip: Check if your DATABASE_URL hostname is correct");
      } else if (error.message.includes("password authentication failed")) {
        console.log("\n💡 Tip: Check if your database password is correct");
      } else if (error.message.includes("does not exist")) {
        console.log("\n💡 Tip: The database might not exist. Create it first.");
      }
    }

    process.exit(1);
  } finally {
    // Close connection
    await client.end();
  }
}

testConnection();
