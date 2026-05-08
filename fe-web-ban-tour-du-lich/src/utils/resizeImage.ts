export function resizeImage(
  file: File,
  maxWidth = 1000,
  maxHeight =1000,
  quality = 1 // ảnh nhẹ hơn, không vỡ
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      return reject("Invalid file");
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Tính tỷ lệ resize
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context error");

        ctx.drawImage(img, 0, 0, width, height);

        // Xuất base64 JPEG
        const base64 = canvas.toDataURL("image/jpeg", quality);

        resolve(base64);
      };

      img.onerror = () => reject("Image load error");
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject("File reading error");
    reader.readAsDataURL(file);
  });
}
