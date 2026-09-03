import app from './app';
import config from './app/config';
import { deleteUnverifiedAccounts } from './app/lib/cron';
import { transporter } from './app/lib/nodemailer';
import { prisma } from './app/lib/prisma';
import { redisClient } from './app/lib/redis';
import { seedAdmin, seedTesterTechnician } from './app/utils/seed';

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");

    await redisClient.connect();
    console.log("Redis Connected Successfully.");

    await transporter.verify();
    console.log("Nodemailer Connected Successfully.");

    await seedAdmin();
    await seedTesterTechnician();

    await deleteUnverifiedAccounts();

    app.listen(config.port, () => {
      console.log(`Example app listening on port ${config.port}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
