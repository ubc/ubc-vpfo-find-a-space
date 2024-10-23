import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';
import { getBuildings, getMeta } from '../services/api';
import Select, { MultiValue, Options } from 'react-select'
import makeAnimated from 'react-select/animated';

const animatedComponents = makeAnimated();

export default function Filters(props) {
  const context = React.useContext(StateContext);

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

  /**
   * Form States
  */
  const [audioVisualFilter, setAudioVisualFilter] = useState<any[]>([]);
  const [accessibilityFilter, setAccessibilityFilter] = useState<any[]>([]);
  const [buildingFilter, setBuildingFilter] = useState({});
  const [furnitureFilter, setFurnitureFilter] = useState<any[]>([]);
  const [capacityFilter, setCapacityFilter] = useState<null|number>(null);

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

  return (<>

    { meta == null && <>Loading ...</> }
    {
      meta !== null && 
      <>
        <form onSubmit={submitFilters}>

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

          <div className="select-group">
            <label id="vpfo-lsb-furniture" htmlFor="vpfo-lsb-furniture-input">
              Style & Layout
            </label>
            <Select 
              options={furnitureOptions}
              name="vpfo-lsb-furniture"
              components={animatedComponents}
              inputId="vpfo-lsb-furniture-input"
              onChange={(selected) => setFurnitureFilter(selected)}
            />
          </div>

          <div className="select-group">
            <label id="vpfo-lsb-building" htmlFor="vpfo-lsb-building-input">
              Building
            </label>
            <Select 
              options={buildingOptions}
              name="vpfo-lsb-building"
              components={animatedComponents}
              inputId="vpfo-lsb-building-input"
              onChange={(selected) => setBuildingFilter(selected)}
            />
          </div>

          <div className="select-group">
            <label id="vpfo-lsb-accessibility" htmlFor="vpfo-lsb-accessibility-input">
              Accessibility
            </label>
            <Select 
              options={accessibilityOptions}
              isMulti
              name="vpfo-lsb-accessibility"
              components={animatedComponents}
              inputId="vpfo-lsb-accessibility-input"
              onChange={(selected) => setAccessibilityFilter(selected)}
            />
          </div>

          <div className="select-group">
            <label id="vpfo-lsb-audio-visual" htmlFor="vpfo-lsb-audio-visual-input">
              Audio Visual
            </label>
            <Select 
              options={audioVisualOptions}
              isMulti
              name="vpfo-lsb-audio-visual"
              components={animatedComponents}
              inputId="vpfo-lsb-audio-visual-input"
              onChange={(selected) => setAudioVisualFilter(selected)}
            />
          </div>

          <button
            type="submit"
            disabled={props.loading}
          >
            Submit Filters
          </button>
        </form>
      </>
    }
  </>);
}