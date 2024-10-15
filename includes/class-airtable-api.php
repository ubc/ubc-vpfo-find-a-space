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
			'Notes',
		);

		return $this->airtable_get( 'Shared Amenities', $payload, $params );
	}

	public function get_buildings( array $params ) {
		$payload = array();

		$payload['fields'] = array(
			'Building Code',
			'Building Name',
			'Building Address',
			'Building Image',
			'Building Content',
		);

		$payload['filterByFormula'] = 'Building Published = Yes';

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

		$payload['pageSize'] = self::ROOMS_PER_PAGE;
		$payload['offset']   = $params['offset'] ?? null;

		return $this->airtable_get( 'Classrooms', $payload, $params );
	}
}
