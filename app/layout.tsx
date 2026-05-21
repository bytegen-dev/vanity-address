import type { Metadata } from "next";
import { IBM_Plex_Mono, Syne } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Vanity Forge — Solana & EVM Address Generator",
  description:
    "Generate custom Solana and EVM wallet addresses with your chosen prefix, suffix, or substring. Runs entirely in your browser.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${plexMono.variable}`}>
      <body>
        {children}
        <ToastContainer
          position="bottom-right"
          autoClose={3200}
          hideProgressBar
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
          toastClassName="vanity-toast"
        />
      </body>
    </html>
  );
}
