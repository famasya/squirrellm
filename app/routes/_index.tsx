import type { ActionFunctionArgs } from "@remix-run/node";
import {
	Form,
	isRouteErrorResponse,
	redirect,
	useActionData,
	useLoaderData,
	useNavigate,
	useNavigation,
	useRouteError,
} from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { CircleAlert, Loader2, Send, Squirrel } from "lucide-react";
import { useEffect, useState } from "react";
import { ClientOnly } from 'remix-utils/client-only';
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SearchableSelect } from "~/components/ui/searchable-select";
import { db } from "~/lib/db";
import { conversations, models as modelsTable } from "~/lib/db.schema";
import useChatStore from "~/lib/stores";
import { commitSession, getSession } from "~/sessions";

export async function action({ request }: ActionFunctionArgs) {
	const session = await getSession(request.headers.get("Cookie"));
	const body = await request.formData();
	const message = body.get("message")?.toString();
	const model = body.get("model")?.toString();
	const instruction = body.get("instruction")?.toString();
	if (!message || !model) throw new Error("Message is required");

	const id = TwitterSnowflake.generate().toString();

	// create session
	await db.insert(conversations).values({
		id: id,
		createdAt: new Date().toISOString(),
		name: message as string,
	});

	session.flash("newConversation", {
		message: message,
		model: model,
		instruction: instruction?.toString(),
	});

	return Response.json(
		{ id },
		{
			headers: {
				"Set-Cookie": await commitSession(session),
			},
		},
	);
}

export async function loader() {
	const models = await db.select().from(modelsTable);
	if (models.length === 0) {
		return redirect("/settings?state=onboarding");
	}
	return { models };
}

export default function AppHome() {
	const [message, setMessage] = useState("");
	const navigation = useNavigation();
	const navigate = useNavigate();
	const { models } = useLoaderData<typeof loader>();
	const defaultModel =
		models.find((model) => model.isDefault === 1) ?? models[0];
	const [selectedModel, setSelectedModel] = useState({
		model: defaultModel.id,
		instruction: defaultModel.systemMessage,
	});
	const response = useActionData<{ id: string }>();
	const { refreshConversationsList } = useChatStore();

	useEffect(() => {
		if (response) {
			refreshConversationsList();
			navigate(`/chat/${response.id}`);
		}
	}, [response, navigate, refreshConversationsList]);

	return (
		<div className="flex h-full items-center justify-center">
			<div className="w-full max-w-[800px] space-y-2 flex flex-col text-center bg-white/5 p-8 rounded-xl shadow-sm">
				<h1 className="text-xl font-semibold mb-2 flex items-center justify-center gap-4">
					<Squirrel />
					How may I help you?
				</h1>
				<Form method="post">
					<Input
						placeholder="Ask me anything..."
						value={message}
						name="message"
						disabled={navigation.state === "submitting" || models.length === 0}
						onChange={(e) => setMessage(e.target.value)}
						className="h-12 rounded-xl shadow-lg dark:bg-zinc-900"
						autoFocus
					/>

					<div className="w-full flex justify-between mt-2">
						<div className="flex gap-2 items-center">
							<SearchableSelect
								disabled={
									navigation.state === "submitting" || models.length === 0
								}
								value={selectedModel.model}
								onChange={(value) =>
									setSelectedModel({
										model: value.value,
										instruction:
											models.find((m) => m.id === value.value)?.systemMessage ||
											null,
									})
								}
								options={models.map((model) => ({
									value: model.id,
									label: model.name,
								}))}
								placeholder="Select a model"
							/>
						</div>
						<Input type="hidden" name="model" value={selectedModel.model} />
						{selectedModel.instruction && (
							<Input
								type="hidden"
								name="instruction"
								value={selectedModel.instruction}
							/>
						)}

						<ClientOnly fallback={<Button disabled><Send /> Send</Button>}>
							{() =>
								<Button
									type="submit"
									disabled={
										navigation.state === "submitting" ||
										models.length === 0 ||
										message.length === 0
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
							}
						</ClientOnly>
					</div>
				</Form>
			</div>
		</div>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();
	console.error(error);
	if (isRouteErrorResponse(error)) {
		return (
			<div className="border border-red-400 p-2 rounded mt-6 bg-white/10">
				<div className="text-red-400 flex flex-row gap-2">
					<CircleAlert /> {error.statusText}
				</div>
			</div>
		);
	}

	if (error instanceof Error) {
		return (
			<div className="border border-red-400 p-2 rounded mt-6 bg-white/10">
				<div className="text-red-400 flex flex-row gap-2">
					<CircleAlert /> {error.message}
				</div>
			</div>
		);
	}

	return <div>Unknown Error</div>;
}
