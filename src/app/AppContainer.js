import React, { useState, useEffect } from 'react';
import { StateProvider } from './StateProvider.js';
import App from './App.js';
import { getBuildings } from './services/api.js';

export default function AppContainer( { config } ) {
  return (
    <StateProvider config={ config }>
      <App />
    </StateProvider>
  );
};