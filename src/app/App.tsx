import React, { useState, useEffect } from 'react';
import { StateContext } from './StateProvider';
import { getBuildings, getRooms, getMeta } from './services/api';
import Table from './components/Table';

export default function App() {
  const context = React.useContext(StateContext);

  useEffect(async () => {
    let payload = {
      ...context.config,
    }
    const meta = await getMeta(payload);
  }, [])

  return (<>
    <Table />
  </>);
}