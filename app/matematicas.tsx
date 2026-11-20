import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
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

export default function MatematicasScreen() {
  const [temaSeleccionado, setTemaSeleccionado] = useState<string | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [preguntaActualMezclada, setPreguntaActualMezclada] = useState<PreguntaMezclada | null>(null);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<number | null>(null);
  const [puntaje, setPuntaje] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [mostrarResultado, setMostrarResultado] = useState(false);

  useEffect(() => {
    dbService.iniciaBD().catch((error) => {
      console.error('Error al inicializar la base de datos:', error);
      Alert.alert('Error', 'No se pudo inicializar la base de datos SQLite.');
    });
  }, []);

  const prepararPregunta = (pregunta: Pregunta): PreguntaMezclada => {
    const opcionesOriginales = [
      pregunta.opcion_a,
      pregunta.opcion_b,
      pregunta.opcion_c,
      pregunta.opcion_d,
    ];

    const textoCorrecto = opcionesOriginales[pregunta.respuesta_correcta];
    const desplazamiento = Math.floor(Math.random() * 3) + 1; 
    let opcionesMezcladas = new Array(4);

    for (let i = 0; i < 4; i++) {
      opcionesMezcladas[(i + desplazamiento) % 4] = opcionesOriginales[i];
    }

    for (let i = opcionesMezcladas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opcionesMezcladas[i], opcionesMezcladas[j]] = [opcionesMezcladas[j], opcionesMezcladas[i]];
    }

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

  const cargarEjerciciosPorTema = async (tema: string) => {
    try {
      setCargando(true);
      setTemaSeleccionado(tema);
      await dbService.iniciaBD();

      // Llamada correcta al método unificado en DataService
      const lista = await dbService.obtenerPreguntasPorTema('matematicas', tema, 10);
      setPreguntas(lista);
      setIndiceActual(0);
      setPuntaje(0);
      setOpcionSeleccionada(null);
      setMostrarResultado(false);

      if (lista.length > 0) {
        setPreguntaActualMezclada(prepararPregunta(lista[0]));
      } else {
        setPreguntaActualMezclada(null);
      }
    } catch (error) {
      console.error('Error al cargar ejercicios:', error);
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
      await dbService.guardarCalificacion(`Matemáticas - ${temaSeleccionado}`, puntaje, preguntas.length);
      setMostrarResultado(true);
    }
  };

  if (!temaSeleccionado) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Stack.Screen options={{ title: 'Área de Matemáticas:', headerBackVisible: false }} />

        <Text style={styles.menuQuestion}>¿Qué deseas practicar hoy?</Text>
        <Text style={styles.menuSubtitle}>Selecciona una categoría para comenzar con los ejercicios:</Text>

        <TouchableOpacity 
          style={[styles.cardTema, { backgroundColor: '#1854fb' }]} 
          onPress={() => cargarEjerciciosPorTema('Algebra')}
        >
          <Text style={styles.tituloCard}> Álgebra</Text>
          <Text style={styles.descCard}>Práctica de ecuaciones, productos notables y expresiones algebraicas.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.cardTema, { backgroundColor: '#00553d' }]} 
          onPress={() => cargarEjerciciosPorTema('Geometria')}
        >
          <Text style={styles.tituloCard}> Geometria</Text>
          <Text style={styles.descCard}>Identificar y calcular figuras geométricas, áreas, perímetros y volúmenes.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.cardTema, { backgroundColor: '#5B21B6' }]} 
          onPress={() => cargarEjerciciosPorTema('Trigonometria')}
        >
          <Text style={styles.tituloCard}> Trigonometría</Text>
          <Text style={styles.descCard}>Comprender y aplicar razones trigonométricas para resolver triángulos.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.cardTema, { backgroundColor: '#f04507' }]} 
          onPress={() => cargarEjerciciosPorTema('Calculo Diferencial')}
        >
          <Text style={styles.tituloCard}>Cálculo Diferencial</Text>
          <Text style={styles.descCard}>Comprender y aplicar derivadas para analizar funciones y tasas de cambio.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonPrimary, { marginTop: 25, backgroundColor: '#378b3f' }]}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.buttonText}>Volver al Menú Principal</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: `Matemáticas: ${temaSeleccionado}` }} />
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Cargando ejercicios de {temaSeleccionado}...</Text>
      </View>
    );
  }

  if ((preguntas.length === 0 || !preguntaActualMezclada) && !mostrarResultado) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: `Matemáticas: ${temaSeleccionado}` }} />
        <Text style={styles.noDataText}>No hay preguntas disponibles para el tema de {temaSeleccionado}.</Text>
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => setTemaSeleccionado(null)}>
          <Text style={styles.buttonText}>Elegir otro tema</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mostrarResultado) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Resultados' }} />
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>¡Tema Completado!</Text>
          <Text style={styles.resultSubtitleResult}>{temaSeleccionado}</Text>
          <Text style={styles.resultScore}>
            {puntaje} / {preguntas.length}
          </Text>
          <Text style={styles.resultSubtext}>
            {puntaje === preguntas.length
              ? '¡Excelente trabajo! Dominas este tema a la perfección.'
              : 'Buen intento, sigue practicando para mejorar tu calificación.'}
          </Text>

          <TouchableOpacity style={styles.buttonPrimary} onPress={() => cargarEjerciciosPorTema(temaSeleccionado)}>
            <Text style={styles.buttonText}>Intentar de nuevo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonPrimary, styles.buttonSecondary]}
            onPress={() => setTemaSeleccionado(null)}
          >
            <Text style={styles.buttonText}>Elegir otro tema</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { pregunta, opcionesMezcladas, indiceCorrectoMezclado } = preguntaActualMezclada!;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: `${temaSeleccionado} (${indiceActual + 1}/${preguntas.length})` }} />

      <View style={styles.headerBar}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pregunta.tema}</Text>
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
        } else if (opcionSeleccionada !== null && esCorrecta) {
          optionStyle = [styles.optionCard, styles.optionCorrectHint];
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
              <Text style={styles.iconStatus}>{esCorrecta ? ' ✅' : ' ❌'}</Text>
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
              {indiceActual + 1 === preguntas.length ? 'Ver Resultados' : 'Siguiente Pregunta'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.btnCambiarTema} onPress={() => setTemaSeleccionado(null)}>
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
  loadingText: { color: '#AAAAAA', marginTop: 15, fontSize: 16 },
  noDataText: { color: '#FFFFFF', fontSize: 18, marginBottom: 20, textAlign: 'center' },
  
  menuQuestion: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 15, marginBottom: 8, textAlign: 'center' },
  menuSubtitle: { fontSize: 15, color: '#94A3B8', marginBottom: 24, textAlign: 'center' },
  cardTema: {
    padding: 20,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tituloCard: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
  descCard: { fontSize: 14, color: '#CBD5E1' },

  headerBar: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 },
  btnCambiarTema: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 28,
    alignItems: 'center',
  },
  btnCambiarTemaText: { color: '#e16ffd', fontSize: 13, fontWeight: 'bold' },

  badge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { color: '#f0b30c', fontWeight: 'bold', fontSize: 12 },
  questionText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20, lineHeight: 28 },
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
  optionCorrectHint: { borderColor: '#22C55E', borderWidth: 1.5 },
  optionText: { color: '#FFFFFF', fontSize: 16, flex: 1 },
  iconStatus: { fontSize: 18, fontWeight: 'bold' },
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
  buttonSecondary: { backgroundColor: '#378b3f' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  resultCard: {
    backgroundColor: '#1E1E1E',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
    marginHorizontal: 16,
  },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  resultSubtitleResult: { fontSize: 16, color: '#38BDF8', fontWeight: '600', marginBottom: 16 },
  resultScore: { fontSize: 48, fontWeight: 'bold', color: '#38BDF8', marginBottom: 12 },
  resultSubtext: { color: '#CCCCCC', fontSize: 15, textAlign: 'center', marginBottom: 20 },
});