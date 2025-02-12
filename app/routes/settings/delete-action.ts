import { count, eq } from "drizzle-orm";
import { db } from "~/lib/db";
import { profiles } from "~/lib/db.schema";

export async function deleteAction({
	id,
	isDefault,
}: { id: string; isDefault: boolean }) {
	return db.transaction(async (tx) => {
		// disable delete if it's the only model
		const [existingProfiles] = await tx
			.select({ count: count(profiles.id) })
			.from(profiles);
		if (existingProfiles.count === 1) {
			return {
				message: "Cannot delete the only profile",
				success: false,
			};
		}

		await tx.delete(profiles).where(eq(profiles.id, id));

		// if isDefault is deleted, set the next first model as default
		if (isDefault) {
			const [newDefaultProfile] = await tx.select().from(profiles).limit(1);

			await tx
				.update(profiles)
				.set({ isDefault: 1 })
				.where(eq(profiles.id, newDefaultProfile.id));
		}

		return {
			message: "Profile deleted",
			success: true,
		};
	});
}
