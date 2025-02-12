import type { ActionFunctionArgs } from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useLocation,
	useNavigation,
	useSubmit
} from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { Edit, Loader2, Save, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { GlobalErrorBoundary } from "~/components/global-error-boundary";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SearchableSelect } from "~/components/ui/searchable-select";
import { Textarea } from "~/components/ui/textarea";
import { db } from "~/lib/db";
import { models as modelsTable } from "~/lib/db.schema";
import type { action as deleteModelAction } from "./api.settings.delete-model";

export async function loader() {
	const availableModels = await db.select().from(modelsTable);
	return { availableModels };
}

export async function action({ request }: ActionFunctionArgs) {
	const {
		id,
		modelId,
		name,
		systemMessage,
		metadata,
		isDefault,
	} = await request.json();

	// upsert model
	await db
		.insert(modelsTable)
		.values({
			id: id !== "" ? id : TwitterSnowflake.generate().toString(),
			modelId: modelId,
			name: name,
			systemMessage: systemMessage || null,
			metadata: metadata,
			isDefault: isDefault,
		})
		.onConflictDoUpdate({
			target: modelsTable.id,
			set: {
				modelId: modelId,
				name: name,
				systemMessage: systemMessage || null,
				metadata: metadata,
				isDefault: isDefault,
			},
		});

	return {
		message: "Model saved",
	};
}

export default function Settings() {
	const navigation = useNavigation();
	const location = useLocation();
	const upsertAction = useActionData<typeof action>();
	const deleteAction = useActionData<typeof deleteModelAction>();
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
	const { availableModels } = useLoaderData<typeof loader>();
	const submit = useSubmit();
	const [formValues, setFormValues] = useState({
		id: "",
		modelId: "",
		name: "",
		systemMessage: "",
		metadata: "{}",
		isDefault: availableModels.length === 0,
	});

	// show success message
	useEffect(() => {
		if (upsertAction?.message) {
			toast.success(upsertAction.message);
		}
	}, [upsertAction]);

	// reset state
	useEffect(() => {
		if (location.key) {
			setFormValues({
				id: "",
				modelId: "",
				name: "",
				systemMessage: "",
				metadata: "{}",
				isDefault: availableModels.length === 0,
			});
		}
	}, [location, availableModels]);

	const upsertHandler = () => {
		submit(formValues, { method: "post", encType: "application/json" });
	};

	return (
		<div className="ml-1 mb-8">
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
					key={location.key}
					className="mt-4 space-y-4 flex flex-col"
				>
					<div className="space-y-2">
						<Label htmlFor="model">Model <span className="text-red-500">*</span></Label>
						<SearchableSelect
							disabled={isLoading || navigation.state === "submitting"}
							onChange={(option) => {
								const metadata = openrouterModels?.find((model) => model.id === option.value) as object;
								setFormValues({
									...formValues,
									modelId: option.value,
									metadata: JSON.stringify(metadata),
								})
							}}
							placeholder="Select a model"
							value={formValues.modelId}
							options={
								openrouterModels?.map((model) => ({
									value: model.id,
									label: model.name,
								})) || []
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
						<Input name="name" id="name"
							value={formValues.name}
							onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
							placeholder="i.e. Coder Wizard"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="instruction">Instruction</Label>
						<Textarea
							disabled={
								isLoading ||
								formValues.modelId === "" ||
								navigation.state === "submitting"
							}
							id="instruction"
							value={formValues.systemMessage}
							onChange={(e) =>
								setFormValues({ ...formValues, systemMessage: e.target.value })
							}
							placeholder="e.g. You are an expert assistant in legal field..."
						/>
					</div>

					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<Label htmlFor="default">Default model</Label>
							<Checkbox
								id="default"
								disabled={
									isLoading ||
									formValues.id === "" ||
									navigation.state === "submitting" ||
									availableModels.length === 1 // if only one model, it is default
								}
								onCheckedChange={(value) =>
									setFormValues({ ...formValues, isDefault: value === true })
								}
								checked={formValues.isDefault}
							/>
						</div>

						<Button
							type="button"
							disabled={
								isLoading ||
								formValues.modelId === "" ||
								formValues.name === "" ||
								navigation.state === "submitting"
							}
							onClick={upsertHandler}
						>
							{navigation.state === "submitting" ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
									Saving...
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
			{availableModels.length > 0 && (
				<div className="w-full max-w-[600px] mt-4 space-y-4">
					{availableModels.map((model) => (
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
								key={location.key}
								className="flex justify-end gap-2"
							>
								<Button
									type="button"
									size={"sm"}
									onClick={() =>
										setFormValues({
											id: model.id,
											modelId: model.modelId,
											name: model.name,
											metadata: model.metadata,
											systemMessage: model.systemMessage || "",
											isDefault: model.isDefault === 1,
										})
									}
								>
									<Edit /> Edit
								</Button>
								<Button
									type="button"
									variant={"destructive"}
									size={"sm"}
									onClick={() => {
										submit(
											{ id: model.id, isDefault: model.isDefault === 1 },
											{ method: "post", encType: "application/json" },
										);
									}}
									disabled={availableModels.length === 1}
								>
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

export function ErrorBoundary() {
	return <GlobalErrorBoundary />;
}
