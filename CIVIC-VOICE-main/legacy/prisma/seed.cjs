// Seed script to populate the database with sample Bengaluru issues
// Run with: npx prisma db push && npx prisma db seed

// Use the Prisma client from @prisma/client (generated to node_modules)
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// For Prisma v7 with driver adapters, pass the Postgres adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Clearing existing issues and votes…");
  await prisma.vote.deleteMany();
  await prisma.issue.deleteMany();

  const now = new Date();

  const areas = [
    "Koramangala 4th Block, Bengaluru",
    "Koramangala 7th Block, Bengaluru",
    "HSR Layout Sector 1, Bengaluru",
    "HSR Layout Sector 2, Bengaluru",
    "Indiranagar 2nd Stage, Bengaluru",
    "Indiranagar, Bengaluru",
    "Domlur, Bengaluru",
    "JP Nagar 3rd Phase, Bengaluru",
    "JP Nagar 6th Phase, Bengaluru",
    "Malleshwaram, Bengaluru",
    "Mathikere, Bengaluru",
    "Bellandur, Bengaluru",
    "Varthur, Bengaluru",
    "MG Road, Bengaluru",
    "Kasavanahalli, Bengaluru",
    "Whitefield, Bengaluru",
    "Hebbal, Bengaluru",
    "Jayanagar, Bengaluru",
    "Majestic, Bengaluru",
    "Brigade Road Area, Bengaluru",
  ];

  const issueTypes = [
    "roads",
    "garbage",
    "street_lighting",
    "drainage",
    "traffic",
    "pollution",
    "footpath",
    "water_supply",
    "animal_control",
    "sanitation",
    "noise",
  ];

  const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const statuses = ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];

  const baseDescriptions = [
    "Potholes causing traffic congestion",
    "Overflowing garbage pile near residential area",
    "Streetlights not working on main road",
    "Open manhole posing danger to pedestrians",
    "Illegal parking blocking footpath",
    "Garbage burning causing air pollution",
    "Broken footpath slabs near bus stop",
    "Sewage water overflowing onto the street",
    "Frequent water supply disruption",
    "Uncollected garbage bins for several days",
    "Tree branches touching live electric wires",
    "Waterlogging after moderate rain",
    "Lake frothing and foul smell",
    "Rusty and leaning street light poles",
    "Broken speed breakers causing accidents",
    "Construction debris dumped on roadside",
    "No zebra crossing near busy junction",
    "Street dogs menace near school",
    "Public toilet in unusable condition",
    "Noise from late-night commercial establishment",
  ];

  const issues = [];

  for (let i = 0; i < 100; i++) {
    const area = areas[i % areas.length];
    const type = issueTypes[i % issueTypes.length];
    const severity = severities[i % severities.length];

    // Make roughly 1/3 of issues "ignored" (open for 20–45 days)
    const isIgnored = i % 3 === 0;
    const daysAgo = isIgnored ? 20 + (i % 25) : i % 10;
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - daysAgo);

    // Ignored issues should not be RESOLVED
    const status = isIgnored
      ? statuses[i % (statuses.length - 1)] // SUBMITTED/ASSIGNED/IN_PROGRESS
      : statuses[i % statuses.length];

    issues.push({
      description: `${baseDescriptions[i % baseDescriptions.length]} (#${
        i + 1
      })`,
      issueType: type,
      severity,
      status,
      location: area,
      locationName: area,
      createdAt,
    });
  }

  await prisma.issue.createMany({
    data: issues,
  });

  console.log(`Seeded ${issues.length} Bengaluru issues`);

  // Add votes: more votes for higher severity and ignored issues
  const createdIssues = await prisma.issue.findMany({
    select: { id: true, createdAt: true, severity: true, status: true },
  });

  const votes = [];

  for (const issue of createdIssues) {
    const isIgnored =
      issue.status !== "RESOLVED" &&
      new Date(issue.createdAt) <=
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let baseVotes = 0;
    switch (issue.severity) {
      case "CRITICAL":
        baseVotes = 8;
        break;
      case "HIGH":
        baseVotes = 5;
        break;
      case "MEDIUM":
        baseVotes = 3;
        break;
      default:
        baseVotes = 1;
    }

    if (isIgnored) {
      baseVotes += 3;
    }

    const count = Math.max(0, baseVotes + Math.floor(Math.random() * 4) - 2);

    for (let i = 0; i < count; i++) {
      const createdAt = new Date(issue.createdAt);
      createdAt.setHours(createdAt.getHours() + 1 + i);
      votes.push({
        issueId: issue.id,
        createdAt,
      });
    }
  }

  if (votes.length > 0) {
    await prisma.vote.createMany({ data: votes });
  }

  console.log(`Seeded ${votes.length} votes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
