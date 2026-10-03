import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { requireStorage } from '@/config/firebase';

async function compressImage(uri: string, width: number): Promise<string> {
  const rendered = await ImageManipulator.manipulate(uri).resize({ width }).renderAsync();
  const saved = await rendered.saveAsync({
    compress: 0.72,
    format: SaveFormat.JPEG,
  });
  return saved.uri;
}

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

export async function uploadImage(localUri: string, storagePath: string, width = 1600): Promise<string> {
  const compressedUri = await compressImage(localUri, width);
  const blob = await uriToBlob(compressedUri);
  const fileRef = ref(requireStorage(), storagePath);
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(fileRef);
}
