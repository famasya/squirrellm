import { NavLink, useNavigation, useParams } from "@remix-run/react";
import type { InferSelectModel } from "drizzle-orm";
import { CircleEllipsis, MessageSquare, Plus, Settings } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
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

const AppSidebar = memo(function AppSidebar() {
	const params = useParams();
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const { state } = useSidebar();
	const navigation = useNavigation();
	const { refreshConversationsListKey } = useChatStore();

	const { data, isLoading, isValidating, size, setSize, mutate } =
		useSWRInfinite(
			(index, previousPageData: ConversationsResponse["conversations"]) => {
				if (previousPageData && !previousPageData.length) return null;
				if (index === 0) return "/api/conversations";
				return `/api/conversations?cursor=${nextCursor}`;
			},
			async (url) => {
				const res = await fetch(url);
				const data = (await res.json()) as ConversationsResponse;
				setNextCursor(data.cursor);
				return data.conversations;
			},
			{
				revalidateFirstPage: false,
				keepPreviousData: true,
				onError: (error) => {
					console.error(error);
					toast.error("Error loading conversations");
				},
			},
		);
	const { messageStatus } = useChatStore();

	// Revalidate all on navigation state or refreshConversationsListKey change
	useEffect(() => {
		if (navigation.state !== "idle" || refreshConversationsListKey) {
			mutate(undefined, {
				revalidate: true,
			});
		}
	}, [navigation.state, mutate, refreshConversationsListKey]);

	const conversations = useMemo(() => data?.flat(), [data]);

	const isActive = useCallback(
		(id: string) => params.id === id,
		[params.id]
	);

	const loadMore = useCallback(() => {
		setSize((prevSize) => prevSize + 1);
	}, [setSize]);

	return (
		<>
			<Sidebar collapsible="icon">
				<SidebarHeader />
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<NavLink to="/">
										<SidebarMenuButton disabled={messageStatus !== null}>
											<Plus />
											<span className="w-full">New Chat</span>
										</SidebarMenuButton>
									</NavLink>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>

					<ScrollArea className="h-full w-full">
						<SidebarGroup className={cn(state === "collapsed" && "hidden")}>
							<SidebarGroupLabel>Conversations</SidebarGroupLabel>
							<SidebarMenu>
								{isLoading && !isValidating
									? Array(3)
										.fill(0)
										.map((_, i) => (
											<SidebarMenuItem key={i.toString()}>
												<Skeleton className="h-6 w-full mb-2" />
											</SidebarMenuItem>
										))
									: conversations?.map((conversation) => (
										<SidebarMenuItem key={conversation.id}>
											<NavLink to={`/chat/${conversation.id}`}>
												<SidebarMenuButton
													disabled={messageStatus !== null}
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
															{conversation.name.length < 20
																? conversation.name
																: `${conversation.name.slice(0, 20)}...`}
														</div>
													</div>
												</SidebarMenuButton>
											</NavLink>
											<ConversationOptions
												disabled={messageStatus !== null}
												id={conversation.id}
											/>
										</SidebarMenuItem>
									))}
								<SidebarMenuItem className="mt-1">
									<SidebarMenuButton
										disabled={!nextCursor}
										onClick={loadMore}
									>
										<span className="w-full flex flex-row gap-2 items-center justify-center">
											{nextCursor ? (
												<>
													<CircleEllipsis className="w-4 h-4" /> Load More
												</>
											) : null}
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
});

export default memo(AppSidebar)
