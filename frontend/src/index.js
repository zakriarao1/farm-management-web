import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

console.log('React app starting...');

function initApp() {
  const rootElement = document.getElementById('root');
  console.log('Root element:', rootElement);
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
    console.log('App rendered!');
  } else {
    console.log('Root not found, trying again next frame...');
    requestAnimationFrame(initApp);
  }
}

// Start on next animation frame
requestAnimationFrame(initApp);