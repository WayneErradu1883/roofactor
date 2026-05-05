import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  const users = [
    {
      email: "Wayne.Erradu@gmail.com",
      name: "Wayne Erradu",
      password: "C0nqu3st#8304!!",
      role: "ADMIN" as const,
    },
    {
      email: "Nomasonto@nomiplex",
      name: "Nomasonto",
      password: "^&89321%$",
      role: "ESTIMATOR" as const,
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!existing) {
      const hashedPassword = await hash(user.password, 12);
      await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          password: hashedPassword,
          role: user.role,
        },
      });
      console.log(`Created user: ${user.email} (${user.role})`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
