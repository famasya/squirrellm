import { NavLink, useParams } from "@remix-run/react";
import { formatRelative } from "date-fns";
import type { InferSelectModel } from "drizzle-orm";
import { CircleEllipsis, MessageSquare, Plus, Settings } from "lucide-react";
import { useState } from "react";
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
  SidebarMenuItem
} from "~/components/ui/sidebar";
import type { sessions } from "~/lib/db.schema";
import { cn } from "~/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type SessionResponse = {
  sessions: Array<InferSelectModel<typeof sessions>>;
  cursor: string | null;
};

export default function AppSidebar() {
  const params = useParams();
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const { data, isLoading, size, setSize } = useSWRInfinite(
    (index, previousPageData: SessionResponse['sessions']) => {
      if (previousPageData && !previousPageData.length) return null;
      if (index === 0) return "/api/sessions"
      return `/api/sessions?cursor=${nextCursor}`;
    },
    async (url) => {
      const res = await fetch(url);
      const data = await res.json() as SessionResponse;
      setNextCursor(data.cursor);
      return data.sessions;
    },
    {
      revalidateFirstPage: false,
    })

  const sessions = data?.flat();
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

          <SidebarGroup>
            <SidebarGroupLabel>Sessions</SidebarGroupLabel>
            <SidebarMenu>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <SidebarMenuItem key={i.toString()}>
                    <Skeleton className="h-6 w-full mb-2" />
                  </SidebarMenuItem>
                ))
              ) : (
                sessions?.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <Tooltip>
                      <TooltipTrigger className="w-full">
                        <SidebarMenuButton asChild>
                          <NavLink to={`/chat/${session.id}`} className={cn(isActive(session.id) && "bg-sidebar-accent text-sidebar-accent-foreground")}>
                            <div className="flex flex-row gap-2 items-center">
                              <MessageSquare />
                              <span className="w-full">{session.name}</span>
                            </div>
                          </NavLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="ml-2">
                        {formatRelative(new Date(session.createdAt), new Date())}
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                ))
              )}
              <SidebarMenuItem className="mt-4">
                <SidebarMenuButton disabled={!nextCursor} onClick={() => setSize(size + 1)}>
                  <span className="w-full flex flex-row gap-2 items-center justify-center">
                    {nextCursor ? <><CircleEllipsis className="w-4 h-4" /> Load More</> : <>No more sessions</>}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

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
