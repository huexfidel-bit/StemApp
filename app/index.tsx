import { Stack, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [nip, setNip] = useState('');

  const manejarIngreso = () => {
    if (!usuario.trim() || !nip.trim()) {
      Alert.alert('Atención', 'Por favor ingresa tu usuario y NIP para continuar.');
      return;
    }

    // Navegar al menú principal de la app STEM
    router.replace('/home');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          

          <Image
            source={require('../assets/images/Designer.png')} // Cambia la ruta a tu imagen
            style={styles.heroImage}
            resizeMode="contain"
          />

          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.subtitle}>
            Registrate con un usuario y contraseña qué recuerdes.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Usuario / Matrícula</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. estudiante123"
            placeholderTextColor="#666"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
          />

          <Text style={styles.label}>NIP de Acceso</Text>
          <TextInput
            style={styles.input}
            placeholder="****"
            placeholderTextColor="#666"
            value={nip}
            onChangeText={setNip}
            keyboardType="numeric"
            secureTextEntry
          />

          <TouchableOpacity style={styles.buttonPrimary} onPress={manejarIngreso}>
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 12,
  },
  heroImage: {
    width: 170,
    height: 115,
    marginBottom: 12,
    borderRadius: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#000000',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  label: {
    color: '#DDDDDD',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#121212',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  buttonPrimary: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});