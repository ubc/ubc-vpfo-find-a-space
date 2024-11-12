import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import { getRooms } from '../services/api';
import ClassroomCard from './ClassroomCard';
import _ from 'lodash';

export default function Table(props) {
  const context                             = React.useContext(StateContext);
  const [rooms, setRooms]                   = useState([]);
  const [nextPageOffset, setNextPageOffset] = useState(null);
  const [prevPageOffset, setPrevPageOffset] = useState(null);
  const [prevOffsets, setPrevOffsets]       = useState([]);

  const containerRef = React.useRef(null);

  async function getPage(currentOffset = null) {
    props.setLoading(true);
    const payload = {
      ...context.config,
      offset: currentOffset,
      filters: props.filters,
    };

    let res = null;

    try {
      res = await getRooms(payload) as any;
    } catch(err) {
      console.error('Error fetching rooms:', err);
      props.setLoading(false);
      return;
    }

    if (res?.data?.records) {
      setRooms(res.data.records.map(room => ({
        'Title'                     : room.fields['Title'],
        'Room Number'               : room.fields['Room Number'],
        'Building Name'             : room.fields['Building Name'],
        'Building Code'             : room.fields['Building Code'],
        'Capacity'                  : room.fields['Capacity'],
        'Room Link'                 : room.fields['Room Link'],
        'Building Link'             : room.fields['Building Link'],
        'Image Gallery'             : room.fields['Image Gallery'],
        'Filter_Furniture'          : room.fields['Filter_Furniture'],
        'Formatted_Furniture'       : room.fields['Formatted_Furniture'],
        'Filter_Room_Layout_Type'   : room.fields['Filter_Room_Layout_Type'],
        'Formatted_Room_Layout_Type': room.fields['Formatted_Room_Layout_Type'],
      })));
    }

    if ( res?.data === null ) {
      setRooms([]);
    }

    const newNextPageOffset = res?.data?.offset;

    if ( newNextPageOffset ) {
      setNextPageOffset(newNextPageOffset);
    }

    props.setLoading(false);
  }

  // Move to the next page
  async function nextPage() {
    if (nextPageOffset) {
      const newPrevPageOffset = prevOffsets.length !== 0 ? prevOffsets[prevOffsets.length - 1] : null;
      // Push the current offset to the stack of previous offsets before moving to the next
      setPrevOffsets((prev) => [...prev, nextPageOffset]);
      setPrevPageOffset(newPrevPageOffset);
      await getPage(nextPageOffset);
    }

    executeScroll();
  }

  // Move to the previous page
  async function prevPage() {
    if (prevOffsets.length > 0) {
      // Create a new array representing the new previous offsets
      const newPrevOffsets = [ ...prevOffsets ];
      // Always pop off the top item. This represents the current page.
      newPrevOffsets.pop();

      setPrevOffsets(newPrevOffsets);
      await getPage(prevPageOffset); // Go to the previous page.

      if ( newPrevOffsets.length === 1 || newPrevOffsets.length === 0 ) {
        setPrevPageOffset(null);
      }
      else {
        setPrevPageOffset(newPrevOffsets[newPrevOffsets.length - 2]);
      }
    }

    executeScroll();
  }

  // useEffect(() => {
  //   // Initial load
  //   getPage();
  // }, []);

  useEffect(() => {
    // Reset offsets, and previous offsets
    setNextPageOffset(null);
    setPrevPageOffset(null);
    setPrevOffsets([]);

    // Fetch a new page, with the new filters via props.
    getPage();
    // executeScroll();
  }, [props.filters]);

  const executeScroll = () => setTimeout(
    () => {
      if ( containerRef && containerRef.current ) {
        containerRef.current.scrollIntoView({ behavior: "smooth" })
      }
    },
    200
  )

  const getCurrentFilters = () => {
    let filters = [];

    ['accessibilityFilter', 'audioVisualFilter'].forEach(key => {
      if ( ! _.isEmpty(props.filters[key] ) ) {
        props.filters[key].forEach(filter => {
          filters.push(filter.label);
        })
      }
    });

    ['buildingFilter', 'furnitureFilter'].forEach(key => {
      if ( ! _.isEmpty(props.filters[key] ) ) {
        // console.log(props.filters[key]);
        filters.push(props.filters[key].label);
      }
    });

    if ( props.filters['capacityFilter'] && props.filters['capacityFilter'] !== null ) {
      // console.log(props.filters['capacityFilter'])
      filters.push('Capacity ' + props.filters['capacityFilter']);
    }

    return filters;
  }

  const hasActiveFilter = () => {
    return getCurrentFilters().length > 0;
  }

  const clearFilters = () => {
    props.clearFilters();
  }

  const renderActiveFilters = () => {
    return <div className="vpfo-lsb-filter-slugs">
      {getCurrentFilters().map((filter) => {
        return <div key={filter} className="vpfo-lsb-filter-slug">{filter}</div>;
      })}
      <a role="button" tabindex="0" className="vpfo-lsb-filter-clear-all" onClick={clearFilters}>
        Clear filters
        <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.70615 2.06895C10.0968 1.67832 10.0968 1.04395 9.70615 0.65332C9.31553 0.262695 8.68115 0.262695 8.29053 0.65332L4.9999 3.94707L1.70615 0.656445C1.31553 0.26582 0.681152 0.26582 0.290527 0.656445C-0.100098 1.04707 -0.100098 1.68145 0.290527 2.07207L3.58428 5.3627L0.293652 8.65645C-0.0969726 9.04707 -0.0969726 9.68145 0.293652 10.0721C0.684277 10.4627 1.31865 10.4627 1.70928 10.0721L4.9999 6.77832L8.29365 10.0689C8.68428 10.4596 9.31865 10.4596 9.70928 10.0689C10.0999 9.67832 10.0999 9.04395 9.70928 8.65332L6.41553 5.3627L9.70615 2.06895Z" fill="#005DA6"/>
        </svg>
      </a>
    </div>;
  }

  return (
    <div ref={containerRef} className="vpfo-lsb-table-container">
      { props.loading &&
        <div className="vpfo-lsb-loading-scrim"><div className="vpfo-lsb-loading-indicator"></div></div>
      }
      { hasActiveFilter() &&
        <div className="vpfo-lsb-current-filters">
          { renderActiveFilters() }
        </div>
      }
      <div className="vpfo-lsb-table">

        { rooms.length === 0 && props.loading === false && <>
          <div className="vpfo-lsb-no-results">No results found.</div>
        </>}

        { rooms.length !== 0 && <>
          <div className="vpfo-lsb-result-list mb-5">
            { rooms.map((room, idx) => {
              return <ClassroomCard key={idx} room={room} />
            })}
          </div>
        </>}

        <div>
          {prevOffsets.length !== 0 && (
            <button className="btn btn-secondary me-5 text-nowrap" onClick={prevPage} disabled={props.loading}>
              Prev page
            </button>
          )}
          {nextPageOffset && (
            <button className="btn btn-primary text-nowrap" onClick={nextPage} disabled={props.loading}>
              Next page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}