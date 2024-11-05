import React, { useState, useEffect } from 'react';
import { StateContext } from './StateProvider';
import { getBuildings, getRooms, getMeta } from './services/api';
import Table from './components/Table';
import Filters from './components/Filters'
import Classroom from './components/Classroom'
import Building from './components/Building'
import { useSearchParams } from'react-router-dom';

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Setup click listeners for classroom links to hijack navigation.
  useEffect(() => {
    document.addEventListener('click', (e) => {

      const element = e.target as HTMLAnchorElement;
      if ( ! element || element.tagName !== 'A' ) {
        return;
      }

      if ( element.classList.contains('vpfo-classroom-link') ) {
        const slug = element.href.substring(element.href.lastIndexOf('/') + 1);
        if ( slug ) {
          e.preventDefault();
          handleShowClassroom(slug);
        }
      }

      if ( element.classList.contains('vpfo-return-to-lsf') ) {
        e.preventDefault();

        handleClearClassroom();
        handleClearBuilding();
      }

      if ( element.classList.contains('vpfo-building-link') ) {
        const slug = element.href.substring(element.href.lastIndexOf('/') + 1);
        if ( slug ) {
          e.preventDefault();
          handleShowBuilding(slug);
        }
      }
    })
  }, []);

  // Similarly, setup click listeners for building links to hijack navigation.
  useEffect(() => {
    document.addEventListener('click', (e) => {
      const element = e.target as HTMLAnchorElement;
      if ( element && element.tagName === 'A' && element.classList.contains('vpfo-building-link') ) {
        const slug = element.href.substring(element.href.lastIndexOf('/') + 1);
        if ( slug ) {
          e.preventDefault();
          handleShowBuilding(slug);
        }
      }
    })
  }, []);

  /**
   * When the query state changes, also update the application state.
   */
  useEffect(() => {
    // console.log(searchParams);
    setFilters(getFilterStateFromQuery());
    setClassroom(getClassroomStateFromQuery());
    setBuilding(getBuildingStateFromQuery());
  }, [searchParams]);

  const getFilterStateFromQuery = () => {
    try {
      const filterString = searchParams.get('filters') || '{}';
      const filters      = JSON.parse(decodeURIComponent(filterString));

      return filters;
    } catch(e) {
      console.error('Error parsing filters:', e);
      return {};
    }
  }

  const getClassroomStateFromQuery = () => {
    try {
      let classroomSlug = searchParams.get('classroom') || null;

      if ( classroomSlug ) {
        classroomSlug = decodeURIComponent(classroomSlug);
      }

      return classroomSlug ?? '';
    } catch(e) {
      console.error('Error parsing classroom slug:', e);
      return '';
    }
  }

  const getBuildingStateFromQuery = () => {
    try {
      let buildingSlug = searchParams.get('building') || null;

      if ( buildingSlug ) {
        buildingSlug = decodeURIComponent(buildingSlug);
      } 

      return buildingSlug ?? '';
    } catch(e) {
      console.error('Error parsing building slug:', e);
      return '';
    }
  }

  const [filters, setFilters] = useState(getFilterStateFromQuery());
  const [classroom, setClassroom] = useState(getClassroomStateFromQuery());
  const [building, setBuilding] = useState(getBuildingStateFromQuery());
  const [loading, setLoading] = useState(false);

  const handleShowClassroom = (newClassroom) => {
    const filterString = encodeURIComponent(newClassroom);
    setSearchParams({...searchParams, classroom: filterString });
  }

  const handleShowBuilding = (newBuilding) => {
    const filterString = encodeURIComponent(newBuilding);
    setSearchParams({...searchParams, building: filterString });
  }
  
  const handleClearBuilding = () => {
    setSearchParams({...searchParams, building: '' });
  }

  const handleClearClassroom = () => {
    setSearchParams({...searchParams, classroom: '' });
  }

  const setFilterQueryState = (newFilters) => {
    const filterString = encodeURIComponent(JSON.stringify(newFilters));
    setSearchParams({...searchParams, filters: filterString });
  }

  const handleSubmitFilters = (newFilters) => {
    setFilterQueryState(newFilters);
  }

  const handleClearFilters = () => {
    setFilterQueryState({});
  }

  console.log({
    filters,
    classroom,
    building,
    searchParams,
    loading,
  })

  return (<>

    {/* Render classroom if classroom is set. */}
    { classroom !== '' && 
      <Classroom
        classroom={classroom}
        clearClassroom={handleClearClassroom}
      />
    }

    {/* Render building if building is set, and classroom is not set */}
    { classroom === '' && building !== '' &&
      <Building
        building={building}
        clearBuilding={handleClearBuilding}
      />
    }

    {/* Otherwise, render filters and table. */}
    { classroom === '' && building === '' &&
      <div className="vpfo-lsb-container">
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
          showClassroom={handleShowClassroom}
        />
      </div>
    }
  </>);
}