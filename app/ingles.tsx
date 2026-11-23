import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { dbService, Pregunta } from '../src/database/DataService';

interface PreguntaMezclada {
  pregunta: Pregunta;
  opcionesMezcladas: string[];
  indiceCorrectoMezclado: number;
}

const ENGLISH_TOPICS = [
  {
    id: 'Fundamentos y Tiempos Verbales Básicos',
    title: 'Fundamentos y Tiempos Verbales Básicos',
    subtitle: 'Verbo To Be, Presente Simple, Pasado Simple y pronombres',
    color: '#005d0e',
  },
  {
    id: 'Estructura Intermediaria',
    title: 'Estructura Intermediaria',
    subtitle: 'Presente Perfecto, comparativos, modales y condicionales',
    color: '#7232fe',
  },
  {
    id: 'Gramática y Funciones Avanzadas',
    title: 'Gramática y Funciones Avanzadas',
    subtitle: 'Voz pasiva, Reported Speech y Tercer Condicional',
    color: '#fb1480',
  },
  {
    id: 'Habilidades Comunicativas y Vocabulario',
    title: 'Habilidades Comunicativas y Vocabulario',
    subtitle: 'Phrasal verbs, modismos y conectores en contexto',
    color: '#b65501',
  },
];

export default function InglesScreen() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [preguntaActualMezclada, setPreguntaActualMezclada] = useState<PreguntaMezclada | null>(null);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<number | null>(null);
  const [puntaje, setPuntaje] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  // Barajado y rotación forzada de opciones para evitar respuestas estáticas
  const prepararPregunta = (pregunta: Pregunta): PreguntaMezclada => {
    const opcionesOriginales = [
      pregunta.opcion_a,
      pregunta.opcion_b,
      pregunta.opcion_c,
      pregunta.opcion_d,
    ];

    const textoCorrecto = opcionesOriginales[pregunta.respuesta_correcta];

    // 1. Desplazamiento forzado
    const desplazamiento = Math.floor(Math.random() * 3) + 1;
    let opcionesMezcladas = new Array(4);

    for (let i = 0; i < 4; i++) {
      opcionesMezcladas[(i + desplazamiento) % 4] = opcionesOriginales[i];
    }

    // 2. Mezcla secundaria
    for (let i = opcionesMezcladas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opcionesMezcladas[i], opcionesMezcladas[j]] = [opcionesMezcladas[j], opcionesMezcladas[i]];
    }

    // 3. Garantizar que nunca quede en el mismo índice de la base de datos
    const indicePrevio = pregunta.respuesta_correcta;
    let nuevoIndiceCorrecto = opcionesMezcladas.findIndex((op) => op === textoCorrecto);

    if (nuevoIndiceCorrecto === indicePrevio) {
      const posObjetivo = (nuevoIndiceCorrecto + 1) % 4;
      [opcionesMezcladas[nuevoIndiceCorrecto], opcionesMezcladas[posObjetivo]] = [
        opcionesMezcladas[posObjetivo],
        opcionesMezcladas[nuevoIndiceCorrecto],
      ];
      nuevoIndiceCorrecto = posObjetivo;
    }

    return {
      pregunta,
      opcionesMezcladas,
      indiceCorrectoMezclado: nuevoIndiceCorrecto,
    };
  };

  const cargarEjerciciosPorTema = async (topicId: string) => {
    try {
      setCargando(true);
      setSelectedTopic(topicId);
      await dbService.iniciaBD();

      const lista = await dbService.obtenerPreguntasPorTema('ingles', topicId, 10);
      setPreguntas(lista);
      setIndiceActual(0);
      setPuntaje(0);
      setOpcionSeleccionada(null);
      setMostrarResultado(false);

      if (lista.length > 0) {
        setPreguntaActualMezclada(prepararPregunta(lista[0]));
      }
    } catch (error) {
      console.error('Error al cargar preguntas de Inglés por tema:', error);
      Alert.alert('Error', 'No se pudieron cargar los ejercicios de este tema.');
    } finally {
      setCargando(false);
    }
  };

  const seleccionarOpcion = (index: number) => {
    if (opcionSeleccionada !== null || !preguntaActualMezclada) return;
    setOpcionSeleccionada(index);

    if (index === preguntaActualMezclada.indiceCorrectoMezclado) {
      setPuntaje((prev) => prev + 1);
    }
  };

  const siguientePregunta = async () => {
    if (!preguntaActualMezclada) return;

    await dbService.marcarComoRespondida(preguntaActualMezclada.pregunta.id);

    const siguienteIndice = indiceActual + 1;
    if (siguienteIndice < preguntas.length) {
      setIndiceActual(siguienteIndice);
      setPreguntaActualMezclada(prepararPregunta(preguntas[siguienteIndice]));
      setOpcionSeleccionada(null);
    } else {
      await dbService.guardarCalificacion('ingles', puntaje, preguntas.length);
      setMostrarResultado(true);
    }
  };

  const volverAlMenuTemas = () => {
    setSelectedTopic(null);
    setPreguntas([]);
    setMostrarResultado(false);
  };

  // 1. PANTALLA DE SELECCIÓN DE TEMAS
  if (!selectedTopic) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Stack.Screen options={{ title: 'Área de Inglés:', headerBackVisible: false }} />

        <Text style={styles.mainTitle}>¿Qué deseas practicar hoy?</Text>
        <Text style={styles.mainSubtitle}>Elige el apartado de inglés:</Text>

        {ENGLISH_TOPICS.map((topic) => (
          <TouchableOpacity
            key={topic.id}
            style={[styles.cardTema, { backgroundColor: topic.color }]}
            onPress={() => cargarEjerciciosPorTema(topic.id)}
          >
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicSubText}>{topic.subtitle}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.buttonPrimary, { marginTop: 20 }]}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.buttonText}>Volver al Menú Principal</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // 2. PANTALLA DE CARGA
  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Loading English exercises...</Text>
      </View>
    );
  }

  // 3. SI NO HAY PREGUNTAS EN ESTE TEMA
  if (preguntas.length === 0 && !mostrarResultado) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: selectedTopic }} />
        <Text style={styles.noDataText}>No hay preguntas disponibles para este tema todavía.</Text>
        <TouchableOpacity style={styles.buttonPrimary} onPress={volverAlMenuTemas}>
          <Text style={styles.buttonText}>Elegir otro tema</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 4. PANTALLA DE RESULTADOS DEL TEMA
  if (mostrarResultado) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Resultados' }} />
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>¡Tema Completado!</Text>
          <Text style={styles.resultScore}>
            {puntaje} / {preguntas.length}
          </Text>
          <Text style={styles.resultSubtext}>
            {puntaje === preguntas.length
              ? 'Great job! Perfect score.'
              : 'Keep practicing to master this topic!'}
          </Text>

          <TouchableOpacity style={styles.buttonPrimary} onPress={volverAlMenuTemas}>
            <Text style={styles.buttonText}>Elegir otro tema</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonPrimary, styles.buttonRetry]}
            onPress={() => cargarEjerciciosPorTema(selectedTopic)}
          >
            <Text style={styles.buttonText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 5. CUESTIONARIO ACTIVO
  const { pregunta, opcionesMezcladas, indiceCorrectoMezclado } = preguntaActualMezclada!;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen
        options={{ title: `Inglés (${indiceActual + 1}/${preguntas.length})`, headerBackVisible: false }}
      />

      {/* Barra superior con el nombre del tema */}
      <View style={styles.topBarRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{selectedTopic}</Text>
        </View>
      </View>

      <Text style={styles.questionText}>{pregunta.pregunta}</Text>

      {opcionesMezcladas.map((opcion, index) => {
        const esLaSeleccionada = opcionSeleccionada === index;
        const esCorrecta = index === indiceCorrectoMezclado;

        let optionStyle: any = styles.optionCard;
        if (opcionSeleccionada !== null && esLaSeleccionada) {
          optionStyle = esCorrecta
            ? [styles.optionCard, styles.optionCorrect]
            : [styles.optionCard, styles.optionIncorrect];
        }

        return (
          <TouchableOpacity
            key={index}
            style={optionStyle}
            onPress={() => seleccionarOpcion(index)}
            disabled={opcionSeleccionada !== null}
          >
            <Text style={styles.optionText}>{opcion}</Text>

            {opcionSeleccionada !== null && esLaSeleccionada && (
              <Text style={styles.iconStatus}>
                {esCorrecta ? ' ✅' : ' ❌'}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      {opcionSeleccionada !== null && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationTitle}>Explicación:</Text>
          <Text style={styles.explanationText}>{pregunta.explicacion}</Text>

          <TouchableOpacity style={styles.buttonNext} onPress={siguientePregunta}>
            <Text style={styles.buttonText}>
              {indiceActual + 1 === preguntas.length ? 'Finalizar' : 'Siguiente Pregunta'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botón de cambiar tema con el mismo diseño que Matemáticas */}
      <TouchableOpacity style={styles.btnCambiarTema} onPress={volverAlMenuTemas}>
        <Text style={styles.btnCambiarTemaText}>← Cambiar de Tema</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 20, paddingBottom: 36 },
  centerContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardTema: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 3,
  },
  topicTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  topicSubText: { fontSize: 13, color: '#E2E8F0' },
  loadingText: { color: '#AAAAAA', marginTop: 15, fontSize: 16 },
  noDataText: { color: '#FFFFFF', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
  },
  badgeText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  btnCambiarTema: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 28,
    marginBottom: 24,
    alignItems: 'center',
  },
  btnCambiarTemaText: { color: '#e16ffd', fontSize: 13, fontWeight: 'bold' },
  questionText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20, lineHeight: 26 },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
  },
  optionCorrect: { backgroundColor: '#14532D', borderColor: '#22C55E' },
  optionIncorrect: { backgroundColor: '#7F1D1D', borderColor: '#EF4444' },
  optionText: { color: '#FFFFFF', fontSize: 15, flex: 1 },
  iconStatus: { fontSize: 16, fontWeight: 'bold' },
  explanationBox: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#38BDF8',
  },
  explanationTitle: { color: '#38BDF8', fontWeight: 'bold', marginBottom: 6 },
  explanationText: { color: '#CCCCCC', fontSize: 14, lineHeight: 20 },
  buttonNext: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonRetry: { backgroundColor: '#378b3f' },
  buttonSecondary: { backgroundColor: '#378b3f' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  resultCard: {
    backgroundColor: '#1E1E1E',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#333333',
  },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  resultScore: { fontSize: 48, fontWeight: 'bold', color: '#38BDF8', marginBottom: 12 },
  resultSubtext: { color: '#AAAAAA', fontSize: 15, textAlign: 'center', marginBottom: 20 },
});