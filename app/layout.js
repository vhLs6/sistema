import "./globals.css";

export const metadata = {
  title: "Sistema de Login",
  description: "Login e cadastro com Next.js, React, Tailwind e SQLite",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
