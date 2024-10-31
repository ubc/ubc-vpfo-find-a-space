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

  const handleClearFilters = () => {
    setFilters({});
  }

  return (<div className="vpfo-lsb-container">
    <Filters
      filters={filters}
      loading={loading}
      onSubmitFilters={handleSubmitFilters}
      setLoading={setLoading}
    />
    <Table
      filters={filters}
      loading={loading}
      setLoading={setLoading}
      clearFilters={handleClearFilters}
    />
  </div>);
}