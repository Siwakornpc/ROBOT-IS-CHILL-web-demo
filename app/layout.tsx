import { Header } from "@/components/Header";
import type { Metadata } from "next";
import {
    Nunito_Sans,
    IBM_Plex_Sans,
    Inter,
    Google_Sans,
    IBM_Plex_Mono,
    JetBrains_Mono,
    Bytesized,
    Cascadia_Code,
} from "next/font/google";
import "./globals.css";
import ThemeScript from '@/components/themescript';
import { MenuProvider } from '@/components/MenuContext';
import { ThemeProvider } from "@/components/ThemeProvider";
import FontScript from '@/components/fontscript';
import { FontProvider } from "@/components/FontProvider";
import "material-symbols";

const nunitoSans = Nunito_Sans({
    subsets: ["latin"],
    variable: "--font-nunito-sans",
});

const ibmPlexSans = IBM_Plex_Sans({
    subsets: ["latin"],
    variable: "--font-ibm-plex-sans",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const googleSans = Google_Sans({
    subsets: ["latin"],
    variable: "--font-google-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    variable: "--font-ibm-plex-mono",
    weight: "400",
});

const jetBrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains-mono",
    weight: "400",
});

const bytesized = Bytesized({
    subsets: ["latin"],
    variable: "--font-bytesized",
    weight: "400",
});

const cascadiaCode = Cascadia_Code({
    subsets: ["latin"],
    variable: "--font-cascadia-code",
    weight: "400",
});

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
        <html
            lang="en"
            className={`${[
                nunitoSans,
                ibmPlexSans,
                inter,
                googleSans,
                ibmPlexMono,
                jetBrainsMono,
                bytesized,
                cascadiaCode,
            ].map((font) => font.variable).join(" ")} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-background text-foreground">
                <ThemeScript /> <FontScript />
                <MenuProvider><ThemeProvider><FontProvider>
                    <Header />
                    {children}
                </FontProvider></ThemeProvider></MenuProvider>
            </body>
        </html>
    );
}
