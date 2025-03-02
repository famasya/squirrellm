import type { ActionFunctionArgs } from "@remix-run/node";
import {
	Form,
	redirect,
	useLoaderData,
	useNavigation,
	useSubmit,
} from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import type { InferSelectModel } from "drizzle-orm";
import { Loader2, Send, Squirrel } from "lucide-react";
import { useState } from "react";
import { GlobalErrorBoundary } from "~/components/global-error-boundary";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SearchableSelect } from "~/components/ui/searchable-select";
import { db } from "~/lib/db";
import { conversations, profiles } from "~/lib/db.schema";
import { commitSession, getSession } from "~/sessions";

type Profile = InferSelectModel<typeof profiles>;

export async function action({ request }: ActionFunctionArgs) {
	const session = await getSession(request.headers.get("Cookie"));

	const { profileId, message } = await request.json();
	if (!message || !profileId) {
		throw new Error("Message and model are required");
	}

	// create session
	const [newSession] = await db
		.insert(conversations)
		.values({
			id: TwitterSnowflake.generate().toString(),
			createdAt: new Date().toISOString(),
			name: message as string,
		})
		.returning();

	session.flash("newConversation", {
		profileId: profileId,
		message: message,
	});

	return redirect(`/chat/${newSession.id}`, {
		headers: {
			"Set-Cookie": await commitSession(session),
		},
	});
}

export async function loader() {
	const availableProfiles = await db.select().from(profiles);
	// redirect if no profiles were created
	if (availableProfiles.length === 0) {
		return redirect("/settings?state=onboarding");
	}
	return { availableProfiles };
}

export default function AppHome() {
	const { availableProfiles } = useLoaderData<typeof loader>();
	const defaultProfile =
		availableProfiles.find((profile) => profile.isDefault === 1) ??
		availableProfiles[0];

	const [newSession, setNewSession] = useState({
		message: "",
		model: defaultProfile.modelId,
		instruction: defaultProfile.systemMessage,
		profileId: defaultProfile.id,
	});
	const navigation = useNavigation();
	const submit = useSubmit();

	return (
		<div className="flex h-full items-center justify-center">
			<div className="w-full max-w-[800px] space-y-2 flex flex-col text-center bg-white/5 px-8 py-4 md:p-8 rounded-xl shadow-sm">
				<h1 className="text-lg sm:text-xl font-semibold mb-2 flex items-center justify-center gap-4">
					<Squirrel />
					How may I help you?
				</h1>
				<Form
					autoComplete="off"
					onSubmit={(e) => {
						e.preventDefault();
						submit(newSession, {
							method: "post",
							encType: "application/json",
						});
					}}
				>
					<Input
						placeholder="Ask me anything..."
						value={newSession.message}
						name="message"
						disabled={
							navigation.state === "submitting" ||
							availableProfiles.length === 0
						}
						onChange={(e) =>
							setNewSession({ ...newSession, message: e.target.value })
						}
						className="h-12 rounded-xl shadow-lg dark:bg-zinc-900"
						autoFocus
					/>

					<div className="w-full flex flex-col sm:flex-row gap-2 justify-between mt-2">
						<div className="flex gap-2 items-center w-full sm:w-1/3">
							<SearchableSelect
								disabled={
									navigation.state === "submitting" ||
									availableProfiles.length === 0
								}
								value={newSession.profileId}
								onChange={({ value: profileId }) => {
									// find modelId
									const profile = availableProfiles.find(
										(profile) => profile.id === profileId,
									) as Profile;
									setNewSession({
										...newSession,
										profileId,
										model: profile.modelId,
										instruction: profile.systemMessage,
									});
								}}
								options={availableProfiles.map((profile) => ({
									value: profile.id,
									label: profile.name,
									description: profile.modelId.split("/")[1],
								}))}
								placeholder="Select a profile"
							/>
						</div>

						<Button
							type="submit"
							size="sm"
							disabled={
								availableProfiles.length === 0 ||
								newSession.message.length === 0
							}
						>
							{navigation.state === "submitting" ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
									Processing...
								</>
							) : (
								<>
									<Send /> Send
								</>
							)}
						</Button>
					</div>
				</Form>
			</div>
		</div>
	);
}

export function ErrorBoundary() {
	return <GlobalErrorBoundary />;
}
