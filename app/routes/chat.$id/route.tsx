import { Outlet } from "@remix-run/react";
import { ScrollArea } from "~/components/ui/scroll-area";
import Chatbox from "./app-chatbox";

export default function AppLayout() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 flex-1">
        <ScrollArea className="h-full overflow-y-auto mr-2">
          <Outlet />
        </ScrollArea>
      </div>
      <Chatbox />
    </div>
  );
}
