import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useBarcode } from '@/app/context/BarcodeContext';
import { useProduct } from '@/app/context/ProductContext';

export default function AddProductScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { formData, setFormData, mainImage, setMainImage, additionalImages, setAdditionalImages } = useProduct();
  const { barcode } = useBarcode();
  const [loading, setLoading] = useState(false);

  const pickImage = async (isMainImage: boolean = true) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });

      if (!result.canceled) {
        const base64Image = result.assets[0].base64;
        const type = result.assets[0].type;
        if (base64Image) {
          if (isMainImage) {
            setMainImage(base64Image);
          } else {
            setAdditionalImages([...additionalImages, base64Image]);
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index));
  };

  const setEncode = (data: string) => {
    setFormData({ ...formData, eancode: data });
  }

  const handleSubmit = async () => {
    if (!formData.sku || !formData.name || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const productData = {
        product: {
          name: formData.name,
          sku: formData.sku,
          status: 1 as 1 | 2 | null,
          price: formData.price,
          weight: formData.weight,
          type_id: "simple",
          attribute_set_id: 4,
          custom_attributes: [
            {
              attribute_code: "eancode",
              value: formData.eancode
            }
          ] as [{ attribute_code: string; value: string }],
        }
      };

      // Create the product first
      const createdProduct = await api.createProduct(user?.token || '', productData);

      // Upload main image if selected
      if (mainImage) {
        await api.uploadProductImage(user?.token || '', formData.sku, mainImage, 0);
      }

      // Upload additional images
      for (let i = 0; i < additionalImages.length; i++) {
        await api.uploadProductImage(user?.token || '', formData.sku, additionalImages[i], i + 1);
      }

      Alert.alert('Success', 'Product created successfully', [
        {
          text: 'OK',
          onPress: () => router.push('/products'),
        },
      ]);
    } catch (error: any) {
      console.log('Error details:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barcode) {
      setFormData({ ...formData, eancode: barcode });
    }
  }, [barcode]);

  return (
    <View style={styles.container}>
      {/* <BarcodeScanner /> */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/products')}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Main Image</Text>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={() => pickImage(true)}
            >
              {mainImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${mainImage}` }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setMainImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera" size={32} color="#666" />
                  <Text style={styles.imagePickerText}>Select Main Image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Additional Images</Text>
            <View style={styles.additionalImagesContainer}>
              {additionalImages.map((image, index) => (
                <View key={index} style={styles.additionalImageContainer}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${image}` }}
                    style={styles.additionalImage}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
              {additionalImages.length < 4 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => pickImage(false)}
                >
                  <Ionicons name="add" size={32} color="#666" />
                  <Text style={styles.imagePickerText}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>SKU *</Text>
            <TextInput
              style={styles.input}
              value={formData.sku}
              onChangeText={(text) => setFormData({ ...formData, sku: text })}
              placeholder="Enter product SKU"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter product name"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={formData.price.toString()}
              onChangeText={(text) => setFormData({ ...formData, price: parseFloat(text) || 0 })}
              placeholder="Enter product price"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Weight</Text>
            <TextInput
              style={styles.input}
              value={formData.weight.toString()}
              onChangeText={(text) => setFormData({ ...formData, weight: parseFloat(text) || 0 })}
              placeholder="Enter product weight"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>EAN Code</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={formData.eancode}
                onChangeText={(text) => setFormData({ ...formData, eancode: text })}
                placeholder="Enter product EAN code"
              />
              <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/products/scanner')}>
                <Ionicons name="scan" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter product description"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Product</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  imagePickerText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 200,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  additionalImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  additionalImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  additionalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  scanButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  inputContainer: {
    width: '100%',
    gap: 0,
  },
}); 