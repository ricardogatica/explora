import { Body, Controller, Get, HttpCode, Logger, Post } from "@nestjs/common";
import { BaseDeDatos } from "./base-de-datos.js";
/* El dominio es JavaScript plano y TypeScript lo lee igual (allowJs): se
   prueba con node --test como el resto de la lógica del proyecto, sin pasar
   por el compilador. */
import { validarRespuesta, validarSesion } from "../dominio/eventos.js";

/* El transporte, y nada más.

   Decidir si algo es válido es de dominio/eventos.js; escribirlo, de
   BaseDeDatos. Aquí solo se traduce entre HTTP y esas dos cosas.

   Las rutas cuelgan de /api porque así las enruta nginx, igual que /universo. */
@Controller("api")
export class ProgresoController {
  private readonly registro = new Logger(ProgresoController.name);

  constructor(private readonly base: BaseDeDatos) {}

  @Get("salud")
  async salud() {
    await this.base.viva();
    return { estado: "bien" };
  }

  @Post("sesiones")
  @HttpCode(201)
  async crearSesion(@Body() cuerpo: unknown) {
    const { sesion, errores } = validarSesion(cuerpo);
    if (errores) return { guardado: false, errores };
    await this.base.asegurarSesion(sesion.id, sesion.modo);
    return { guardado: true };
  }

  /* Devuelve 202 y no 201: esto es una estadística, no un recurso que el
     navegador vaya a leer después. La respuesta no le importa a nadie —el
     progreso que ve quien practica vive en su navegador— y lo que importa es
     que la petición no le estorbe. */
  @Post("respuestas")
  @HttpCode(202)
  async guardarRespuesta(@Body() cuerpo: unknown) {
    const { evento, errores } = validarRespuesta(cuerpo);
    if (errores) {
      /* Un 400 aquí sería lo correcto en una API pública. Esta la llama nuestra
         propia interfaz, así que un cuerpo inválido es un fallo nuestro: se
         registra para verlo y se responde que no se guardó, sin romper la
         práctica de quien está respondiendo. */
      this.registro.warn(`Respuesta descartada: ${errores.join("; ")}`);
      return { guardado: false, errores };
    }

    await this.base.asegurarSesion(evento.sesion, "local");
    await this.base.guardarRespuesta(evento);
    return { guardado: true };
  }
}
