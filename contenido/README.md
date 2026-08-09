# El contenido de Explora

Aquí vive lo que Explora enseña. Vive fuera de las aplicaciones a propósito: es
el activo del proyecto, y no debe quedar preso de la aplicación que hoy lo pinta.

```
contenido/
├── bandas.js            los seis tramos de edad de la ruta
├── esquema.js           qué forma tiene una pregunta, y su validador
├── paginas.js           frontmatter de las páginas
├── corregir.js          qué cuenta como acertar
├── lenguaje/
│   ├── paginas/*.md     una página = un archivo
│   └── preguntas.json
└── matematicas/
    ├── paginas/*.md
    └── preguntas.json
```

## Añadir una página

Un archivo `.md` en `contenido/<materia>/paginas/`, con su metadata en la
cabecera. No hay manifiesto que actualizar: si el archivo está, la página existe.

```markdown
---
titulo: Tilde diacrítica
materia: lenguaje
categoria: Ortografía
descripcion: Diferencia palabras iguales con funciones distintas.
bandas: [11-12]
orden: 30
---

# Tilde diacrítica

El texto, en markdown.
```

`bandas` es una lista porque una misma explicación puede servir en dos tramos.
Puede faltar: una guía general como «Cómo evaluar» no es de ninguna edad.
`orden` coloca la página dentro de su categoría, que casi nunca es alfabético.

## Añadir una pregunta

Una entrada en `contenido/<materia>/preguntas.json`. Cinco tipos:
`multiple-choice`, `fill`, `observation`, `drag-match` y `drag-order`. Dos
familias: `practica`, que explica por qué; y `diagnostico`, que nombra la
habilidad que observa y devuelve una lectura al adulto.

**El build falla si algo no cumple el contrato**, y a propósito: una pregunta
cuya respuesta no está entre sus opciones no da ningún error al cargar la
página, solo deja a un niño delante de un ejercicio que no se puede resolver.
Las reglas están en `esquema.js` y se prueban con `node --test`.

## Las bandas de edad

`5-6` · `7-8` · `9-10` · `11-12` · `13-14` · `15-17`, más `previo` para lo
anterior a los 5, que queda fuera de la progresión. Particionan: cada una empieza
donde termina la anterior, sin huecos ni solapes.

> **Las bandas de las preguntas de lenguaje son estimaciones.**
>
> Sus 17 preguntas nunca tuvieron edad, solo categoría, y las bandas que llevan
> hoy salen de un juicio sobre a qué edad se enseña cada tema —primero
> mayúsculas, luego la ortografía que se corrige leyendo, después lo que exige
> distinguir función gramatical, y al final la composición de textos—. **No están
> tomadas de las bases curriculares chilenas ni de ningún programa oficial.**
> Sirven para que la ruta tenga forma desde el primer día; conviene que alguien
> con formación en didáctica las revise.
>
> Las de matemáticas sí venían con edad y se convirtieron por solapamiento de
> años, no por opinión.

## Corregir

`corregir.js` decide qué cuenta como acertar. La regla que más pesa: **no se
quitan las tildes**. En matemáticas daría igual, pero en lenguaje la tilde es
justo lo que se pregunta, y aceptar «cancion» por «canción» enseña lo contrario
del ejercicio. Sí se perdonan mayúsculas, espacios de más y la coma decimal.

El buscador hace lo contrario y también a propósito: allí sí se ignoran las
tildes, porque escribir «acentuacion» y no encontrar nada es un castigo por
escribir rápido.
