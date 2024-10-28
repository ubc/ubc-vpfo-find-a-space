import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import { getRooms } from '../services/api';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

type Room = {
  'Title'        : string
  'Room Number'  : string
  'Capacity'     : string,
  'Room Link'    : string,
}

const columnHelper = createColumnHelper<Room>()

const columns = [
  columnHelper.accessor('Title', {
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('Room Number', {
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('Capacity', {
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('Room Link', {
    cell: info => <>
      <a target="_blank" href={ info.getValue() }>View Room</a>
    </>
  }),
]

export default function Table(props) {
  const context                       = React.useContext(StateContext);
  const [rooms, setRooms]             = useState([]);
  const [offset, setOffset]           = useState(null);
  const [prevOffsets, setPrevOffsets] = useState([]);

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
        'Title'        : room.fields['Title'],
        'Room Number'  : room.fields['Room Number'],
        'Capacity'     : room.fields['Capacity'],
        'Room Link'    : 'https://pl-theme.brendan.paperleaf.dev/classrooms/' + room.fields['Slug'],
      })));
    }

    if ( res?.data === null ) {
      setRooms([]);
    }

    if (res?.data?.offset) {
      setOffset(res.data.offset);
    }

    props.setLoading(false);
  }

  // Move to the next page
  async function nextPage() {
    if (offset) {
      // Push the current offset to the stack of previous offsets before moving to the next
      setPrevOffsets((prev) => [...prev, offset]);
      await getPage(offset);
    }
  }

  // Move to the previous page
  async function prevPage() {
    if (prevOffsets.length) {
      // Clone the previous offsets array
      const newPrevOffsets = [...prevOffsets];
  
      // Pop the last offset (this is the offset for the current page)
      const previousOffset = newPrevOffsets.pop();
  
      // Load the previous page using that offset
      await getPage(previousOffset);
  
      // After loading, update the state
      setPrevOffsets(newPrevOffsets); // Set the updated previous offsets
      setOffset(previousOffset as any);       // Set the offset to the previous page
    } else {
      // If no previous offsets, go back to the first page
      await getPage(null);  // Load the first page
      setOffset(null);      // Reset offset to null for the first page
    }
  }

  useEffect(() => {
    // Initial load
    getPage();
  }, []);

  useEffect(() => {
    // Reset offsets, and previous offsets
    setOffset(null);
    setPrevOffsets([]);

    // Fetch a new page, with the new filters via props.
    getPage();
  }, [props.filters]);

  const table = useReactTable({
    columns,
    data: rooms,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // turn off client-side pagination
  });

  return (
    <div className="vpfo-lsb-table-container">
      { props.loading &&
        <div className="vpfo-lsb-loading-scrim"><div className="vpfo-lsb-loading-indicator"></div></div>
      }
      <div className="vpfo-lsb-table">
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          {prevOffsets.length > 0 && (
            <button onClick={prevPage} disabled={props.loading}>
              Load prev page
            </button>
          )}
          {offset && (
            <button onClick={nextPage} disabled={props.loading}>
              Load next page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}