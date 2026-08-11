---
titulo: Nube de puntos (diagrama de dispersión)
materia: matematicas
categoria: Datos y probabilidad
descripcion: Representar dos variables numéricas, leer la correlación y no confundirla con causa.
bandas: [15-17]
orden: 134
---

# Nube de puntos (diagrama de dispersión)

Cuando las dos variables que se cruzan son **numéricas**, la tabla de doble entrada
se queda corta y lo que sirve es dibujarlas: una en el eje horizontal, otra en el
vertical, y un punto por cada individuo.

## Un ejemplo

Horas de estudio y nota obtenida por ocho estudiantes:

| Horas | 1 | 2 | 2 | 3 | 4 | 5 | 6 | 8 |
|---|---|---|---|---|---|---|---|---|
| Nota | 3,0 | 3,8 | 4,5 | 4,2 | 5,5 | 5,8 | 6,4 | 6,8 |

Cada par es un punto: (1; 3,0), (2; 3,8) y así. Al dibujarlos se ve que la nube
sube de izquierda a derecha: a más horas, mejor nota. Los puntos no forman una recta
perfecta —el de 3 horas y 4,2 rompe la tendencia— y eso es lo normal con datos
reales.

## Qué se lee en la nube

**La dirección:**

| Tipo | Cómo se ve | Ejemplo |
|---|---|---|
| correlación positiva | la nube sube | altura y peso |
| correlación negativa | la nube baja | precio y cantidad vendida |
| sin correlación | la nube no tiene forma | número de zapato y nota en historia |

**La fuerza:** si los puntos están muy juntos alrededor de una línea imaginaria, la
correlación es fuerte; si están muy repartidos, es débil aunque haya dirección.

**Los valores atípicos:** un punto lejísimos de los demás. No se borra: se
investiga. Puede ser un error al anotar, o el dato más interesante del conjunto.

## La línea de tendencia

Es la recta que mejor se acerca a todos los puntos, y sirve para estimar valores que
no se midieron. Con la nube de arriba, alguien que estudie 7 horas debería sacar
alrededor de 6,5.

Dos límites que hay que decir siempre:

- **Solo vale dentro del rango medido.** Estimar la nota de quien estudia 40 horas
  con esta recta daría un número imposible: la nota máxima es 7.
- **Que la recta pase cerca no prueba que la relación sea recta.** Muchas relaciones
  son curvas y una recta las disimula.

## Correlación no es causa

Es lo más importante de esta página. Dos variables pueden moverse juntas por tres
razones distintas:

1. Una causa a la otra: estudiar más sube la nota.
2. Hay una tercera variable detrás: en verano se venden más helados y hay más
   ahogamientos. Los helados no ahogan a nadie; es el calor.
3. Casualidad: con suficientes variables, algunas se parecen por azar.

Una nube de puntos **nunca** distingue por sí sola cuál de las tres es. Para eso hace
falta un experimento o un argumento externo a los datos.

## Errores frecuentes

- **Deducir causa de una correlación.** El error más común y el más costoso.
- **Extrapolar fuera del rango medido.**
- **Borrar los puntos que estorban** para que la nube quede más bonita.
- **Buscar correlación en variables cualitativas.** Para color de ojos y deporte
  favorito lo que sirve es una tabla de contingencia, no una nube.
