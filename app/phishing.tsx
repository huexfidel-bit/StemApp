import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dbService, PhishingScenario } from '../src/database/DataService';

export default function PhishingScreen() {
  const [scenarios, setScenarios] = useState<PhishingScenario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0); // Conteo de aciertos (1 en 1)
  const [selectedHint, setSelectedHint] = useState<string | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    title: string;
    message: string;
  }>({ show: false, isCorrect: false, title: '', message: '' });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await dbService.obtenerEscenariosPhishing();
      setScenarios(data);
      setCurrentIndex(0);
      setScore(0);
      setMostrarResultado(false);
    } catch (error) {
      console.error('Error al cargar escenarios de phishing:', error);
      Alert.alert('Error', 'No se pudieron cargar los desafíos de phishing.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Ciberseguridad: Phishing', headerBackVisible: false }} />
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Cargando desafíos desde SQLite...</Text>
      </View>
    );
  }

  if (scenarios.length === 0 && !mostrarResultado) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ title: 'Ciberseguridad: Phishing', headerBackVisible: false }} />
        <Text style={styles.emptyText}>No hay desafíos disponibles.</Text>
        <TouchableOpacity style={styles.buttonPrimary} onPress={cargarDatos}>
          <Text style={styles.buttonText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonPrimary, styles.homeButtonGreen]}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.buttonText}>Volver al Menú Principal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUserDecision = async (userGuessedPhishing: boolean) => {
    const currentScenario = scenarios[currentIndex];
    const isCorrect = userGuessedPhishing === currentScenario.isPhishing;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setFeedback({
      show: true,
      isCorrect,
      title: isCorrect ? '¡Excelente Identificación!' : '¡Ten Cuidado!',
      message: currentScenario.explanation,
    });
  };

  const handleNextScenario = async () => {
    setFeedback((prev) => ({ ...prev, show: false }));
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Guarda la calificación basada en los aciertos sobre el total de preguntas
      await dbService.guardarCalificacion('phishing', score, scenarios.length);
      setMostrarResultado(true);
    }
  };

  // Pantalla de Resultados al finalizar (idéntica a Matemáticas e Inglés)
  if (mostrarResultado) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Resultados de Phishing', headerBackVisible: false }} />
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>¡Módulo Completado!</Text>
          <Text style={styles.resultScore}>
            {score} / {scenarios.length}
          </Text>
          <Text style={styles.resultSubtext}>
            {score === scenarios.length
              ? '¡Excelente trabajo! Identificaste todos los casos.'
              : 'Buen intento, sigue practicando para detectar correos y mensajes sospechosos.'}
          </Text>

          <TouchableOpacity style={styles.buttonPrimary} onPress={cargarDatos}>
            <Text style={styles.buttonText}>Intentar de nuevo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonPrimary, styles.buttonSecondary]}
            onPress={() => router.replace('/home')}
          >
            <Text style={styles.buttonText}>Volver al Menú</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentScenario = scenarios[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: `Detective de Phishing (${currentIndex + 1}/${scenarios.length})`,
          headerBackVisible: false,
        }}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}> Lee detenidamente</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.emailCard}>
          <View style={styles.emailHeader}>
            <Text style={styles.subjectText}>{currentScenario.subject}</Text>
            <Text style={styles.dateText}>{currentScenario.date}</Text>
          </View>

          <TouchableOpacity
            style={styles.senderContainer}
            onPress={() => setSelectedHint(currentScenario.hintSender)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {currentScenario.senderName.charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.senderName}>{currentScenario.senderName}</Text>
              <Text style={styles.senderEmail}>De: {currentScenario.senderEmail}</Text>
            </View>
            <Text style={styles.inspectBadge}>🔍</Text>
          </TouchableOpacity>

          <View style={styles.emailBody}>
            <Text style={styles.bodyText}>{currentScenario.body}</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setSelectedHint(currentScenario.hintUrl)}
            >
              <Text style={styles.actionButtonText}>
                {currentScenario.actionText}
              </Text>
              <Text style={styles.urlHintText}>🔗 {currentScenario.targetUrl}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.hintBanner}
          onPress={() => setSelectedHint(currentScenario.hintUrgency)}
        >
          <Text style={styles.hintBannerText}>
             ¿Sientes presión o urgencia en este mensaje? Toca aquí.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonPrimary, styles.homeButtonGreen]}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.buttonText}>Volver al Menú Principal</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footerButtons}>
        <TouchableOpacity
          style={[styles.decisionButton, styles.safeButton]}
          onPress={() => handleUserDecision(false)}
        >
          <Text style={styles.decisionText}>✅ Correo Seguro</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.decisionButton, styles.phishingButton]}
          onPress={() => handleUserDecision(true)}
        >
          <Text style={styles.decisionText}>⚠ Es Phishing</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={selectedHint !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedHint(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pista del Inspector</Text>
            <Text style={styles.modalBody}>{selectedHint}</Text>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setSelectedHint(null)}
            >
              <Text style={styles.closeModalText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={feedback.show} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              feedback.isCorrect ? styles.correctCard : styles.incorrectCard,
            ]}
          >
            <Text style={styles.feedbackTitle}>
              {feedback.isCorrect ? '✔ ' : '✖ '}
              {feedback.title}
            </Text>
            <Text style={styles.feedbackBody}>{feedback.message}</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNextScenario}>
              <Text style={styles.nextButtonText}>Siguiente Caso ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#AAAAAA' },
  emptyText: { fontSize: 16, color: '#FFFFFF', marginBottom: 16 },
  buttonPrimary: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  homeButtonGreen: { backgroundColor: '#5d6900' },
  buttonSecondary: { backgroundColor: '#334155' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#b00303',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  scrollContent: { padding: 16, paddingBottom: 28 },
  emailCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  emailHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 12,
    marginBottom: 12,
  },
  subjectText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  dateText: { fontSize: 12, color: '#AAAAAA', marginTop: 4 },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
  senderName: { fontWeight: '600', color: '#FFFFFF' },
  senderEmail: { fontSize: 12, color: '#AAAAAA' },
  inspectBadge: { fontSize: 11, color: '#38BDF8', fontWeight: 'bold' },
  emailBody: { marginTop: 8 },
  bodyText: { fontSize: 14, color: '#DDDDDD', lineHeight: 20 },
  actionButton: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  urlHintText: { color: '#93C5FD', fontSize: 11, marginTop: 4 },
  hintBanner: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#332B00',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  hintBannerText: { color: '#FCD34D', fontSize: 13, textAlign: 'center' },
  footerButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 12,
  },
  decisionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  safeButton: { backgroundColor: '#166534' },
  phishingButton: { backgroundColor: '#991B1B' },
  decisionText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#FFFFFF' },
  modalBody: { fontSize: 14, color: '#DDDDDD', marginBottom: 20, lineHeight: 20 },
  closeModalButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalText: { color: '#FFFFFF', fontWeight: 'bold' },
  correctCard: { borderLeftWidth: 6, borderLeftColor: '#22C55E' },
  incorrectCard: { borderLeftWidth: 6, borderLeftColor: '#EF4444' },
  feedbackTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#FFFFFF' },
  feedbackBody: { fontSize: 14, color: '#DDDDDD', lineHeight: 20, marginBottom: 20 },
  nextButton: { backgroundColor: '#334155', padding: 12, borderRadius: 8, alignItems: 'center' },
  nextButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  resultCard: {
    backgroundColor: '#1E1E1E',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 40,
  },
  resultTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  resultScore: { fontSize: 48, fontWeight: 'bold', color: '#38BDF8', marginBottom: 12 },
  resultSubtext: { color: '#AAAAAA', fontSize: 16, textAlign: 'center', marginBottom: 20 },
});