// filepath: d:\github\financial Management\Internship_project\Frontent\app\src\utils\axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000', // Backend base URL
});

export default axiosInstance;