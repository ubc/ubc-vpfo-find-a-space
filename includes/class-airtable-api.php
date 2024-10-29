<?php

namespace UbcVpfoFindASpace;

defined( 'ABSPATH' ) || exit;

use TANIOS\Airtable\Airtable;

class Airtable_Api {
	private $van_airtable;
	private $okan_airtable;

	const CACHE_TTL      = 3600;
	const ROOMS_PER_PAGE = 10;

	private static $campus_mapping = array(
		'vancouver' => 'van_airtable',
		'okanagan'  => 'okan_airtable',
	);

	public function __construct() {
		$api_key      = UBC_VPFO_FIND_A_SPACE_AIRTABLE_API_KEY;
		$van_base_id  = UBC_VPFO_FIND_A_SPACE_AIRTABLE_BASE_ID_VAN;
		$okan_base_id = UBC_VPFO_FIND_A_SPACE_AIRTABLE_BASE_ID_OKAN;

		$this->van_airtable = new Airtable(
			array(
				'api_key' => $api_key,
				'base'    => $van_base_id,
			)
		);

		$this->okan_airtable = new Airtable(
			array(
				'api_key' => $api_key,
				'base'    => $okan_base_id,
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
							'formula'  => $payload['filterByFormula'],
							'error'    => $response['error'],
							'params'   => $params,
							'response' => $response,
							'table'    => $table,
						)
					)
				);
			}

			// Return an empty result.
			return null;
		}

		$res = array(
			'records' => $response['records'],
			'offset'  => $response['offset'],
		);

		return $res;
	}

	public function get( string $func, array $params = array() ) {
		$campus = sanitize_text_field( $params['campus'] );
		if ( ! array_key_exists( $campus, self::$campus_mapping ) ) {
			throw new \Exception( 'Invalid campus provided.' );
		}

		// Sort the parameters to ensure consistent cache keys.
		ksort( $params );

		// Create cache key for this request.
		$cache_key = sprintf( '%s_%s_%s', $campus, $func, md5( wp_json_encode( $params ) ) );

		// TODO: Remove this transient delete.
		delete_transient( $cache_key );
		$records = get_transient( $cache_key );

		if ( $records ) {
			return $records;
		}

		$records = call_user_func_array( array( $this, $func ), array( 'params' => $params ) );

		set_transient( $cache_key, $records, self::CACHE_TTL ); // Cache for 1 hour

		return $records;
	}

	public function get_informal_amenities( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'Name',
			'Description',
		);

		return $this->filter_empty_options(
			$this->airtable_get( 'Informal Spaces Amenities', $payload, $params ),
			$params
		);
	}

	public function get_accessibility( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'Name',
			'Description',
			'Formal Count',
			'Informal Count',
		);

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

		return $this->filter_empty_options(
			$this->airtable_get( 'Furniture', $payload, $params ),
			$params
		);
	}

	public function get_resources( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'File Name',
			'Attachment',
			'Category',
		);

		return $this->filter_empty_options(
			$this->airtable_get( 'All Resources', $payload, $params ),
			$params
		);
	}

	public function get_shared_amenities( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'Name',
			'Category',
			'Description',
		);

		return $this->airtable_get( 'Amenities', $payload, $params );
	}

	public function get_buildings( array $params ) {
		$payload = array();

		$payload['fields'] = array(
			'Building Code',
			'Building Name',
			'Formal Count',
			'Informal Count',
		);

		return $this->filter_empty_options(
			$this->airtable_get( 'Buildings', $payload, $params ),
			$params
		);
	}

	public function get_rooms( array $params ) {
		$payload = array();

		$payload['fields'] = array(
			'Title',
			'Building Name',
			'Building Code',
			'Room Number',
			'Image Gallery',
			'Capacity',
			'Slug',
			'Filter_RoomLayoutType',
			'Filter_Furniture',
		);

		$payload['pageSize']        = self::ROOMS_PER_PAGE;
		$payload['offset']          = $params['offset'] ?? null;
		$payload['filterByFormula'] = $this->get_rooms_filter_formula( $params );

		// dd($payload['filterByFormula']);

		$rooms = $this->airtable_get( 'Classrooms', $payload, $params );

		// dd($rooms);

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

		$capacity_filter           = isset( $filters['capacityFilter'] ) ? (int) $filters['capacityFilter'] : null;
		$audiovideo_filter         = $filters['audioVisualFilter'] ?? array();
		$accessibility_filter      = $filters['accessibilityFilter'] ?? array();
		$building_filter           = $filters['buildingFilter'] ?? array();
		$furniture_filter          = $filters['furnitureFilter'] ?? array();
		$informal_amenities_filter = $filters['informalAmenitiesFilter'] ?? array();

		if ( $capacity_filter ) {
			$formula_parts[] = "{Capacity} >= $capacity_filter";
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

		if ( ! empty( $building_filter ) ) {
			$building_code = sanitize_text_field( $building_filter['value'][0] ?? '' );
			if ( $building_code ) {
				$formula_parts[] = "{Building Code} = '$building_code'";
			}
		}

		if ( ! empty( $furniture_filter ) ) {
			$value = sanitize_text_field( $furniture_filter['value'][0] ?? '' );
			if ( $value ) {
				$formula_parts[] = "FIND('$value', {Filter_Furniture})";
			}
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

				$search_formula_parts[] = "FIND('$part', LOWER({Title}))";
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
