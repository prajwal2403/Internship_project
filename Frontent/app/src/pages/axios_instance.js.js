// filepath: d:\github\financial Management\Internship_project\Frontent\app\src\utils\axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://internship-project-1-ahe5.onrender.com', // Backend base URL
});

export default axiosInstance;