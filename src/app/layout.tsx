import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "দুরন্ত ডিজিটাল সাইন - পাটগ্রাম",
  description: "দুরন্ত ডিজিটাল সাইন - ডিজাইনে দুরন্ত, মানে অনন্য। পাটগ্রাম, লালমনিরহাট।",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🖨️</text></svg>",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body className="antialiased" style={{ background: "#f0f4f8", minHeight: "100vh" }}>
        {children}
      </body>
    </html>
  );
}
