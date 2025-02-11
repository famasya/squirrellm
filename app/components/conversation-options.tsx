import { useNavigate } from "@remix-run/react";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import useChatStore from "~/lib/stores";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
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
	disabled: boolean;
};
export default function ConversationOptions({ id, disabled }: Props) {
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
				setOpen(false);
				toast.success("Chat deleted");
				refreshConversationsList();
				navigate("/");
			},
			onError: (error) => {
				console.error(error);
				toast.error("Error deleting chat. Please try again");
			},
		},
	);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger
					disabled={disabled}
					asChild
					className="cursor-default"
				>
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

			<AlertDialog open={open}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete conversation?</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						Are you sure you want to delete this conversation? This action
						cannot be undone.
					</AlertDialogDescription>
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
							{isMutating ? (
								<>
									<Loader2 className="animate-spin" /> Continue
								</>
							) : (
								<>
									<Trash2 /> Continue
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
