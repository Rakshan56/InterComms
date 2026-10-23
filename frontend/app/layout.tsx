import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "InterComms | Project clarity", description: "Turn team vision into project reality." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
