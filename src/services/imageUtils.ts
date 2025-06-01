export const cleanupBlobUrls = (urls: { [key: string]: string }) => {
  Object.values(urls).forEach(url => {
    if (url) {
      safeRevokeUrl(url);
    }
  });
};

export const safeRevokeUrl = (url: string) => {
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error revoking URL:', error);
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const safeStoreBase64Image = async (
  storageKey: string,
  imageKey: string,
  base64Data: string,
  maxSizeMB: number = 1
): Promise<void> => {
  try {
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    existingData[imageKey] = base64Data;
    localStorage.setItem(storageKey, JSON.stringify(existingData));
  } catch (error) {
    console.error(`Error storing image ${imageKey}:`, error);
    throw new Error('Failed to store image data');
  }
}; 