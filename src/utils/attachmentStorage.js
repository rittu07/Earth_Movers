import { getAuthHeaders } from '../context/AuthContext';
import { API_URL } from './apiUrl';
import { validateAttachmentFile } from './documentSecurity';

const compressImage = async (file) => {
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
  if (!blob) throw new Error('Image compression failed');
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
};

export const uploadAttachment = async (file, category = 'maintenance') => {
  const validationError = validateAttachmentFile(file);
  if (validationError) throw new Error(validationError);
  const uploadFile = await compressImage(file);
  const body = new FormData();
  body.append('file', uploadFile, uploadFile.name);
  body.append('category', category);

  const response = await fetch(`${API_URL}/api/attachments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Attachment upload failed');
  return result;
};
