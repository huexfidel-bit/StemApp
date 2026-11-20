import * as SQLite from 'expo-sqlite';

// ==========================================
// INTERFACES DE DATOS
// ==========================================

export interface Pregunta {
  id: number;
  modulo: string;
  tema: string;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
  respuesta_correcta: number; // 0: A, 1: B, 2: C, 3: D
  explicacion: string;
  respondida: number; // 0: No, 1: Sí
}

export interface Calificacion {
  id: number;
  modulo: string;
  puntaje: number;
  total_preguntas: number;
  fecha: string;
}

export interface PhishingScenario {
  id: number;
  senderName: string;
  senderEmail: string;
  subject: string;
  date: string;
  body: string;
  actionText: string;
  targetUrl: string;
  isPhishing: boolean;
  hintSender: string;
  hintUrl: string;
  hintUrgency: string;
  explanation: string;
  respondida?: number; // 0: No, 1: Sí
}

// ==========================================
// SERVICIO PRINCIPAL DE LA BASE DE DATOS
// ==========================================

class DataService {
  private dbPromise: Promise<SQLite.SQLiteDatabase>;
  private inicializada: boolean = false;

  constructor() {
    this.dbPromise = SQLite.openDatabaseAsync('estudio_app.db');
  }

  /**
   * Inicializa las tablas necesarias (preguntas, calificaciones y phishing_challenges)
   * y carga los datos por defecto si la base de datos está vacía.
   */
  async iniciaBD(): Promise<void> {
    if (this.inicializada) return;

    const db = await this.dbPromise;

    // ⚠️ LÍNEA DE REINICIO TEMPORAL: Descoméntala UNA SOLA VEZ para que se borre la tabla vieja 
    // y se carguen las preguntas y los nuevos temas en tu dispositivo. Después vuelve a comentarla.
    await db.execAsync('DROP TABLE IF EXISTS preguntas; DROP TABLE IF EXISTS phishing_challenges;');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS preguntas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modulo TEXT NOT NULL,
        tema TEXT NOT NULL,
        pregunta TEXT NOT NULL,
        opcion_a TEXT NOT NULL,
        opcion_b TEXT NOT NULL,
        opcion_c TEXT NOT NULL,
        opcion_d TEXT NOT NULL,
        respuesta_correcta INTEGER NOT NULL,
        explicacion TEXT NOT NULL,
        respondida INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS calificaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modulo TEXT NOT NULL,
        puntaje INTEGER NOT NULL,
        total_preguntas INTEGER NOT NULL,
        fecha TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS phishing_challenges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderName TEXT NOT NULL,
        senderEmail TEXT NOT NULL,
        subject TEXT NOT NULL,
        date TEXT NOT NULL,
        body TEXT NOT NULL,
        actionText TEXT NOT NULL,
        targetUrl TEXT NOT NULL,
        isPhishing INTEGER NOT NULL,
        hintSender TEXT NOT NULL,
        hintUrl TEXT NOT NULL,
        hintUrgency TEXT NOT NULL,
        explanation TEXT NOT NULL,
        respondida INTEGER DEFAULT 0
      );
    `);

    // Verificar y cargar banco de preguntas (Matemáticas e Inglés)
    const conteoPreguntas = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM preguntas;'
    );
    if (!conteoPreguntas || conteoPreguntas.total === 0) {
      await this.cargarPreguntasIniciales();
    }

    // Verificar y cargar banco de escenarios de Phishing
    const conteoPhishing = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) as total FROM phishing_challenges;'
    );
    if (!conteoPhishing || conteoPhishing.total === 0) {
      await this.cargarEscenariosPhishing();
    }

    this.inicializada = true;
  }

  // ==========================================
  // CARGA INICIAL DE PREGUNTAS
  // ==========================================

  private async cargarPreguntasIniciales(): Promise<void> {
    const db = await this.dbPromise;

    const bancoPreguntas = [
      // ------------------------------------------
      // MATEMÁTICAS - Algebra (30 PREGUNTAS)
      // ------------------------------------------
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es el valor de x en la ecuación 3x - 5 = 10?', a: 'x = 3', b: 'x = 5', c: 'x = 15', d: 'x = 2', correcta: 1, explicacion: 'Sumamos 5 a ambos lados: 3x = 15. Luego dividimos entre 3: x = 5.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Simplifica la expresión: (x²)(x³)', a: 'x⁵', b: 'x⁶', c: '2x⁵', d: 'x', correcta: 0, explicacion: 'Al multiplicar potencias con la misma base, se suman los exponentes: 2 + 3 = 5.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Factoriza el trinomio: x² - 9', a: '(x - 3)(x - 3)', b: '(x + 3)(x - 3)', c: '(x + 9)(x - 1)', d: 'x(x - 9)', correcta: 1, explicacion: 'Es una diferencia de cuadrados perfectos: a² - b² = (a + b)(a - b).' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es la pendiente de la recta y = -2x + 7?', a: '7', b: '-2', c: '2', d: '-7', correcta: 1, explicacion: 'En la forma y = mx + b, la pendiente "m" es el coeficiente de x, en este caso -2.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Si 2x + y = 10 y x = 3, ¿cuál es el valor de y?', a: '3', b: '4', c: '6', d: '7', correcta: 1, explicacion: 'Sustituyendo x=3: 2(3) + y = 10 => 6 + y = 10 => y = 4.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es la solución de x² = 49?', a: 'Solo 7', b: 'Solo -7', c: 'x = 7 y x = -7', d: 'x = 0', correcta: 2, explicacion: 'La raíz cuadrada de 49 tiene dos valores: +7 y -7, ya que (-7)² = 49.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Despeja "y" en: 4y - 8 = 0', a: 'y = 2', b: 'y = -2', c: 'y = 4', d: 'y = 8', correcta: 0, explicacion: '4y = 8 => y = 8/4 = 2.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es el valor de (2x)³ cuando x = 2?', a: '12', b: '16', c: '32', d: '64', correcta: 3, explicacion: 'Sustituyendo x=2: (2 * 2)³ = 4³ = 64.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Simplifica la expresión: 3a + 5b - a + 2b', a: '2a + 7b', b: '4a + 3b', c: '2a + 3b', d: '4a + 7b', correcta: 0, explicacion: 'Agrupando términos semejantes: (3a - a) + (5b + 2b) = 2a + 7b.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Resuelve para x: 5x + 10 = 35', a: 'x = 5', b: 'x = 7', c: 'x = 9', d: 'x = 25', correcta: 0, explicacion: 'Restamos 10 (5x = 25) y dividimos entre 5 (x = 5).' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es el desarrollo del binomio al cuadrado (a + b)²?', a: 'a² + b²', b: 'a² + 2ab + b²', c: 'a² - 2ab + b²', d: '2a + 2b', correcta: 1, explicacion: 'El cuadrado del primero, más el doble del primero por el segundo, más el cuadrado del segundo.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Desarrolla el binomio: (x - 4)²', a: 'x² - 16', b: 'x² - 8x + 16', c: 'x² + 8x + 16', d: 'x² - 4x + 16', correcta: 1, explicacion: 'Cuadrado del primero (x²), menos el doble del primero por el segundo (-8x), más el cuadrado del segundo (+16).' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es el resultado de multiplicar (x + 5)(x - 5)?', a: 'x² + 25', b: 'x² - 10x + 25', c: 'x² - 25', d: 'x² + 10x - 25', correcta: 2, explicacion: 'Producto de binomios conjugados: diferencia de cuadrados (x)² - (5)² = x² - 25.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Factoriza por factor común: 3x² + 6x', a: '3x(x + 2)', b: '3(x² + 2x)', c: 'x(3x + 6)', d: '3x(3x + 2)', correcta: 0, explicacion: 'El factor común numérico y literal es 3x, quedando 3x(x + 2).' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Resuelve el sistema de ecuaciones sencillo: x + y = 10 y x - y = 2', a: 'x = 5, y = 5', b: 'x = 6, y = 4', c: 'x = 7, y = 3', d: 'x = 8, y = 2', correcta: 1, explicacion: 'Sumando ambas ecuaciones: 2x = 12 => x = 6. Sustituyendo y = 4.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es la raíz de la ecuación lineal: -3x = 18?', a: 'x = 6', b: 'x = -6', c: 'x = -54', d: 'x = 15', correcta: 1, explicacion: 'Dividimos 18 entre -3, lo que resulta en x = -6.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Simplifica aplicando leyes de exponentes: (x⁴)³', a: 'x⁷', b: 'x¹²', c: '4x³', d: '3x⁴', correcta: 1, explicacion: 'Potencia de una potencia: los exponentes se multiplican (4 * 3 = 12).' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es el valor de x en: 7x - 3 = 4x + 9?', a: 'x = 2', b: 'x = 3', c: 'x = 4', d: 'x = 6', correcta: 1, explicacion: 'Agrupamos términos con x: 7x - 4x = 9 + 3 => 3x = 12 => x = 4.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Divide los polinomios (x² + 5x + 6) entre (x + 2):', a: 'x + 3', b: 'x - 3', c: 'x + 2', d: 'x + 6', correcta: 0, explicacion: 'Factorizando el numerador obtenemos (x + 2)(x + 3), al dividir entre (x + 2) queda (x + 3).' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Qué grado tiene el polinomio 4x⁵ - 3x² + 7x - 1?', a: 'Grado 1', b: 'Grado 2', c: 'Grado 4', d: 'Grado 5', correcta: 3, explicacion: 'El grado del polinomio lo determina el exponente mayor de la variable, que en este caso es 5.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Resuelve la desigualdad o inecuación: 2x + 4 > 10', a: 'x > 3', b: 'x < 3', c: 'x > 7', d: 'x > 5', correcta: 0, explicacion: '2x > 6 => x > 3.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es el resultado de simplificar x / x³ para x ≠ 0?', a: 'x²', b: '1 / x²', c: 'x', d: '1 / x', correcta: 1, explicacion: 'Restamos exponentes en cociente de bases iguales: 1 - 3 = -2, lo que equivale a 1/x².' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Si f(x) = x² - 3x + 2, ¿cuánto vale f(2)?', a: '0', b: '2', c: '-2', d: '4', correcta: 0, explicacion: 'Sustituyendo x = 2: (2)² - 3(2) + 2 = 4 - 6 + 2 = 0.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cómo se le llama a una expresión algebraica que consta de un solo término?', a: 'Binomio', b: 'Trinomio', c: 'Monomio', d: 'Polinomio', correcta: 2, explicacion: 'Un monomio es una expresión algebraica compuesta por un solo término.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Resuelve la ecuación con fracciones: x/2 + 3 = 7', a: 'x = 4', b: 'x = 8', c: 'x = 10', d: 'x = 2', correcta: 1, explicacion: 'x/2 = 4 => x = 4 * 2 = 8.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Factoriza por agrupación o aspa simple: x² + 5x + 6', a: '(x + 1)(x + 6)', b: '(x + 2)(x + 3)', c: '(x - 2)(x - 3)', d: '(x + 5)(x + 1)', correcta: 1, explicacion: 'Dos números que sumados den 5 y multiplicados den 6 son 2 y 3: (x + 2)(x + 3).' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es el valor numérico de 3x²y cuando x = 2 e y = -1?', a: '12', b: '-12', c: '6', d: '-6', correcta: 1, explicacion: '3(2)²(-1) = 3(4)(-1) = 12 * (-1) = -12.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es el resultado de elevar cualquier expresión diferente de cero a la potencia cero (x⁰)?', a: '0', b: '1', c: 'x', d: 'Indefinido', correcta: 1, explicacion: 'Por definición de los exponentes, todo número elevado a la cero es igual a 1.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: 'Resuelve la ecuación cuadrática incompleta: x² - 16 = 0', a: 'x = 4', b: 'x = -4', c: 'x = 4 y x = -4', d: 'No tiene solución', correcta: 2, explicacion: 'x² = 16 => x = ±√16, por lo que las raíces son 4 y -4.' },
      { modulo: 'matematicas', tema: 'Algebra', pregunta: '¿Cuál es el inverso aditivo de -5x + 3?', a: '5x - 3', b: '-5x - 3', c: '5x + 3', d: '-3x + 5', correcta: 0, explicacion: 'El inverso aditivo cambia de signo a todos los términos de la expresión: 5x - 3.' },

      // ------------------------------------------
      // MATEMÁTICAS - Geometria (30 PREGUNTAS)
      // ------------------------------------------
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el área de un cuadrado cuyo lado mide 5 cm?', a: '20 cm²', b: '25 cm²', c: '10 cm²', d: '30 cm²', correcta: 1, explicacion: 'El área del cuadrado se calcula elevando el lado al cuadrado: 5 * 5 = 25.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el perímetro de un rectángulo de base 8 cm y altura 3 cm?', a: '24 cm', b: '11 cm', c: '22 cm', d: '48 cm', correcta: 2, explicacion: 'El perímetro es la suma de todos los lados: 2(8 + 3) = 22 cm.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuánto suman los ángulos internos de cualquier triángulo?', a: '90°', b: '180°', c: '360°', d: '270°', correcta: 1, explicacion: 'Por teorema fundamental de la geometría, la suma de los ángulos internos de un triángulo es siempre 180°.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el volumen de un cubo con arista de 3 cm?', a: '9 cm³', b: '18 cm³', c: '27 cm³', d: '12 cm³', correcta: 2, explicacion: 'El volumen del cubo es arista al cubo: 3³ = 3 * 3 * 3 = 27 cm³.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cómo se le llama a la cuerda que pasa por el centro de un círculo?', a: 'Radio', b: 'Diámetro', c: 'Tangente', d: 'Arco', correcta: 1, explicacion: 'El diámetro es la cuerda máxima que pasa exactamente por el centro de la circunferencia.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el área de un triángulo con base 10 cm y altura 6 cm?', a: '60 cm²', b: '30 cm²', c: '15 cm²', d: '20 cm²', correcta: 1, explicacion: 'El área del triángulo es (base * altura) / 2 => (10 * 6) / 2 = 30 cm².' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cómo se le llama a un triángulo que tiene sus tres lados iguales?', a: 'Isósceles', b: 'Escaleno', c: 'Equilátero', d: 'Rectángulo', correcta: 2, explicacion: 'Un triángulo equilátero se caracteriza por tener sus tres lados y tres ángulos iguales.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es la medida de cada ángulo interno de un triángulo equilátero?', a: '45°', b: '60°', c: '90°', d: '120°', correcta: 1, explicacion: 'Como los 3 ángulos son iguales y suman 180°, se divide 180 / 3 = 60°.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el área de un círculo con radio de 4 cm (usa π ≈ 3.14)?', a: '25.12 cm²', b: '50.24 cm²', c: '12.56 cm²', d: '100.48 cm²', correcta: 1, explicacion: 'El área del círculo es π * r² => 3.14 * (4)² = 3.14 * 16 = 50.24 cm².' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cómo se le llama a un polígono de 5 lados?', a: 'Hexágono', b: 'Pentágono', c: 'Heptágono', d: 'Cuadrilátero', correcta: 1, explicacion: 'Un polígono de 5 lados y 5 ángulos recibe el nombre de pentágono.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es la suma de los ángulos internos de un cuadrilátero (como un rectángulo o cuadrado)?', a: '180°', b: '270°', c: '360°', d: '540°', correcta: 2, explicacion: 'Cualquier cuadrilátero puede dividirse en dos triángulos, por lo que suma 2 * 180° = 360°.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Qué nombre recibe un ángulo que mide más de 90° y menos de 180°?', a: 'Ángulo recto', b: 'Ángulo agudo', c: 'Ángulo obtuso', d: 'Ángulo llano', correcta: 2, explicacion: 'Los ángulos mayores a 90° y menores a 180° se denominan obtusos.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el perímetro de un círculo (circunferencia) con diámetro de 10 cm (π ≈ 3.14)?', a: '31.4 cm', b: '15.7 cm', c: '62.8 cm', d: '78.5 cm', correcta: 0, explicacion: 'La longitud de la circunferencia es π * diámetro => 3.14 * 10 = 31.4 cm.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cómo se le llama a dos líneas que nunca se cruzan por más que se prolonguen?', a: 'Perpendiculares', b: 'Secantes', c: 'Paralelas', d: 'Convergentes', correcta: 2, explicacion: 'Las líneas paralelas mantienen siempre la misma distancia y jamás se intersectan.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el área de un trapecio con base mayor B = 8 cm, base menor b = 4 cm y altura h = 5 cm?', a: '60 cm²', b: '30 cm²', c: '20 cm²', d: '40 cm²', correcta: 1, explicacion: 'Área = ((B + b) * h) / 2 => ((8 + 4) * 5) / 2 = (12 * 5) / 2 = 30 cm².' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuánto mide un ángulo recto?', a: '45°', b: '90°', c: '180°', d: '360°', correcta: 1, explicacion: 'Por definición geométrica, un ángulo recto mide exactamente 90 grados.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cómo se le llama a un triángulo que tiene dos lados iguales y uno desigual?', a: 'Equilátero', b: 'Escaleno', c: 'Isósceles', d: 'Rectángulo', correcta: 2, explicacion: 'El triángulo isósceles se define por tener dos lados de igual longitud y uno diferente.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el volumen de un cilindro con radio r = 3 cm y altura h = 10 cm (π ≈ 3.14)?', a: '282.6 cm³', b: '94.2 cm³', c: '188.4 cm³', d: '47.1 cm³', correcta: 0, explicacion: 'Volumen = π * r² * h => 3.14 * (3)² * 10 = 3.14 * 9 * 10 = 282.6 cm³.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Qué es una línea tangente a una circunferencia?', a: 'Una línea que la cruza en dos puntos', b: 'Una línea que pasa por el centro', c: 'Una línea que la toca en un solo punto exacto', d: 'Una línea exterior sin relación', correcta: 2, explicacion: 'La tangente es una recta coplanar que toca a la curva en un único punto (punto de tangencia).' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cómo se le llama a un polígono de 6 lados?', a: 'Pentágono', b: 'Hexágono', c: 'Heptágono', d: 'Octágono', correcta: 1, explicacion: 'Un polígono regular o irregular de seis lados se llama hexágono.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: 'Si dos ángulos suman 90°, ¿cómo se les denomina?', a: 'Suplementarios', b: 'Complementarios', c: 'Adyacentes', d: 'Opuestos', correcta: 1, explicacion: 'Dos ángulos son complementarios si la suma de sus medidas es exactamente 90°.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: 'Si dos ángulos suman 180°, ¿cómo se les denomina?', a: 'Complementarios', b: 'Suplementarios', c: 'Agudos', d: 'Rectos', correcta: 1, explicacion: 'Dos ángulos son suplementarios si suman entre ambos 180°.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el área de un rombo cuyas diagonales miden D = 10 cm y d = 6 cm?', a: '60 cm²', b: '30 cm²', c: '15 cm²', d: '16 cm²', correcta: 1, explicacion: 'Área del rombo = (D * d) / 2 => (10 * 6) / 2 = 30 cm².' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cómo se le llama a un triángulo que tiene sus tres lados de diferentes longitudes?', a: 'Equilátero', b: 'Isósceles', c: 'Escaleno', d: 'Regular', correcta: 2, explicacion: 'Un triángulo escaleno carece de lados iguales; todos sus lados y ángulos son diferentes.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el volumen de una esfera con radio r = 3 cm (Fórmula: V = (4/3)πr³, usa π ≈ 3.14)?', a: '113.04 cm³', b: '37.68 cm³', c: '84.78 cm³', d: '28.26 cm³', correcta: 0, explicacion: 'V = (4/3) * 3.14 * (3)³ = (4/3) * 3.14 * 27 = 4 * 3.14 * 9 = 113.04 cm³.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Qué nombre recibe el segmento que une dos vértices no consecutivos en un polígono?', a: 'Radio', b: 'Diagonal', c: 'Secante', d: 'Apotema', correcta: 1, explicacion: 'La diagonal es el segmento de recta que conecta dos vértices no adyacentes de un polígono.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el perímetro de un romboide cuyos lados adyacentes miden 7 cm y 4 cm?', a: '28 cm', b: '11 cm', c: '22 cm', d: '14 cm', correcta: 2, explicacion: 'El perímetro es la suma de sus 4 lados: 2(7 + 4) = 22 cm.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cómo se le llama al ángulo que mide menos de 90°?', a: 'Ángulo obtuso', b: 'Ángulo recto', c: 'Ángulo agudo', d: 'Ángulo llano', correcta: 2, explicacion: 'Un ángulo agudo es aquel cuya amplitud es menor a 90°.' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuál es el área de un paralelogramo de base 9 cm y altura 4 cm?', a: '13 cm²', b: '36 cm²', c: '18 cm²', d: '26 cm²', correcta: 1, explicacion: 'Área del paralelogramo = base * altura => 9 * 4 = 36 cm².' },
      { modulo: 'matematicas', tema: 'Geometria', pregunta: '¿Cuánto mide un ángulo llano o plano?', a: '90°', b: '180°', c: '270°', d: '360°', correcta: 1, explicacion: 'Un ángulo llano se extiende en línea recta y mide exactamente 180°.' },

      // ------------------------------------------
      // MATEMÁTICAS - Trigonometría (30 PREGUNTAS)
      // ------------------------------------------
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿A qué razón trigonométrica equivale el cateto opuesto dividido entre la hipotenusa?', a: 'Seno', b: 'Coseno', c: 'Tangente', d: 'Cotangente', correcta: 0, explicacion: 'Por definición, el seno de un ángulo es la razón entre el cateto opuesto y la hipotenusa (sen θ = CO / H).' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el valor exacto de sen(90°)?', a: '0', b: '1', c: '-1', d: '0.5', correcta: 1, explicacion: 'En el círculo unitario, el punto a 90° tiene coordenada y = 1, por lo que sen(90°) = 1.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cómo se define la tangente de un ángulo en un triángulo rectángulo?', a: 'Adyacente / Opuesto', b: 'Opuesto / Adyacente', c: 'Opuesto / Hipotenusa', d: 'Adyacente / Hipotenusa', correcta: 1, explicacion: 'La tangente es la razón entre el cateto opuesto y el cateto adyacente (tan θ = CO / CA).' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el valor de cos(0°)?', a: '0', b: '1', c: '-1', d: 'Indefinido', correcta: 1, explicacion: 'En el círculo unitario, para un ángulo de 0° la coordenada x vale 1, por lo que cos(0°) = 1.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: 'Si en un triángulo rectángulo los catetos miden 3 y 4 cm, ¿cuánto mide la hipotenusa?', a: '5 cm', b: '7 cm', c: '6 cm', d: '25 cm', correcta: 0, explicacion: 'Por el Teorema de Pitágoras: h = √(3² + 4²) = √(9 + 16) = √25 = 5 cm.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿A cuántos radianes equivalen 180°?', a: 'π/2 rad', b: 'π rad', c: '2π rad', d: '3π/2 rad', correcta: 1, explicacion: 'La equivalencia fundamental entre grados y radianes establece que 180° = π radianes.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es la razón recíproca o inversa del Coseno?', a: 'Cosecante', b: 'Secante', c: 'Cotangente', d: 'Seno', correcta: 1, explicacion: 'La secante es el inverso multiplicativo del coseno (sec θ = 1 / cos θ).' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el valor de tan(45°)?', a: '0', b: '0.5', c: '1', d: '√3', correcta: 2, explicacion: 'En un triángulo rectángulo isósceles de 45°, el cateto opuesto y el adyacente miden lo mismo, por lo que CO/CA = 1.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es la identidad pitagórica fundamental?', a: 'sen²θ - cos²θ = 1', b: 'sen²θ + cos²θ = 1', c: 'tan²θ + 1 = sen²θ', d: 'senθ + cosθ = 1', correcta: 1, explicacion: 'La identidad trigonométrica fundamental en la unidad de círculo es sen²(θ) + cos²(θ) = 1.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es la razón recíproca del Seno?', a: 'Secante', b: 'Cosecante', c: 'Cotangente', d: 'Tangente', correcta: 1, explicacion: 'La cosecante es el inverso multiplicativo del seno (csc θ = 1 / sen θ).' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿A cuántos grados sexagesimales equivale un ángulo de π/2 radianes?', a: '45°', b: '90°', c: '180°', d: '270°', correcta: 1, explicacion: 'Sustituyendo π = 180°: 180° / 2 = 90°.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el valor de sen(30°)?', a: '0.5 (1/2)', b: '√3/2', c: '1', d: '0', correcta: 0, explicacion: 'En un triángulo notable 30°-60°-90°, el cateto opuesto a 30° es la mitad de la hipotenusa, por lo tanto sen(30°) = 1/2.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el valor de cos(60°)?', a: '0.5 (1/2)', b: '√3/2', c: '1', d: '0', correcta: 0, explicacion: 'El cos(60°) es igual al sen(30°), por lo tanto su valor es 1/2 o 0.5.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿A qué equivale tan(θ) expresada en función de seno y coseno?', a: 'cos(θ) / sen(θ)', b: 'sen(θ) / cos(θ)', c: '1 / (sen(θ)cos(θ))', d: 'sen(θ) * cos(θ)', correcta: 1, explicacion: 'La identidad por cociente establece que tan(θ) = sen(θ) / cos(θ).' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿En qué cuadrante el Seno y el Coseno son ambos positivos?', a: 'Primer Cuadrante (I)', b: 'Segundo Cuadrante (II)', c: 'Tercer Cuadrante (III)', d: 'Cuarto Cuadrante (IV)', correcta: 0, explicacion: 'En el primer cuadrante (0° a 90°), tanto las coordenadas x (coseno) como y (seno) son positivas.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el valor de sen(180°)?', a: '1', b: '-1', c: '0', d: 'Indefinido', correcta: 2, explicacion: 'A 180°, sobre la circunferencia unitaria, la coordenada vertical y es 0.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Qué ley trigonométrica se usa para resolver cualquier triángulo relacionando sus lados con los senos de los ángulos opuestos?', a: 'Ley de los Cosenos', b: 'Ley de los Senos', c: 'Teorema de Pitágoras', d: 'Ley de Tangentes', correcta: 1, explicacion: 'La Ley de los Senos establece que a / sen(A) = b / sen(B) = c / sen(C).' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el periodo de las funciones sen(x) y cos(x)?', a: 'π (180°)', b: '2π (360°)', c: 'π/2 (90°)', d: '4π (720°)', correcta: 1, explicacion: 'Las funciones Seno y Coseno repiten su gráfica completa cada 2π radianes (360°).' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el valor de cos(90°)?', a: '1', b: '0', c: '-1', d: '0.5', correcta: 1, explicacion: 'A 90°, sobre la circunferencia unitaria, la coordenada horizontal x es igual a 0.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿A cuántos grados equivalen 2π radianes?', a: '180°', b: '360°', c: '90°', d: '540°', correcta: 1, explicacion: 'Una vuelta completa a la circunferencia equivale a 2π radianes o 360°.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cómo se define la cotangente de un ángulo en un triángulo rectángulo?', a: 'Opuesto / Adyacente', b: 'Adyacente / Opuesto', c: 'Hipotenusa / Opuesto', d: 'Hipotenusa / Adyacente', correcta: 1, explicacion: 'La cotangente es la razón recíproca de la tangente: cot(θ) = Adyacente / Opuesto.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿En qué cuadrante el Coseno es negativo y el Seno es positivo?', a: 'Primer Cuadrante (I)', b: 'Segundo Cuadrante (II)', c: 'Tercer Cuadrante (III)', d: 'Cuarto Cuadrante (IV)', correcta: 1, explicacion: 'En el II cuadrante (90° a 180°), la x (coseno) es negativa y la y (seno) es positiva.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es la fórmula de la Ley de los Cosenos para encontrar el lado c?', a: 'c² = a² + b²', b: 'c² = a² + b² - 2ab cos(C)', c: 'c² = a² + b² + 2ab sen(C)', d: 'c = a + b - cos(C)', correcta: 1, explicacion: 'La Ley de los Cosenos generaliza el teorema de Pitágoras: c² = a² + b² - 2ab cos(C).' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el valor de tan(0°)?', a: '0', b: '1', c: 'Indefinido', d: '-1', correcta: 0, explicacion: 'tan(0°) = sen(0°)/cos(0°) = 0 / 1 = 0.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿A cuántos radianes equivalen 60°?', a: 'π/6 rad', b: 'π/4 rad', c: 'π/3 rad', d: 'π/2 rad', correcta: 2, explicacion: 'Convertimos a radianes: 60° * (π / 180°) = 60π / 180 = π/3 rad.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el dominio de amplitud para sen(x) y cos(x)?', a: '[-1, 1]', b: '[0, 1]', c: '[-∞, ∞]', d: '[0, ∞]', correcta: 0, explicacion: 'Los valores de salida de sen(x) y cos(x) oscilan estrictamente entre -1 y 1.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Qué sucede con tan(90°)?', a: 'Vale 0', b: 'Vale 1', c: 'Es indefinido (tiende al infinito)', d: 'Vale -1', correcta: 2, explicacion: 'tan(90°) = sen(90°)/cos(90°) = 1 / 0. La división entre cero no está definida.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el valor de cos(180°)?', a: '1', b: '0', c: '-1', d: '0.5', correcta: 2, explicacion: 'A 180°, en el eje x negativo del círculo unitario, cos(180°) = -1.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿Cuál es el ángulo de referencia si tenemos un ángulo de 150° en el segundo cuadrante?', a: '30°', b: '60°', c: '45°', d: '15°', correcta: 0, explicacion: 'El ángulo de referencia en el II cuadrante es 180° - θ => 180° - 150° = 30°.' },
      { modulo: 'matematicas', tema: 'Trigonometria', pregunta: '¿A cuántos radianes equivalen 45°?', a: 'π/3 rad', b: 'π/4 rad', c: 'π/6 rad', d: 'π/2 rad', correcta: 1, explicacion: 'Convertimos a radianes: 45° * (π / 180°) = 45π / 180 = π/4 rad.' },

      // ------------------------------------------
      // MATEMÁTICAS - Cálculo Diferencial (30 PREGUNTAS)
      // ------------------------------------------
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de la función constante f(x) = c?', a: 'c', b: '1', c: '0', d: 'x', correcta: 2, explicacion: 'La derivada de cualquier número constante es siempre cero, ya que no experimenta cambios.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = x²', a: '2x', b: 'x', c: '2', d: 'x²', correcta: 0, explicacion: 'Aplicando la regla de la potencia (d/dx xⁿ = n·xⁿ⁻¹): 2·x^(2-1) = 2x.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = 5x?', a: '0', b: 'x', c: '5', d: '5x', correcta: 2, explicacion: 'La derivada de un término lineal ax es simplemente su coeficiente a, es decir, 5.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: 'Calcula el límite: lim (x → 2) de (3x + 1)', a: '5', b: '7', c: '6', d: '3', correcta: 1, explicacion: 'Sustituyendo directamente x = 2 en la expresión: 3(2) + 1 = 6 + 1 = 7.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la integral indefinida de f(x) = 1 dx (o ∫ dx)?', a: '0', b: 'x + C', c: '1 + C', d: 'x²', correcta: 1, explicacion: 'La integral de una diferencial es la variable de integración más la constante de integración C.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = x³?', a: '3x²', b: 'x²', c: '3x', d: '6x', correcta: 0, explicacion: 'Usando la regla de la potencia: 3 · x^(3-1) = 3x².' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Qué representa geométricamente la derivada de una función en un punto específico?', a: 'El área bajo la curva', b: 'La pendiente de la recta tangente', c: 'El volumen del sólido de revolución', d: 'La intersección con el eje y', correcta: 1, explicacion: 'La derivada mide la pendiente o la tasa de cambio instantánea de la curva en ese punto.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = sin(x)?', a: 'cos(x)', b: '-cos(x)', c: 'sin(x)', d: '-sin(x)', correcta: 0, explicacion: 'Por las reglas de derivación trigonométrica estándar, la derivada del seno es el coseno.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = e^x?', a: 'xe^(x-1)', b: 'e^x', c: '1/x', d: '0', correcta: 1, explicacion: 'La función exponencial natural e^x es única porque es su propia derivada.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = 4x³ - 2x?', a: '12x² - 2', b: '4x² - 2', c: '12x - 2', d: '12x² - 2x', correcta: 0, explicacion: 'Derivamos término a término aplicando la regla de la suma/resta: 4(3x²) - 2(1) = 12x² - 2.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = cos(x)?', a: 'sin(x)', b: '-sin(x)', c: 'cos(x)', d: '-cos(x)', correcta: 1, explicacion: 'La derivada de la función coseno es el negativo de la función seno: -sin(x).' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = ln(x) para x > 0?', a: 'e^x', b: '1/x', c: 'x', d: 'ln(x)', correcta: 1, explicacion: 'La derivada del logaritmo natural de x es su recíproco, 1/x.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Qué regla se utiliza para derivar el producto de dos funciones f(x) · g(x)?', a: 'Regla del cociente', b: 'Regla de la cadena', c: 'Regla del producto', d: 'Regla de la potencia', correcta: 2, explicacion: 'La regla del producto establece que (f·g)\' = f\'g + fg\'.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Qué regla se utiliza para derivar una función compuesta f(g(x))?', a: 'Regla del producto', b: 'Regla de la cadena', c: 'Regla del cociente', d: 'Regla lineal', correcta: 1, explicacion: 'La regla de la cadena permite derivar funciones compuestas multiplicando la derivada externa por la interna.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = 7x⁴ - 5x² + 3?', a: '28x³ - 10x', b: '28x³ - 10x + 3', c: '7x³ - 5x', d: '28x - 10', correcta: 0, explicacion: 'Derivamos cada término: 7(4x³) - 5(2x) + 0 = 28x³ - 10x.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: 'Calcula el límite: lim (x → 0) de (sin(x) / x)', a: '0', b: '1', c: 'Indefinido', d: '-1', correcta: 1, explicacion: 'Es un límite trigonométrico notable fundamental que por L\'Hôpital o geometría resulta ser 1.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la segunda derivada de f(x) = x³?', a: '3x²', b: '6x', c: '6', d: '0', correcta: 1, explicacion: 'Primera derivada: 3x². Segunda derivada (derivar de nuevo): 3(2x) = 6x.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cómo se le llama al punto donde la derivada de una función es igual a cero (f\'(x) = 0)?', a: 'Punto de inflexión', b: 'Punto crítico', c: 'Asíntota', d: 'Raíz', correcta: 1, explicacion: 'Un punto crítico es aquel en el que la derivada es cero o no está definida, candidatos a máximos o mínimos.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = tan(x)?', a: 'sec²(x)', b: 'csc²(x)', c: 'cot²(x)', d: '-sec²(x)', correcta: 0, explicacion: 'La derivada de la función tangente es la secante al cuadrado: sec²(x).' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: 'Si la posición de un objeto está dada por una función s(t), ¿qué representa su primera derivada s\'(t)?', a: 'La aceleración', b: 'La velocidad', c: 'El jerk', d: 'La distancia total', correcta: 1, explicacion: 'La derivada de la posición con respecto al tiempo es la velocidad instantánea.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: 'Si la velocidad de un objeto está dada por v(t), ¿qué representa su derivada v\'(t)?', a: 'La posición', b: 'La velocidad media', c: 'La aceleración', d: 'El desplazamiento', correcta: 2, explicacion: 'La derivada de la velocidad con respecto al tiempo define la aceleración instantánea.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = 1/x (o x⁻¹)?', a: '-1/x²', b: '1/x²', c: '-1/x', d: 'ln(x)', correcta: 0, explicacion: 'Aplicando regla de la potencia para x⁻¹: -1·x^(-1-1) = -1·x⁻² = -1/x².' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = √x (o x^(1/2))?', a: '1 / (2√x)', b: '2√x', c: '1 / √x', d: '√x / 2', correcta: 0, explicacion: 'Regla de la potencia: (1/2)x^(-1/2) = 1 / (2x^(1/2)) = 1 / (2√x).' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Qué indica el criterio de la segunda derivada si f\'\'(x) < 0 en un punto crítico?', a: 'Que hay un mínimo local', b: 'Que hay un máximo local', c: 'Que no se puede determinar', d: 'Que hay un punto de inflexión', correcta: 1, explicacion: 'Una segunda derivada negativa indica que la curva es cóncava hacia abajo, por lo que hay un máximo local.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = 2^x?', a: '2^x', b: '2^x · ln(2)', c: 'x · 2^(x-1)', d: '2^x / ln(2)', correcta: 1, explicacion: 'La derivada de una función exponencial a^x es a^x · ln(a), por lo que para 2^x es 2^x · ln(2).' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Qué regla matemática se aplica para evaluar límites que resultan en formas indeterminadas como 0/0 o ∞/∞?', a: 'Regla de L\'Hôpital', b: 'Regla de Cramer', c: 'Teorema de Bayes', d: 'Regla de Ruffini', correcta: 0, explicacion: 'La regla de L\'Hôpital permite calcular límites indeterminados derivando el numerador y denominador por separado.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de f(x) = 3x⁵ - 2x³ + x?', a: '15x⁴ - 6x²', b: '15x⁴ - 6x² + 1', c: '3x⁴ - 2x² + 1', d: '15x⁵ - 6x³', correcta: 1, explicacion: 'Derivamos término a término: 3(5x⁴) - 2(3x²) + 1 = 15x⁴ - 6x² + 1.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la tercera derivada de f(x) = 2x³?', a: '6x', b: '12x', c: '12', d: '0', correcta: 2, explicacion: '1ª deriv: 6x². 2ª deriv: 12x. 3ª deriv: 12.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cómo se le llama a la línea que se aproxima continuamente a la gráfica de una función sin llegar a tocarla?', a: 'Tangente', b: 'Secante', c: 'Asíntota', d: 'Directriz', correcta: 2, explicacion: 'Una asíntota es una recta hacia la cual la función tiende a acercarse indefinidamente a medida que crece o decrece.' },
      { modulo: 'matematicas', tema: 'Calculo Diferencial', pregunta: '¿Cuál es la derivada de la función f(x) = ln(3x)?', a: '1/x', b: '3/x', c: '1/(3x)', d: '3', correcta: 0, explicacion: 'Por propiedades de logaritmos ln(3x) = ln(3) + ln(x). Su derivada es 0 + 1/x = 1/x (o aplicando regla de la cadena: (1/3x)·3 = 1/x).' },

      // ------------------------------------------
      // INGLÉS - Fundamentos y Tiempos Verbales Básicos
      // ------------------------------------------
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete the sentence: "She _____ to the university every morning by bus."', a: 'go', b: 'goes', c: 'going', d: 'is go', correcta: 1, explicacion: 'En Presente Simple, para terceras personas del singular (he, she, it) se agrega "-es" al verbo "go" -> "goes".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Which sentence is correctly written in the Simple Past tense?', a: 'They didn’t went to the party.', b: 'They not went to the party.', c: 'They didn’t go to the party.', d: 'They don’t went to the party.', correcta: 2, explicacion: 'En negaciones en Pasado Simple se usa el auxiliar "didn’t" seguido del verbo principal en su forma base ("go").' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Choose the correct form of the verb "to be": "My brother and I _____ very excited about the trip."', a: 'am', b: 'is', c: 'are', d: 'be', correcta: 2, explicacion: '"My brother and I" equivale al pronombre plural "we" (nosotros), por lo que corresponde "are".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'What is the correct question form in Present Continuous? "_____ right now?"', a: 'Are you studying', b: 'Do you studying', c: 'You are studying', d: 'Is you studying', correcta: 0, explicacion: 'Para preguntas en Presente Continuo se invierte el verbo "to be" y el sujeto: "Are + you + verbo con -ing".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Select the right preposition of time: "The meeting starts _____ 9:30 AM _____ Monday."', a: 'in / on', b: 'at / on', c: 'on / at', d: 'at / in', correcta: 1, explicacion: 'Se utiliza "at" para horas exactas (at 9:30 AM) y "on" para días de la semana (on Monday).' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'What is the plural form of "child"?', a: 'childs', b: 'children', c: 'childes', d: 'childrens', correcta: 1, explicacion: 'El plural de "child" es irregular y se escribe "children".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete the sentence with the correct possessive adjective: "Maria lost _____ keys yesterday."', a: 'his', b: 'her', c: 'their', d: 'our', correcta: 1, explicacion: 'Para el sujeto femenino singular (Maria / she) el adjetivo posesivo correspondiente es "her".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Choose the correct option for Future with "Going to": "We _____ build a mobile application next semester."', a: 'is going to', b: 'am going to', c: 'are going to', d: 'going to', correcta: 2, explicacion: 'El pronombre "We" (nosotros) utiliza el auxiliar del verbo to be en plural: "are going to".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Which sentence is in the Simple Present negative form?', a: 'He doesn’t like coffee.', b: 'He don’t like coffee.', c: 'He not like coffee.', d: 'He no likes coffee.', correcta: 0, explicacion: 'Para la tercera persona del singular (he) en negativa se usa "doesn’t" y el verbo regresa a su forma base ("like").' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Identify the correct Past Simple of the irregular verb "eat":', a: 'eated', b: 'ate', c: 'aten', d: 'eating', correcta: 1, explicacion: 'El pasado simple del verbo irregular "eat" es "ate".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete the sentence: "Look! The cat _____ on the roof."', a: 'sleep', b: 'sleeps', c: 'is sleeping', d: 'are sleeping', correcta: 2, explicacion: 'La palabra "Look!" indica una acción que ocurre en el momento exacto (Presente Continuo: "is sleeping").' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Which indefinite article is correct before a word starting with a vowel sound? "I need _____ apple."', a: 'a', b: 'an', c: 'the', d: 'some', correcta: 1, explicacion: 'Se utiliza el artículo indefinido "an" antes de palabras que empiezan con sonido de vocal ("apple").' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Choose the correct pronoun: "_____ am studying computer science at university."', a: 'He', b: 'She', c: 'I', d: 'They', correcta: 2, explicacion: 'El verbo "am" se usa exclusivamente con el pronombre personal "I".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'What is the past form of the verb "to be" (is/am)?', a: 'were', b: 'was', c: 'been', d: 'are', correcta: 1, explicacion: 'Para el singular (I, he, she, it) el pasado del verbo to be es "was".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete the question: "_____ do you live? - I live in Mérida."', a: 'What', b: 'When', c: 'Where', d: 'Who', correcta: 2, explicacion: '"Where" se utiliza para preguntar por lugares o ubicaciones.' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Choose the correct plural form of "box":', a: 'boxs', b: 'boxes', c: 'boxesies', d: 'box', correcta: 1, explicacion: 'Los sustantivos que terminan en -x forman su plural añadiendo "-es" ("boxes").' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete with the correct demonstrative pronoun: "_____ books over there are mine."', a: 'This', b: 'That', c: 'These', d: 'Those', correcta: 3, explicacion: 'Se utiliza "Those" para objetos plurales que están lejos ("over there").' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Which sentence is a correct affirmative statement in Simple Past?', a: 'They played video games yesterday.', b: 'They playes video games yesterday.', c: 'They playing video games yesterday.', d: 'They plays video games yesterday.', correcta: 0, explicacion: 'Los verbos regulares en pasado simple añaden la terminación "-ed" ("played").' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Select the correct modal verb for ability: "A robot _____ compute data very fast."', a: 'can', b: 'must', c: 'should', d: 'is', correcta: 0, explicacion: '"Can" se utiliza para expresar habilidad o capacidad presente.' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete the sentence: "There _____ three computers in the laboratory."', a: 'is', b: 'are', c: 'am', d: 'be', correcta: 1, explicacion: 'Para sustantivos plurales ("three computers") se utiliza la forma "There are".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'What is the correct negative form of "They are ready"?', a: 'They are not ready.', b: 'They aren’t be ready.', c: 'They not are ready.', d: 'They is not ready.', correcta: 0, explicacion: 'La negación del verbo to be se forma añadiendo "not" después del verbo (o usando la contracción "aren\'t").' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Choose the correct preposition of place: "The laptop is _____ the desk."', a: 'in', b: 'on', c: 'at', d: 'underneath of', correcta: 1, explicacion: 'Se utiliza "on" para indicar que un objeto está sobre una superficie plana ("on the desk").' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete the sentence: "How _____ do you visit your family? - Twice a week."', a: 'much', b: 'many', c: 'often', d: 'long', correcta: 2, explicacion: '"How often" se usa para preguntar por la frecuencia con la que se realiza una acción.' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Identify the correct past form of the irregular verb "go":', a: 'goed', b: 'gone', c: 'went', d: 'going', correcta: 2, explicacion: 'El pasado simple del verbo irregular "go" es "went".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Choose the correct subject pronoun for a group of people including yourself:', a: 'They', b: 'We', c: 'You', d: 'He', correcta: 1, explicacion: 'Cuando te incluyes dentro de un grupo, el pronombre correspondiente en inglés es "We" (nosotros).' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete the sentence: "She _____ speak French fluently."', a: 'don’t', b: 'doesn’t can', c: 'can’t', d: 'isn’t can', correcta: 2, explicacion: 'La forma negativa del verbo modal "can" es "can’t" (o "cannot"), y no requiere auxiliares adicionales.' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'What is the correct time expression for Simple Present habits?', a: 'yesterday', b: 'always', c: 'next week', d: 'at this moment', correcta: 1, explicacion: 'Adverbios de frecuencia como "always" (siempre) se emplean habitualmente en Presente Simple.' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete the sentence: "_____ is your birthday? - It is in September."', a: 'What', b: 'Where', c: 'When', d: 'Who', correcta: 2, explicacion: '"When" se utiliza para preguntar por fechas, momentos o tiempos específicos.' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Choose the correct possessive pronoun: "This backpack belongs to me. It is _____."', a: 'mine', b: 'yours', c: 'his', d: 'hers', correcta: 0, explicacion: 'El pronombre posesivo independiente que corresponde a la primera persona ("I") es "mine".' },
      { modulo: 'ingles', tema: 'Fundamentos y Tiempos Verbales Básicos', pregunta: 'Complete the sentence in Future (Will): "I think it _____ rain later this afternoon."', a: 'is going to', b: 'will', c: 'wants to', d: 'shall to', correcta: 1, explicacion: 'Las predicciones basadas en opiniones o suposiciones con "I think" se expresan comúnmente usando el auxiliar "will".' },

      // ------------------------------------------
      // INGLÉS - Estructura Intermediaria
      // ------------------------------------------
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete using Present Perfect: "I _____ in Mérida _____ five years."', a: 'lived / since', b: 'have lived / for', c: 'have lived / since', d: 'am living / for', correcta: 1, explicacion: 'Se usa Presente Perfecto ("have lived") para acciones que empezaron en el pasado y continúan, junto con "for" para periodos de tiempo.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Choose the correct comparative form: "This algorithm is _____ than the previous one."', a: 'more efficient', b: 'efficienter', c: 'most efficient', d: 'more efficienter', correcta: 0, explicacion: 'Los adjetivos largos de tres o más sílabas ("efficient") forman el comparativo anteponiendo "more".' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the First Conditional sentence: "If it rains tomorrow, we _____ the outdoor event."', a: 'cancel', b: 'would cancel', c: 'will cancel', d: 'canceled', correcta: 2, explicacion: 'El Primer Condicional sigue la estructura: If + Presente Simple, ... will + verbo base.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Which modal verb expresses strong obligation or necessity? "You _____ wear a helmet when riding a motorcycle."', a: 'might', b: 'must', c: 'could', d: 'would', correcta: 1, explicacion: '"Must" indica una obligación fuerte, regla o necesidad indispensable.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Identify the correct Second Conditional sentence:', a: 'If I had more time, I would learn another language.', b: 'If I have more time, I would learn another language.', c: 'If I had more time, I will learn another language.', d: 'If I would have more time, I learned another language.', correcta: 0, explicacion: 'El Segundo Condicional (situaciones hipotéticas) usa: If + Pasado Simple ("had"), ... would + verbo base ("would learn").' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence with "already" or "yet": "Have you finished your mobile app _____?"', a: 'already', b: 'yet', c: 'just', d: 'ever', correcta: 1, explicacion: 'En preguntas y oraciones negativas del presente perfecto, se utiliza "yet" al final de la oración.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Choose the correct superlative form: "This is _____ difficult problem in the exam."', a: 'the most', b: 'more', c: 'the more', d: 'most', correcta: 0, explicacion: 'Los superlativos de adjetivos largos requieren "the most" antes del adjetivo.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence: "She has _____ finished reading the technical documentation."', a: 'yet', b: 'ever', c: 'just', d: 'ago', correcta: 2, explicacion: '"Just" se usa en presente perfecto para indicar que una acción acaba de suceder recientemente.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Which sentence correctly uses "too" or "enough"? "He is not old _____ to drive a car."', a: 'too', b: 'enough', c: 'very', d: 'so', correcta: 1, explicacion: '"Enough" se coloca después de los adjetivos para indicar suficiencia.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence with the correct relative clause: "The developer _____ wrote this code is an expert."', a: 'which', b: 'where', c: 'who', d: 'whose', correcta: 2, explicacion: 'Se utiliza "who" como pronombre relativo para referirse a personas ("The developer").' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Choose the correct option: "You _____ park your car here. It is forbidden."', a: 'don’t have to', b: 'mustn’t', c: 'should', d: 'can', correcta: 1, explicacion: '"Mustn’t" expresa prohibición estricta (no está permitido).' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence using Past Continuous: "While I _____ code, the power went out."', a: 'was writing', b: 'wrote', c: 'am writing', d: 'have written', correcta: 0, explicacion: 'Para acciones en progreso interrumpidas en el pasado se usa Pasado Continuo ("was/were + -ing").' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Identify the correct sentence using "as...as" (equality comparison):', a: 'This framework is as fast as that one.', b: 'This framework is as faster as that one.', c: 'This framework is as fast than that one.', d: 'This framework is more fast as that one.', correcta: 0, explicacion: 'La estructura de igualdad utiliza "as + adjetivo base + as".' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence: "Have you _____ traveled outside of Mexico?"', a: 'already', b: 'ever', c: 'never', d: 'just', correcta: 1, explicacion: '"Ever" se utiliza comúnmente en preguntas de presente perfecto para indagar sobre experiencias de vida.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Choose the correct modal verb for lack of necessity: "Tomorrow is Sunday, so you _____ wake up early."', a: 'mustn’t', b: 'don’t have to', c: 'can’t', d: 'shouldn’t', correcta: 2, explicacion: '"Don’t have to" indica que no hay obligación ni necesidad de hacer algo.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence: "I have known my best friend _____ ten years."', a: 'since', b: 'for', c: 'during', d: 'from', correcta: 1, explicacion: 'Se utiliza "for" seguido de la duración o periodo de tiempo exacto ("ten years").' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'What is the correct comparative form of the adjective "good"?', a: 'gooder', b: 'better', c: 'best', d: 'more good', correcta: 1, explicacion: 'El adjetivo "good" tiene un comparativo irregular que es "better".' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the First Conditional: "If database queries are slow, the app _____ crash."', a: 'would', b: 'will', c: 'did', d: 'ed', correcta: 1, explicacion: 'En el primer condicional, la consecuencia utiliza "will + verbo base".' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Choose the correct option: "This coffee is _____ hot to drink right now."', a: 'enough', b: 'too', c: 'such', d: 'so', correcta: 1, explicacion: '"Too" se coloca antes de los adjetivos para indicar exceso ("too hot").' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Identify the correct sentence in Past Perfect:', a: 'She had finished her project before the deadline.', b: 'She has finished her project before the deadline.', c: 'She had finish her project before the deadline.', d: 'She was finish her project before the deadline.', correcta: 0, explicacion: 'El Pasado Perfecto utiliza "had + participio pasado" ("had finished").' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence: "I have known him _____ 2024."', a: 'for', b: 'since', c: 'during', d: 'until', correcta: 1, explicacion: 'Se utiliza "since" para indicar el punto de inicio exacto de una acción en el tiempo.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'What is the superlative form of the adjective "bad"?', a: 'baddest', b: 'worse', c: 'worst', d: 'more bad', correcta: 2, explicacion: 'El superlativo irregular de "bad" es "the worst".' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence: "If I won the lottery, I _____ buy a new house."', a: 'will', b: 'would', c: 'can', d: 'did', correcta: 1, explicacion: 'En el segundo condicional (hipotético), la cláusula principal utiliza "would + verbo base".' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Choose the correct option: "You look tired. You _____ take a break."', a: 'should', b: 'mustn’t', c: 'can’t', d: 'has to', correcta: 0, explicacion: '"Should" se utiliza para dar consejos o recomendaciones saludables.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence with the correct relative pronoun for possession: "The student _____ laptop was stolen went to security."', a: 'who', b: 'which', c: 'whose', d: 'where', correcta: 2, explicacion: 'Se utiliza "whose" para indicar posesión vinculada a una persona.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Identify the correct sentence using "too many":', a: 'There are too many bugs in this script.', b: 'There is too many bugs in this script.', c: 'There are too much bugs in this script.', d: 'There is too much error.', correcta: 0, explicacion: 'Se usa "too many" con sustantivos contables en plural ("bugs").' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence using "too much": "He spends _____ time playing video games."', a: 'too many', b: 'too much', c: 'enough', d: 'few', correcta: 1, explicacion: 'Se usa "too much" con sustantivos incontables ("time").' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Choose the correct question format in Present Perfect:', a: 'Have you ever visited Canada?', b: 'Did you ever visited Canada?', c: 'Has you ever visit Canada?', d: 'You have ever visited Canada?', correcta: 0, explicacion: 'Las preguntas en presente perfecto inician con el auxiliar "Have/Has + sujeto + participio".' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the sentence: "This is _____ interesting movie I have ever watched."', a: 'more', b: 'the most', c: 'much', d: 'less', correcta: 1, explicacion: 'Se emplea el superlativo "the most" para destacar una cualidad extrema en un grupo.' },
      { modulo: 'ingles', tema: 'Estructura Intermediaria', pregunta: 'Complete the Second Conditional: "If she studied harder, she _____ pass the exams easily."', a: 'will', b: 'would', c: 'can', d: 'did', correcta: 1, explicacion: 'La estructura del segundo condicional requiere "would" acompañado del verbo base.' },

      // ------------------------------------------
      // INGLÉS - Gramática y Funciones Avanzadas
      // ------------------------------------------
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Transform into Passive Voice: "Engineers developed the new software in 2026."', a: 'The new software is developed by engineers in 2026.', b: 'The new software was developed by engineers in 2026.', c: 'The new software has developed by engineers in 2026.', d: 'The new software were developed by engineers in 2026.', correcta: 1, explicacion: 'Como la oración activa está en Pasado Simple ("developed"), la voz pasiva requiere "was/were + participio pasado" ("was developed").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Choose the correct Reported Speech: Direct: "I am working on the database," Carlos said.', a: 'Carlos said that he is working on the database.', b: 'Carlos said that he was working on the database.', c: 'Carlos said that he worked on the database.', d: 'Carlos said that he had worked on the database.', correcta: 1, explicacion: 'En Reported Speech, el Presente Continuo ("am working") retrocede un tiempo verbal a Pasado Continuo ("was working").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the Third Conditional: "If they _____ earlier, they wouldn’t have missed the flight."', a: 'left', b: 'have left', c: 'had left', d: 'would leave', correcta: 2, explicacion: 'El Tercer Condicional expresa arrepentimientos o situaciones pasadas irreales: If + Past Perfect ("had left"), ... would have + participio.' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Select the correct relative pronoun: "The server _____ crashed yesterday has been repaired."', a: 'who', b: 'where', c: 'which', d: 'whose', correcta: 2, explicacion: 'Se utiliza "which" (o "that") para referirse a objetos, máquinas o cosas como "the server".' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Which sentence uses the Causative form ("have/get something done") correctly?', a: 'I had my laptop repaired yesterday.', b: 'I had repaired my laptop yesterday.', c: 'I had my laptop repair yesterday.', d: 'I have my laptop repairing yesterday.', correcta: 0, explicacion: 'La estructura causativa indica que alguien más realizó el servicio por ti: Subject + have/get + objeto + participio pasado ("repaired").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Transform into Passive Voice: "They will release the new update next week."', a: 'The new update will be released next week.', b: 'The new update is released next week.', c: 'The new update would be released next week.', d: 'The new update has been released next week.', correcta: 0, explicacion: 'En voz pasiva con futuro, la estructura es "will be + participio pasado" ("will be released").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Choose the correct Reported Speech for a direct command: Direct: "Open the source code file," the teacher said.', a: 'The teacher said to open the source code file.', b: 'The teacher said open the source code file.', c: 'The teacher told that open the file.', d: 'The teacher asked opening the file.', correcta: 0, explicacion: 'Para reportar órdenes o peticiones afirmativas se emplea "told/asked + sujeto + to + verbo base".' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the sentence with a defining relative clause: "This is the laboratory _____ we conduct robotics experiments."', a: 'who', b: 'where', c: 'which', d: 'whose', correcta: 1, explicacion: 'Se utiliza "where" como adverbio relativo para referirse a lugares o instalaciones.' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Identify the correct sentence in Passive Voice (Present Simple): "English _____ all over the world."', a: 'is spoken', b: 'speaks', c: 'is speak', d: 'was spoken', correcta: 0, explicacion: 'En Presente Simple, la voz pasiva utiliza "is/am/are + participio pasado" ("is spoken").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Choose the correct Reported Speech for a question: Direct: "Where do you live?" she asked me.', a: 'She asked me where I lived.', b: 'She asked me where do I live.', c: 'She asked me where did I live.', d: 'She asked me where I live.', correcta: 0, explicacion: 'En Reported Speech de preguntas con WH, se elimina el auxiliar de interrogación y el verbo cambia a pasado sin invertir orden.' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the Third Conditional: "If I had studied harder, I _____ the exam."', a: 'would pass', b: 'will have passed', c: 'would have passed', d: 'passed', correcta: 2, explicacion: 'La estructura de consecuencia del tercer condicional es "would have + participio pasado".' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Which sentence correctly uses a non-defining relative clause?', a: 'My laptop, which I bought last year, is extremely fast.', b: 'My laptop which I bought last year is extremely fast.', c: 'My laptop, that I bought last year, is extremely fast.', d: 'My laptop who I bought last year is extremely fast.', correcta: 0, explicacion: 'Las cláusulas no definitorias van entre comas y utilizan "which" (nunca "that").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Transform into Passive Voice: "Someone stole my smartphone yesterday."', a: 'My smartphone was stolen yesterday.', b: 'My smartphone is stolen yesterday.', c: 'My smartphone has stolen yesterday.', d: 'My smartphone were stolen yesterday.', correcta: 0, explicacion: 'Pasado simple activo ("stole") pasa a "was/were + stole (stolen)" en voz pasiva.' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Choose the correct option using "wish" for present regrets: "I don’t understand this code. I wish I _____ more about Python."', a: 'know', b: 'knew', c: 'had known', d: 'will know', correcta: 1, explicacion: 'Para expresar deseos o lamentos sobre situaciones presentes contrarias a la realidad se usa "wish + Pasado Simple".' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the sentence with the correct participle: "_____ by the complex instructions, the student asked for help."', a: 'Confusing', b: 'Confused', c: 'Confuse', d: 'To confuse', correcta: 1, explicacion: 'Se usa el participio en -ed ("Confused") para describir el estado de cómo se siente una persona.' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Identify the correct sentence using a causative structure: "I need to get my motorcycle _____ before the trip."', a: 'repair', b: 'repaired', c: 'repairing', d: 'repaire', correcta: 1, explicacion: 'La estructura causativa "get something done" requiere el participio pasado del verbo ("repaired").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the sentence: "The man _____ car was towed is waiting outside."', a: 'who', b: 'which', c: 'whose', d: 'whom', correcta: 2, explicacion: 'Se usa "whose" para denotar posesión directa entre el sustantivo previo y el objeto posterior.' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Choose the correct Reported Speech transformation: Direct: "I will finish the app tomorrow," said John.', a: 'John said that he will finish the app tomorrow.', b: 'John said that he would finish the app the next day.', c: 'John said that he finished the app tomorrow.', d: 'John said that he can finish the app.', correcta: 1, explicacion: '"Will" cambia a "would" y expresiones de tiempo como "tomorrow" cambian a "the next day" en el discurso indirecto.' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the sentence with a participle clause: "_____ the report, she submitted it to the manager."', a: 'Finish', b: 'Finished', c: 'Having finished', d: 'Finishing', correcta: 2, explicacion: 'Se utiliza el gerundio perfecto ("Having finished") para indicar una acción completada antes de otra en el pasado.' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Which sentence correctly uses "so...that" or "such...that"?', a: 'It was such a difficult test that nobody passed.', b: 'It was so a difficult test that nobody passed.', c: 'It was such difficult test that nobody passed.', d: 'It was so difficult test that nobody passed.', correcta: 0, explicacion: 'Con sustantivos contables en singular se emplea "such + a/an + adjetivo + sustantivo + that".' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Transform into Passive Voice: "They have tested all API endpoints successfully."', a: 'All API endpoints have been tested successfully.', b: 'All API endpoints has been tested successfully.', c: 'All API endpoints were tested successfully.', d: 'All API endpoints are tested successfully.', correcta: 0, explicacion: 'El presente perfecto en voz pasiva utiliza "have/has been + participio pasado" ("have been tested").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the sentence: "I wish I _____ attended the tech conference last week."', a: 'knew', b: 'have', c: 'had', d: 'would', correcta: 2, explicacion: 'Para expresar lamentos sobre situaciones pasadas (que ya no se pueden cambiar) se usa "wish + Pasado Perfecto" ("had attended").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Choose the correct relative pronoun (can be omitted when object): "The book _____ I bought yesterday is about software architecture."', a: 'who', b: 'where', c: 'which', d: 'whose', correcta: 2, explicacion: 'Para cosas u objetos que actúan como objeto directo se utiliza "which" (o se puede omitir).' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Identify the correct sentence in Reported Speech for a negative request: Direct: "Don’t touch the wires," the technician warned us.', a: 'The technician warned us not to touch the wires.', b: 'The technician told us don’t touch the wires.', c: 'The technician asked us to not touch the wires.', d: 'The technician said not touch the wires.', correcta: 0, explicacion: 'Las peticiones u órdenes negativas en estilo indirecto se estructuran con "not to + verbo base".' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the sentence: "The presentation was _____ boring that half of the audience left."', a: 'such', b: 'so', c: 'too', d: 'enough', correcta: 1, explicacion: 'Se utiliza "so" directamente antes de un adjetivo o adverbio aislado seguido de "that".' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Which sentence correctly exemplifies a mixed conditional?', a: 'If I had studied programming earlier, I would be a senior developer now.', b: 'If I studied programming earlier, I would have been a senior developer now.', c: 'If I have studied programming, I will be a developer.', d: 'If I studied, I will pass.', correcta: 0, explicacion: 'Un condicional mixto común combina una condición pasada irreal (Pasado Perfecto) con un resultado presente (would + verbo base).' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the sentence: "She had her house _____ with new security cameras last month."', a: 'install', b: 'installed', c: 'installing', d: 'installation', correcta: 1, explicacion: 'En la estructura causativa "have something done", el verbo final va en participio pasado ("installed").' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Choose the correct passive form of: "People say that technology is evolving fast."', a: 'It is said that technology is evolving fast.', b: 'Technology is said evolving fast.', c: 'It was said technology evolves fast.', d: 'People are said technology evolves.', correcta: 0, explicacion: 'Para oraciones impersonales pasivas de opinión se utiliza la estructura "It is said that...".' },
      { modulo: 'ingles', tema: 'Gramática y Funciones Avanzadas', pregunta: 'Complete the sentence using a participle adjective: "The database update results were very _____."', a: 'disappointing', b: 'disappointed', c: 'disappoint', d: 'disappointment', correcta: 0, explicacion: 'Se emplea el participio en "-ing" ("disappointing") para describir la causa o la cosa que genera el efecto.' },
      // ------------------------------------------
      // INGLÉS - Habilidades Comunicativas y Vocabulario
      // ------------------------------------------
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What does the phrasal verb "figure out" mean in the sentence: "We need to figure out how to fix this bug"?', a: 'Ignore completely', b: 'Understand or find a solution', c: 'Delete permanently', d: 'Postpone until tomorrow', correcta: 1, explicacion: '"Figure out" significa comprender, resolver o encontrar la solución a un problema.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the best connector to show contrast: "The connection was unstable; _____, we finished the presentation on time."', a: 'furthermore', b: 'therefore', c: 'nevertheless', d: 'likewise', correcta: 2, explicacion: '"Nevertheless" (sin embargo / no obstante) introduce un contraste frente a una dificultad previa.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What is the meaning of the idiom "to hit the nail on the head"?', a: 'To make a serious mistake', b: 'To describe exactly what is causing a situation or problem', c: 'To work late at night', d: 'To start a project from scratch', correcta: 1, explicacion: '"Hit the nail on the head" (dar en el clavo) significa acertar exactamente con el punto o solución.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Select the most polite and professional way to ask for clarification in an email:', a: 'What are you talking about?', b: 'Explain this again, I don’t get it.', c: 'Could you please clarify what you mean by the second point?', d: 'You didn’t write this clearly.', correcta: 2, explicacion: 'El uso de "Could you please clarify..." es la forma estándar, cortés y profesional en entornos académicos y laborales.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the right word to complete the collocation: "Before deploying the app, we must _____ a thorough test."', a: 'make', b: 'do', c: 'carry out', d: 'take', correcta: 2, explicacion: 'En inglés técnico y académico, la colocación natural para realizar pruebas o investigaciones es "carry out a test/research".' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What does the phrasal verb "back up" mean in a computer science context?', a: 'To delete all files', b: 'To make a copy of data for security', c: 'To shut down the system', d: 'To restart the server', correcta: 1, explicacion: '"Back up" significa realizar una copia de seguridad o respaldo de la información.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the correct connector of addition: "The application is fast; _____, it has an intuitive user interface."', a: 'however', b: 'furthermore', c: 'otherwise', d: 'conversely', correcta: 1, explicacion: '"Furthermore" (además / por añadidura) se emplea para sumar información positiva o argumentos.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What is the meaning of the idiom "to burn the midnight oil"?', a: 'To waste fuel', b: 'To work or study late into the night', c: 'To start a fire accidentally', d: 'To sleep all night long', correcta: 1, explicacion: '"Burn the midnight oil" significa desvelarse trabajando o estudiando de manera intensa.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Select the best phrase to start a formal professional presentation:', a: 'Hey guys, listen to this.', b: 'Good morning everyone, and welcome to my presentation.', c: 'What is up, let us begin.', d: 'I am here because I have to.', correcta: 1, explicacion: '"Good morning everyone, and welcome to..." es la fórmula estándar de cortesía y formalidad en presentaciones.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the correct collocation: "We need to _____ a decision before the deadline."', a: 'make', b: 'do', c: 'take', d: 'have', correcta: 0, explicacion: 'En inglés se dice "to make a decision" (tomar o formular una decisión).' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What does the phrasal verb "look forward to" mean in an email closing: "I look forward to hearing from you"?', a: 'To wait with fear', b: 'To anticipate with pleasure or excitement', c: 'To look backward in time', d: 'To ignore messages', correcta: 1, explicacion: '"Look forward to" expresa entusiasmo o anticipación positiva ante algo futuro.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the correct connector of consequence: "The server crashed; _____, the website was temporarily offline."', a: 'consequently', b: 'meanwhile', c: 'similarly', d: 'nevertheless', correcta: 0, explicacion: '"Consequently" (por consiguiente / como resultado) introduce el efecto directo de una causa previa.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What does the idiom "piece of cake" mean?', a: 'A delicious dessert', b: 'Something extremely easy to do', c: 'A difficult challenge', d: 'An expensive gift', correcta: 1, explicacion: '"A piece of cake" es una expresión idiomática que significa que una tarea es sumamente fácil.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Select the most appropriate closing for a formal business or academic email:', a: 'Cheers,', b: 'Sincerely,', c: 'See ya,', d: 'Later,', correcta: 1, explicacion: '"Sincerely" (Atentamente / Sinceramente) es el cierre formal y adecuado en comunicaciones escritas profesionales.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the correct collocation with "do": "Everyone must _____ their best during the competition."', a: 'make', b: 'do', c: 'give', d: 'have', correcta: 1, explicacion: 'La expresión correcta para esforzarse al máximo es "to do one’s best".' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What does the phrasal verb "run out of" mean in: "We ran out of memory on the server"?', a: 'To have an excess of something', b: 'To completely exhaust or finish a supply', c: 'To run very fast outside', d: 'To upgrade components', correcta: 1, explicacion: '"Run out of" significa quedarse sin provisiones, recursos o almacenamiento.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the best transition to introduce a contrasting idea: "_____ the project was challenging, the team succeeded."', a: 'Although', b: 'Because', c: 'Therefore', d: 'Furthermore', correcta: 0, explicacion: '"Although" (aunque) introduce una concesión o contraste directo al inicio de una cláusula.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What is the meaning of the idiom "to cost an arm and a leg"?', a: 'To require physical surgery', b: 'To be extremely expensive', c: 'To be completely free', d: 'To be very cheap', correcta: 1, explicacion: '"Cost an arm and a leg" (costar un ojo de la cara) indica que algo tiene un precio exageradamente alto.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Select the correct professional expression to disagree politely in a meeting:', a: 'You are completely wrong.', b: 'That makes no sense.', c: 'I see your point, but I have a different perspective.', d: 'Shut up and listen.', correcta: 2, explicacion: 'Validar la postura ajena con "I see your point, but..." es una forma asertiva y cordial de disentir.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the correct collocation for progress: "Our team continues to _____ significant progress."', a: 'make', b: 'do', c: 'have', d: 'get', correcta: 0, explicacion: 'Se utiliza la combinación "to make progress" para referirse al avance en proyectos o metas.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What does the phrasal verb "drop out" mean?', a: 'To drop an object on the floor', b: 'To quit or leave a school, course, or program', c: 'To fall asleep quickly', d: 'To drop a message in chat', correcta: 1, explicacion: '"Drop out" se utiliza cuando alguien abandona o se da de baja de una institución educativa o programa.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the correct connector to show simultaneity: "The developers coded the backend; _____, the designers built the UI."', a: 'meanwhile', b: 'therefore', c: 'otherwise', d: 'consequently', correcta: 0, explicacion: '"Meanwhile" (mientras tanto) indica que dos acciones ocurren de manera simultánea en paralelo.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What does the idiom "break a leg" mean before a presentation or exam?', a: 'To suffer a physical injury', b: 'To wish someone good luck', c: 'To run away quickly', d: 'To fail miserably', correcta: 1, explicacion: '"Break a leg" es una expresión teatral y común para desearle mucho éxito a alguien.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Select the best phrase to interrupt politely during a professional discussion:', a: 'Quiet everyone, I am speaking.', b: 'May I add something here?', c: 'You are interrupting my thoughts.', d: 'Stop talking right now.', correcta: 1, explicacion: '"May I add something here?" constituye una forma educada y respetuosa de pedir la palabra.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the correct collocation: "We must _____ an appointment with the technical supervisor."', a: 'make', b: 'do', c: 'have', d: 'take', correcta: 0, explicacion: 'La colocación adecuada para agendar una cita o reunión es "to make an appointment".' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What does the phrasal verb "carry out" mean in: "We will carry out security tests tomorrow"?', a: 'To abandon a task', b: 'To execute or perform a task', c: 'To carry boxes outside', d: 'To delay indefinitely', correcta: 1, explicacion: '"Carry out" significa llevar a cabo, ejecutar o realizar una acción o prueba.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the best connector of purpose: "We optimized the database _____ improve response times."', a: 'in order to', b: 'because of', c: 'despite', d: 'furthermore', correcta: 0, explicacion: '"In order to" (para / con el fin de) se utiliza para expresar el propósito u objetivo de una acción.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'What is the meaning of the idiom "under the weather"?', a: 'Experiencing good health outdoors', b: 'Feeling slightly ill or unwell', c: 'Working in the rain', d: 'Checking meteorological reports', correcta: 1, explicacion: '"Under the weather" es una frase idiomática que denota sentirse enfermo, decaído o indispuesto.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Select the most appropriate opening for a professional inquiry email:', a: 'Hey, answer this question.', b: 'I am writing to inquire about the software license requirements.', c: 'Tell me everything about your system.', d: 'Give me information now.', correcta: 1, explicacion: '"I am writing to inquire about..." es la fórmula cortés, formal y profesional para solicitar informes.' },
      { modulo: 'ingles', tema: 'Habilidades Comunicativas y Vocabulario', pregunta: 'Choose the correct collocation for errors: "It is normal to _____ mistakes while learning to code."', a: 'make', b: 'do', c: 'take', d: 'have', correcta: 0, explicacion: 'En inglés se utiliza siempre la combinación "to make mistakes" (cometer errores).' },



       




















    ];

    await db.withTransactionAsync(async () => {
      for (const p of bancoPreguntas) {
        await db.runAsync(
          `INSERT INTO preguntas (modulo, tema, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, explicacion, respondida) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0);`,
          [p.modulo, p.tema, p.pregunta, p.a, p.b, p.c, p.d, p.correcta, p.explicacion]
        );
      }
    });
  }

  private async cargarEscenariosPhishing(): Promise<void> {
    const db = await this.dbPromise;

    const escenarios = [
      { senderName: 'Soporte Banco Seguro', senderEmail: 'seguridad@banc0-alertas-update.com', subject: '¡URGENTE! Cuenta bloqueada', date: '10:42 AM', body: 'Estimado cliente, detectamos acceso no autorizado. Verifique sus datos inmediatamente:', actionText: 'Restablecer Mi Cuenta', targetUrl: 'http://login.banc0-alertas-update.com', isPhishing: 1, hintSender: 'Usa "banc0" con cero.', hintUrl: 'Dirección HTTP no segura.', hintUrgency: 'Usa pánico y urgencia.', explanation: '¡Es Phishing! Los bancos jamás solicitan claves vía e-mail.' },
      { senderName: 'StreamFlex', senderEmail: 'no-reply@streamflex.com', subject: 'Tu recibo de suscripción', date: 'Ayer', body: 'Gracias por continuar con tu suscripción mensual de $199.00 MXN.', actionText: 'Ver Cuenta', targetUrl: 'https://www.streamflex.com/account', isPhishing: 0, hintSender: 'Dominio oficial coincidente.', hintUrl: 'Usa sitio HTTPS oficial.', hintUrgency: 'Notificación común sin presión.', explanation: '¡Es Legítimo! El dominio coincide y es HTTPS.' },
      { senderName: 'Soporte Banco Seguro', senderEmail: 'seguridad@banc0-alertas-update.com', subject: '¡URGENTE! Cuenta bloqueada', date: '10:42 AM', body: 'Estimado cliente, detectamos acceso no autorizado. Verifique sus datos inmediatamente:', actionText: 'Restablecer Mi Cuenta', targetUrl: 'http://login.banc0-alertas-update.com', isPhishing: 1, hintSender: 'Usa "banc0" con cero.', hintUrl: 'Dirección HTTP no segura.', hintUrgency: 'Usa pánico y urgencia.', explanation: 'Es phishing: combina dominio alterado, enlace sin cifrado y presión temporal.' },
     
      { senderName: 'Mesa de Ayuda TI', senderEmail: 'admin@soporte-red-campus.xyz', subject: 'Actualización obligatoria de contraseña', date: '08:15 AM', body: 'Su contraseña expirará hoy. Inicie sesión en el portal para conservar su acceso:', actionText: 'Actualizar Clave', targetUrl: 'http://portal-acceso-seguro.xyz/login', isPhishing: 1, hintSender: 'Dominio externo no oficial.', hintUrl: 'HTTP y ruta de acceso ajena.', hintUrgency: 'Amenaza de pérdida de acceso.', explanation: 'Es phishing: suplanta soporte técnico con un dominio externo y enlace HTTP.' },
      { senderName: 'Nube Académica', senderEmail: 'notificaciones@nubeacademica.edu', subject: 'Nuevo comentario en tu documento', date: 'Ayer', body: 'Un colaborador comentó en "Proyecto_Final.pdf". Puedes revisar los cambios desde tu cuenta.', actionText: 'Abrir Documento', targetUrl: 'https://nubeacademica.edu/files/104', isPhishing: 0, hintSender: 'Dirección del dominio institucional.', hintUrl: 'Enlace HTTPS del mismo dominio.', hintUrgency: 'Aviso informativo habitual.', explanation: 'Es legítimo: conserva coherencia de dominio y un tono informativo estándar.' },
      { senderName: 'Envíos Express', senderEmail: 'rastreo@paqueteria-entrega-mx.com', subject: 'Paquete retenido por saldo pendiente', date: '11:20 AM', body: 'Su envío requiere un pago de $35.00 MXN para liberar la entrega hoy mismo:', actionText: 'Pagar Ahora', targetUrl: 'http://cobro-envio-rapido.com/pay', isPhishing: 1, hintSender: 'Dominio genérico de mensajería.', hintUrl: 'URL de pago externa sin HTTPS.', hintUrgency: 'Cobro inesperado con límite diario.', explanation: 'Es phishing: usa un cobro menor urgente para capturar datos de pago.' },
      { senderName: 'Tienda Oficial', senderEmail: 'pedidos@tiendaoficial.com', subject: 'Confirmación de tu pedido #8841', date: 'Martes', body: 'Preparamos tu orden. Consulta el estado del envío dentro de tu perfil habitual.', actionText: 'Ver Pedido', targetUrl: 'https://tiendaoficial.com/orders/8841', isPhishing: 0, hintSender: 'Remitente oficial de comercio.', hintUrl: 'HTTPS en dominio principal.', hintUrgency: 'Confirmación rutinaria de compra.', explanation: 'Es legítimo: coincide con una operación esperada y un dominio seguro.' },
      { senderName: 'Seguridad de Cuenta', senderEmail: 'alertas@verificacion-cuenta-segura.net', subject: 'Inicio de sesión desde otro dispositivo', date: '03:05 AM', body: 'Detectamos un acceso nuevo. Si no fuiste tú, bloquea tu cuenta desde aquí:', actionText: 'Bloquear Acceso', targetUrl: 'http://seguridad-sesion-check.net', isPhishing: 1, hintSender: 'Dominio genérico de alertas.', hintUrl: 'Enlace HTTP no cifrado.', hintUrgency: 'Alerta nocturna para reacción rápida.', explanation: 'Es phishing: aprovecha una alerta de seguridad falsa hacia un dominio externo.' },
      { senderName: 'Calendario Escolar', senderEmail: 'avisos@calendarioescolar.org', subject: 'Recordatorio: sesión informativa del jueves', date: 'Ayer', body: 'La sesión comenzará a las 17:00 hrs. Consulta el programa en el portal oficial.', actionText: 'Ver Programa', targetUrl: 'https://calendarioescolar.org/agenda', isPhishing: 0, hintSender: 'Dominio organizacional conocido.', hintUrl: 'Conexión HTTPS verificada.', hintUrgency: 'Recordatorio ordinario sin presión.', explanation: 'Es legítimo: comunica un evento con enlace propio y tono neutral.' },
      { senderName: 'Premios y Sorteos', senderEmail: 'ganadores@promo-regalos-vip.com', subject: '¡Felicidades! Ganaste un equipo nuevo', date: '09:10 AM', body: 'Tu correo fue seleccionado. Reclama tu premio ingresando tus datos antes de medianoche:', actionText: 'Reclamar Premio', targetUrl: 'http://canje-recompensa-vip.com', isPhishing: 1, hintSender: 'Dominio promocional no oficial.', hintUrl: 'Enlace HTTP sin protección.', hintUrgency: 'Límite de tiempo para reclamar.', explanation: 'Es phishing: usa una recompensa llamativa y urgencia para recolectar datos.' },
      { senderName: 'Portal de Pagos', senderEmail: 'facturacion@portalpagos.com', subject: 'Comprobante de servicio disponible', date: 'Miércoles', body: 'Tu comprobante mensual ya está listo para consulta en tu panel de usuario.', actionText: 'Consultar Recibo', targetUrl: 'https://portalpagos.com/receipts', isPhishing: 0, hintSender: 'Dominio consistente del servicio.', hintUrl: 'Ruta HTTPS dentro del sitio.', hintUrgency: 'Notificación periódica normal.', explanation: 'Es legítimo: mantiene consistencia entre remitente, contexto y URL.' },
      { senderName: 'Recursos Humanos', senderEmail: 'rh@nomina-actualizacion-segura.com', subject: 'Documento pendiente de firma digital', date: '01:50 PM', body: 'Descargue y abra el archivo adjunto de inmediato para evitar retrasos en su registro:', actionText: 'Descargar Anexo', targetUrl: 'http://descargas-nomina-doc.com/anexo.exe', isPhishing: 1, hintSender: 'Dominio externo simulando RH.', hintUrl: 'Apunta a archivo ejecutable (.exe).', hintUrgency: 'Presión por supuesto retraso.', explanation: 'Es phishing: simula un trámite interno para inducir la descarga de un ejecutable.' },
      { senderName: 'Biblioteca Digital', senderEmail: 'servicios@bibliotecadigital.edu', subject: 'Préstamo próximo a vencer', date: 'Ayer', body: 'El material reservado vence en tres días. Puedes renovarlo desde el catálogo.', actionText: 'Ir al Catálogo', targetUrl: 'https://bibliotecadigital.edu/loans', isPhishing: 0, hintSender: 'Dominio educativo esperado.', hintUrl: 'URL HTTPS legítima.', hintUrgency: 'Aviso anticipado sin alarma.', explanation: 'Es legítimo: ofrece un aviso preventivo claro hacia el portal oficial.' },
      { senderName: 'Soporte de Factura', senderEmail: 'cfdi@revision-fiscal-express.com', subject: 'Aviso de inconsistencia en comprobante', date: '12:18 PM', body: 'Se reportó una discrepancia fiscal. Valide su acceso en el siguiente enlace:', actionText: 'Validar Ahora', targetUrl: 'http://validacion-fiscal-mx.com/login', isPhishing: 1, hintSender: 'Dominio no oficial de terceros.', hintUrl: 'Sitio HTTP externo de acceso.', hintUrgency: 'Supuesta inconsistencia urgente.', explanation: 'Es phishing: emplea un tema sensible y urgencia para redirigir a un formulario.' },
      { senderName: 'Equipo de Desarrollo', senderEmail: 'repo@equipodesarrollo.io', subject: 'Revisión completada en solicitud de cambios', date: 'Hoy', body: 'Se aprobaron los cambios de la rama principal. Revisa los detalles en el repositorio.', actionText: 'Ver Cambios', targetUrl: 'https://equipodesarrollo.io/prs/42', isPhishing: 0, hintSender: 'Dominio técnico coherente.', hintUrl: 'Enlace HTTPS del proyecto.', hintUrgency: 'Actualización rutinaria de trabajo.', explanation: 'Es legítimo: corresponde a una notificación de flujo de trabajo habitual.' },
      { senderName: 'Centro de Ayuda', senderEmail: 'soporte@recuperar-cuenta-rapido.org', subject: 'Solicitud de restablecimiento de acceso', date: '06:40 AM', body: 'Alguien solicitó cambiar su contraseña. Confirme o cancele aquí de inmediato:', actionText: 'Confirmar Cambio', targetUrl: 'http://recuperar-cuenta-rapido.org/reset', isPhishing: 1, hintSender: 'Dominio genérico de recuperación.', hintUrl: 'Conexión HTTP sin cifrado.', hintUrgency: 'Acción inmediata ante cambio.', explanation: 'Es phishing: simula un aviso de seguridad para capturar credenciales de acceso.' }
    ];

    await db.withTransactionAsync(async () => {
      for (const e of escenarios) {
        await db.runAsync(
          `INSERT INTO phishing_challenges (
            senderName, senderEmail, subject, date, body, actionText, targetUrl, isPhishing, hintSender, hintUrl, hintUrgency, explanation, respondida
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0);`,
          [
            e.senderName,
            e.senderEmail,
            e.subject,
            e.date,
            e.body,
            e.actionText,
            e.targetUrl,
            e.isPhishing,
            e.hintSender,
            e.hintUrl,
            e.hintUrgency,
            e.explanation
          ]
        );
      }
    });
  }
  async obtenerPreguntasAleatoriasPorTema(modulo: string, tema: string, limite: number = 10): Promise<Pregunta[]> {
    await this.iniciaBD();
    const db = await this.dbPromise;
    const mod = modulo.toLowerCase().trim();
    const temaBusqueda = tema.toLowerCase().trim();

    let resultados = await db.getAllAsync<Pregunta>(
      `SELECT * FROM preguntas 
       WHERE LOWER(TRIM(modulo)) = ? AND LOWER(TRIM(tema)) LIKE ? AND respondida = 0 
       ORDER BY RANDOM() 
       LIMIT ?;`,
      [mod, `%${temaBusqueda}%`, limite]
    );

    if (resultados.length < limite) {
      await db.runAsync(
        `UPDATE preguntas SET respondida = 0 WHERE LOWER(TRIM(modulo)) = ? AND LOWER(TRIM(tema)) LIKE ?;`,
        [mod, `%${temaBusqueda}%`]
      );

      resultados = await db.getAllAsync<Pregunta>(
        `SELECT * FROM preguntas 
         WHERE LOWER(TRIM(modulo)) = ? AND LOWER(TRIM(tema)) LIKE ? AND respondida = 0 
         ORDER BY RANDOM() 
         LIMIT ?;`,
        [mod, `%${temaBusqueda}%`, limite]
      );
    }

    return resultados;
  }


  // ==========================================
  // MÉTODOS DE CONSULTA (Nombre unificado)
  // ==========================================
  async obtenerPreguntasPorTema(modulo: string, tema: string, limite: number = 10): Promise<Pregunta[]> {
    await this.iniciaBD();
    const db = await this.dbPromise;
    const mod = modulo.toLowerCase().trim();
    const temaBusqueda = tema.toLowerCase().trim();

    let resultados = await db.getAllAsync<Pregunta>(
      `SELECT * FROM preguntas 
       WHERE LOWER(TRIM(modulo)) = ? AND LOWER(TRIM(tema)) LIKE ? AND respondida = 0 
       ORDER BY RANDOM() 
       LIMIT ?;`,
      [mod, `%${temaBusqueda}%`, limite]
    );

    if (resultados.length < limite) {
      await db.runAsync(
        `UPDATE preguntas SET respondida = 0 WHERE LOWER(TRIM(modulo)) = ? AND LOWER(TRIM(tema)) LIKE ?;`,
        [mod, `%${temaBusqueda}%`]
      );

      resultados = await db.getAllAsync<Pregunta>(
        `SELECT * FROM preguntas 
         WHERE LOWER(TRIM(modulo)) = ? AND LOWER(TRIM(tema)) LIKE ? AND respondida = 0 
         ORDER BY RANDOM() 
         LIMIT ?;`,
        [mod, `%${temaBusqueda}%`, limite]
      );
    }

    return resultados;
  }

  async obtenerPreguntasAleatorias(modulo: string, limite: number = 10): Promise<Pregunta[]> {
    await this.iniciaBD();
    const db = await this.dbPromise;
    const mod = modulo.toLowerCase();

    let resultados = await db.getAllAsync<Pregunta>(
      `SELECT * FROM preguntas 
       WHERE LOWER(modulo) = ? AND respondida = 0 
       ORDER BY RANDOM() 
       LIMIT ?;`,
      [mod, limite]
    );

    if (resultados.length < limite) {
      await db.runAsync(
        `UPDATE preguntas SET respondida = 0 WHERE LOWER(modulo) = ?;`,
        [mod]
      );

      resultados = await db.getAllAsync<Pregunta>(
        `SELECT * FROM preguntas 
         WHERE LOWER(modulo) = ? AND respondida = 0 
         ORDER BY RANDOM() 
         LIMIT ?;`,
        [mod, limite]
      );
    }

    return resultados;
  }

  async marcarComoRespondida(id: number): Promise<void> {
    const db = await this.dbPromise;
    await db.runAsync('UPDATE preguntas SET respondida = 1 WHERE id = ?;', [id]);
  }

  async guardarCalificacion(
    modulo: string,
    puntaje: number,
    totalPreguntas: number
  ): Promise<void> {
    const db = await this.dbPromise;
    const fecha = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO calificaciones (modulo, puntaje, total_preguntas, fecha) 
       VALUES (?, ?, ?, ?);`,
      [modulo.toLowerCase(), puntaje, totalPreguntas, fecha]
    );
  }

  async obtenerHistorial(): Promise<Calificacion[]> {
    await this.iniciaBD();
    const db = await this.dbPromise;
    return await db.getAllAsync<Calificacion>(
      'SELECT * FROM calificaciones ORDER BY id DESC;'
    );
  }

  async obtenerEscenariosPhishing(limite: number = 10): Promise<PhishingScenario[]> {
    await this.iniciaBD();
    const db = await this.dbPromise;

    let rows = await db.getAllAsync<any>(
      `SELECT * FROM phishing_challenges 
       WHERE respondida = 0 
       ORDER BY RANDOM() 
       LIMIT ?;`,
      [limite]
    );

    if (rows.length < limite) {
      await db.runAsync('UPDATE phishing_challenges SET respondida = 0;');

      rows = await db.getAllAsync<any>(
        `SELECT * FROM phishing_challenges 
         WHERE respondida = 0 
         ORDER BY RANDOM() 
         LIMIT ?;`,
        [limite]
      );
    }

    return rows.map((row) => ({
      ...row,
      isPhishing: Boolean(row.isPhishing),
    }));
  }

  async marcarPhishingComoRespondido(ids: number[]): Promise<void> {
    const db = await this.dbPromise;
    await db.withTransactionAsync(async () => {
      for (const id of ids) {
        await db.runAsync('UPDATE phishing_challenges SET respondida = 1 WHERE id = ?;', [id]);
      }
    });
  }
}

export const dbService = new DataService();