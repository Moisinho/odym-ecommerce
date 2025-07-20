import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv/config';
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * Uploads an image to imgBB.
 * @param {string} base64Image - The image as a base64 encoded string.
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
export async function uploadImage(base64Image) {
  try {
    if (!IMGBB_API_KEY) {
      console.log(process.env);
      throw new Error('IMGBB_API_KEY is not configured');
    }

    // Remove data:image/... prefix if present
    const cleanBase64 = base64Image.includes('data:image') 
      ? base64Image.split(',')[1] 
      : base64Image;

    console.log('Image upload attempt - Base64 length:', cleanBase64.length);

    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', cleanBase64);

    const response = await axios.post(IMGBB_UPLOAD_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (response.data && response.data.data && response.data.data.url) {
      console.log('Image uploaded successfully:', response.data.data.url);
      return response.data.data.url;
    } else {
      throw new Error('Invalid response from imgBB');
    }
  } catch (error) {
    console.error('ImgBB upload error:', error.message);
    console.error('Error details:', error.response?.data || error);
    throw new Error(`imgBB upload failed: ${error.message}`);
  }
}
