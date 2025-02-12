import type { ActionFunctionArgs } from "@remix-run/node";
import {
	Form,
	redirect,
	useActionData,
	useLoaderData,
	useNavigate,
	useNavigation
} from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { Loader2, Send, Squirrel } from "lucide-react";
import { useEffect, useState } from "react";
import { GlobalErrorBoundary } from "~/components/global-error-boundary";
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

	console.log(model, message, instruction)
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
	const availableModels = await db.select().from(modelsTable);
	if (availableModels.length === 0) {
		return redirect("/settings?state=onboarding");
	}
	return { availableModels };
}

export default function AppHome() {
	const [message, setMessage] = useState("");
	const navigation = useNavigation();
	const navigate = useNavigate();
	const { availableModels } = useLoaderData<typeof loader>();
	const defaultModel =
		availableModels.find((model) => model.isDefault === 1) ??
		availableModels[0];
	const [selectedModel, setSelectedModel] = useState({
		model: defaultModel.modelId,
		name: defaultModel.name,
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
				<Form method="post" autoComplete="off">
					<Input
						placeholder="Ask me anything..."
						value={message}
						name="message"
						disabled={navigation.state === "submitting" || availableModels.length === 0}
						onChange={(e) => setMessage(e.target.value)}
						className="h-12 rounded-xl shadow-lg dark:bg-zinc-900"
						autoFocus
					/>

					<div className="w-full flex justify-between mt-2">
						<div className="flex gap-2 items-center w-">
							<SearchableSelect
								disabled={
									navigation.state === "submitting" || availableModels.length === 0
								}
								value={selectedModel.model}
								onChange={(value) =>
									setSelectedModel({
										model: value.value,
										name: value.label,
										instruction:
											availableModels.find((m) => m.modelId === value.value)
												?.systemMessage || null,
									})
								}
								options={availableModels.map((model) => ({
									value: model.modelId,
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

						<Button
							type="submit"
							disabled={
								availableModels.length === 0 ||
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
					</div>
				</Form>
			</div>
		</div>
	);
}

export function ErrorBoundary() {
	return <GlobalErrorBoundary />;
}
