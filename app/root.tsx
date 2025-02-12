import { ClerkApp, RedirectToSignIn, SignedIn, SignedOut } from "@clerk/remix";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import type {
	LinksFunction,
	LoaderFunction,
	MetaFunction,
} from "@remix-run/node";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import AppHeader from "./components/app-header";
import AppSidebar from "./components/app-sidebar";
import { GlobalErrorBoundary } from "./components/global-error-boundary";
import { SidebarProvider } from "./components/ui/sidebar";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import "./tailwind.css";

export const links: LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap",
	},
];
export const meta: MetaFunction = () => [
	{
		title: "OpenRouter Chat",
	},
];

export const loader: LoaderFunction = (args) => rootAuthLoader(args);

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<meta httpEquiv="content-type" content="text/html; charset=utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="dark:bg-zinc-900 min-h-screen overflow-hidden">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

function App() {
	return (
		<>
			<SignedIn>
				<SidebarProvider className="flex h-screen">
					<AppSidebar />
					<div className="flex flex-col flex-1">
						<AppHeader />
						<div className="px-3 flex-1 min-h-0 dark:bg-zinc-900 overflow-auto">
							<Toaster
								toastOptions={{
									duration: 3000,
									classNames: {
										default: "border-white/30 border-2",
										closeButton: "bg-white/30",
									},
								}}
								closeButton
							/>
							<TooltipProvider delayDuration={0}>
								<Suspense
									fallback={
										<div className="flex h-screen items-center justify-center">
											<Loader2 className="animate-spin" />
										</div>
									}
								>
									<Outlet />
								</Suspense>
							</TooltipProvider>
						</div>
					</div>
				</SidebarProvider>
			</SignedIn>
			<SignedOut>
				<RedirectToSignIn />
			</SignedOut>
		</>
	);
}

export function ErrorBoundary() {
	return <GlobalErrorBoundary />;
}

export default ClerkApp(App);
