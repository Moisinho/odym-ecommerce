import axios from 'axios';

const IMGBB_API_KEY = process.env.IMGBB_API_KEY; // Set your imgBB API key in environment variables
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

/**
 * Uploads an image to imgBB.
 * @param {string} base64Image - The image as a base64 encoded string (without data:image/... prefix).
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
export async function uploadImage(base64Image) {
  try {
    const response = await axios.post(IMGBB_UPLOAD_URL, null, {
      params: {
        key: IMGBB_API_KEY,
        image: base64Image,
      },
    });
    if (response.data && response.data.data && response.data.data.url) {
      return response.data.data.url;
    } else {
      throw new Error('Invalid response from imgBB');
    }
  } catch (error) {
    throw new Error(`imgBB upload failed: ${error.message}`);
  }
}
