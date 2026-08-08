import "./globals.css";

export const metadata = {
  title: "Explora · materias",
  description: "Base de conocimiento interactivo por edades, de los 5 a los 17 años."
};

export default function Layout({ children }) {
  return (
    <html lang="es">
      <body><div className="shell">{children}</div></body>
    </html>
  );
}
