import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import { getBuildings, getRooms } from '../services/api';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

type Room = {
  'Title': string
  'Room Number': string
  'Capacity': string
}

const columnHelper = createColumnHelper<Room>()

const columns = [
  columnHelper.accessor('Title', {
    cell: info => info.getValue(),
    // footer: info => info.column.id,
  }),
  columnHelper.accessor('Room Number', {
    cell: info => info.getValue(),
    // footer: info => info.column.id,
  }),
  columnHelper.accessor('Capacity', {
    cell: info => info.getValue(),
    // footer: info => info.column.id,
  }),
]

export default function Table() {
  const context = React.useContext(StateContext);
  const [rooms, setRooms] = useState([]);
  const [offset, setOffset] = useState(null);
  const [prevOffsets, setPrevOffsets] = useState([]);
  const [loading, setLoading] = useState(false);

  function getPayload() {
    let payload = {
      ...context.config,
    }

    if ( offset ) {
      payload.offset = offset;
    }

    return payload;
  }

  async function getPage() {
    setLoading(true);

    const res = await getRooms(getPayload()) as any;

    if ( ! res ) {
      return;
    }

    if ( offset ) {
      setPrevOffsets([...prevOffsets, offset]);
    }

    if ( res.data.offset ) {
      setOffset(res.data.offset);
    }

    if ( res.data.records ) {
      setRooms( res.data.records.map(room => {
        return {
          'Title'      : room.fields['Title'],
          'Room Number': room.fields['Room Number'],
          'Capacity'   : room.fields['Capacity'],
        }
      }));
    }

    setLoading(false);
  }

  async function prevPage() {
    if (! prevOffsets.length ) {
      return;
    }

    console.log(prevOffsets);

    const newPrevOffsets = [...prevOffsets];
    const newOffset = newPrevOffsets.pop();

    setPrevOffsets(newPrevOffsets);
    setOffset(newOffset);

    console.log(newPrevOffsets, newOffset);

    getPage();
  }

  // Load initial page of results.
  useEffect(() => {
    getPage();
  }, []);

  const table = useReactTable({
    columns,
    data: rooms,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // turn off client-side pagination
  });

  return (<>
    <div className="vpfo-find-spaces-table">
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
      {prevOffsets.length > 0 && <>
        <button onClick={prevPage}>
          Load prev page
        </button>
      </>}
      {offset && <>
        <button onClick={getPage}>
          Load next page
        </button>
      </>}
    </div>
  </>);
}