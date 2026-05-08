import axios from "axios";
import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";
import { format, quality } from "@cloudinary/url-gen/actions/delivery";

type Uploadable = File | string; // File hoặc base64

/**
 * Upload 1 hoặc nhiều ảnh lên Cloudinary.
 * @param files - Mảng File, FileList hoặc base64 string
 * @returns Promise<string[]> - Mảng URL ảnh đã resize/format/quality
 */
export const uploadImagesCloudinary = async (
  files: Uploadable[] | FileList,
): Promise<string[]> => {
  
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const fileArray = Array.from(files);

  const cld = new Cloudinary({ cloud: { cloudName } });

  const uploadSingle = async (file: Uploadable) => {
    const formData = new FormData();

    // Nếu là File thì upload trực tiếp
    // Nếu là string (base64) thì upload base64
    if (typeof file === "string") {
      formData.append("file", file); // file = "data:image/png;base64,...."
    } else {
      formData.append("file", file);
    }

    formData.append("upload_preset", uploadPreset);

    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );

    const uploaded = res.data; // Cloudinary trả về public_id, secure_url,...

    // Tối ưu ảnh
    const img = cld
      .image(uploaded.public_id)
      .resize(
        fill()
          .width(800)
          .height(800)
      )
      .delivery(format("auto"))
      .delivery(quality("auto"));

    return img.toURL();
  };

  const urls = await Promise.all(fileArray.map(uploadSingle));
  return urls;
};
