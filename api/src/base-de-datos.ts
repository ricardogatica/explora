import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import pg from "pg";

/* El esquema, en dos tablas y sin ORM.

   Un ORM aquí sería más que lo que hay que guardar. Son dos inserciones y
   ninguna consulta compleja; lo que se gana con `pg` a secas es que el SQL de
   arriba es exactamente el que corre.

   `IF NOT EXISTS` en vez de un sistema de migraciones: mientras el esquema sea
   esto, crear la tabla al arrancar es honesto y no hay estado que reconciliar.
   En cuanto haya que cambiar una columna con datos dentro, esto se queda corto
   y tocará migraciones de verdad. */
const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS sesion (
    id          uuid PRIMARY KEY,
    modo        text        NOT NULL,
    creada_en   timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS respuesta (
    id          bigserial   PRIMARY KEY,
    sesion_id   uuid        NOT NULL REFERENCES sesion(id) ON DELETE CASCADE,
    materia     text        NOT NULL,
    banda       text        NOT NULL,
    familia     text        NOT NULL,
    pregunta    text        NOT NULL,
    correcta    boolean,
    escrito     text,
    ms          integer,
    creada_en   timestamptz NOT NULL DEFAULT now()
  );

  -- La consulta que da sentido a todo esto es «qué preguntas falla más gente».
  CREATE INDEX IF NOT EXISTS respuesta_por_pregunta ON respuesta (pregunta);
`;

@Injectable()
export class BaseDeDatos implements OnModuleInit, OnModuleDestroy {
  private readonly registro = new Logger(BaseDeDatos.name);
  private readonly grupo: pg.Pool;

  constructor() {
    this.grupo = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      // Si la base no responde, que se note pronto: quien practica no debe
      // quedarse esperando a que guardemos una estadística.
      connectionTimeoutMillis: 4000,
      max: 8
    });
  }

  async onModuleInit() {
    await this.grupo.query(ESQUEMA);
    this.registro.log("Esquema al día");
  }

  async onModuleDestroy() {
    await this.grupo.end();
  }

  /* La sesión se crea sola la primera vez que llega una respuesta suya. El
     navegador genera su uuid sin preguntar a nadie —así el progreso funciona
     con la API caída— y aquí solo se anota que existe. */
  async asegurarSesion(id: string, modo: string) {
    await this.grupo.query(
      `INSERT INTO sesion (id, modo) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [id, modo]
    );
  }

  async guardarRespuesta(evento: {
    sesion: string; materia: string; banda: string; familia: string;
    pregunta: string; correcta: boolean | null; escrito: string | null; ms: number | null;
  }) {
    await this.grupo.query(
      `INSERT INTO respuesta (sesion_id, materia, banda, familia, pregunta, correcta, escrito, ms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [evento.sesion, evento.materia, evento.banda, evento.familia,
       evento.pregunta, evento.correcta, evento.escrito, evento.ms]
    );
  }

  async viva() {
    await this.grupo.query("SELECT 1");
  }
}
