import { Form } from "@remix-run/react";
import type { InferSelectModel } from "drizzle-orm";
import { Edit, Trash } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { profiles } from "~/lib/db.schema";

type Props = {
	availableProfiles: InferSelectModel<typeof profiles>[];
	locationKey: string;
	setFormValues: (values: {
		id: string;
		modelId: string;
		name: string;
		systemMessage: string;
		metadata: string;
		isDefault: boolean;
	}) => void;
	handleDelete: (id: string, isDefault: boolean) => void;
};

export default function ProfilesList({
	availableProfiles,
	locationKey,
	setFormValues,
	handleDelete,
}: Props) {
	// sort default first
	const sortedProfiles = availableProfiles.sort(
		(a, b) => Number(b.isDefault) - Number(a.isDefault),
	);
	return (
		<>
			<h1 className="mt-8 text-lg font-bold">Profiles</h1>
			{sortedProfiles.length > 0 && (
				<div className="w-full max-w-[600px] mt-4 space-y-4">
					{sortedProfiles.map((profile) => (
						<div
							key={profile.id}
							className="text-sm border-[1px] rounded-sm p-4 space-y-4"
						>
							<div>
								<h2 className="font-semibold mb-4">
									{profile.name} {profile.isDefault ? "(Default)" : ""}
									<div className="text-slate-500 text-xs mt-1">
										{profile.modelId}
									</div>
								</h2>
								<div className="bg-white/10 p-2 rounded">
									<div className="font-semibold">Instruction</div>
									<div className="">{profile.systemMessage || "-"}</div>
								</div>
							</div>

							<Form
								autoComplete="off"
								key={locationKey}
								className="flex justify-between gap-2 items-center"
							>
								<div className="text-slate-500 text-xs">
									{availableProfiles.length === 1 &&
										"Cannot delete the only profile"}
								</div>
								<div className="space-x-2">
									<Button
										type="button"
										size={"sm"}
										onClick={() =>
											setFormValues({
												id: profile.id,
												modelId: profile.modelId,
												name: profile.name,
												metadata: profile.metadata,
												systemMessage: profile.systemMessage || "",
												isDefault: profile.isDefault === 1,
											})
										}
									>
										<Edit /> Edit
									</Button>
									<Button
										type="button"
										variant={"destructive"}
										size={"sm"}
										onClick={() =>
											handleDelete(profile.id, profile.isDefault === 1)
										}
										disabled={availableProfiles.length === 1}
									>
										<Trash /> Remove
									</Button>
								</div>
							</Form>
						</div>
					))}
				</div>
			)}
		</>
	);
}
