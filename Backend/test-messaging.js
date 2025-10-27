const { MongoClient, ObjectId } = require('mongodb');

// Test messaging functionality
async function testMessaging() {
  const uri = "mongodb+srv://NewUser:veesha2025@educare.fa1yvuh.mongodb.net/?retryWrites=true&w=majority&appName=EduCare";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB for testing");

    const db = client.db("educare");
    const messagesCollection = db.collection("messages");
    const usersCollection = db.collection("users");

    // Test data
    const testMessage = {
      senderId: new ObjectId(),
      recipientId: new ObjectId(),
      message: "Hello! This is a test message.",
      type: "text",
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert test message
    const result = await messagesCollection.insertOne(testMessage);
    console.log("Test message inserted:", result.insertedId);

    // Query test message
    const retrievedMessage = await messagesCollection.findOne({ _id: result.insertedId });
    console.log("Retrieved message:", retrievedMessage);

    // Clean up test data
    await messagesCollection.deleteOne({ _id: result.insertedId });
    console.log("Test message cleaned up");

    console.log("✅ Messaging system test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await client.close();
  }
}

// Run the test
testMessaging();
