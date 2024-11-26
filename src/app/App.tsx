import React, { useState, useEffect } from 'react';
import { StateContext } from './StateProvider';
import { getBuildings, getRooms, getMeta } from './services/api';
import Table from './components/Table';
import Filters from './components/Filters'
import Classroom from './components/Classroom'
import Building from './components/Building'
import { useSearchParams } from'react-router-dom';
import _ from 'lodash';

export default function App() {

  const getFilterStateFromQuery = () => {
		try {
			const filterString = searchParams.get('filters') || '{}';
			const filters      = JSON.parse(decodeURIComponent(filterString));

			return filters;
		} catch(e) {
			console.error('Error parsing filters:', e);
			return {};
		}
	}

	const getClassroomStateFromQuery = () => {
		try {
			let classroomSlug = searchParams.get('classroom') || null;

			if ( classroomSlug ) {
				classroomSlug = decodeURIComponent(classroomSlug);
			}

			return classroomSlug ?? '';
		} catch(e) {
			console.error('Error parsing classroom slug:', e);
			return '';
		}
	}

	const getBuildingStateFromQuery = () => {
		try {
			let buildingSlug = searchParams.get('building') || null;

			if ( buildingSlug ) {
				buildingSlug = decodeURIComponent(buildingSlug);
			} 

			return buildingSlug ?? '';
		} catch(e) {
			console.error('Error parsing building slug:', e);
			return '';
		}
	}

	const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(getFilterStateFromQuery);
	const [classroom, setClassroom] = useState(getClassroomStateFromQuery);
	const [building, setBuilding] = useState(getBuildingStateFromQuery);
	const [loading, setLoading] = useState(false);

	// Setup click listeners for classroom links to hijack navigation.
	useEffect(() => {
		document.addEventListener('click', (e) => {

			const element = e.target as HTMLAnchorElement;
			if ( ! element || element.tagName !== 'A' ) {
				return;
			}

			if ( element.classList.contains('vpfo-classroom-link') ) {
				const slug = element.href.substring(element.href.lastIndexOf('/') + 1);
				if ( slug ) {
					e.preventDefault();
					handleShowClassroom(slug);
				}
			}

			if ( element.classList.contains('vpfo-return-to-lsf') ) {
				e.preventDefault();

				handleClearClassroom();
				handleClearBuilding();
			}

			if ( element.classList.contains('vpfo-building-link') ) {
				const slug = element.href.substring(element.href.lastIndexOf('/') + 1);
				if ( slug ) {
					e.preventDefault();
					handleShowBuilding(slug);
				}
			}
		})
	}, []);

	// Similarly, setup click listeners for building links to hijack navigation.
	useEffect(() => {
		document.addEventListener('click', (e) => {
			const element = e.target as HTMLAnchorElement;
			if ( element && element.tagName === 'A' && element.classList.contains('vpfo-building-link') ) {
				const slug = element.href.substring(element.href.lastIndexOf('/') + 1);
				if ( slug ) {
					e.preventDefault();
					handleShowBuilding(slug);
				}
			}
		})
	}, []);

	/**
	 * When state changes, updated query param state to reflect current state.
	 */
	useEffect(() => {
    // console.log({
    //   filters,
    //   classroom,
    //   building,
    //   searchParams,
    // });

    searchParams.set('classroom', classroom);
    searchParams.set('building', building);
    searchParams.set('filters', encodeURIComponent(JSON.stringify(filters)));

    setSearchParams(searchParams);
	}, [filters, classroom, building]);

	const handleShowClassroom = (newClassroom) => {
    setClassroom(newClassroom);
    setBuilding('');
	}

  const handleClearClassroom = () => {
    setClassroom('');
	}

	const handleShowBuilding = (newBuilding) => {
    setBuilding(newBuilding);
    setClassroom('');
	}
	
	const handleClearBuilding = () => {
    setBuilding('');
	}

	const handleSubmitFilters = (newFilters) => {
    setFilters(newFilters);
	}

	const handleClearFilters = () => {
    setFilters({});
	}

	// TODO - remove console logging when ready for production
	// console.log({
	// 	filters,
	// 	classroom,
	// 	building,
	// 	searchParams,
	// 	loading,
	// })

	let pageState = 'table';
	if ( classroom !== '' ) {
		pageState = 'classroom';
	} else if ( classroom === '' && building !== '' ) {
		pageState = 'building';
	}

	let classroomClass = pageState === 'classroom'? '' : 'd-none';
	let buildingClass  = pageState === 'building'? '' : 'd-none';
	let tableClass     = pageState === 'table' ? 'vpfo-lsb-container' : 'vpfo-lsb-container d-none';

	return (<>

		{/* Render classroom if classroom is set. */}
		<div className={classroomClass}>
			<Classroom
				classroom={classroom}
				clearClassroom={handleClearClassroom}
			/>
		</div>

		{/* Render building if building is set, and classroom is not set */}
		<div className={buildingClass}>
			<Building
				building={building}
				clearBuilding={handleClearBuilding}
			/>
		</div>

		{/* Otherwise, render filters and table. */}
		<div className={tableClass}>
			<Filters
				filters={filters}
				loading={loading}
				onSubmitFilters={handleSubmitFilters}
				setLoading={setLoading}
        clearFilters={handleClearFilters}
				showClassroom={handleShowClassroom}
			/>
			<Table
				filters={filters}
				loading={loading}
				setLoading={setLoading}
				clearFilters={handleClearFilters}
				showClassroom={handleShowClassroom}
			/>
		</div>
	</>);
}