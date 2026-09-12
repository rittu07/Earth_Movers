const MAX_ATTACHMENT_BYTES = 80000;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

export const validateAttachmentFile = (file) => {
  if (!file || !ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    return 'Only PDF, JPEG, PNG, and WebP files are allowed.';
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return 'Please choose a file smaller than 80 KB to keep it viewable and synchronized.';
  }
  return '';
};

export const isSafeDocumentUrl = (value) => {
  const url = String(value || '');
  return /^data:(application\/pdf|image\/(jpeg|png|webp));base64,[a-z0-9+/=\s]+$/i.test(url);
};
