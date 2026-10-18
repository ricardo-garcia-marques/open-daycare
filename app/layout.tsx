import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { KidsStoreProvider } from "@/lib/kids-store";
import { PostsStoreProvider } from "@/lib/posts-store";
import { UserProvider } from "@/lib/user-store";
import { CreatePostProvider } from "./(components)/create-post-provider";
import "./globals.css";

const fredoka = Fredoka({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-fredoka",
});

const nunito = Nunito({
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "OpenDayCare",
  description: "Guardería OpenDayCare — Sala Soles",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <KidsStoreProvider>
          <PostsStoreProvider>
            <UserProvider>
              <CreatePostProvider>{children}</CreatePostProvider>
            </UserProvider>
          </PostsStoreProvider>
        </KidsStoreProvider>
      </body>
    </html>
  );
}
