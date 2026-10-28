import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Uploads an image file to Firebase Storage under `posts/{authorId}/{timestamp}_{filename}`.
 * If Firebase Storage is restricted or encounters an error, safely falls back to a base64 Data URL
 * so that user uploads never fail or lose content.
 */
export async function uploadPostImage(file: File, authorId: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `posts/${authorId}/${timestamp}_${sanitizedName}`);
    
    // Attempt upload
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.warn('Firebase Storage upload failed or offline, falling back to base64 Data URL:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert image to Data URL'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
