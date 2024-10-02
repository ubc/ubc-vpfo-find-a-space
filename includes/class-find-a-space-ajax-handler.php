<?php

namespace UbcVpfoFindASpace;

defined( 'ABSPATH' ) || exit;

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Ubc_Vpfo_Find_A_Space
 * @subpackage Ubc_Vpfo_Find_A_Space/includes
 * @author     Paperleaf ZGM <info@paper-leaf.com>
 */
class Find_A_Space_Ajax_Handler {

	const NONCE_KEY = 'ubc-vpfo-find-a-space-nonce';

	/**
	 * Api integration with Airtable.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Airtable_Api    $airtable_api
	 */
	protected $airtable_api;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		$this->airtable_api = new Airtable_Api();
		$this->register_handlers();
	}

	private function register_handlers() {
		// Callback for initial meta data.
		add_action( 'wp_ajax_find_a_space_meta', array( $this, 'meta_callback' ) );
		add_action( 'wp_ajax_nopriv_find_a_space_meta', array( $this, 'meta_callback' ) );

		// List buildings
		add_action( 'wp_ajax_find_a_space_buildings', array( $this, 'buildings_callback' ) );
		add_action( 'wp_ajax_nopriv_find_a_space_buildings', array( $this, 'buildings_callback' ) );

		// Query single building
		add_action( 'wp_ajax_find_a_space_single_building', array( $this, 'single_building_callback' ) );
		add_action( 'wp_ajax_nopriv_find_a_space_single_building', array( $this, 'single_building_callback' ) );

		// List spaces (with filters)
		add_action( 'wp_ajax_find_a_space_spaces', array( $this, 'spaces_callback' ) );
		add_action( 'wp_ajax_nopriv_find_a_space_spaces', array( $this, 'spaces_callback' ) );
	}

	private function verify_nonce() {
		return ( isset( $_REQUEST['_nonce'] )
			&& wp_verify_nonce( $_REQUEST['_nonce'], self::NONCE_KEY ) );
	}

	public function meta_callback() {
		if ( ! $this->verify_nonce() ) {
			return wp_send_json_error( 'Invalid nonce' );
		}

		return wp_send_json( array( 'message' => 'Meta' ) );
	}

	public function buildings_callback() {
		if ( ! $this->verify_nonce() ) {
			return wp_send_json_error( 'Invalid nonce' );
		}

		$data = $_REQUEST['data'];

		$campus = sanitize_text_field( $data['campus'] ?? null );
		$formal = rest_sanitize_boolean( $data['formal'] ?? null );

		$params = array(
			'campus' => $campus,
			'formal' => $formal,
		);

		$records = $this->airtable_api->get( 'get_buildings', $params );

		return wp_send_json( array( 'data' => $records ) );
	}

	public function single_building_callback() {
		if ( ! $this->verify_nonce() ) {
			return wp_send_json_error( 'Invalid nonce' );
		}

		return wp_send_json( array( 'message' => 'Building single' ) );
	}

	public function spaces_callback() {
		if ( ! $this->verify_nonce() ) {
			return wp_send_json_error( 'Invalid nonce' );
		}

		return wp_send_json( array( 'message' => 'Spaces' ) );
	}
}
