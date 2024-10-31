import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';

export default function ClassroomCard(props) {
  const context = React.useContext(StateContext);
  const isFormal = context.config.formal;

  const room = props.room;

  const renderImage = () => {
    const hasThumb = typeof room['Image Gallery'] !== 'undefined' && room['Image Gallery'].length > 0;
    if ( ! hasThumb ) {
      return <div className="classroom-thumbnail no-image"></div>
    }

    const thumb = room['Image Gallery'][0] ?? null;
    let thumbProps = {} as any;

    if (thumb && thumb['url'] ) {
      if ( thumb['url'] ) {
        thumbProps.src = thumb['url'];
      }
      if ( thumb['width'] ) {
        thumbProps.width = thumb['width'];
      }
      if ( thumb['height'] ) {
        thumbProps.height = thumb['height'];
      }
      if ( room['Title'] ) {
        thumbProps.alt = room['Title'];
      }
    }
    
    return <div className="classroom-thumbnail">
      <img
        src={ thumbProps.src }
        alt={ thumbProps.alt }
        width={ thumbProps.width }
        height={ thumbProps.height }
      />
    </div>
  }

  const renderRoomInformation = () => {
    const room = props.room;

    return (
      <div className="d-flex align-items-start justify-content-between mb-5">
        <div>
          <h2 className="mb-0 fw-bold text-uppercase">{ room['Title'] }</h2>
          <div className="classroom-building-name fw-bold text-uppercase mt-2">{ room['Building Name'] }</div>
        </div>
        <a
          href={room['Room Link'] }
          target="_blank"
          className="btn btn-secondary ms-5 text-nowrap">View Space</a>
      </div>
    )
  }

  const renderRoomMeta = () => {
    const room = props.room;
    const capacity = room['Capacity'] ?? null;
    const layoutType = room['Filter_RoomLayoutType'] ?? null;
    const furniture = room['Filter_Furniture'] ?? null;

    let renderLayout = '' as null|string;

    if ( layoutType && furniture ) {
      renderLayout = layoutType + '; ' + furniture;
    } else if ( layoutType ) {
      renderLayout = layoutType;
    } else if ( furniture ) {
      renderLayout = furniture;
    } else {
      renderLayout = null;
    }

    return (
      <div className="d-flex align-items-start">
        { capacity !== null && 
          <dl>
            <dt>Capacity</dt>
            <dd>{ capacity }</dd>
          </dl>
        }
        { renderLayout !== null && 
          <dl className="ms-9">
            <dt>Style &amp; Layout</dt>
            <dd>{ renderLayout }</dd>
          </dl>
        }
      </div>
    )
  }

  return <>
    <div key={props.idx} className="classroom-card d-flex flex-column flex-md-row pt-5 pt-md-0 ps-md-5 position-relative">
      <div className="accent position-absolute"></div>

      { renderImage() }

      <div className="classroom-details p-5 ps-md-0 ms-md-9 flex-grow-1">
        { renderRoomInformation() }

        { renderRoomMeta() }
      </div>
    </div>
  </>
}