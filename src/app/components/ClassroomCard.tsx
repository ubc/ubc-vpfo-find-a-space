import React, { useState, useEffect } from 'react';
import { StateContext } from '../StateProvider';

export default function ClassroomCard(props) {
	const context = React.useContext(StateContext);

	const room = props.room;

	const renderImage = () => {
		const hasThumb = typeof room['Image Gallery'] !== 'undefined' && room['Image Gallery'].length > 0;
		if ( ! hasThumb ) {
			return <div className="classroom-thumbnail no-image"></div>
		}

		const thumb = room['Image Gallery'][0] ?? null;
		let thumbProps = {} as any;

		if (thumb && thumb['url'] ) {
			if ( thumb.thumbnails.large.url ) {
				thumbProps.src = thumb.thumbnails.large.url;
			}
			if (thumb.thumbnails.large.width ) {
				thumbProps.width = thumb.thumbnails.large.width;
			}
			if ( thumb.thumbnails.large.height ) {
				thumbProps.height = thumb.thumbnails.large.height;
			}
			if ( room['Name'] ) {
				thumbProps.alt = room['Name'];
			}
		}
		
		return <div className="classroom-thumbnail">
			<img
				key={ thumbProps.src }
				src={ thumbProps.src }
				alt={ thumbProps.alt }
				width={ thumbProps.width }
				height={ thumbProps.height }
			/>
		</div>
	}

	const renderRoomInformation = () => {
		const room = props.room;
		const roomBuildingNameOriginal = room['Building Name Original'] ? room['Building Name Original'][0] : null;
		const roomBuildingNameOverride = room['Building Name Override'] ? room['Building Name Override'][0] : null;
		const roomBuildingName = roomBuildingNameOverride ?? roomBuildingNameOriginal;

		return (
			<div className="d-flex align-items-start justify-content-between mb-5">
				<div>
					<h2 className="mb-0 fw-bold text-uppercase">{ room['Name'] }</h2>
          <a
            href={ room['Building Link'] }
            target="_blank"
            className="classroom-building-name fw-bold text-uppercase mt-2 vpfo-building-link">
              { roomBuildingName }
          </a>
				</div>
				<a
					href={ room['Room Link'] }
					target="_blank"
					className="btn btn-secondary ms-5 text-nowrap vpfo-classroom-link">
            View Space
        </a>
			</div>
		)
	}

	const renderRoomMeta = () => {
		const room = props.room;
		const capacity = room['Capacity'] ?? null;
		const layoutType = room['Formatted_Room_Layout_Type'] ?? null;
		const furniture = room['Formatted_Furniture'] ?? null;

		let renderLayout = '' as null|string;

		if ( layoutType && furniture ) {
			renderLayout = furniture + '; ' + layoutType;
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
						<dt>Style - Furniture &amp; Layout</dt>
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