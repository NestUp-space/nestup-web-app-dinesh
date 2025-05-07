import prisma from '../config/db';

async function main() {
  const statuses = [
    { id: 1, status: 'Pending' },
    { id: 2, status: 'In Progress' },
    { id: 3, status: 'Completed' },
    { id: 4, status: 'On Hold' },
    { id: 5, status: 'Cancelled' },
  ];

  console.log('Seeding Status table...');
  for (const statusData of statuses) {
    await prisma.status.upsert({
      where: { id: statusData.id },
      update: {},
      create: statusData,
    });
    console.log(`Upserted status: ${statusData.status} (ID: ${statusData.id})`);
  }
  console.log('Status table seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
