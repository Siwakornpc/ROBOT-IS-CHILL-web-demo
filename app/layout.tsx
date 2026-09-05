import { Header } from "@/components/Header";
import type { Metadata } from "next";
import "./globals.css";
import ThemeScript from '@/components/themescript';
import FontScript from '@/components/fontscript';
import { MenuProvider } from '@/components/MenuContext';
import { ThemeProvider } from "@/components/ThemeProvider";
import { FontProvider } from "@/components/FontProvider";

export const metadata: Metadata = {
    title: "Robot Is Chill Web Demo",
    description: "A free web demo of the Discord Bot: ROBOT IS CHILL in Vercel App",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full antialiased">
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0"
                />
            </head>
            <body className="min-h-full flex flex-col bg-background text-foreground">
                <ThemeScript />
                <FontScript />
                <MenuProvider>
                    <ThemeProvider>
                        <FontProvider>
                            <Header />
                            {children}
                        </FontProvider>
                    </ThemeProvider>
                </MenuProvider>
            </body>
        </html>
    );
}