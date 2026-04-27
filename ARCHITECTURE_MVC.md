# Arquitectura Modelo-Vista-Controlador (MVC) - FPShooter

Este proyecto ha sido refactorizado siguiendo el patrón de diseño MVC para mejorar la mantenibilidad y separar la lógica de negocio de la representación visual.

## 1. El Modelo (`src/model/GameModel.ts`)
Es el **estado de la verdad**. No contiene lógica de renderizado ni referencias al DOM.
- **Responsabilidades**:
    - Almacenar variables de estado (puntuación, posición del jugador, estado del juego).
    - Exponer métodos para modificar ese estado (`incrementShots`, `incrementKills`).
    - Notificar a los observadores cuando el estado cambia.
- **Restricciones**: Solo puede conocer tipos matemáticos básicos como `Vector3` de Three.js para cálculos de posición.

## 2. La Vista (`src/view/UIManager.ts` y `src/view/Engine.ts`)
Se encarga de **mostrar** el estado al usuario.
- **UIManager**: 
    - Se suscribe al `GameModel`. 
    - Cada vez que el modelo notifica un cambio, la UI se redibuja automáticamente.
    - No guarda copias locales del estado; siempre lee del modelo.
- **Engine**: 
    - Gestiona el renderizado 3D. Actúa como la "ventana" visual al mundo del juego.

## 3. El Controlador (`src/controller/GameManager.ts`)
Es el **orquestador**. Conecta al usuario con el sistema.
- **Responsabilidades**:
    - Capturar la entrada del usuario a través del `InputManager`.
    - Ejecutar la lógica de colisiones y física.
    - **Actualizar el Modelo**: Cuando ocurre un evento (un disparo, una colisión), el controlador invoca métodos del modelo.
    - **Coordinación**: Inicializa la escena, carga sonidos y gestiona el ciclo de vida de las entidades.

## Flujo de Datos (Ejemplo de un disparo)
1. **Entrada**: El usuario hace clic (detectado por `InputManager`).
2. **Controlador**: `GameManager` detecta el clic, crea un proyectil en el mundo 3D y llama a `model.incrementShots()`.
3. **Modelo**: El `GameModel` suma 1 al contador y notifica a todos sus suscriptores.
4. **Vista**: `UIManager` recibe la notificación y actualiza el texto en el HTML automáticamente.

## Estructura de Directorios
- `src/model/`: Contiene el estado del juego y la lógica de datos pura (`GameModel.ts`).
- `src/view/`: Contiene todo lo relacionado con la representación visual y Three.js (`Engine`, `UIManager`, `Player`, `Enemy`, `Projectile`).
- `src/controller/`: Contiene la lógica de orquestación e input (`GameManager`, `InputManager`).

---

## Mecánicas Avanzadas e Interfaz

### 1. Sistema de Audio y Silencio
- **Audio Maestro**: El `GameManager` gestiona un `AudioListener` global.
- **Atenuación 3D**: Los sonidos de los enemigos (`Enemy.ts`) usan `PositionalAudio` con un modelo de distancia `inverse`, lo que hace que el volumen disminuya de forma realista al alejarse.
- **Botón de Silencio**: Ubicado en la esquina inferior derecha, permite alternar el volumen maestro (0 o 1) a través del modelo.

### 2. Sistema de Pausa y Menú
- **Pausa (P)**: Detiene la simulación y libera el ratón automáticamente. Al reanudar, el ratón se vuelve a capturar (Pointer Lock) sin necesidad de clics adicionales.
- **Resumen (Tab)**: Muestra un panel de información y controles en español. Al abrirse, oculta el HUD principal para evitar redundancia de datos.

### 3. Pruebas Unitarias (Tests)
Las pruebas se encuentran en `src/tests/` y utilizan **Vitest**.
- **Model Tests**: Verifican que los cambios de estado notifiquen correctamente a la vista.
- **Physics Tests**: Aseguran que los proyectiles se muevan y se inicialicen correctamente.

---

## Beneficios de esta estructura
- **Escalabilidad**: Los directiorios separados permiten encontrar archivos rápidamente por su función (Datos vs Visual vs Lógica).
- **Mantenibilidad**: Los tests aseguran que cambios en el Modelo no rompan la lógica de las Vistas.
- **Experiencia de Usuario**: La integración de audio posicional y controles fluidos (sprint, pausa automática) eleva la calidad del juego.
- **Escalabilidad**: Si quieres añadir un minimapa, solo tienes que crear una nueva "Vista" que se suscriba al modelo. No tienes que tocar la lógica de disparo ni de movimiento.
- **Depuración**: Si la puntuación es incorrecta, sabes que el problema está en el Modelo o en quién lo llama (el Controlador), no en la UI.
- **Desacoplamiento**: Puedes cambiar Three.js por otro motor o cambiar el HTML por un canvas sin romper la lógica del juego.
