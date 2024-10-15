import React, { useState, useEffect } from 'react';
import { StateProvider } from './StateProvider';
import App from './App';
import { getBuildings } from './services/api';

export default function AppContainer( { config } ) {
  return (
    <StateProvider config={ config } children={ <App />} />
  );
};