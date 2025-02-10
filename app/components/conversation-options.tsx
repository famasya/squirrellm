import { useNavigate } from "@remix-run/react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import useChatStore from "~/lib/stores";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarMenuAction } from "./ui/sidebar";

type Props = {
	id: string;
};
export default function ConversationOptions({ id }: Props) {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const { refreshConversationsList } = useChatStore();
	const { trigger, isMutating } = useSWRMutation(
		"/api/delete-chat",
		async (key, { arg }: { arg: string }) => {
			const response = await fetch(key, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id: arg }),
			});
			return response.json();
		},
		{
			onSuccess: () => {
				toast.success("Chat deleted");
				refreshConversationsList();
				navigate("/");
			},
			onError: (error) => {
				console.log(error);
				toast.error("Error deleting chat. Please try again");
			},
		},
	);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<SidebarMenuAction>
						<MoreHorizontal />
					</SidebarMenuAction>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="right" align="start">
					<DropdownMenuItem onClick={() => setOpen(!open)}>
						<Trash2 /> Delete conversation
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete conversation?</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={isMutating}
							onClick={() => setOpen(false)}
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-red-500 hover:bg-red-600 text-white"
							disabled={isMutating}
							onClick={() => trigger(id)}
						>
							<Trash2 />
							Continue
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
