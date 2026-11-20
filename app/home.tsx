import { Stack, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const modulos = [
    {
      id: 'matematicas',
      titulo: 'Matemáticas',
      color: '#ff2519',
      desc: 'Álgebra, geometría y conceptos clave.',
      ruta: '/matematicas',
    },
    {
      id: 'ingles',
      titulo: 'Inglés',
      color: '#0044ff',
      desc: 'Vocabulario técnico y gramática.', 
      ruta: '/ingles',
    },
    {
      id: 'phishing',
      titulo: 'Detective Anti-Phishing',
      color: '#ccff13',
      desc: 'Identifica ciberamenazas y fraudes.',
      ruta: '/phishing',
     
    },
    {
      id: 'robotica',
      titulo: 'Brazo Robótico (Beta)',
      color: '#ff3f9c',
      desc: 'Cinemática y lógica de control.',
      ruta: '/robotica',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: 'Menú Principal STEM', headerBackVisible: false }} />

      <Text style={styles.title}>Módulos Educativos</Text>
      <Text style={styles.subtitle}>Selecciona un área para comenzar tus ejercicios:</Text>

      {modulos.map((modulo) => (
        <TouchableOpacity
          key={modulo.id}
          style={[styles.card, { borderColor: modulo.color }]}
          onPress={() => router.push(modulo.ruta as any)}
        >
          <Text style={[styles.cardTitle, { color: modulo.color }]}>{modulo.titulo}</Text>
          <Text style={styles.cardDesc}>{modulo.desc}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollContent: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginTop: 10 },
  subtitle: { fontSize: 15, color: '#AAAAAA', marginBottom: 25, marginTop: 5 },
  card: {
    backgroundColor: '#000000',
    padding: 20,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 2,
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  cardDesc: { fontSize: 14, color: '#CCCCCC', lineHeight: 20 },
});