/* Las actividades que existen, por nombre.

   Esta lista está separada de los componentes a propósito: el lector de contenido
   la necesita para validar en tiempo de build que ninguna página pide una
   actividad inexistente, y ese lector no puede importar un componente de cliente
   —arrastraría React y el JSX a un módulo que corre en Node durante el build—.

   Una lista escrita a mano se desincroniza de los componentes, así que hay una
   prueba que compara esto con los archivos que hay en esta carpeta. Sin ella, un
   nombre aquí sin componente detrás sería un hueco en la página, y un componente
   sin nombre aquí sería código que nadie puede usar. */

export const NOMBRES_DE_ACTIVIDAD = ["potencias"];
