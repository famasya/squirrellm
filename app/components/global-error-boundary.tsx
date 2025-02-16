import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { CircleAlert } from "lucide-react";
import { memo } from "react";

export const GlobalErrorBoundary = memo(function GlobalErrorBoundary() {
	const error = useRouteError();
	let errorMessage = String(error);
	if (error instanceof Error) {
		errorMessage = error.message;
	}
	if (isRouteErrorResponse(error)) {
		errorMessage = error.statusText;
	}

	return (
		<div className="w-full h-full flex flex-col justify-center items-center">
			<div className="border border-red-400 p-2 rounded mt-6 bg-white/10">
				<div className="text-red-400 flex flex-row gap-2">
					<CircleAlert /> {errorMessage}
				</div>
			</div>
		</div>
	);
});
