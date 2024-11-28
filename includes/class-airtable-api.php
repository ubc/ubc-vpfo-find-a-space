<?php

namespace UbcVpfoFindASpace;

defined( 'ABSPATH' ) || exit;

use TANIOS\Airtable\Airtable;

class Airtable_Api {
	private $van_airtable;
	private $okan_airtable;

	const CACHE_TTL      = HOUR_IN_SECONDS * 12; // 12 hours
	const ROOMS_PER_PAGE = 10;

	private static $campus_mapping = array(
		'vancouver' => 'van_airtable',
		'okanagan'  => 'okan_airtable',
	);

	public function __construct( array $settings ) {
		$this->van_airtable = new Airtable(
			array(
				'api_key' => $settings['api_key'],
				'base'    => $settings['base_id_van'],
			)
		);

		$this->okan_airtable = new Airtable(
			array(
				'api_key' => $settings['api_key'],
				'base'    => $settings['base_id_okan'],
			)
		);
	}

	private function airtable( array $params ) {
		$campus = sanitize_text_field( $params['campus'] );
		return $this->{ self::$campus_mapping[ $campus ] };
	}

	private function airtable_get( string $table, array $payload, array $params ) {
		$airtable = $this->airtable( $params );
		$request  = $airtable->getContent( $table, $payload );
		$response = $request->getResponse();

		if ( ! $response['records'] || empty( $response['records'] ) ) {

			// Check for an error from Airtable.
			if ( isset( $response['error'] ) ) {
				throw new \Exception(
					'Invalid Airtable response ' .
					wp_json_encode(
						array(
							'formula'  => $payload['filterByFormula'] ?? null,
							'error'    => $response['error'],
							'params'   => $params,
							'response' => $response,
							'table'    => $table,
						)
					)
				);
			}

			// Return an empty result.
			return array(
				'records' => array(),
				'offset'  => null,
			);
		}

		$res = array(
			'records' => $response['records'],
			'offset'  => $response['offset'],
		);

		return $res;
	}

	/**
	 * Iterate over all keys in the Airtable Response and sanitize the
	 * values for storage as a WordPress Transient.
	 *
	 * @param mixed $data The Airtable response data.
	 * @return mixed The sanitized data.
	 */
	public function sanitize_for_transient( $data ) {

		if ( ! is_array( $data ) ) {
			return $data;
		}

		foreach ( $data as $key => &$value ) {
			if ( is_array( $value ) ) {
				$value = $this->sanitize_for_transient( $value ); // Recursive call for nested arrays
			} elseif ( is_string( $value ) ) {
				if ( filter_var( $value, FILTER_VALIDATE_URL ) ) {
					$value = esc_url_raw( $value );
				} elseif ( is_numeric( $value ) ) {
					$value = intval( $value );
				} else {
					$value = sanitize_text_field( $value );
				}
			} elseif ( is_int( $value ) || is_float( $value ) ) {
				$value = intval( $value );
			}
		}

		return $data;
	}

	public function get( string $func, array $params = array() ) {
		$campus = sanitize_text_field( $params['campus'] );
		if ( ! array_key_exists( $campus, self::$campus_mapping ) ) {
			throw new \Exception( 'Invalid campus provided.' );
		}

		// Sort the parameters to ensure consistent cache keys.
		ksort( $params );
		$cache_key = null;

		if ( $params['should_cache'] ?? false ) {
			$cache_key = sprintf( '%s_%s_%s', $campus, $func, md5( wp_json_encode( $params ) ) );
			$records   = get_transient( $cache_key );

			if ( $records ) {
				return $records;
			}
		}

		$records = call_user_func_array( array( $this, $func ), array( 'params' => $params ) );

		if ( null !== $cache_key ) {
			$records = $this->sanitize_for_transient( $records );
			set_transient( $cache_key, $records, self::CACHE_TTL ); // Cache for 1 hour
		}

		return $records;
	}

	public function get_informal_amenities( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'Name',
			'Description',
		);

		$payload['sort'] = array(
			array(
				'field'     => 'Filter Sort',
				'direction' => 'asc',
			),
		);

		return $this->filter_empty_options(
			$this->airtable_get( 'Informal Spaces Amenities', $payload, $params ),
			$params
		);
	}

	public function get_accessibility( array $params ) {
		$payload           = array();
		$formula_parts     = array();
		$payload['fields'] = array(
			'Name',
			'Description',
			'Formal Count',
			'Informal Count',
		);

		$payload['sort'] = array(
			array(
				'field'     => 'Filter Sort',
				'direction' => 'asc',
			),
		);

		$formula_parts[]            = '{Hide from Filter Drop Down} = 0';
		$payload['filterByFormula'] = 'AND(' . implode( ', ', $formula_parts ) . ')';

		return $this->filter_empty_options(
			$this->airtable_get( 'Accessibility', $payload, $params ),
			$params
		);
	}

	public function get_classroom_layouts( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'Name',
			'Description',
			'Formal Count',
			'Informal Count',
		);

		$payload['sort'] = array(
			array(
				'field'     => 'Filter Sort',
				'direction' => 'asc',
			),
		);

		return $this->filter_empty_options(
			$this->airtable_get( 'Classroom Layout', $payload, $params ),
			$params
		);
	}

	public function get_furniture( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'Name',
			'Description',
			'Formal Count',
			'Informal Count',
		);

		$payload['sort'] = array(
			array(
				'field'     => 'Filter Sort',
				'direction' => 'asc',
			),
		);

		return $this->filter_empty_options(
			$this->airtable_get( 'Furniture', $payload, $params ),
			$params
		);
	}

	public function get_other_room_features( array $params ) {
		$payload           = array();
		$formula_parts     = array();
		$payload['fields'] = array(
			'Name',
			'Category',
			'Description',
		);

		$payload['sort'] = array(
			array(
				'field'     => 'Filter Sort',
				'direction' => 'asc',
			),
		);

		$formula_parts[]            = '{Hide from Filter Drop Down} = 0';
		$formula_parts[]            = '{Category} = "Other Room Features"';
		$payload['filterByFormula'] = 'AND(' . implode( ', ', $formula_parts ) . ')';

		return $this->filter_empty_options(
			$this->airtable_get( 'Amenities', $payload, $params ),
			$params
		);
	}

	public function get_shared_amenities( array $params ) {
		$payload           = array();
		$formula_parts     = array();
		$payload['fields'] = array(
			'Name',
			'Category',
			'Description',
		);

		$payload['sort'] = array(
			array(
				'field'     => 'Filter Sort',
				'direction' => 'asc',
			),
		);

		$formula_parts[]            = '{Hide from Filter Drop Down} = 0';
		$formula_parts[]            = '{Category} != "Other Room Features"';
		$payload['filterByFormula'] = 'AND(' . implode( ', ', $formula_parts ) . ')';

		return $this->filter_empty_options(
			$this->airtable_get( 'Amenities', $payload, $params ),
			$params
		);
	}

	public function get_buildings( array $params ) {
		$payload = array();

		$payload['fields'] = array(
			'Building Code',
			'Building Name',
			'Building Name (override)',
			'Formal Count',
			'Informal Count',
		);

		$payload['sort'] = array(
			array(
				'field'     => 'Building Name',
				'direction' => 'asc',
			),
		);

		$buildings = $this->filter_empty_options(
			$this->airtable_get( 'Buildings', $payload, $params ),
			$params
		);

		if ( null !== $buildings['records'] ) {
			$buildings['records'] = array_map(
				function ( $record ) {
					$fields = (array) $record->fields;
					if ( ! empty( $fields['Building Name (override)'] ) ) {
						$fields['Building Name'] = $fields['Building Name (override)'];
					}

					$record->fields = $fields;

					return $record;
				},
				$buildings['records']
			);
		}

		return $buildings;
	}

	public function get_rooms( array $params ) {
		$payload = array();

		$payload['fields'] = array(
			'Title',
			'Name',
			'Buildings - Building Name',
			'Buildings - Building Name (override)',
			'Building Code',
			'Room Number',
			'Image Gallery',
			'Capacity',
			'Slug',
			'Building Slug',
			'Filter_Room_Layout_Type',
			'Formatted_Room_Layout_Type',
			'Filter_Furniture',
			'Formatted_Furniture',
		);

		$payload['pageSize']        = self::ROOMS_PER_PAGE;
		$payload['offset']          = $params['offset'] ?? null;
		$payload['filterByFormula'] = $this->get_rooms_filter_formula( $params );

		// Defaults for sorting on Airtable Classrooms
		$sort_direction = 'asc';
		$sort_field     = 'Title';

		// Modify sorting based on the provided sort parameter
		switch ( $params['sort_by'] ) {
			case 'alpha_asc':
				// No change
				break;
			case 'alpha_desc':
				$sort_direction = 'desc';
				break;
			case 'capacity_desc':
				$sort_field     = 'Capacity';
				$sort_direction = 'desc';
				// No change
				break;
			case 'code_asc':
				$sort_field = 'Name';
				// No change
				break;
		}

		$payload['sort'] = array(
			array(
				'field'     => $sort_field,
				'direction' => $sort_direction,
			),
		);

		$rooms = $this->airtable_get( 'Classrooms', $payload, $params );

		if ( null !== $rooms['records'] ) {
			$rooms['records'] = array_map(
				function ( $record ) {
					$fields              = (array) $record->fields;
					$fields['Room Link'] = sprintf( '%s/classrooms/%s', get_site_url(), $fields['Slug'] );

					if ( ! empty( $fields['Building Slug'] ) ) {
						$fields['Building Link'] = sprintf( '%s/buildings/%s', get_site_url(), $fields['Building Slug'][0] );
					} else {
						$fields['Building Link'] = '';
					}

					$record->fields = $fields;

					return $record;
				},
				$rooms['records']
			);
		}

		// Sort the rooms by levenshein distance to improve search results.
		if ( null !== $rooms['records'] && ! empty( $params['search'] ) ) {
			$search = sanitize_text_field( $params['search'] );

			usort(
				$rooms['records'],
				function ( $a, $b ) use ( $search ) {
					return levenshtein( $search, strtolower( $a->fields['Name'] ) ) - levenshtein( $search, strtolower( $b->fields['Name'] ) );
				}
			);
		}

		return $rooms;
	}

	private function filter_empty_options( array $response, array $params ) {
		$formal = (bool) $params['formal'];

		$records = $response['records'] ?? array();

		$records = array_values(
			array_filter(
				$response['records'],
				function ( $record ) use ( $formal ) {
					$key = $formal ? 'Formal Count' : 'Informal Count';
					if ( ! property_exists( $record->fields, $key ) ) {
						return true;
					}

					return 0 !== $record->fields->$key;
				}
			)
		);

		$response['records'] = $records;

		return $response;
	}

	private function get_rooms_filter_formula( array $params ): string {
		$formula_parts = array();
		$filters       = isset( $params['filters'] ) ? $params['filters'] : null;
		$search        = isset( $params['search'] ) ? $params['search'] : null;

		$is_informal_string = rest_sanitize_boolean( $params['formal'] ) ? '0' : '1';

		// Do not show hidden rooms.
		$formula_parts[] = '{Is Hidden} = 0';

		// Filter to informal / formal learning spaces.
		$formula_parts[] = '{Is Informal Space} = ' . $is_informal_string;

		// Return early if no filters or search are being applied.
		if ( is_null( $filters ) && is_null( $search ) ) {
			return 'AND(' . implode( ', ', $formula_parts ) . ')';
		}

		$capacity_filter            = isset( $filters['capacityFilter'] ) ? $filters['capacityFilter'] : null;
		$audiovideo_filter          = $filters['audioVisualFilter'] ?? array();
		$accessibility_filter       = $filters['accessibilityFilter'] ?? array();
		$building_filter            = $filters['buildingFilter'] ?? array();
		$furniture_filter           = $filters['furnitureFilter'] ?? array();
		$informal_amenities_filter  = $filters['ISAmenitiesFilter'] ?? array();
		$layout_filter              = $filters['layoutFilter'] ?? array();
		$other_room_features_filter = $filters['otherRoomFeaturesFilter'] ?? array();

		// Set a default capacity min/max
		$capacity_min_max = array( 0, 500 );

		// Sanitize capacity filter.
		if ( $capacity_filter && count( $capacity_filter ) === 2 ) {
			$capacity_min_max[0] = absint( $capacity_filter[0] );
			$capacity_min_max[1] = absint( $capacity_filter[1] );
		}

		// Apply the filter for capacity only if it is not default.
		if ( 0 !== $capacity_min_max[0] || 500 !== $capacity_min_max[1] ) {
			$formula_parts[] = "{Capacity} >= $capacity_min_max[0]";
			$formula_parts[] = "{Capacity} <= $capacity_min_max[1]";
		}

		if ( ! empty( $informal_amenities_filter ) ) {
			foreach ( $informal_amenities_filter as $filter ) {
				$value = sanitize_text_field( $filter['value'] ?? '' );
				if ( $value ) {
					$formula_parts[] = "FIND('$value', {Filter_IS_Amenities})";
				}
			}
		}

		if ( ! empty( $audiovideo_filter ) ) {
			foreach ( $audiovideo_filter as $filter ) {
				$value = sanitize_text_field( $filter['value'] ?? '' );
				if ( $value ) {
					$formula_parts[] = "FIND('$value', {Filter_Amenities})";
				}
			}
		}

		if ( ! empty( $other_room_features_filter ) ) {
			foreach ( $other_room_features_filter as $filter ) {
				$value = sanitize_text_field( $filter['value'] ?? '' );
				if ( $value ) {
					$formula_parts[] = "FIND('$value', {Filter_Amenities})";
				}
			}
		}

		if ( ! empty( $building_filter ) ) {
			$building_filter_parts = array();

			foreach ( $building_filter as $filter ) {
				$value = sanitize_text_field( $filter['value'][0] ?? '' );
				if ( $value ) {
					$building_filter_parts[] = "{Building Code} = '$value'";
				}
			}

			$formula_parts[] = 'OR(' . implode( ', ', $building_filter_parts ) . ')';
		}

		if ( ! empty( $furniture_filter ) ) {
			$furniture_filter_parts = array();

			foreach ( $furniture_filter as $filter ) {
				$value = sanitize_text_field( $filter['value'] ?? '' );
				if ( $value ) {
					$furniture_filter_parts[] = "FIND('$value', {Filter_Furniture})";
				}
			}

			$formula_parts[] = 'OR(' . implode( ', ', $furniture_filter_parts ) . ')';
		}

		if ( ! empty( $layout_filter ) ) {
			$layout_filter_parts = array();

			foreach ( $layout_filter as $filter ) {
				$value = sanitize_text_field( $filter['value'] ?? '' );
				if ( $value ) {
					$layout_filter_parts[] = "FIND('$value', {Filter_Room_Layout_Type})";
				}
			}

			$formula_parts[] = 'OR(' . implode( ', ', $layout_filter_parts ) . ')';
		}

		if ( ! empty( $accessibility_filter ) ) {
			foreach ( $accessibility_filter as $filter ) {
				$value = sanitize_text_field( $filter['value'] ?? '' );
				if ( $value ) {
					$formula_parts[] = "FIND('$value', {Filter_Accessibility})";
				}
			}
		}

		// Finally, apply search if provided.
		if ( $search ) {
			$search               = preg_replace( '/[^A-Za-z0-9 ]/', '', $search ); // Remove non alphanumeric characters
			$search_parts         = explode( ' ', $search ); // Explode search string into parts
			$search_formula_parts = array();

			foreach ( $search_parts as $part ) {
				$part = strtolower( trim( $part ) );

				$search_formula_parts[] = "FIND('$part', LOWER({Name}))";
				$search_formula_parts[] = "FIND('$part', LOWER({Building Name}))";
				$search_formula_parts[] = "FIND('$part', LOWER({Building Code}))";
				$search_formula_parts[] = "FIND('$part', LOWER({Room Number}))";
			}

			$formula_parts[] = 'OR(' . implode( ', ', $search_formula_parts ) . ')';
		}

		if ( count( $formula_parts ) === 0 ) {
			return '';
		}

		if ( count( $formula_parts ) === 1 ) {
			return $formula_parts[0];
		}

		return 'AND(' . implode( ', ', $formula_parts ) . ')';
	}
}
