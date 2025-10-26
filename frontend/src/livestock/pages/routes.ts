import React from 'react';
import { LivestockPage } from './LivestockPage';

// This will be used in the main App.tsx without modifying crop routes
export const livestockRoutes = [
  {
    path: '/livestock/*',
    element: React.createElement(LivestockPage),
  },
];