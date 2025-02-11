import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";

interface NavigationWarningDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export const NavigationWarningDialog = ({
	open,
	onOpenChange,
	onConfirm,
}: NavigationWarningDialogProps) => {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="sm:max-w-[425px]">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-lg font-semibold">
						Leave this page?
					</AlertDialogTitle>
					<AlertDialogDescription className="text-base text-neutral-600 dark:text-neutral-300">
						There are unsaved changes. Are you sure you want to leave? Your
						changes will be lost.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="mt-6">
					<AlertDialogCancel className="border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-red-500 hover:bg-red-600 transition-colors"
					>
						Leave Page
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export const useNavigationWarning = (
	shouldWarn: boolean,
	onConfirm: () => void,
	setShowDialog: (show: boolean) => void,
) => {
	const navigate = useNavigate();

	const handleBeforeUnload = useCallback(
		(event: BeforeUnloadEvent) => {
			if (shouldWarn) {
				event.preventDefault();
				return "";
			}
		},
		[shouldWarn],
	);

	useEffect(() => {
		if (shouldWarn) {
			window.addEventListener("beforeunload", handleBeforeUnload);
		}

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [shouldWarn, handleBeforeUnload]);

	const handleNavigate = useCallback(
		(to: string) => {
			if (shouldWarn) {
				setShowDialog(true);
				return false;
			}
			onConfirm();
			navigate(to);
			return true;
		},
		[shouldWarn, navigate, onConfirm, setShowDialog],
	);

	return { handleNavigate };
};
