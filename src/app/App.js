import React, { useState, useEffect } from 'react';
import { StateContext } from './StateProvider.js';
import { getBuildings } from './services/api.js';

export default function App() {
  const context = React.useContext(StateContext);

  useEffect(async () => {
    const buildings = await getBuildings(context.config);
    console.log(buildings);
  }, [])

  return (<></>);
}