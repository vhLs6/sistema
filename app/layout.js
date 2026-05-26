import "./globals.css";

export const metadata = {
  title: "Estudos",
  applicationName: "Estudos",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Estudos",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  description: "Painel para organizar horários, trabalhos, provas, notas e faltas.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
