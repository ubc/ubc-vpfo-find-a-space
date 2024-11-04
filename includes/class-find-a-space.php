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
class Find_A_Space {

	/**
	 * The unique identifier of this plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $plugin_name    The string used to uniquely identify this plugin.
	 */
	protected $plugin_name;

	/**
	 * The current version of the plugin.
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      string    $version    The current version of the plugin.
	 */
	protected $version;

	/**
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Find_A_Space_Ajax_Handler    $handler
	 */
	protected $ajax_handler;

	/**
	 *
	 * @since    1.0.0
	 * @access   protected
	 * @var      Find_A_Space_Airtable_Options    $airtable_options
	 */
	protected $airtable_options;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * @since    1.0.0
	 */
	public function __construct() {
		if ( defined( 'UBC_VPFO_FIND_A_SPACE_VERSION' ) ) {
			$this->version = UBC_VPFO_FIND_A_SPACE_VERSION;
		} else {
			$this->version = '1.0.0';
		}
		$this->plugin_name = 'ubc-vpfo-find-a-space';

		// Always instantiate the options page class.
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-find-a-space-airtable-options.php';
		$this->airtable_options = new Find_A_Space_Airtable_Options();

		$settings = $this->airtable_options->get_settings();

		// Only load the plugin when the Airtable API key and Base ID are defined.
		if ( $settings['api_key']
			&& $settings['base_id_van']
			&& $settings['base_id_okan']
		) {
			$this->load_dependencies( $settings );
		}
	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies( array $settings ) {
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-find-a-space-ajax-handler.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-airtable-api.php';

		$this->ajax_handler = new Find_A_Space_Ajax_Handler( $settings );

		add_action( 'init', array( $this, 'init_block' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'localize_scripts' ), 10 );
	}

	public function init_block() {
		register_block_type( plugin_dir_path( __DIR__ ) . 'build' );
	}

	public function localize_scripts() {
		wp_localize_script(
			'create-block-ubc-vpfo-find-a-space-view-script',
			'find_a_space_script_vars',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'site_url' => get_site_url(),
				'_nonce'   => wp_create_nonce( Find_A_Space_Ajax_Handler::NONCE_KEY ),
			)
		);
	}

	/**
	 * The name of the plugin used to uniquely identify it within the context of
	 * WordPress and to define internationalization functionality.
	 *
	 * @since     1.0.0
	 * @return    string    The name of the plugin.
	 */
	public function get_plugin_name() {
		return $this->plugin_name;
	}

	/**
	 * Retrieve the version number of the plugin.
	 *
	 * @since     1.0.0
	 * @return    string    The version number of the plugin.
	 */
	public function get_version() {
		return $this->version;
	}
}
