import cron from "node-cron";
import { prisma } from "./prisma";

export const deleteUnverifiedAccounts = async () => {
	cron.schedule("*/10 * * * *", async () => {
		try {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

			const deletedAccounts = await prisma.user.deleteMany({
				where: {
					emailVerified: false,
					createdAt: { lt: oneHourAgo },
				},
			});

			if (deletedAccounts.count > 0) {
				console.log(
					`Cron Job: Deleted ${deletedAccounts.count} unverified account(s) who registered more than an hour ago.`,
				);
			}
		} catch (error) {
			console.error(
				"Cron Job: Error while deleting unverified accounts:",
				error,
			);
		}

		console.log("Account delete cron schedule (every 10 minutes)");
	});
};
