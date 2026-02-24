import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taskly | Task CRUD + User Profile",
  description: "Taskly frontend preview for task CRUD with profile access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
