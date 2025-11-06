import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
} else {
  console.error('Root element not found!');
  // You could also retry after a delay
  setTimeout(() => {
    const retryElement = document.getElementById('root');
    if (retryElement) {
      const root = ReactDOM.createRoot(retryElement);
      root.render(<App />);
    }
  }, 100);
}