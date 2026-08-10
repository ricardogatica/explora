import "./portal.css";
import "./globals.css";

export const metadata = {
  title: "Explora",
  description: "Base de conocimiento interactivo por edades, de los 5 a los 17 años.",
  /* Declarado, y no dejado al azar: sin esto el navegador pide /favicon.ico por
     su cuenta y se lleva un 404 en cada visita. */
  icons: { icon: "/favicon.svg" }
};

/* Las tipografías son las del portal: Bricolage para los títulos, Inter para el
   texto y IBM Plex Mono para las cifras y etiquetas. Se cargan igual que en el
   index.html original, con enlaces, en lugar de con next/font: así el CSS
   copiado sigue valiendo tal cual y las dos portadas se ven idénticas mientras
   convivan. */
export default function Layout({ children }) {
  return (
    /* suppressHydrationWarning solo en <html>: hay extensiones —Google Tag
       Assistant, gestores de contraseñas, traductores— que le añaden atributos
       antes de que React hidrate, y React lo reporta como si el HTML del
       servidor y el del cliente no coincidieran. No es cosa nuestra y no se
       puede evitar desde aquí. Se limita a esta etiqueta: dentro seguimos
       queriendo enterarnos de cualquier discrepancia de verdad. */
    <html lang="es" suppressHydrationWarning>
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
