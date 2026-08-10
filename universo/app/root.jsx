import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./estilos.css";

export function Layout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Bajo /universo/ como todo lo demás: la raíz del dominio es de materias. */}
        <link rel="icon" href="/universo/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Inter:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }) {
  /* Un objeto que no existe tiene que decirlo, no quedarse en blanco: las URL
     del universo se comparten y se teclean. */
  return (
    <main className="pagina">
      <h1>Aquí no hay nada</h1>
      <p className="subtitle">
        {error?.status === 404
          ? "Esa ficha no existe. Puede que el enlace esté mal escrito o que apunte a una versión anterior del sitio."
          : "Algo se rompió al cargar esta página."}
      </p>
      <p><a className="boton" href="/universo/indice">Ver el índice del universo</a></p>
    </main>
  );
}
