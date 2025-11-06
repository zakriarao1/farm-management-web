import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

console.log('React app starting...');

// Simple fix - wait a bit longer for DOM
setTimeout(() => {
  const rootElement = document.getElementById('root');
  console.log('Root element after timeout:', rootElement);
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
    console.log('App rendered successfully!');
  } else {
    console.error('Root element still not found after timeout');
  }
}, 50);