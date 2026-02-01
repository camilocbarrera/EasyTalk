// Test script to verify Clerk webhook endpoint
// Run with: bun run scripts/test-webhook.ts

const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000/api/webhooks/clerk";

// Simulated Clerk user.created payload
const testPayload = {
  type: "user.created",
  data: {
    id: "user_test_" + Date.now(),
    email_addresses: [
      {
        id: "email_test_123",
        email_address: "test@example.com",
      },
    ],
    primary_email_address_id: "email_test_123",
    username: "testuser",
    first_name: "Test",
    last_name: "User",
    image_url: "https://example.com/avatar.png",
  },
};

async function testWebhook() {
  console.log("🔍 Testing Clerk webhook endpoint...\n");
  console.log(`URL: ${WEBHOOK_URL}`);
  console.log(`Payload: ${JSON.stringify(testPayload, null, 2)}\n`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const status = response.status;
    const text = await response.text();

    console.log(`Status: ${status}`);
    console.log(`Response: ${text}\n`);

    if (status === 200) {
      console.log("✅ Webhook endpoint is working!");
      console.log("\n📋 Next steps:");
      console.log("1. Go to Clerk Dashboard → Webhooks");
      console.log("2. Add endpoint: https://www.easytalk.ai/api/webhooks/clerk");
      console.log("3. Select events: user.created, user.updated, user.deleted");
      console.log("4. Copy the Signing Secret to your .env.local as CLERK_WEBHOOK_SECRET");
      console.log("5. Click 'Test' in Clerk Dashboard to send a real test webhook");
    } else if (status === 400) {
      console.log("⚠️  Webhook returned 400 - This might be expected if:");
      console.log("   - CLERK_WEBHOOK_SECRET is set (signature verification failed)");
      console.log("   - The payload format is incorrect");
    } else {
      console.log("❌ Unexpected response");
    }
  } catch (error) {
    console.error("❌ Failed to connect to webhook:");
    console.error(error);
    console.log("\n💡 Make sure your dev server is running: bun dev");
  }
}

testWebhook();
