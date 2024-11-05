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
 */
class Find_A_Space_Airtable_Options {

	const NONCE_KEY            = 'ubc-vpfo-airtable-options-nonce';
	const OPTION_GROUP         = 'reading';
	const OPTION_SECTION_ID    = 'ubc_vpfo_airtable_section';
	const OPTION_PAGE          = 'reading';
	const OPTION_API_KEY       = 'UBC_VPFO_AIRTABLE_API_KEY';
	const OPTION_BASE_ID_VAN   = 'UBC_VPFO_AIRTABLE_BASE_ID_VAN';
	const OPTION_BASE_ID_OKAN  = 'UBC_VPFO_AIRTABLE_BASE_ID_OKAN';
	const OPTION_BASE_URL_VAN  = 'UBC_VPFO_AIRTABLE_BASE_URL_VAN';
	const OPTION_BASE_URL_OKAN = 'UBC_VPFO_AIRTABLE_BASE_URL_OKAN';

	/**
	 * Initialize the class and register settings.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	/**
	 * Registers settings section, fields, and settings.
	 *
	 * @since    1.0.0
	 */
	public function register_settings() {
		// Register the settings section.
		add_settings_section(
			self::OPTION_SECTION_ID,
			__( 'Airtable API Settings', 'ubc-vpfo-find-a-space' ),
			array( $this, 'display_section_description' ),
			self::OPTION_PAGE
		);

		// Register each field within the section.
		$this->add_text_field(
			self::OPTION_API_KEY,
			__( 'Airtable API Key', 'ubc-vpfo-find-a-space' ),
			''
		);
		$this->add_text_field(
			self::OPTION_BASE_ID_VAN,
			__( 'Airtable Base ID - Vancouver', 'ubc-vpfo-find-a-space' ),
			''
		);
		$this->add_text_field(
			self::OPTION_BASE_ID_OKAN,
			__( 'Airtable Base ID - Okanagan', 'ubc-vpfo-find-a-space' ),
			''
		);
		$this->add_text_field(
			self::OPTION_BASE_URL_VAN,
			__( 'Base url - Vancouver', 'ubc-vpfo-find-a-space' ),
			__( 'Eg. https://learningspaces.ubc.ca', 'ubc-vpfo-find-a-space' )
		);
		$this->add_text_field(
			self::OPTION_BASE_URL_OKAN,
			__( 'Base url - Okanagan', 'ubc-vpfo-find-a-space' ),
			__( 'Eg. https://learningspaces.ok.ubc.ca', 'ubc-vpfo-find-a-space' )
		);

		// Register the settings themselves.
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_API_KEY,
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			)
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_BASE_ID_VAN,
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			)
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_BASE_ID_OKAN,
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			)
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_BASE_URL_VAN,
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			)
		);

		register_setting(
			self::OPTION_GROUP,
			self::OPTION_BASE_URL_OKAN,
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => null,
			)
		);
	}

	/**
	 * Adds a text field to the settings section.
	 *
	 * @param string $id    The option field ID.
	 * @param string $title The field title.
	 * @param string $placeholder The placeholder text for the field.
	 */
	private function add_text_field( $id, $title, $placeholder ) {
		add_settings_field(
			$id,
			$title,
			array( $this, 'display_text_field' ),
			self::OPTION_PAGE,
			self::OPTION_SECTION_ID,
			array(
				'label_for'   => $id,
				'option_name' => $id,
				'placeholder' => $placeholder,
			)
		);
	}

	/**
	 * Callback for displaying the settings section description.
	 */
	public function display_section_description() {
		echo '<p>' . esc_html__( 'Enter API credentials to enable the UBC Find a Space block.', 'ubc-vpfo-find-a-space' ) . '</p>';
	}

	/**
	 * Callback for displaying a text field.
	 *
	 * @param array $args Arguments passed to the callback.
	 */
	public function display_text_field( $args ) {
		$option_name = $args['option_name'];
		$placeholder = $args['placeholder'] ?? '';
		$value       = get_option( $option_name );
		echo '<input type="text" id="' . esc_attr( $option_name ) . '" name="' . esc_attr( $option_name ) . '" placeholder="' . esc_attr( $placeholder ) . '" value="' . esc_attr( $value ) . '" class="regular-text">';
	}

	/**
	 * Retrieves all option settings.
	 *
	 * @return array An associative array of all option settings.
	 */
	public function get_settings() {
		return array(
			'api_key'            => get_option( self::OPTION_API_KEY ),
			'base_id_van'        => get_option( self::OPTION_BASE_ID_VAN ),
			'base_id_okan'       => get_option( self::OPTION_BASE_ID_OKAN ),
			'base_url_vancouver' => untrailingslashit( get_option( self::OPTION_BASE_URL_VAN ) ),
			'base_url_okanagan'  => untrailingslashit( get_option( self::OPTION_BASE_URL_OKAN ) ),
		);
	}
}
