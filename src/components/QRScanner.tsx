import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, X } from 'lucide-react-native';

interface QRScannerProps {
  onSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onSuccess, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00A3FF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Precisamos de premissão para aceder à câmara.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Conceder Permissão</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { marginTop: 10, backgroundColor: 'transparent' }]} onPress={onClose}>
          <Text style={[styles.btnText, { color: '#64748B' }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    onSuccess(data);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      
      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <View>
            <Text style={styles.stepText}>Passo 1 de 2</Text>
            <Text style={styles.title}>Escaneamento Ativo</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.viewfinderContainer}>
           <View style={styles.viewfinder} />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={() => handleBarCodeScanned({ data: "OS-SITE-A12X-SIMULATED" })}
            style={styles.simBtn}
          >
            <Text style={styles.simBtnText}>Simular Leitura (Debug)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#0F172A' },
  errorText: { color: 'white', textAlign: 'center', marginBottom: 20, fontWeight: '700' },
  btn: { backgroundColor: '#00A3FF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { color: 'white', fontWeight: '900', textTransform: 'uppercase' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, paddingTop: 40 },
  stepText: { color: '#00A3FF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  title: { color: 'white', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 12 },
  viewfinderContainer: { alignItems: 'center', justifyContent: 'center' },
  viewfinder: { width: 250, height: 250, borderColor: '#00A3FF', borderRadius: 40, borderStyle: 'solid', borderWidth: 2 },
  footer: { padding: 24, paddingBottom: 40 },
  simBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16, alignItems: 'center' },
  simBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }
});

export default QRScanner;
