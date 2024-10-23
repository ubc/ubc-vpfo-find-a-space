import React, { useState, useEffect } from 'react';
import { StateContext } from './StateProvider';
import { getBuildings, getRooms, getMeta } from './services/api';
import Table from './components/Table';
import Filters from './components/Filters'

export default function App() {

  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmitFilters = (newFilters) => {
    setFilters(newFilters);
  }

  return (<>
    <Filters onSubmitFilters={handleSubmitFilters} loading={loading} setLoading={setLoading} />
    <Table filters={filters} loading={loading} setLoading={setLoading} />
  </>);
}