import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import { getRooms } from '../services/api';
import ClassroomCard from './ClassroomCard';

export default function Table(props) {
  const context                             = React.useContext(StateContext);
  const [rooms, setRooms]                   = useState([]);
  const [nextPageOffset, setNextPageOffset] = useState(null);
  const [prevPageOffset, setPrevPageOffset] = useState(null);
  const [prevOffsets, setPrevOffsets]       = useState([]);

  async function getPage(currentOffset = null) {
    props.setLoading(true);
    const payload = {
      ...context.config,
      offset: currentOffset,
      filters: props.filters,
    };

    const res = await getRooms(payload) as any;

    if (res?.data?.records) {
      setRooms(res.data.records.map(room => ({
        'Title'                : room.fields['Title'],
        'Room Number'          : room.fields['Room Number'],
        'Capacity'             : room.fields['Capacity'],
        'Room Link'            : room.fields['Room Link'],
        'Image Gallery'        : room.fields['Image Gallery'],
        'Filter_Furniture'     : room.fields['Filter_Furniture'],
        'Filter_RoomLayoutType': room.fields['Filter_RoomLayoutType'],
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
  }

  // Move to the previous page
  async function prevPage() {
    if (prevOffsets.length > 0) {
      // Create a new array representing the new previous offsets
      const newPrevOffsets = [ ...prevOffsets ];
      // Always pop off the top item. This represents the current page.
      newPrevOffsets.pop();

      setPrevOffsets(newPrevOffsets);
      getPage(prevPageOffset); // Go to the previous page.

      if ( newPrevOffsets.length === 1 || newPrevOffsets.length === 0 ) {
        setPrevPageOffset(null);
      }
      else {
        setPrevPageOffset(newPrevOffsets[newPrevOffsets.length - 2]);
      }
    }
  }

  useEffect(() => {
    // Initial load
    getPage();
  }, []);

  useEffect(() => {
    // Reset offsets, and previous offsets
    setNextPageOffset(null);
    setPrevPageOffset(null);
    setPrevOffsets([]);

    // Fetch a new page, with the new filters via props.
    getPage();
  }, [props.filters]);

  return (
    <div className="vpfo-lsb-table-container">
      { props.loading &&
        <div className="vpfo-lsb-loading-scrim"><div className="vpfo-lsb-loading-indicator"></div></div>
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
            <button className="btn btn-secondary text-nowrap" onClick={nextPage} disabled={props.loading}>
              Next page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}