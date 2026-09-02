import app from './app';
import config from './app/config';
import { prisma } from './app/lib/prisma';
import { seedAdmin, seedTesterTechnician } from './app/utils/seed';

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");

    await seedAdmin();
    await seedTesterTechnician();

    app.listen(config.port, () => {
      console.log(`Example app listening on port ${config.port}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
