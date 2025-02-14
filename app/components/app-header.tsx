import { UserButton } from "@clerk/remix";
import { Link } from "@remix-run/react";
import { SidebarIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useSidebar } from "~/components/ui/sidebar";

export default function AppHeader() {
	const { toggleSidebar } = useSidebar();
	const userButtonAppearance = {
		elements: {
			userButtonAvatarBox: "w-6 h-6 mt-1",
		},
	};

	return (
		<div className="mt-1 border-b-[1px] pb-1 pl-2 w-full dark:bg-zinc-900/10 dark:backdrop-blur-sm">
			<div className="flex flex-row items-center h-full gap-2">
				<Button size={"icon"} variant={"ghost"} onClick={toggleSidebar}>
					<SidebarIcon />
				</Button>
				<div className="flex-1">
					<Link to={"/"}>
						<span className="font-bold">Squirrellm</span>
					</Link>
				</div>
				<div className="mr-4">
					<UserButton appearance={userButtonAppearance} />
				</div>
			</div>
		</div>
	);
}
