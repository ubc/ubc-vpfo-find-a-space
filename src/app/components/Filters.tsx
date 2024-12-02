import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import { getBuildings, getMeta } from '../services/api';
import Search from './Search';
import Select, { MultiValue, Options } from 'react-select'
import Slider from 'react-slider';
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
}

const filterContainer = document.querySelector('.vpfo-lsb-filters-container');

const groupRecordsByCategory = (data) => {
  return data.reduce((acc, current) => {
    const category = current.fields.Category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(current.fields.Name);
    return acc;
  }, {});
};

const min = 0;
const max = 503;

export default function Filters(props) {
  const context = React.useContext(StateContext);
  const isFormal = context.config.formal;

  const [filtersOpen, setFiltersOpen] = useState(true);

  // Meta, which contains Amenities, Resources, and Informal Amenities data.
  const [meta, setMeta] = useState(null);

  // A/V select options, which are grouped by Category.
  const [audioVisualOptions, setAudioVisualOptions] = useState<any[]>([]);

  // Other Room Feature options
  const [otherRoomFeatureOptions, setOtherRoomFeatureOptions] = useState<any[]>([]);

  // Accessibility select options.
  const [accessibilityOptions, setAccessibilityOptions] = useState<any[]>([]);

  // Buildings Options
  const [buildingOptions, setBuildingOptions] = useState<any[]>([]);

  // Furniture Options
  const [furnitureOptions, setFurnitureOptions] = useState<any[]>([]);

  // Layout Options
  const [layoutOptions, setLayoutOptions] = useState<any[]>([]);

  // Furniture Options
  const [ISAmenitiesOptions, setISAmenitiesOptions] = useState<any[]>([]);

  const getInitialFilterState = (key) => {
    if ( ! props.filters ) {
      return null;
    }

    const filter = props.filters[key];

    if ( filter === undefined || filter === null ) {
      return null;
    }

    return filter;
  }

  /**
   * Form States
  */
  const [audioVisualFilter, setAudioVisualFilter] = useState<any[]>(getInitialFilterState('audioVisualFilter') ?? []);
  const [otherRoomFeaturesFilter, setOtherRoomFeaturesFilter] = useState<any[]>(getInitialFilterState('otherRoomFeaturesFilter') ?? []);
  const [accessibilityFilter, setAccessibilityFilter] = useState<any[]>(getInitialFilterState('accessibilityFilter') ?? []);
  const [buildingFilter, setBuildingFilter] = useState(getInitialFilterState('buildingFilter') ?? {});
  const [furnitureFilter, setFurnitureFilter] = useState<any[]>(getInitialFilterState('furnitureFilter') ?? []);
  const [layoutFilter, setLayoutFilter] = useState<any[]>(getInitialFilterState('layoutFilter') ?? []);
  const [capacityFilter, setCapacityFilter] = useState<number[]>(getInitialFilterState('capacityFilter') ?? [min, max]);
  const [ISAmenitiesFilter, setISAmenitiesFilter] = useState<any[]>(getInitialFilterState('ISAmenitiesFilter') ?? []);

  const setupBuildingOptions = (records) => {
    let options = [];

    options = records.map(building => {
      return {
        label: building.fields['Building Name'],
        value: building.fields['Building Code'],
      }
    })

    setBuildingOptions(options);
  }

  const setupBuildings = async () => {
    let payload = {
      ...context.config,
    }

    const buildings = await getBuildings(payload);
    // console.log(buildings);

    const data = buildings?.data?.data?.records || {};

    // Buildings filter.
    setupBuildingOptions(data);
  }

  const setupAVOptions = (meta) => {
    let options: any[] = [];
    const groupedAmenities = groupRecordsByCategory(meta.shared_amenities.records);
    
    for (const [groupName, groupItems] of Object.entries(groupedAmenities)) {
      options.push({
        label: groupName,
        options: groupItems.map((amenity) => {
          return {
            label: amenity,
            value: amenity,
          }
        })
      });
    }

    setAudioVisualOptions(options);
  }

  const setupOtherRoomFeaturesOptions = (meta) => {
    let options: any[] = [];

    options = meta.other_room_features.records.map(record => {
      return {
        label: record.fields.Name,
        value: record.fields.Name,
      }
    })

    setOtherRoomFeatureOptions(options);
  }

  const setupAccessibilityOptions = (meta) => {
    let options = [];

    options = meta.accessibility.records.map(record => {
      return {
        label: record.fields.Name,
        value: record.fields.Name,
      }
    })

    setAccessibilityOptions(options);
  }

  const setupFurnitureOptions = (meta) => {
    let options = [];

    options = meta.furniture.records.map(record => {
      return {
        label: record.fields.Name,
        value: record.fields.Name,
      }
    })

    setFurnitureOptions(options);
  }

  const setupLayoutOptions = (meta) => {
    let options = [];

    options = meta.classroom_layouts.records.map(record => {
      return {
        label: record.fields.Name,
        value: record.fields.Name,
      }
    })

    setLayoutOptions(options);
  }

  const setupISAmenitiesOptions = (meta) => {
    let options = [];

    options = meta.informal_amenities.records.map(record => {
      return {
        label: record.fields.Name,
        value: record.fields.Name,
      }
    })

    setISAmenitiesOptions(options);
  }

  const setupMeta = async () => {
    let payload = {
      ...context.config,
    }
    const meta = await getMeta(payload);

    const data = meta?.data?.data || {};

    setMeta(data);

    // Amenities filter.
    setupAccessibilityOptions(data);

    // Audio / Video filter.
    setupAVOptions(data);

    // Furniture filter.
    setupFurnitureOptions(data);

    // Layout filter.
    setupLayoutOptions(data);

    // Informal Spaces Amenities filter.
    setupISAmenitiesOptions(data);

    // Other room features filter.
    setupOtherRoomFeaturesOptions(data);
  }

  useEffect(() => {
    setupBuildings();
    setupMeta();
  }, []);

  useEffect(() => {
    if ( _.isEmpty(props.filters) ) {
      // Ensure our filter states are empty.
      resetLocalFilters();
    }
  }, [props.filters])

  const submitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let capacityFilterSend = null;
    if ( capacityFilter.length === 2 && (capacityFilter[0] !== min || capacityFilter[1] !== max) ) {
      capacityFilterSend = capacityFilter;
    }

    // console.log("Filters:", { audioVisualFilter, accessibilityFilter, buildingFilter, furnitureFilter, capacityFilter });
    props.onSubmitFilters({ audioVisualFilter, accessibilityFilter, buildingFilter, furnitureFilter, layoutFilter, capacityFilter: capacityFilterSend, otherRoomFeaturesFilter, ISAmenitiesFilter });
  }

  const renderFormalFilters = () => {
    return <>
      <h5 className="vpfo-lsb-filter-heading">Filter Results</h5>
      { renderBuildingSelect() }
      { renderCapacityInput() }
      { renderFurnitureSelect() }
      { renderLayoutSelect() }
      { renderAccessibilitySelect() }
      { renderAudioVideoSelect() }
      { renderOtherRoomFeaturesSelect() }
    </>
  }

  const renderInformalFilters = () => {
    return <>
      <h5 className="vpfo-lsb-filter-heading">Filter Results</h5>
      {/* { renderFurnitureSelect() } */}
      {/* { renderLayoutSelect() } */}
      { renderBuildingSelect() }
      { renderCapacityInput() }
      {/* { renderAccessibilitySelect() } */}
      { renderISAmenitiesSelect() }
    </>
  }

  const renderCapacityInput = () => {
    return (
      <div className="input-group">
        <label htmlFor="vpfo-lsb-capacity-input">
          Capacity
        </label>
        <div className="slider-container">
          <Slider
            min={min}
            max={max}
            value={capacityFilter}
            ariaLabelledby="vpfo-lsb-capacity-input"
            onChange={(value, idx) => setCapacityFilter(value)}
            pearling
            minDistance={25}
            renderThumb={(props, state) => <div {...props}>{ state.valueNow }</div>}
          />
        </div>
      </div>
    )
  }

  const renderFurnitureSelect = () => {
    return (
      <div className="select-group">
        <label id="vpfo-lsb-furniture" htmlFor="vpfo-lsb-furniture-input">
          Style
        </label>
        <Select
          options={furnitureOptions}
          value={furnitureFilter}
          name="vpfo-lsb-furniture"
          isClearable
          isMulti
          menuPortalTarget={filterContainer}
          menuPosition={'fixed'} 
          closeMenuOnSelect={false}
          styles={selectStyles}
          components={animatedComponents}
          inputId="vpfo-lsb-furniture-input"
          onChange={(selected) => setFurnitureFilter(selected)}
        />
      </div>
    )
  }

  const renderLayoutSelect = () => {
    return (
      <div className="select-group">
        <label id="vpfo-lsb-layout" htmlFor="vpfo-lsb-layout-input">
          Layout
        </label>
        <Select 
          options={layoutOptions}
          value={layoutFilter}
          name="vpfo-lsb-layout"
          isClearable
          isMulti
          menuPortalTarget={filterContainer}
          menuPosition={'fixed'} 
          menuPortalTarget={document.querySelector('body')}
          closeMenuOnSelect={false}
          styles={selectStyles}
          components={animatedComponents}
          inputId="vpfo-lsb-layout-input"
          onChange={(selected) => setLayoutFilter(selected)}
        />
      </div>
    )
  }

  const renderISAmenitiesSelect = () => {
    return (
      <div className="select-group">
        <label id="vpfo-lsb-informal-amenities" htmlFor="vpfo-lsb-informal-amenities-input">
          Amenities
        </label>
        <Select 
          options={ISAmenitiesOptions}
          value={ISAmenitiesFilter}
          isMulti
          menuPortalTarget={filterContainer}
          menuPosition={'fixed'} 
          isClearable
          closeMenuOnSelect={false}
          styles={selectStyles}
          name="vpfo-lsb-informal-amenities"
          components={animatedComponents}
          inputId="vpfo-lsb-informal-amenities-input"
          onChange={(selected) => setISAmenitiesFilter(selected)}
        />
      </div>
    )
  }

  const renderBuildingSelect = () => {
    return (
      <div className="select-group">
        <label id="vpfo-lsb-building" htmlFor="vpfo-lsb-building-input">
          Building
        </label>
        <Select 
          options={buildingOptions}
          value={buildingFilter}
          name="vpfo-lsb-building"
          isClearable
          isMulti
          menuPortalTarget={filterContainer}
          menuPosition={'fixed'} 
          closeMenuOnSelect={false}
          styles={selectStyles}
          components={animatedComponents}
          inputId="vpfo-lsb-building-input"
          onChange={(selected) => setBuildingFilter(selected)}
        />
      </div>
    )
  }

  const renderAccessibilitySelect = () => {
    return (
      <div className="select-group">
        <label id="vpfo-lsb-accessibility" htmlFor="vpfo-lsb-accessibility-input">
          Accessibility
        </label>
        <Select 
          options={accessibilityOptions}
          value={accessibilityFilter}
          isMulti
          menuPortalTarget={filterContainer}
          menuPosition={'fixed'} 
          isClearable
          closeMenuOnSelect={false}
          styles={selectStyles}
          name="vpfo-lsb-accessibility"
          components={animatedComponents}
          inputId="vpfo-lsb-accessibility-input"
          onChange={(selected) => setAccessibilityFilter(selected)}
        />
      </div>
    )
  }

  const renderAudioVideoSelect = () => {
    return (
      <div className="select-group">
        <label id="vpfo-lsb-audio-visual" htmlFor="vpfo-lsb-audio-visual-input">
          Audio Visual
        </label>
        <Select 
          options={audioVisualOptions}
          value={audioVisualFilter}
          isMulti
          menuPortalTarget={filterContainer}
          menuPosition={'fixed'} 
          isClearable
          closeMenuOnSelect={false}
          styles={selectStyles}
          name="vpfo-lsb-audio-visual"
          components={animatedComponents}
          inputId="vpfo-lsb-audio-visual-input"
          onChange={(selected) => setAudioVisualFilter(selected)}
        />
      </div>
    )
  }

  const renderOtherRoomFeaturesSelect = () => {
    return (
      <div className="select-group">
        <label id="vpfo-lsb-other-room-features" htmlFor="vpfo-lsb-other-room-features-input">
          Other Room Features
        </label>
        <Select 
          options={otherRoomFeatureOptions}
          value={otherRoomFeaturesFilter}
          isMulti
          menuPortalTarget={filterContainer}
          menuPosition={'fixed'} 
          isClearable
          closeMenuOnSelect={false}
          styles={selectStyles}
          name="vpfo-lsb-other-room-features"
          components={animatedComponents}
          inputId="vpfo-lsb-other-room-features-input"
          onChange={(selected) => setOtherRoomFeaturesFilter(selected)}
        />
      </div>
    )
  }

  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  }

  let btnClass = "btn btn-primary text-nowrap";
  if (props.loading) {
    btnClass += " disabled";
  }

  let filterToggleClass = 'vpfo-lsb-filters-mobile-toggle';
  if ( filtersOpen === true) {
    filterToggleClass += ' vpfo-lsb-filters-mobile-toggle-open'
  } else {
    filterToggleClass += ' vpfo-lsb-filters-mobile-toggle-closed'
  }

  const resetLocalFilters = () => {
    setAudioVisualFilter([]);
    setOtherRoomFeaturesFilter([]);
    setAccessibilityFilter([]);
    setBuildingFilter([]);
    setFurnitureFilter([]);
    setLayoutFilter([]);
    setCapacityFilter([min, max]);
    setISAmenitiesFilter([]);
  }

  const clearFilters = () => {
    props.clearFilters();

    resetLocalFilters();
  }

  return (<>

    { meta === null &&
      <div className="vpfo-lsb-filters-container vpfo-lsb-filters-container-loading">
        <div className="vpfo-lsb-loading-scrim"><div className="vpfo-lsb-loading-indicator"></div></div>
      </div>
    }
    {
      meta !== null &&
      <>
        <div className={filterToggleClass} onClick={toggleFilters}>
          <h5>Search and Filter</h5>
          { filtersOpen === true &&
            <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.70628 1.74619C10.0969 1.35557 10.0969 0.721191 9.70628 0.330566C9.31565 -0.0600586 8.68128 -0.0600586 8.29065 0.330566L5.00002 3.62432L1.70627 0.333691C1.31565 -0.0569337 0.681274 -0.0569337 0.290649 0.333691C-0.0999756 0.724316 -0.0999756 1.35869 0.290649 1.74932L3.5844 5.03994L0.293775 8.33369C-0.0968505 8.72432 -0.0968505 9.35869 0.293775 9.74932C0.6844 10.1399 1.31877 10.1399 1.7094 9.74932L5.00002 6.45557L8.29378 9.74619C8.6844 10.1368 9.31878 10.1368 9.7094 9.74619C10.1 9.35557 10.1 8.72119 9.7094 8.33057L6.41565 5.03994L9.70628 1.74619Z" fill="white"/>
            </svg>
          }
          {
            filtersOpen === false &&
            <svg width="17" height="15" viewBox="0 0 17 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.62188 1.12548C0.82813 0.687976 1.26563 0.409851 1.75 0.409851H15.25C15.7344 0.409851 16.1719 0.687976 16.3781 1.12548C16.5844 1.56298 16.5219 2.0786 16.2156 2.4536L10.5 9.43798V13.4099C10.5 13.788 10.2875 14.1349 9.94688 14.3036C9.60626 14.4724 9.20313 14.438 8.90001 14.2099L6.90001 12.7099C6.64688 12.5224 6.5 12.2255 6.5 11.9099V9.43798L0.781255 2.45048C0.47813 2.0786 0.412505 1.55985 0.62188 1.12548Z" fill="white"/>
            </svg>
          }
        </div>

        <form onSubmit={submitFilters} className="vpfo-lsb-filters-container">

          <Search setLoading={props.setLoading} showClassroom={props.showClassroom} />

          { isFormal === true && renderFormalFilters() }
          { isFormal === false && renderInformalFilters() }

          <button
            type="submit"
            disabled={props.loading}
            className={btnClass}
          >
            Submit Filters
          </button>

          <a role="button" tabIndex={0} className="vpfo-lsb-filter-clear-all btn btn-secondary" onClick={clearFilters}>
            Clear filters
            <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.70615 2.06895C10.0968 1.67832 10.0968 1.04395 9.70615 0.65332C9.31553 0.262695 8.68115 0.262695 8.29053 0.65332L4.9999 3.94707L1.70615 0.656445C1.31553 0.26582 0.681152 0.26582 0.290527 0.656445C-0.100098 1.04707 -0.100098 1.68145 0.290527 2.07207L3.58428 5.3627L0.293652 8.65645C-0.0969726 9.04707 -0.0969726 9.68145 0.293652 10.0721C0.684277 10.4627 1.31865 10.4627 1.70928 10.0721L4.9999 6.77832L8.29365 10.0689C8.68428 10.4596 9.31865 10.4596 9.70928 10.0689C10.0999 9.67832 10.0999 9.04395 9.70928 8.65332L6.41553 5.3627L9.70615 2.06895Z" fill="#005DA6"/>
            </svg>
          </a>
        </form>
      </>
    }
  </>);
}