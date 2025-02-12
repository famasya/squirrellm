import type { ActionFunctionArgs } from "@remix-run/node";
import { count, eq } from "drizzle-orm";
import { db } from "~/lib/db";
import { models } from "~/lib/db.schema";

export async function action({ request }: ActionFunctionArgs) {
  const {
    id,
    isDefault,
  } = await request.json();

  if (!id) {
    throw new Error("ID is required");
  }

  return db.transaction(async (tx) => {

    // disable delete if it's the only model
    const [existingModels] = await tx.select({ count: count(models.id) }).from(models);
    if (existingModels.count === 1) {
      return {
        message: "Cannot delete the only model",
        success: false,
      };
    }

    await tx.delete(models).where(eq(models.id, id));

    // if isDefault is deleted, set the next first model as default
    if (isDefault) {
      const [newDefaultModel] = await tx.select().from(models).limit(1);

      await tx
        .update(models)
        .set({ isDefault: 1 })
        .where(eq(models.id, newDefaultModel.id));
    }
    return {
      message: "Model deleted",
      success: true,
    };
  })

}
