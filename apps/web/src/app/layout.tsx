import type { Metadata } from "next";
import "./globals.css";
import "../themes.css";
import "../App.css";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
	title: "TopChess",
	description: "Play chess online",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className="h-full antialiased"
		>
			<body className="min-h-full flex flex-col">
				<AppProviders>{children}</AppProviders></body>
		</html>
	);
}
