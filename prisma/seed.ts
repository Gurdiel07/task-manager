import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@taskmanager.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@taskmanager.com",
      hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  const [engineering, support] = await Promise.all([
    prisma.team.upsert({
      where: { name: "Engineering" },
      update: {},
      create: {
        name: "Engineering",
        description: "Software engineering and development team",
      },
    }),
    prisma.team.upsert({
      where: { name: "Support" },
      update: {},
      create: {
        name: "Support",
        description: "Customer support and helpdesk team",
      },
    }),
  ]);
  console.log(`Created teams: ${engineering.name}, ${support.name}`);

  await prisma.teamMember.upsert({
    where: { userId_teamId: { userId: admin.id, teamId: engineering.id } },
    update: {},
    create: {
      userId: admin.id,
      teamId: engineering.id,
      role: "LEAD",
    },
  });

  const tagData = [
    { name: "Bug", color: "#EF4444" },
    { name: "Feature", color: "#3B82F6" },
    { name: "Urgent", color: "#F59E0B" },
    { name: "Documentation", color: "#8B5CF6" },
    { name: "Enhancement", color: "#10B981" },
  ];
  for (const tag of tagData) {
    await prisma.ticketTag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  console.log(`Created ${tagData.length} tags`);

  const slaPolicies = [
    {
      name: "Critical SLA",
      description: "For critical priority tickets",
      conditions: { priority: "CRITICAL" },
      responseTimeMin: 15,
      resolutionMin: 240,
    },
    {
      name: "Standard SLA",
      description: "For medium and high priority tickets",
      conditions: { priority: ["HIGH", "MEDIUM"] },
      responseTimeMin: 60,
      resolutionMin: 1440,
    },
    {
      name: "Low Priority SLA",
      description: "For low priority tickets",
      conditions: { priority: "LOW" },
      responseTimeMin: 480,
      resolutionMin: 4320,
    },
  ];
  for (const policy of slaPolicies) {
    await prisma.sLAPolicy.upsert({
      where: { id: policy.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: policy,
    });
  }
  console.log(`Created ${slaPolicies.length} SLA policies`);

  const badges = [
    {
      name: "First Ticket",
      description: "Resolved your first ticket",
      icon: "trophy",
      criteria: { type: "tickets_resolved", count: 1 },
    },
    {
      name: "Speed Demon",
      description: "Resolved a ticket within 30 minutes",
      icon: "zap",
      criteria: { type: "fast_resolution", minutes: 30 },
    },
    {
      name: "Team Player",
      description: "Collaborated on 10 different tickets",
      icon: "users",
      criteria: { type: "collaborations", count: 10 },
    },
  ];
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }
  console.log(`Created ${badges.length} badges`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
