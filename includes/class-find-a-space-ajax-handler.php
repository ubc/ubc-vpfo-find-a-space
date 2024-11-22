<?php

namespace UbcVpfoFindASpace;

use DOMDocument;
use DOMXPath;

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
	 * Plugin settings, containing airtable information and base urls.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      array    $settings
	 */
	protected $settings;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * @since    1.0.0
	 */
	public function __construct( array $settings ) {
		$this->settings = $settings;
		$this->airtable_api = new Airtable_Api( $settings );
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

		// List rooms (with filters)
		add_action( 'wp_ajax_find_a_space_rooms', array( $this, 'rooms_callback' ) );
		add_action( 'wp_ajax_nopriv_find_a_space_rooms', array( $this, 'rooms_callback' ) );

		// Single room
		add_action( 'wp_ajax_find_a_space_classroom', array( $this, 'single_classroom_callback' ) );
		add_action( 'wp_ajax_nopriv_find_a_space_classroom', array( $this, 'single_classroom_callback' ) );

		// Single building
		add_action( 'wp_ajax_find_a_space_building', array( $this, 'single_building_callback' ) );
		add_action( 'wp_ajax_nopriv_find_a_space_building', array( $this, 'single_building_callback' ) );
	}

	private function verify_nonce() {
		return ( isset( $_REQUEST['_nonce'] )
			&& wp_verify_nonce( $_REQUEST['_nonce'], self::NONCE_KEY ) );
	}

	public function meta_callback() {
		if ( ! $this->verify_nonce() ) {
			return wp_send_json_error( 'Invalid nonce' );
		}

		$data = $_REQUEST['data'];

		$campus = sanitize_text_field( $data['campus'] ?? null );
		$formal = rest_sanitize_boolean( $data['formal'] ?? null );

		$params = array(
			'campus'       => $campus,
			'formal'       => $formal,
			'should_cache' => true,
		);

		$shared_amenities    = $this->airtable_api->get( 'get_shared_amenities', $params );
		$other_room_features = $this->airtable_api->get( 'get_other_room_features', $params );
		$informal_amenities  = $this->airtable_api->get( 'get_informal_amenities', $params );
		$accessibility       = $this->airtable_api->get( 'get_accessibility', $params );
		$classroom_layouts   = $this->airtable_api->get( 'get_classroom_layouts', $params );
		$furniture           = $this->airtable_api->get( 'get_furniture', $params );

		$payload = array(
			'shared_amenities'    => $shared_amenities,
			'other_room_features' => $other_room_features,
			'informal_amenities'  => $informal_amenities,
			'accessibility'       => $accessibility,
			'classroom_layouts'   => $classroom_layouts,
			'furniture'           => $furniture,
		);

		return wp_send_json( array( 'data' => $payload ) );
	}

	public function buildings_callback() {
		if ( ! $this->verify_nonce() ) {
			return wp_send_json_error( 'Invalid nonce' );
		}

		$data = $_REQUEST['data'];

		$campus = sanitize_text_field( $data['campus'] ?? null );
		$formal = rest_sanitize_boolean( $data['formal'] ?? null );

		$params = array(
			'campus'       => $campus,
			'formal'       => $formal,
			'should_cache' => true,
		);

		$data = $this->airtable_api->get( 'get_buildings', $params );

		return wp_send_json( array( 'data' => $data ) );
	}

	/**
	 * We are pulling the content for the virtually generated classroom and building pages and displaying
	 * it dynamically in the Find a Space GB block. We have to manipulate the HTML to get
	 * the template to work in the block, so we are scraping the HTML from the virtual page
	 * to display in the block so that we don't have to retrieve all of the data again and
	 * reformat it all, which saves processing resources. Provided that there is an instance
	 * of the Spaces Pages plugin running on the Learning Spaces website, the block will work
	 * on any site even without Spaces Pages because we're pulling the URLs directly from the
	 * Learning Spaces website.
	 *
	 * @param string $html     The HTML string to parse.
	 * @param string $selector The CSS selector to target.
	 *
	 * @return string|null The HTML content within the specified selector, or null if no match is found.
	 */
	private function get_html_in_selector( string $html, string $selector ) {
		// Load the HTML into DOMDocument
		libxml_use_internal_errors( true );
		$dom = new DOMDocument();
		$dom->loadHTML( $html );
		libxml_clear_errors();

		// Use DOMXPath to query for specific content
		$xpath    = new DOMXPath( $dom );
		$selector = sprintf( "//section[contains(@class, '%s')]", $selector );
		$elements = $xpath->query( $selector );

		if ( 0 === $elements->length ) {
			return null;
		}

		$html = $elements[0];

		$remove_element_selectors = array(
			// ".//div[@id='classroom-list']",
			"//div[contains(@class, 'classroom-list-nav')]",
		);

		foreach ( $remove_element_selectors as $selector ) {
			$inner_elements = $xpath->query( $selector, $html );

			if ( $inner_elements->length > 0 ) {
				// Remove the inner element with ID 'classroom-list'
				$el = $inner_elements[0];
				$el->parentNode->removeChild( $el );
			}
		}

		return $dom->saveHTML( $elements[0] );
	}

	public function single_building_callback() {
		if ( ! $this->verify_nonce() ) {
			return wp_send_json_error( 'Invalid nonce' );
		}

		$data = $_REQUEST['data'];

		$slug         = sanitize_text_field( $data['slug'] ?? null );
		$campus       = sanitize_text_field( $data['campus'] ?? null );
		$base_url_key = sprintf( '%s_%s', 'base_url', $campus );

		$base_url = $this->settings[ $base_url_key ];
		if ( ! $base_url ) {
			return wp_send_json_error( 'Base URL not found' );
		}

		$url = sprintf( '%s/buildings/%s?all_classroom=1', $base_url, $slug );

		$res = wp_remote_get( $url, array( 'method' => 'GET' ) );

		if ( is_wp_error( $res ) ) {
			return wp_send_json_error( 'Failed to fetch building data' );
		}

		$html = wp_remote_retrieve_body( $res );
		$html = $this->get_html_in_selector( $html, 'vpfo-spaces-page' );

		return wp_send_json( array( 'html' => $html ) );
	}

	public function single_classroom_callback() {
		if ( ! $this->verify_nonce() ) {
			return wp_send_json_error( 'Invalid nonce' );
		}

		$data = $_REQUEST['data'];

		$slug         = sanitize_text_field( $data['slug'] ?? null );
		$campus       = sanitize_text_field( $data['campus'] ?? null );
		$base_url_key = sprintf( '%s_%s', 'base_url', $campus );

		$base_url = $this->settings[ $base_url_key ];
		if ( ! $base_url ) {
			return wp_send_json_error( 'Base URL not found' );
		}

		$url = sprintf( '%s/classrooms/%s', $base_url, $slug );

		$res = wp_remote_get( $url, array( 'method' => 'GET' ) );

		if ( is_wp_error( $res ) ) {
			return wp_send_json_error( 'Failed to fetch classroom data' );
		}

		$html = wp_remote_retrieve_body( $res );
		$html = $this->get_html_in_selector( $html, 'vpfo-spaces-page' );

		return wp_send_json( array( 'html' => $html ) );
	}

	public function rooms_callback() {
		if ( ! $this->verify_nonce() ) {
			return wp_send_json_error( 'Invalid nonce' );
		}

		$data = $_REQUEST['data'];

		$campus  = sanitize_text_field( $data['campus'] ?? null );
		$offset  = sanitize_text_field( $data['offset'] ?? null );
		$search  = sanitize_text_field( $data['search'] ?? null );
		$formal  = rest_sanitize_boolean( $data['formal'] ?? null );
		$sort_by = sanitize_text_field( $data['sortBy'] ?? null );
		$filters = $data['filters'] ?? null;

		$allowed_sort_by = array(
			'alpha_asc',
			'alpha_desc',
			'capacity_desc',
			'code_asc',
		);

		if ( ! in_array( $sort_by, $allowed_sort_by, true ) ) {
			$sort_by = 'alpha_asc';
		}

		$params = array(
			'campus'       => $campus,
			'formal'       => $formal,
			'offset'       => $offset,
			'filters'      => $filters,
			'search'       => $search,
			'should_cache' => false, // We cannot cache due to LIST_RECORDS_ITERATOR_NOT_AVAILABLE errors from Airtable.
			'sort_by'      => $sort_by,
		);

		$data = $this->airtable_api->get( 'get_rooms', $params );

		return wp_send_json( $data );
	}
}
