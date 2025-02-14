<?php

namespace UbcVpfoSpacesPage;

defined( 'ABSPATH' ) || exit;

class Find_A_Space_Airtable_Options {

	const NONCE_KEY                = 'ubc-vpfo-airtable-options-nonce';
	const OPTION_GROUP             = 'reading';
	const OPTION_SECTION_ID        = 'ubc_vpfo_airtable_section';
	const OPTION_PAGE              = 'reading';
	const OPTION_API_KEY           = 'UBC_VPFO_AIRTABLE_API_KEY';
	const OPTION_BASE_ID_VAN       = 'UBC_VPFO_AIRTABLE_BASE_ID_VAN';
	const OPTION_BASE_ID_OKAN      = 'UBC_VPFO_AIRTABLE_BASE_ID_OKAN';
	const OPTION_BASE_URL_VAN      = 'UBC_VPFO_AIRTABLE_BASE_URL_VAN';
	const OPTION_BASE_URL_OKAN     = 'UBC_VPFO_AIRTABLE_BASE_URL_OKAN';
	const OPTION_AIRTABLE_LOCATION = 'UBC_VPFO_AIRTABLE_LOCATION';

	public function __construct() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	public function register_settings() {
		add_settings_section(
			self::OPTION_SECTION_ID,
			__( 'Airtable API Settings', 'ubc-vpfo-find-a-space' ),
			array( $this, 'display_section_description' ),
			self::OPTION_PAGE
		);

		$this->add_text_field( self::OPTION_API_KEY, __( 'Airtable API Key', 'ubc-vpfo-find-a-space' ), '' );
		$this->add_text_field( self::OPTION_BASE_ID_VAN, __( 'Airtable Base ID - Vancouver', 'ubc-vpfo-find-a-space' ), '' );
		$this->add_text_field( self::OPTION_BASE_ID_OKAN, __( 'Airtable Base ID - Okanagan', 'ubc-vpfo-find-a-space' ), '' );
		$this->add_text_field( self::OPTION_BASE_URL_VAN, __( 'Base URL - Vancouver', 'ubc-vpfo-find-a-space' ), __( 'Eg. https://learningspaces.ubc.ca', 'ubc-vpfo-find-a-space' ) );
		$this->add_text_field( self::OPTION_BASE_URL_OKAN, __( 'Base URL - Okanagan', 'ubc-vpfo-find-a-space' ), __( 'Eg. https://learningspaces.ok.ubc.ca', 'ubc-vpfo-find-a-space' ) );
		$this->add_select_field( self::OPTION_AIRTABLE_LOCATION, __( 'Airtable Location (Spaces Pages)', 'ubc-vpfo-find-a-space' ), array( 'van_airtable' => 'Vancouver', 'okan_airtable' => 'Okanagan' ) );

		register_setting( self::OPTION_GROUP, self::OPTION_API_KEY, array( 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => null ) );
		register_setting( self::OPTION_GROUP, self::OPTION_BASE_ID_VAN, array( 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => null ) );
		register_setting( self::OPTION_GROUP, self::OPTION_BASE_ID_OKAN, array( 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => null ) );
		register_setting( self::OPTION_GROUP, self::OPTION_BASE_URL_VAN, array( 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => null ) );
		register_setting( self::OPTION_GROUP, self::OPTION_BASE_URL_OKAN, array( 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => null ) );
		register_setting( self::OPTION_GROUP, self::OPTION_AIRTABLE_LOCATION, array( 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => 'van_airtable' ) );
	}

	private function add_text_field( $id, $title, $placeholder ) {
		add_settings_field( $id, $title, array( $this, 'display_text_field' ), self::OPTION_PAGE, self::OPTION_SECTION_ID, array( 'label_for' => $id, 'option_name' => $id, 'placeholder' => $placeholder ) );
	}

	private function add_select_field( $id, $title, $options ) {
		add_settings_field( $id, $title, array( $this, 'display_select_field' ), self::OPTION_PAGE, self::OPTION_SECTION_ID, array( 'label_for' => $id, 'option_name' => $id, 'options' => $options ) );
	}

	public function display_section_description() {
		echo '<p>' . esc_html__( 'Enter API credentials to enable the UBC Find a Space block.', 'ubc-vpfo-find-a-space' ) . '</p>';
	}

	public function display_text_field( $args ) {
		$option_name = $args['option_name'];
		$placeholder = $args['placeholder'] ?? '';
		$value       = get_option( $option_name );

		echo '<input type="text" id="' . esc_attr( $option_name ) . '" name="' . esc_attr( $option_name ) . '" placeholder="' . esc_attr( $placeholder ) . '" value="' . esc_attr( $value ) . '" class="regular-text">';
	}

	public function display_select_field( $args ) {
		$option_name = $args['option_name'];
		$options     = $args['options'];
		$value       = get_option( $option_name, 'van_airtable' );

		echo '<select id="' . esc_attr( $option_name ) . '" name="' . esc_attr( $option_name ) . '">';
		foreach ( $options as $key => $label ) {
			echo '<option value="' . esc_attr( $key ) . '"' . selected( $value, $key, false ) . '>' . esc_html( $label ) . '</option>';
		}
		echo '</select>';
	}

	public function get_settings() {
		return array(
			'api_key'            => get_option( self::OPTION_API_KEY ),
			'base_id_van'        => get_option( self::OPTION_BASE_ID_VAN ),
			'base_id_okan'       => get_option( self::OPTION_BASE_ID_OKAN ),
			'base_url_vancouver' => untrailingslashit( get_option( self::OPTION_BASE_URL_VAN ) ),
			'base_url_okanagan'  => untrailingslashit( get_option( self::OPTION_BASE_URL_OKAN ) ),
			'airtable_location'  => get_option( self::OPTION_AIRTABLE_LOCATION, 'van_airtable' ),
		);
	}
}
