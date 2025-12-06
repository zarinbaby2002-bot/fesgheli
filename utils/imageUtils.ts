
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.9;

export const processImage = (
  file: File, 
  onProgress: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        // Reading the file is the first 50% of the process
        const percent = Math.round((event.loaded / event.total) * 50);
        onProgress(percent);
      }
    };

    reader.readAsDataURL(file);

    reader.onload = (event) => {
      onProgress(55); // File read, now processing
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        onProgress(65); // Image loaded into memory
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round(height * (MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round(width * (MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        onProgress(75); // Canvas created

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        onProgress(90); // Image drawn to canvas

        // Convert to JPEG for compression
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        onProgress(100); // Done
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
