import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import { getBuildings, getMeta } from '../services/api';
import Search from './Search';
import Select, { MultiValue, Options } from 'react-select'
import makeAnimated from 'react-select/animated';

const animatedComponents = makeAnimated();

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

export default function Filters(props) {
  const context = React.useContext(StateContext);
  const isFormal = context.config.formal;

  // Meta, which contains Amenities, Resources, and Informal Amenities data.
  const [meta, setMeta] = useState(null);

  // A/V select options, which are grouped by Category.
  const [audioVisualOptions, setAudioVisualOptions] = useState<any[]>([]);

  // Accessibility select options.
  const [accessibilityOptions, setAccessibilityOptions] = useState<any[]>([]);

  // Buildings
  const [buildings, setBuildings] = useState<any[]>([]);

  // Buildings Options
  const [buildingOptions, setBuildingOptions] = useState<any[]>([]);

  // Furniture Options
  const [furnitureOptions, setFurnitureOptions] = useState<any[]>([]);

  // Furniture Options
  const [ISAmenitiesOptions, setISAmenitiesOptions] = useState<any[]>([]);

  /**
   * Form States
  */
  const [audioVisualFilter, setAudioVisualFilter] = useState<any[]>([]);
  const [accessibilityFilter, setAccessibilityFilter] = useState<any[]>([]);
  const [buildingFilter, setBuildingFilter] = useState({});
  const [furnitureFilter, setFurnitureFilter] = useState<any[]>([]);
  const [capacityFilter, setCapacityFilter] = useState<null|number>(null);
  const [ISAmenitiesFilter, setISAmenitiesFilter] = useState<any[]>([]);

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
    console.log(buildings);

    const data = buildings?.data?.data?.records || {};
    
    setBuildings(data);

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

    options = meta.furniture.records.map(record => {
      return {
        label: record.fields.Name,
        value: record.fields.Name,
      }
    })

    setFurnitureOptions(options);
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
  }

  useEffect(() => {
    setupBuildings();
    setupMeta();
  }, []);

  const submitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Filters:", { audioVisualFilter, accessibilityFilter, buildingFilter, furnitureFilter, capacityFilter });
    props.onSubmitFilters({ audioVisualFilter, accessibilityFilter, buildingFilter, furnitureFilter, capacityFilter });
  }

  const renderFormalFilters = () => {
    return <>
      {/* <h5>Formal Filters</h5> */}
      { renderFurnitureSelect() }
      { renderCapacityInput() }
      { renderBuildingSelect() }
      { renderAccessibilitySelect() }
      { renderAudioVideoSelect() }
    </>
  }

  const renderInformalFilters = () => {
    return <>
      {/* <h5>Informal Filters</h5> */}
      { renderFurnitureSelect() }
      { renderCapacityInput() }
      { renderBuildingSelect() }
      { renderAccessibilitySelect() }
      { renderISAmenitiesSelect() }
    </>
  }

  const renderCapacityInput = () => {
    return (
      <div className="input-group">
        <label htmlFor="vpfo-lsb-capacity-input">
          Capacity
        </label>
        <input 
          type="number" 
          id="vpfo-lsb-capacity-input" 
          name="vpfo-lsb-capacity" 
          min="0"
          placeholder="Enter minimum"
          onChange={(e) => setCapacityFilter(parseInt(e.target.value))}
        />
      </div>
    )
  }

  const renderFurnitureSelect = () => {
    return (
      <div className="select-group">
        <label id="vpfo-lsb-furniture" htmlFor="vpfo-lsb-furniture-input">
          Style & Layout
        </label>
        <Select 
          options={furnitureOptions}
          name="vpfo-lsb-furniture"
          isClearable
          components={animatedComponents}
          inputId="vpfo-lsb-furniture-input"
          onChange={(selected) => setFurnitureFilter(selected)}
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
          isMulti
          isClearable
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
          name="vpfo-lsb-building"
          isClearable
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
          isMulti
          isClearable
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
          isMulti
          isClearable
          name="vpfo-lsb-audio-visual"
          components={animatedComponents}
          inputId="vpfo-lsb-audio-visual-input"
          onChange={(selected) => setAudioVisualFilter(selected)}
        />
      </div>
    )
  }

  let btnClass = "btn btn-primary text-nowrap";
  if (props.loading) {
    btnClass += " disabled";
  }

  return (<>

    { meta == null && <>Loading ...</> }
    {
      meta !== null &&
      <>
        <form onSubmit={submitFilters} className="vpfo-lsb-filters-container">

          <Search setLoading={props.setLoading} />

          { isFormal === true && renderFormalFilters() }
          { isFormal === false && renderInformalFilters() }

          <button
            type="submit"
            disabled={props.loading}
            className={btnClass}
          >
            Submit Filters
          </button>
        </form>
      </>
    }
  </>);
}