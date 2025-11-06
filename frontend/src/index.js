import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

console.log('React app starting...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  console.log('DOM still loading, adding event listener');
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  console.log('DOM already ready, initializing app');
  initApp();
}

function initApp() {
  console.log('initApp called');
  const rootElement = document.getElementById('root');
  console.log('Root element:', rootElement);
  
  if (rootElement) {
    console.log('Creating React root...');
    const root = ReactDOM.createRoot(rootElement);
    console.log('Rendering App...');
    root.render(<App />);
    console.log('App rendered!');
  } else {
    console.error('Root element not found!');
  }
}