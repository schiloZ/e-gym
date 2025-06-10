// test-db.js
const { PrismaClient } = require("./app/generated/prisma");
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Connected successfully:", user);
  } catch (error) {
    console.error("Connection error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
test();
