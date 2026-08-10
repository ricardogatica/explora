import { Module } from "@nestjs/common";
import { BaseDeDatos } from "./base-de-datos.js";
import { ProgresoController } from "./progreso.controller.js";

@Module({
  controllers: [ProgresoController],
  providers: [BaseDeDatos]
})
export class AppModule {}
