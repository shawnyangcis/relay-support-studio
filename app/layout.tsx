import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay — A more helpful kind of support",
  description:
    "Try a working website support assistant: answers with sources, thoughtful follow-ups, and a clear handoff. Built with fictional sample content.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
