import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.hRDUser.findUnique({
    where: { email: "hrd@company.com" },
  });

  if (existing) {
    console.log("ℹ️  Akun HRD sudah ada, skip seed");
    return;
  }

  await prisma.hRDUser.create({
    data: {
      email: "hrd@company.com",
      password: await bcrypt.hash("password123", 10),
      name: "HRD Admin",
    },
  });
  console.log("✅ Seed berhasil: akun HRD default dibuat (hrd@company.com / password123)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
