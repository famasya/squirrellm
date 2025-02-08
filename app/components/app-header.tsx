import { SidebarIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useSidebar } from "~/components/ui/sidebar";

export default function AppHeader() {
  const {
    toggleSidebar,
  } = useSidebar()

  return <div className="mt-1 border-b-[1px] pb-1 pl-2 w-full">
    <div className="flex items-center h-full gap-2">
      <Button size={"icon"} variant={"ghost"} onClick={toggleSidebar}>
        <SidebarIcon />
      </Button>
      <div className="flex-1">
        <span className="font-bold">OpenRouter </span>
        <span>Chat</span>
      </div>
    </div>
  </div>;
}
