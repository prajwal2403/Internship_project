import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Herosection from './components/Herosection.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import MainPage from './pages/MainPage.jsx';

function App() {
  return (
    <Routes>
      {/* Home Page */}
      <Route path="/" element={<Herosection />} />
      
      {/* Signup Page */}
      <Route path="/signup" element={<Signup />} />
      
      {/* Login Page */}
      <Route path="/login" element={<Login />} />
      <Route path="/main" element={<MainPage userEmail="user@example.com" />} />
    </Routes>
  );
}

export default App;
