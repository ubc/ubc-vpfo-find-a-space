import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import AsyncSelect from 'react-select/async';
import { getRooms } from '../services/api';
import makeAnimated from 'react-select/animated';
import _ from 'lodash';

const animatedComponents = makeAnimated();

export default function Search(props) {
  const context = React.useContext(StateContext);

  const getSelectOptions = async (
      search: string,
      callback: (options: any[]) => void
    ) => {
    // console.log('Fetching options...', { search });
    if ( search.length < 3 ) return [];

    const payload = {
      ...context.config,
      offset: null,
      search: search,
    };

    const res = await getRooms(payload);
    let options = [];

    if (res?.data?.records) {
      options = res.data.records.map(room => ({
        label: room.fields.Title,
        value: room.fields.Slug
      }));
    } else {
      options = []
    }

    // console.log('Found:', { options });

    callback(options);

    return options;
  }

  return (<>
    <div className="select-group">
      <label id="vpfo-lsb-search" htmlFor="vpfo-lsb-search-input">
        Search
      </label>
      <AsyncSelect
        cacheOptions
        escapeClearsValue={false}
        loadOptions={getSelectOptions}
        name="vpfo-lsb-search"
        components={animatedComponents}
        inputId="vpfo-lsb-search-input"
        placeholder="Enter 3 or more characters to search"
        loadingMessage={() => 'Loading...'}
        onChange={(selected) => console.log('Option selected:', { selected })}
      />
    </div>
    
  </>);
}