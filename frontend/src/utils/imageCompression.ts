// compress image to fit within payload size limit
// accomodate backend 1MB limit for request bodies
const MAX_PAYLOAD_SIZE = 1 * 1024 * 1024; // 1MB in bytes
const MAX_DIMENSION = 1280; // max width/height

export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        
        // scale down if dimensions are too large
        const scale = Math.min(MAX_DIMENSION / Math.max(width, height), 1);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        
        let quality = 0.85;
        let dataUrl = "";
        
        // iteratively reduce quality and dimensions until within limit
        while (quality > 0.1) {
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          
          // Base64 encoding increases size by ~33%, so estimate actual bytes
          const estimatedSizeInBytes = Math.ceil(dataUrl.length * 0.75);
          if (estimatedSizeInBytes < MAX_PAYLOAD_SIZE) {
            resolve(dataUrl);
            return;
          }
          
          // reduce quality first, then dimensions
          quality -= 0.15;
          if (quality < 0.5) {
            width = Math.round(width * 0.85);
            height = Math.round(height * 0.85);
          }
        }
        
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error("Error in loading image"));
      };
    };
    
    reader.onerror = () => {
      reject(new Error("Error in reading file"));
    };
  });
};
