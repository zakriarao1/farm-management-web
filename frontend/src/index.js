
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
});