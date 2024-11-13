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
	const [searchParams, setSearchParams] = useSearchParams();

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
	 * When the query state changes, also update the application state.
	 */
	useEffect(() => {
		const queryFilters   = getFilterStateFromQuery();
		const queryClassroom = getClassroomStateFromQuery();
		const queryBuilding  = getBuildingStateFromQuery();

    // console.log('searchParams state updated');
    // console.log({ queryFilters, queryClassroom, queryBuilding });

		if ( false === _.isEqual(filters, queryFilters) ) {
			// console.log('setting filters', filters, queryFilters);
			setFilters(queryFilters);
		}

		if ( false === _.isEqual(classroom, queryClassroom) ) {
			// console.log('setting classroom', queryClassroom);
			setClassroom(queryClassroom);
		}

		if ( false === _.isEqual(building, queryBuilding) ) {
			// console.log('setting building', queryBuilding);
			setBuilding(queryBuilding);
		}
	}, [searchParams]);

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

	const [filters, setFilters] = useState(getFilterStateFromQuery);
	const [classroom, setClassroom] = useState(getClassroomStateFromQuery);
	const [building, setBuilding] = useState(getBuildingStateFromQuery);
	const [loading, setLoading] = useState(false);

	const handleShowClassroom = (newClassroom) => {
    searchParams.set('classroom', encodeURIComponent(newClassroom));
		setSearchParams(searchParams);
	}

  const handleClearClassroom = () => {
		searchParams.set('classroom', '');
		setSearchParams(searchParams);
	}

	const handleShowBuilding = (newBuilding) => {
    searchParams.set('building', encodeURIComponent(newBuilding));
		setSearchParams(searchParams);
	}
	
	const handleClearBuilding = () => {
    searchParams.set('building', '');
		setSearchParams(searchParams);
	}

	const setFilterQueryState = (newFilters) => {
		const filterString = encodeURIComponent(JSON.stringify(newFilters));
    searchParams.set('filters', filterString);
		setSearchParams(searchParams);
	}

	const handleSubmitFilters = (newFilters) => {
		setFilterQueryState(newFilters);
	}

	const handleClearFilters = () => {
		setFilterQueryState({});
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
	let buildingClass = pageState === 'building'? '' : 'd-none';
	let tableClass = pageState === 'table' ? 'vpfo-lsb-container' : 'vpfo-lsb-container d-none';

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