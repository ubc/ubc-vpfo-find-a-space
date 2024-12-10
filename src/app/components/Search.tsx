import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import AsyncSelect from 'react-select/async';
import { getRooms } from '../services/api';
import makeAnimated from 'react-select/animated';
import _ from 'lodash';

const animatedComponents = makeAnimated();

const selectStyles = {
  control: (baseStyles, state) => ({
    ...baseStyles,
    borderColor: '#5E869F',
    borderRadius: '0px',
    ":hover": {
      borderColor: '#5E869F',
    }
  }),
  menuPortal: (baseStyles, state) => ({
    ...baseStyles,
    zIndex: 100,
  }),
  placeholder: (baseStyles, state) => ({
      ...baseStyles,
      color: '#002145',
  }),
  loadingIndicator: (baseStyles, state) => ({
   ...baseStyles,
    color: '#002145',
  }),
  noOptionsMessage: (baseStyles, state) => ({
    ...baseStyles,
     color: '#002145',
   }),
}

const filterContainer = document.querySelector('.vpfo-lsb-filters-container');

export default function Search(props) {
  const context = React.useContext(StateContext);

  const getSelectOptions = async (
      search: string,
      callback: (options: any[]) => void
    ) => {
    // console.log('Fetching options...', { search });
    if ( search.length < 2 ) return [];

    const payload = {
      ...context.config,
      offset: null,
      search: search,
    };

    const res = await getRooms(payload);
    let options = [];

    if (res?.data?.records) {
      options = res.data.records.map(room => ({
        label: room.fields.Name,
        value: room.fields['Room Link']
      }));
    } else {
      options = []
    }

    callback(options);

    return options;
  }

  return (<>
    <div>
      <label id="vpfo-lsb-search" htmlFor="vpfo-lsb-search-input" className="vpfo-lsb-filter-heading">
        Search
      </label>
      <div className="select-group">
        <AsyncSelect
          cacheOptions
          escapeClearsValue={false}
          loadOptions={getSelectOptions}
          name="vpfo-lsb-search"
          value={props.search}
          styles={selectStyles}
          noOptionsMessage={() => 'Start typing to search'}
          inputId="vpfo-lsb-search-input"
          placeholder="Search"
          loadingMessage={() => 'Loading...'}
          blurInputOnSelect
          menuPortalTarget={filterContainer}
          menuPosition={'fixed'} 
          components={{ ...animatedComponents, DropdownIndicator:() => null, IndicatorSeparator:() => null }}
          onChange={(selected) => {
            if ( ! selected ) {
              return;
            }

            const url = selected.value;
            const slug = selected.value.substring(selected.value.lastIndexOf('/') + 1);
            if ( slug ) {
              props.setSearch(null);
              props.showClassroom(slug);
            }
          }}
        />
      </div>
    </div>
  </>);
}