import type { ActionFunctionArgs } from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useLocation,
	useNavigation,
	useSubmit,
} from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { ne } from "drizzle-orm";
import { Loader2, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { profiles } from "~/lib/db.schema";
import { deleteAction } from "./delete-action";
import ProfilesList from "./profiles-list";

export async function loader() {
	const availableProfiles = await db.select().from(profiles);
	return { availableProfiles };
}

export async function action({ request }: ActionFunctionArgs) {
	const { id, modelId, name, systemMessage, metadata, isDefault } =
		await request.json();
	const params = new URL(request.url).searchParams.get("action");
	if (params === "delete") {
		if (!id) throw new Error("ID is required");
		return deleteAction({ id, isDefault });
	}

	if (!modelId) {
		return {
			message: "Model ID is required",
			success: false,
		};
	}

	return db.transaction(async (tx) => {
		// upsert model
		const [newProfile] = await tx
			.insert(profiles)
			.values({
				id: id !== "" ? id : TwitterSnowflake.generate().toString(),
				modelId: modelId,
				name: name,
				systemMessage: systemMessage || null,
				metadata: metadata,
				isDefault: isDefault ? 1 : 0,
			})
			.onConflictDoUpdate({
				target: profiles.id,
				set: {
					modelId: modelId,
					name: name,
					systemMessage: systemMessage || null,
					metadata: metadata,
					isDefault: isDefault ? 1 : 0,
				},
			})
			.returning();

		// if isDefault is updated, set all other profiles to not default
		if (isDefault) {
			await tx
				.update(profiles)
				.set({ isDefault: 0 })
				.where(ne(profiles.id, newProfile.id));
		}

		return {
			message: "Profile saved",
			success: true,
		};
	});
}

export default function Settings() {
	const navigation = useNavigation();
	const location = useLocation();
	const submit = useSubmit();
	const actionResult = useActionData<typeof action>();

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

	const { availableProfiles } = useLoaderData<typeof loader>();
	const [formValues, setFormValues] = useState({
		id: "",
		modelId: "",
		name: "",
		systemMessage: "",
		metadata: "{}",
		isDefault: availableProfiles.length === 0,
	});

	// reset state
	useEffect(() => {
		if (location.key) {
			setFormValues({
				id: "",
				modelId: "",
				name: "",
				systemMessage: "",
				metadata: "{}",
				isDefault: availableProfiles.length === 0,
			});
		}
	}, [location, availableProfiles]);

	// show action result
	useEffect(() => {
		if (actionResult) {
			actionResult.success
				? toast.success(actionResult.message)
				: toast.error(actionResult.message);
		}
	}, [actionResult]);
	const pageRef = useRef<HTMLDivElement>(null);

	return (
		<div className="ml-1 mb-8" ref={pageRef}>
			{location.search.includes("state=onboarding") && (
				<div className="w-full p-2 rounded-sm mt-4 bg-white/10">
					<p className="text-sm">
						You must specify your default profile before proceeding.
					</p>
				</div>
			)}
			<h1 className="text-lg font-bold mt-4">Settings</h1>

			<div className="w-full max-w-[600px] border-[1px] p-4 rounded-sm mt-4">
				<h2 className="font-semibold">Add new profile</h2>

				<Form
					autoComplete="off"
					key={location.key}
					className="mt-4 space-y-4 flex flex-col"
				>
					<div className="space-y-2">
						<Label htmlFor="model">
							Profile <span className="text-red-500">*</span>
						</Label>
						<SearchableSelect
							disabled={isLoading || navigation.state === "submitting"}
							onChange={(option) => {
								const metadata = openrouterModels?.find(
									(model) => model.id === option.value,
								) as object;
								setFormValues({
									...formValues,
									modelId: option.value,
									metadata: JSON.stringify(metadata),
								});
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
						<Label htmlFor="name">
							Name <span className="text-red-500">*</span>
						</Label>
						<Input
							name="name"
							id="name"
							value={formValues.name}
							onChange={(e) =>
								setFormValues({ ...formValues, name: e.target.value })
							}
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
							<Label htmlFor="default">Default profile</Label>
							<Checkbox
								id="default"
								disabled={
									isLoading ||
									formValues.modelId === "" ||
									navigation.state === "submitting" ||
									availableProfiles.length === 0 // if only one profile, it is default
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
							onClick={() => {
								submit(formValues, {
									method: "post",
									encType: "application/json",
									action: "/settings?action=upsert",
								});
							}}
						>
							{navigation.state === "submitting" ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
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

			<ProfilesList
				availableProfiles={availableProfiles}
				locationKey={location.key}
				setFormValues={(values) => {
					// scroll to ref
					pageRef.current?.scrollIntoView({ behavior: "instant" });
					setFormValues(values);
				}}
				handleDelete={(id, isDefault) => {
					submit(
						{ id, isDefault },
						{
							method: "post",
							encType: "application/json",
							action: "/settings?action=delete",
						},
					);
				}}
			/>
		</div>
	);
}

export function ErrorBoundary() {
	return <GlobalErrorBoundary />;
}
