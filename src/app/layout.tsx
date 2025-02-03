// app/layout.tsx
"use client";

import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "../../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import "regenerator-runtime/runtime";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // If a logged-in user navigates to /login or /register, redirect to /dashboard.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && (pathname === "/login" || pathname === "/register")) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
