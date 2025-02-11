import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { CircleAlert } from "lucide-react";

export function GlobalErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  if (isRouteErrorResponse(error)) {
    return (
      <div className="border border-red-400 p-2 rounded mt-6 bg-white/10">
        <div className="text-red-400 flex flex-row gap-2">
          <CircleAlert /> {error.statusText}
        </div>
      </div>
    );
  }

  if (error instanceof Error) {
    return (
      <div className="border border-red-400 p-2 rounded mt-6 bg-white/10">
        <div className="text-red-400 flex flex-row gap-2">
          <CircleAlert /> {error.message}
        </div>
      </div>
    );
  }

  return <div>Unknown Error</div>;
}
