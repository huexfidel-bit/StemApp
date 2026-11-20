import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Longitudes físicas simuladas de los eslabones (en mm)
const L1 = 110; // Brazo principal
const L2 = 90;  // Antebrazo

const RUTINAS_EJEMPLO = {
  pickAndPlace: `// Rutina: Tomar y colocar pieza
PINZA ABRIR
J1 -35
J2 60
ESPERAR 0.6
PINZA CERRAR
ESPERAR 0.5
J1 -75
J2 30
PINZA ABRIR
J1 -45
J2 45`,
  calibracion: `// Rutina: Barrido de ejes
J1 -90
J2 0
ESPERAR 0.5
J1 -20
J2 80
ESPERAR 0.5      
J1 -45
J2 45`,
};

export default function RoboticaScreen() {
  // Ángulos en grados: J1 (Hombro respecto a la horizontal), J2 (Codo relativo a J1)
  const [j1, setJ1] = useState(-45);
  const [j2, setJ2] = useState(45);
  const [pinzaAbierta, setPinzaAbierta] = useState(true);

  // Estado de consola de programación y modal de edición
  const [codigo, setCodigo] = useState(RUTINAS_EJEMPLO.pickAndPlace);
  const [borradorCodigo, setBorradorCodigo] = useState(RUTINAS_EJEMPLO.pickAndPlace);
  const [modalEditorVisible, setModalEditorVisible] = useState(false);
  const [mostrarGuiaComandos, setMostrarGuiaComandos] = useState(false);

  const [ejecutando, setEjecutando] = useState(false);
  const [lineaActual, setLineaActual] = useState<number | null>(null);
  const [logConsola, setLogConsola] = useState('SISTEMA LISTO // MODO MANUAL');
  const abortarRef = useRef(false);

  // Valores animados
  const animJ1 = useRef(new Animated.Value(-45)).current;
  const animJ2 = useRef(new Animated.Value(45)).current;

  useEffect(() => {
    Animated.spring(animJ1, {
      toValue: j1,
      useNativeDriver: true,
      friction: 8,
      tension: 45,
    }).start();
  }, [j1, animJ1]);

  useEffect(() => {
    Animated.spring(animJ2, {
      toValue: j2,
      useNativeDriver: true,
      friction: 8,
      tension: 45,
    }).start();
  }, [j2, animJ2]);

  // Cálculo de Cinemática Directa (Posición X, Y del efector final en mm)
  const rad1 = (Math.abs(j1) * Math.PI) / 180;
  const rad12 = ((Math.abs(j1) - j2) * Math.PI) / 180;
  const posX = Math.round(L1 * Math.cos(rad1) + L2 * Math.cos(rad12));
  const posY = Math.round(L1 * Math.sin(rad1) + L2 * Math.sin(rad12));

  const esperar = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const abrirEditor = () => {
    if (ejecutando) return;
    setBorradorCodigo(codigo);
    setMostrarGuiaComandos(false);
    setModalEditorVisible(true);
  };

  const insertarComando = (cmd: string) => {
    setBorradorCodigo((prev) => (prev.trim() ? `${prev}\n${cmd}` : cmd));
  };

  const ejecutarScriptConCodigo = async (scriptAEjecutar: string) => {
    if (ejecutando) return;
    abortarRef.current = false;
    setEjecutando(true);

    const lineas = scriptAEjecutar.split('\n');

    for (let i = 0; i < lineas.length; i++) {
      if (abortarRef.current) {
        setLogConsola('PARO DE EMERGENCIA ACTIVADO');
        break;
      }

      const limpia = lineas[i].trim().toUpperCase();
      if (!limpia || limpia.startsWith('//')) continue;

      setLineaActual(i + 1);
      const [cmd, arg] = limpia.split(/\s+/);

      if (cmd === 'J1' && !isNaN(Number(arg))) {
        const val = Math.max(-110, Math.min(-10, Number(arg)));
        setJ1(val);
        setLogConsola(`L${i + 1}: Moviendo Eje J1 a ${val}°`);
        await esperar(550);
      } else if (cmd === 'J2' && !isNaN(Number(arg))) {
        const val = Math.max(-20, Math.min(110, Number(arg)));
        setJ2(val);
        setLogConsola(`L${i + 1}: Moviendo Eje J2 a ${val}°`);
        await esperar(550);
      } else if (cmd === 'PINZA') {
        const abrir = arg === 'ABRIR';
        setPinzaAbierta(abrir);
        setLogConsola(`L${i + 1}: Efector final -> ${abrir ? 'ABIERTO' : 'CERRADO'}`);
        await esperar(400);
      } else if (cmd === 'ESPERAR') {
        const seg = Math.min(5, Math.max(0.1, Number(arg) || 0.5));
        setLogConsola(`L${i + 1}: Pausa de ${seg}s`);
        await esperar(seg * 1000);
      } else {
        setLogConsola(`ERROR SINTAXIS EN LÍNEA ${i + 1}: ${limpia}`);
        await esperar(900);
      }
    }

    if (!abortarRef.current) {
      setLogConsola('RUTINA COMPLETADA EXITOSAMENTE');
    }
    setLineaActual(null);
    setEjecutando(false);
  };

  const guardarYEjecutar = () => {
    setCodigo(borradorCodigo);
    setModalEditorVisible(false);
    setTimeout(() => {
      ejecutarScriptConCodigo(borradorCodigo);
    }, 200);
  };

  const detenerEmergencia = () => {
    abortarRef.current = true;
  };

  const rotJ1 = animJ1.interpolate({
    inputRange: [-180, 180],
    outputRange: ['-180deg', '180deg'],
  });

  const rotJ2 = animJ2.interpolate({
    inputRange: [-180, 180],
    outputRange: ['-180deg', '180deg'],
  });

  const totalLineas = codigo.split('\n').filter((l) => l.trim().length > 0).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: 'Laboratorio de Robótica', headerBackVisible: false }} />

      {/* ENCABEZADO TÉCNICO */}
      <View style={styles.headerPanel}>
        <View>
          <Text style={styles.headerTag}>SIMULADOR CINEMÁTICO STEM</Text>
          <Text style={styles.headerTitle}>Manipulador Articulado</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: ejecutando ? '#F59E0B' : '#10B981' }]} />
          <Text style={styles.statusBadgeText}>{ejecutando ? 'AUTO' : 'ONLINE'}</Text>
        </View>
      </View>

      {/* TELEMETRÍA DE CINEMÁTICA DIRECTA */}
      <View style={styles.telemetryBar}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>EJE J1 (θ₁)</Text>
          <Text style={styles.telemetryValue}>{j1}°</Text>
        </View>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>EJE J2 (θ₂)</Text>
          <Text style={styles.telemetryValue}>{j2}°</Text>
        </View>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>EFECTOR (X, Y)</Text>
          <Text style={styles.telemetryValue}>{posX}, {posY} mm</Text>
        </View>
      </View>

      {/* LIENZO DE SIMULACIÓN CON REJILLA */}
      <View style={styles.viewport}>
        <View style={styles.gridHorizontal} />
        <View style={styles.gridVertical} />
        <Text style={styles.axisLabelY}>+Y (mm)</Text>
        <Text style={styles.axisLabelX}>+X (mm)</Text>

        <View style={styles.originAnchor}>
          <Animated.View
            style={[
              styles.link1Pivot,
              {
                transform: [
                  { translateX: -L1 / 2 },
                  { rotate: rotJ1 },
                  { translateX: L1 / 2 },
                ],
              },
            ]}
          >
            <View style={styles.link1Body}>
              <Text style={styles.linkCode}>L1: {L1}mm</Text>
            </View>

            <Animated.View
              style={[
                styles.link2Pivot,
                {
                  transform: [
                    { translateX: -L2 / 2 },
                    { rotate: rotJ2 },
                    { translateX: L2 / 2 },
                  ],
                },
              ]}
            >
              <View style={styles.servoJoint}>
                <View style={styles.servoCore} />
              </View>

              <View style={styles.link2Body}>
                <Text style={styles.linkCode}>L2: {L2}mm</Text>
              </View>

              <View style={styles.gripperHub}>
                <View
                  style={[
                    styles.gripperFingerTop,
                    { transform: [{ translateY: pinzaAbierta ? -6 : -1 }] },
                  ]}
                />
                <View
                  style={[
                    styles.gripperFingerBottom,
                    { transform: [{ translateY: pinzaAbierta ? 6 : 1 }] },
                  ]}
                />
              </View>
            </Animated.View>
          </Animated.View>

          <View style={styles.baseServo}>
            <View style={styles.servoCore} />
          </View>
          <View style={styles.pedestalNeck} />
          <View style={styles.pedestalFoot} />
        </View>
      </View>

      {/* BARRA DE LOGS DEL CONTROLADOR */}
      <View style={styles.consoleStatus}>
        <Text style={styles.consoleStatusText}>&gt; {logConsola}</Text>
      </View>

      {/* CONTROL MANUAL DE EJES (JOGGING) */}
      <Text style={styles.sectionTitle}>CONTROL MANUAL DE EJES (JOG)</Text>
      <View style={styles.jogGrid}>
        <View style={styles.jogCard}>
          <Text style={styles.jogTitle}>Hombro (J1)</Text>
          <View style={styles.jogButtons}>
            <TouchableOpacity
              style={styles.jogBtn}
              disabled={ejecutando}
              onPress={() => {
                setLogConsola('JOG MANUAL: Eje J1 -10°');
                setJ1((v) => Math.max(-110, v - 10));
              }}
            >
              <Text style={styles.jogBtnText}>-10°</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.jogBtn}
              disabled={ejecutando}
              onPress={() => {
                setLogConsola('JOG MANUAL: Eje J1 +10°');
                setJ1((v) => Math.min(-10, v + 10));
              }}
            >
              <Text style={styles.jogBtnText}>+10°</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.jogCard}>
          <Text style={styles.jogTitle}>Codo (J2)</Text>
          <View style={styles.jogButtons}>
            <TouchableOpacity
              style={styles.jogBtn}
              disabled={ejecutando}
              onPress={() => {
                setLogConsola('JOG MANUAL: Eje J2 -10°');
                setJ2((v) => Math.max(-20, v - 10));
              }}
            >
              <Text style={styles.jogBtnText}>-10°</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.jogBtn}
              disabled={ejecutando}
              onPress={() => {
                setLogConsola('JOG MANUAL: Eje J2 +10°');
                setJ2((v) => Math.min(110, v + 10));
              }}
            >
              <Text style={styles.jogBtnText}>+10°</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.gripperToggleBtn}
        disabled={ejecutando}
        onPress={() => {
          setPinzaAbierta((prev) => {
            const next = !prev;
            setLogConsola(`EFECTOR FINAL: ${next ? 'ABIERTO' : 'CERRADO'}`);
            return next;
          });
        }}
      >
        <Text style={styles.gripperToggleText}>
          EFECTOR FINAL: {pinzaAbierta ? 'CERRAR PINZA' : 'ABRIR PINZA'}
        </Text>
      </TouchableOpacity>

      {/* TARJETA RESUMEN DE RUTINA + ABRIR VENTANA DE CÓDIGO */}
      <Text style={styles.sectionTitle}>PROGRAMACIÓN DE SECUENCIA</Text>
      <View style={styles.scriptSummaryCard}>
        <View style={styles.scriptSummaryHeader}>
          <Text style={styles.scriptSummaryTitle}>RUTINA ACTIVA ({totalLineas} líneas)</Text>
          {lineaActual !== null && (
            <Text style={styles.activeLineBadge}>LÍNEA {lineaActual}</Text>
          )}
        </View>

        <Text numberOfLines={4} style={styles.scriptPreviewText}>
          {codigo}
        </Text>

        <TouchableOpacity
          style={[styles.openEditorBtn, ejecutando && { opacity: 0.5 }]}
          onPress={abrirEditor}
          disabled={ejecutando}
        >
          <Text style={styles.openEditorBtnText}> ABRIR EDITOR DE CÓDIGO</Text>
        </TouchableOpacity>
      </View>

      {/* CONTROLES DE EJECUCIÓN */}
      <View style={styles.runControls}>
        <TouchableOpacity
          style={[styles.runBtn, ejecutando && { opacity: 0.5 }]}
          onPress={() => ejecutarScriptConCodigo(codigo)}
          disabled={ejecutando}
        >
          <Text style={styles.runBtnText}>▶ EJECUTAR CÓDIGO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={detenerEmergencia}
          disabled={!ejecutando}
        >
          <Text style={styles.stopBtnText}>■ STOP</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/home')}>
        <Text style={styles.homeBtnText}>Volver al Menú Principal</Text>
      </TouchableOpacity>

      {/* VENTANA APARTE (MODAL) PARA ESCRIBIR CÓDIGO CON LIBERTAD */}
      <Modal
        visible={modalEditorVisible}
        animationType="slide"
        onRequestClose={() => setModalEditorVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Editor de Rutina del Brazo</Text>
            <TouchableOpacity onPress={() => setModalEditorVisible(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* MENÚ EXPLICATIVO DE CÓMO CODIFICAR */}
          <View style={styles.guideHeaderRow}>
            <Text style={styles.syntaxHelp}>
              Una instrucción por línea · Sin distinguir mayúsculas
            </Text>
            <TouchableOpacity
              style={styles.guideToggleBtn}
              onPress={() => setMostrarGuiaComandos((prev) => !prev)}
            >
              <Text style={styles.guideToggleText}>
                {mostrarGuiaComandos ? 'Ocultar Guía' : ' Cómo codificar'}
              </Text>
            </TouchableOpacity>
          </View>

          {mostrarGuiaComandos && (
            <View style={styles.guideBox}>
              <Text style={styles.guideTitle}>GUÍA RÁPIDA DE INSTRUCCIONES</Text>

              <Text style={styles.guideItem}>
                <Text style={styles.guideCmd}>J1 [-110 a -10]</Text> — Mueve el hombro (eslabón base) en grados. Ej:{' '}
                <Text style={styles.guideExample}>J1 -45</Text>
              </Text>

              <Text style={styles.guideItem}>
                <Text style={styles.guideCmd}>J2 [-20 a 110]</Text> — Dobla o estira el codo respecto al hombro. Ej:{' '}
                <Text style={styles.guideExample}>J2 60</Text>
              </Text>

              <Text style={styles.guideItem}>
                <Text style={styles.guideCmd}>PINZA [ABRIR | CERRAR]</Text> — Controla el efector final. Ej:{' '}
                <Text style={styles.guideExample}>PINZA CERRAR</Text>
              </Text>

              <Text style={styles.guideItem}>
                <Text style={styles.guideCmd}>ESPERAR [seg]</Text> — Pausa la secuencia (0.1 a 5 seg). Ej:{' '}
                <Text style={styles.guideExample}>ESPERAR 0.5</Text>
              </Text>

              <Text style={styles.guideNote}>
                Tip: Usa <Text style={styles.guideExample}>//</Text> al inicio de una línea para escribir comentarios que el robot ignora.
              </Text>
            </View>
          )}

          {/* PLANTILLAS E INSERCIÓN RÁPIDA */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbarScroll}>
            <TouchableOpacity
              style={styles.insertChip}
              onPress={() => setBorradorCodigo(RUTINAS_EJEMPLO.pickAndPlace)}
            >
              <Text style={styles.insertChipText}>Plantilla: Pick & Place</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.insertChip}
              onPress={() => setBorradorCodigo(RUTINAS_EJEMPLO.calibracion)}
            >
              <Text style={styles.insertChipText}>Plantilla: Barrido</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.insertChip} onPress={() => insertarComando('J1 -50')}>
              <Text style={styles.insertChipText}>+ J1 -50</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.insertChip} onPress={() => insertarComando('J2 60')}>
              <Text style={styles.insertChipText}>+ J2 60</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.insertChip}
              onPress={() => insertarComando('PINZA CERRAR')}
            >
              <Text style={styles.insertChipText}>+ PINZA CERRAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.insertChip} onPress={() => insertarComando('ESPERAR 1')}>
              <Text style={styles.insertChipText}>+ ESPERA 1</Text>
            </TouchableOpacity>
          </ScrollView>

          <TextInput
            style={styles.modalEditorInput}
            multiline
            autoFocus
            value={borradorCodigo}
            onChangeText={setBorradorCodigo}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Escribe aquí tus instrucciones..."
            placeholderTextColor="#64748B"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => {
                setCodigo(borradorCodigo);
                setModalEditorVisible(false);
                setLogConsola('RUTINA GUARDADA');
              }}
            >
              <Text style={styles.modalBtnText}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalRunBtn} onPress={guardarYEjecutar}>
              <Text style={styles.modalBtnText}>▶ Guardar y Ejecutar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 18, paddingBottom: 40 },
  headerPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTag: { color: '#38BDF8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  headerTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: 'bold' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusBadgeText: { color: '#E2E8F0', fontSize: 11, fontWeight: 'bold' },

  telemetryBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 12,
  },
  telemetryItem: { flex: 1, alignItems: 'center' },
  telemetryLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
  telemetryValue: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold', marginTop: 2, fontFamily: 'monospace' },

  viewport: {
    height: 250,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    position: 'relative',
  },
  gridHorizontal: {
    position: 'absolute',
    bottom: 42,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#1E293B',
  },
  gridVertical: {
    position: 'absolute',
    left: 75,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#1E293B',
  },
  axisLabelY: { position: 'absolute', top: 10, left: 82, color: '#475569', fontSize: 10, fontFamily: 'monospace' },
  axisLabelX: { position: 'absolute', bottom: 46, right: 12, color: '#475569', fontSize: 10, fontFamily: 'monospace' },

  originAnchor: {
    position: 'absolute',
    left: 75,
    bottom: 42,
    alignItems: 'center',
  },
  link1Pivot: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: L1,
    height: 16,
    justifyContent: 'center',
  },
  link1Body: {
    width: L1,
    height: 14,
    backgroundColor: '#2563EB',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkCode: { color: '#DBEAFE', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace' },

  link2Pivot: {
    position: 'absolute',
    left: L1 - 4,
    width: L2,
    height: 14,
    justifyContent: 'center',
  },
  link2Body: {
    width: L2,
    height: 11,
    backgroundColor: '#0D9488',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#2DD4BF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  servoJoint: {
    position: 'absolute',
    left: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  baseServo: {
    position: 'absolute',
    left: -11,
    bottom: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
  },
  servoCore: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F8FAFC' },
  pedestalNeck: {
    position: 'absolute',
    left: -12,
    bottom: -30,
    width: 24,
    height: 22,
    backgroundColor: '#334155',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  pedestalFoot: {
    position: 'absolute',
    left: -34,
    bottom: -38,
    width: 68,
    height: 10,
    backgroundColor: '#475569',
    borderRadius: 3,
  },

  gripperHub: {
    position: 'absolute',
    right: -14,
    width: 16,
    height: 20,
    justifyContent: 'center',
  },
  gripperFingerTop: {
    width: 14,
    height: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  gripperFingerBottom: {
    width: 14,
    height: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },

  consoleStatus: {
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 10,
  },
  consoleStatusText: { color: '#10B981', fontFamily: 'monospace', fontSize: 12 },

  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  jogGrid: { flexDirection: 'row', gap: 10 },
  jogCard: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  jogTitle: { color: '#E2E8F0', fontSize: 13, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  jogButtons: { flexDirection: 'row', gap: 8 },
  jogBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  jogBtnText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 13 },

  gripperToggleBtn: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  gripperToggleText: { color: '#F59E0B', fontWeight: 'bold', fontSize: 13 },

  scriptSummaryCard: {
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  scriptSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scriptSummaryTitle: { color: '#E2E8F0', fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' },
  activeLineBadge: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#29200C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scriptPreviewText: {
    color: '#94A3B8',
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  openEditorBtn: {
    backgroundColor: '#1E293B',
    padding: 11,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  openEditorBtnText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 13 },

  runControls: { flexDirection: 'row', gap: 10, marginTop: 12 },
  runBtn: {
    flex: 3,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  runBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  stopBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  homeBtn: {
    backgroundColor: '#378b3f',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  homeBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  // Estilos del Modal Editor y Guía
  modalContainer: {
    flex: 1,
    backgroundColor: '#0B0F19',
    padding: 18,
    paddingTop: 24,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: 'bold' },
  modalCloseText: { color: '#94A3B8', fontSize: 14, fontWeight: 'bold' },
  guideHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  syntaxHelp: { color: '#64748B', fontSize: 11, fontFamily: 'monospace', flex: 1 },
  guideToggleBtn: {
    backgroundColor: '#172554',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  guideToggleText: { color: '#93C5FD', fontSize: 12, fontWeight: 'bold' },
  guideBox: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  guideTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  guideItem: { color: '#CBD5E1', fontSize: 12, lineHeight: 18, marginBottom: 6 },
  guideCmd: { color: '#FBBF24', fontFamily: 'monospace', fontWeight: 'bold' },
  guideExample: { color: '#34D399', fontFamily: 'monospace' },
  guideNote: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    paddingTop: 6,
  },
  toolbarScroll: { maxHeight: 38, marginBottom: 10 },
  insertChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  insertChipText: { color: '#38BDF8', fontSize: 12, fontWeight: 'bold' },
  modalEditorInput: {
    flex: 1,
    backgroundColor: '#020617',
    color: '#E2E8F0',
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  modalRunBtn: {
    flex: 2,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});