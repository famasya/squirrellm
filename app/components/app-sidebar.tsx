import { NavLink, useParams } from "@remix-run/react";
import type { InferSelectModel } from "drizzle-orm";
import { CircleEllipsis, MessageSquare, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWRInfinite from "swr/infinite";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "~/components/ui/sidebar";
import type { conversations } from "~/lib/db.schema";
import useChatStore from "~/lib/stores";
import { cn } from "~/lib/utils";
import ConversationOptions from "./conversation-options";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";

type ConversationsResponse = {
	conversations: Array<InferSelectModel<typeof conversations>>;
	cursor: string | null;
};

export default function AppSidebar() {
	const params = useParams();
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const { state } = useSidebar();
	const { refreshConversationsListKey } = useChatStore();
	const { data, isLoading, size, setSize } = useSWRInfinite(
		(index, previousPageData: ConversationsResponse["conversations"]) => {
			if (previousPageData && !previousPageData.length)
				return ["", refreshConversationsListKey];
			if (index === 0)
				return ["/api/conversations", refreshConversationsListKey];
			return [
				`/api/conversations?cursor=${nextCursor}`,
				refreshConversationsListKey,
			];
		},
		async ([url, _]) => {
			const res = await fetch(url);
			const data = (await res.json()) as ConversationsResponse;
			setNextCursor(data.cursor);
			return data.conversations;
		},
		{
			revalidateFirstPage: false,
			onError: (error) => {
				console.log(error);
				toast.error("Error loading conversations");
			},
		},
	);

	const conversations = data?.flat();
	const isActive = (id: string) => params.id === id;

	return (
		<>
			<Sidebar collapsible="icon">
				<SidebarHeader />
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton asChild>
										<NavLink to="/">
											<Plus />
											<span className="w-full">New Chat</span>
										</NavLink>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<ScrollArea className="h-full w-full">
						<SidebarGroup className={cn(state === "collapsed" && "hidden")}>
							<SidebarGroupLabel>Conversations</SidebarGroupLabel>
							<SidebarMenu>
								{isLoading
									? Array(3)
											.fill(0)
											.map((_, i) => (
												<SidebarMenuItem key={i.toString()}>
													<Skeleton className="h-6 w-full mb-2" />
												</SidebarMenuItem>
											))
									: conversations?.map((conversation) => (
											<SidebarMenuItem key={conversation.id}>
												<SidebarMenuButton asChild>
													<NavLink
														to={`/chat/${conversation.id}`}
														className={cn(
															isActive(conversation.id) &&
																"bg-sidebar-accent text-sidebar-accent-foreground",
														)}
													>
														<div className="flex flex-row gap-2 items-center w-full">
															<div>
																<MessageSquare className="w-4 h-4" />
															</div>
															<div className="w-full">
																{conversation.name.length < 24
																	? conversation.name
																	: `${conversation.name.slice(0, 24)}...`}
															</div>
														</div>
													</NavLink>
												</SidebarMenuButton>
												<ConversationOptions id={conversation.id} />
											</SidebarMenuItem>
										))}
								<SidebarMenuItem className="mt-1">
									<SidebarMenuButton
										disabled={!nextCursor}
										onClick={() => setSize(size + 1)}
									>
										<span className="w-full flex flex-row gap-2 items-center justify-center">
											{nextCursor ? (
												<>
													<CircleEllipsis className="w-4 h-4" /> Load More
												</>
											) : (
												<>{!isLoading ? "No more conversations" : null}</>
											)}
										</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroup>
					</ScrollArea>
				</SidebarContent>
				<SidebarFooter>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild>
								<NavLink to="/settings">
									<Settings />
									<span className="w-full">Settings</span>
								</NavLink>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>
		</>
	);
}
