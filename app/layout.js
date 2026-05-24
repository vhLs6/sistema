import "./globals.css";

export const metadata = {
  title: "Estudos",
  description: "Painel para organizar horários, trabalhos, provas, notas e faltas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
