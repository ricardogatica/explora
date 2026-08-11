import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module.js";

/* El servicio que guarda el progreso.

   Detrás de nginx, que le manda /api/* y nada más. No sirve páginas ni
   archivos: si se cae, la web se sigue leyendo entera y lo único que deja de
   funcionar es guardar estadísticas. Esa separación es a propósito. */
async function arrancar() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ["log", "warn", "error"] });

  /* Un cuerpo grande aquí no tiene ningún uso legítimo: lo que se guarda son
     unos cientos de bytes. */
  app.useBodyParser("json", { limit: "16kb" });

  /* Sin CORS: la interfaz vive en el mismo dominio, detrás del mismo nginx.
     Abrirlo sería invitar a que cualquier página escriba en nuestra base. */
  /* En «::» y no en «0.0.0.0». Escuchando solo en IPv4, el servicio queda
     invisible para quien lo llame por IPv6, y la red privada de Railway resuelve
     los nombres internos a las dos familias: nginx podría resolver la dirección
     IPv6 del contenedor y encontrarse con que ahí no hay nadie escuchando. La
     doble pila acepta las dos y no cuesta nada.

     El puerto viene del entorno porque las plataformas lo imponen; 3100 es solo
     el valor para levantarlo en casa. */
  const puerto = Number(process.env.PORT ?? 3100);
  await app.listen(puerto, "::");
  new Logger("Explora").log(`Escuchando en el puerto ${puerto}`);
}

arrancar();
