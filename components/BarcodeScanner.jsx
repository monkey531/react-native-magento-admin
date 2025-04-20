import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, SafeAreaView } from 'react-native';
import { Camera, useCameraPermissions } from 'expo-camera';

const BarcodeScanner = ({ barcode, setBarcode }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  //const [barcode, setBarcode] = useState(null);

  const handleBarCodeScanned = (result) => {
    if (!scanned && result.type === 'org.gs1.EAN-13') {
      setScanned(true);
      setBarcode(result.data);
    }
  };

  if (!permission) return <Text>Requesting camera permission...</Text>;
  if (!permission.granted) return <Text>No access to camera</Text>;

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: ['ean13'],
        }}
      />
      {scanned && (
        <View style={styles.result}>
          <Text style={styles.resultText}>Scanned EAN-13: {barcode}</Text>
          <Button title="Scan Again" onPress={() => setScanned(false)} />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  result: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default BarcodeScanner;
