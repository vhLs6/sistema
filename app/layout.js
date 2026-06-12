import "./globals.css";

export const metadata = {
  title: "Challenge Rounds",
  applicationName: "Challenge Rounds",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rounds",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  description: "A group challenge game with rounds, rewards, and secret challenges.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101113",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
