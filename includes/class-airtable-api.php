<?php

namespace UbcVpfoFindASpace;

defined( 'ABSPATH' ) || exit;

use TANIOS\Airtable\Airtable;

class Airtable_Api {
	private $airtable;

	const CACHE_TTL = 3600;

	public static $campus_map = array(
		'vancouver' => 'UBCV',
		'okanagan'  => 'UBCO',
	);

	public function __construct() {
		$api_key = UBC_VPFO_FIND_A_SPACE_AIRTABLE_API_KEY;
		$base_id = UBC_VPFO_FIND_A_SPACE_AIRTABLE_BASE_ID;

		$this->airtable = new Airtable(
			array(
				'api_key' => $api_key,
				'base'    => $base_id,
			)
		);
	}

	public function setup_payload( array $params ) {
		$payload = array();

		if ( ! array_key_exists( $params['campus'], self::$campus_map ) ) {
			throw new \Exception( 'Invalid campus.' );
		}

		$payload['filterByFormula'] = sprintf( '%s = "%s"', 'campus', self::$campus_map[ $params['campus'] ] );
		// TODO: Apply formal vs non-formal filter from $params.

		return $payload;
	}

	public function get( string $func, array $params = array() ) {
		// Sort the parameters to ensure consistent cache keys.
		ksort( $params );

		// Create cache key for this request.
		$cache_key = sprintf( '%s_%s', $func, md5( wp_json_encode( $params ) ) );

		delete_transient( $cache_key );
		$records = get_transient( $cache_key );

		if ( $records ) {
			return $records;
		}

		$records = call_user_func_array( array( $this, $func ), array( 'params' => $params ) );

		set_transient( $cache_key, $records, self::CACHE_TTL ); // Cache for 1 hour

		return $records;
	}

	public function get_buildings( array $params ) {
		$payload = $this->setup_payload( $params );

		$payload['sort'] = array(
			array(
				'field'     => 'BLDG_UID',
				'direction' => 'asc',
			),
		);

		$payload['fields'] = array(
			'BLDG_UID',
			'name',
			'bldg_code',
		);

		$request  = $this->airtable->getContent( 'Buildings', $payload );
		$response = $request->getResponse();

		if ( ! $response['records'] || empty( $response['records'] ) ) {
			return null;
		}

		$records = $response['records'];

		return $records;
	}
}
