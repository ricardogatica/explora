import "./portal.css";
import "./globals.css";

export const metadata = {
  title: "Explora",
  description: "Base de conocimiento interactivo por edades, de los 5 a los 17 años."
};

/* Las tipografías son las del portal: Bricolage para los títulos, Inter para el
   texto y IBM Plex Mono para las cifras y etiquetas. Se cargan igual que en el
   index.html original, con enlaces, en lugar de con next/font: así el CSS
   copiado sigue valiendo tal cual y las dos portadas se ven idénticas mientras
   convivan. */
export default function Layout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Inter:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
