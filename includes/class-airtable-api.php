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
		// delete_transient( $cache_key );
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

		return $this->airtable_get( 'Informal Spaces Amenities', $payload, $params );
	}

	public function get_accessibility( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'Name',
			'Description',
		);

		return $this->airtable_get( 'Accessibility', $payload, $params );
	}

	public function get_classroom_layouts( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'Name',
			'Description',
		);

		return $this->airtable_get( 'Classroom Layout', $payload, $params );
	}

	public function get_furniture( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'Name',
			'Description',
		);

		return $this->airtable_get( 'Furniture', $payload, $params );
	}

	public function get_resources( array $params ) {
		$payload           = array();
		$payload['fields'] = array(
			'File Name',
			'Attachment',
			'Category',
		);

		return $this->airtable_get( 'All Resources', $payload, $params );
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
		);

		return $this->airtable_get( 'Buildings', $payload, $params );
	}

	public function get_rooms( array $params ) {
		$payload = array();

		$payload['fields'] = array(
			'Title',
			'Building Name',
			'Building Code',
			'Room Number',
			'Image Gallery',
			'Classroom Layout',
			'Capacity',
		);

		$payload['pageSize']        = self::ROOMS_PER_PAGE;
		$payload['offset']          = $params['offset'] ?? null;
		$payload['filterByFormula'] = $this->get_rooms_filter_formula( $params['filters'] );

		// dd($payload['filterByFormula']);

		return $this->airtable_get( 'Classrooms', $payload, $params );
	}

	private function get_rooms_filter_formula( ?array $filters ): string {
		$formula_parts = array();
		if ( is_null( $filters ) ) {
			return '';
		}

		$capacity_filter      = isset( $filters['capacityFilter'] ) ? (int) $filters['capacityFilter'] : null;
		$audiovideo_filter    = $filters['audioVisualFilter'] ?? array();
		$accessibility_filter = $filters['audioVisualFilter'] ?? array();
		$building_filter      = $filters['buildingFilter'] ?? array();
		$furniture_filter     = $filters['furnitureFilter'] ?? array();

		if ( $capacity_filter ) {
			$formula_parts[] = "Capacity >= $capacity_filter";
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
				$formula_parts[] = "Building Code = '$building_code'";
			}
		}

		if ( ! empty( $furniture_filter ) ) {
			$furniture = sanitize_text_field( $furniture_filter['value'][0] ?? '' );
			if ( $furniture ) {
				$formula_parts[] = "Furniture = '$furniture'";
			}
		}

		if ( ! empty( $accessibility_filter ) ) {
			foreach ( $accessibility_filter as $filter ) {
				$value = sanitize_text_field( $filter['value'] ?? '' );
				if ( $value ) {
					$formula_parts[] = "FIND('$value', {Accessibility})";
				}
			}
		}

		return 'AND(' . implode( ', ', $formula_parts ) . ')';
	}
}
