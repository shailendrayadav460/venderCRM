// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // या आपका VendorMatchApp

// 💥 FIX: यहाँ import को 'app.css' में बदलें ताकि Tailwind की स्टाइलिंग लोड हो सके।
import './App.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);