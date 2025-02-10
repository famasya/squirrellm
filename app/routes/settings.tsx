import type { ActionFunctionArgs } from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useLocation,
	useNavigation,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { Edit, Loader2, Save, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SearchableSelect } from "~/components/ui/searchable-select";
import { Textarea } from "~/components/ui/textarea";
import { db } from "~/lib/db";
import { models as modelsTable } from "~/lib/db.schema";

export async function loader() {
	const dbModels = await db.select().from(modelsTable);
	return { dbModels };
}

export async function action({ request }: ActionFunctionArgs) {
	const body = await request.formData();
	const model = body.get("model");
	const name = body.get("name");
	const deleteId = body.get("deleteId");
	const systemMessage = body.get("systemMessage");
	const isDefault = body.get("isDefault") || 0;

	if (deleteId) {
		await db.delete(modelsTable).where(eq(modelsTable.id, deleteId as string));

		if (isDefault) {
			// if isDefault is deleted, set the next first model as default
			const nextModel = await db.select().from(modelsTable).limit(1);
			if (nextModel.length === 0) return true;

			await db
				.update(modelsTable)
				.set({ isDefault: 1 })
				.where(eq(modelsTable.id, nextModel[0].id));
		}
		return true;
	}

	if (!model || !name) {
		throw new Error("Model and name are required");
	}

	await db
		.insert(modelsTable)
		.values({
			id: model as string,
			name: name as string,
			systemMessage: (systemMessage as string) || null,
			isDefault: isDefault as number,
		})
		.onConflictDoUpdate({
			set: {
				name: name as string,
				systemMessage: (systemMessage as string) || null,
				isDefault: isDefault as number,
			},
			target: modelsTable.id,
		});

	return true;
}

export default function Settings() {
	const navigation = useNavigation();
	const location = useLocation();
	const response = useActionData<boolean>();
	const { data: openrouterModels, isLoading } = useSWR(
		"https://openrouter.ai/api/v1/models",
		async (url) => {
			const request = await fetch(url);
			const { data } = (await request.json()) as ModelListResponse;
			return data;
		},
		{
			onError: (error) => {
				console.error(error);
				toast.error("Error loading models");
			},
		},
	);
	const { dbModels } = useLoaderData<typeof loader>();
	const [formValue, setFormValue] = useState({
		id: "",
		name: "",
		systemMessage: "",
		isDefault: dbModels.length === 0,
	});

	// show alert if response is true
	useEffect(() => {
		if (response === true) {
			toast.success("Settings saved");
		}
	}, [response]);

	// reset state
	useEffect(() => {
		if (location.key) {
			setFormValue({
				id: "",
				name: "",
				systemMessage: "",
				isDefault: dbModels.length === 0,
			});
		}
	}, [location, dbModels]);

	return (
		<div className="ml-1">
			{location.search.includes("state=onboarding") && (
				<div className="w-full p-2 rounded-sm mt-4 bg-white/10">
					<p className="text-sm">
						You must specify your default model and system message for your
						client before proceeding.
					</p>
				</div>
			)}
			<h1 className="text-lg font-bold mt-4">Settings</h1>

			<div className="w-full max-w-[600px] border-[1px] p-4 rounded-sm mt-4">
				<h2 className="font-semibold">Add new model</h2>
				<Form
					method="post"
					key={location.key}
					className="mt-4 space-y-4 flex flex-col"
				>
					<div className="space-y-2">
						<Label htmlFor="model">Model</Label>
						<SearchableSelect
							disabled={isLoading || navigation.state === "submitting"}
							onChange={(option) =>
								setFormValue({
									...formValue,
									id: option.value,
									name: option.label,
								})
							}
							placeholder="Select a model"
							value={formValue.id}
							options={
								openrouterModels?.map((model) => ({
									value: model.id,
									label: model.name,
								})) || []
							}
						/>
						<Input type="hidden" name="model" value={formValue.id || ""} />
						<Input type="hidden" name="name" value={formValue.name || ""} />
					</div>
					<div className="space-y-2">
						<Label htmlFor="instruction">Instruction</Label>
						<Textarea
							disabled={
								isLoading ||
								formValue.id === "" ||
								navigation.state === "submitting"
							}
							id="instruction"
							value={formValue.systemMessage}
							onChange={(e) =>
								setFormValue({ ...formValue, systemMessage: e.target.value })
							}
							placeholder="e.g. You are an expert assistant in legal field..."
						/>
						<Input
							type="hidden"
							name="systemMessage"
							value={formValue.systemMessage}
						/>
					</div>

					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<Checkbox
								id="default"
								disabled={
									isLoading ||
									formValue.id === "" ||
									navigation.state === "submitting"
								}
								onCheckedChange={(value) =>
									setFormValue({ ...formValue, isDefault: value === true })
								}
								checked={formValue.isDefault}
							/>
							<Label htmlFor="default">Default model</Label>
							<Input
								type="hidden"
								name="isDefault"
								value={formValue.isDefault ? 1 : 0}
							/>
						</div>
						<Button
							type="submit"
							disabled={
								isLoading ||
								formValue.id === "" ||
								navigation.state === "submitting"
							}
						>
							{navigation.state === "submitting" ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
									Processing...
								</>
							) : (
								<>
									<Save /> Save
								</>
							)}
						</Button>
					</div>
				</Form>
			</div>

			<h1 className="mt-8 text-lg font-bold">Models</h1>
			{dbModels.length > 0 && (
				<div className="w-full max-w-[600px] mt-4 space-y-4">
					{dbModels.map((model) => (
						<div
							key={model.id}
							className="text-sm border-[1px] rounded-sm p-4 space-y-2"
						>
							<h2 className="font-semibold">
								{model.name} {model.isDefault ? "(Default)" : ""}
							</h2>
							<div className="">
								<div>Instruction</div>
								<div>{model.systemMessage || "-"}</div>
							</div>

							<Form
								method="post"
								key={location.key}
								className="flex justify-end gap-2"
							>
								<Button
									type="button"
									size={"sm"}
									onClick={() =>
										setFormValue({
											id: model.id,
											name: model.name,
											systemMessage: model.systemMessage || "",
											isDefault: model.isDefault === 1,
										})
									}
								>
									<Edit /> Edit
								</Button>
								<Input type="hidden" name="deleteId" value={model.id} />
								<Input
									type="hidden"
									name="isDefault"
									value={model.isDefault ? 1 : 0}
								/>
								<Button type="submit" variant={"destructive"} size={"sm"}>
									<Trash /> Remove
								</Button>
							</Form>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
