import React, { useState, useEffect } from 'react';
import { StateProvider } from './StateProvider';
import App from './App';
import { getBuildings } from './services/api';
import { BrowserRouter } from 'react-router-dom';

export default function AppContainer( { config } ) {
  return (
    <BrowserRouter>
      <StateProvider config={ config } children={ <App />} />
    </BrowserRouter>
  );
};