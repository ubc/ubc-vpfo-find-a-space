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

		// Only load the plugin when the Airtable API key and Base ID are defined.
		if ( defined( 'UBC_VPFO_FIND_A_SPACE_AIRTABLE_API_KEY' ) && defined( 'UBC_VPFO_FIND_A_SPACE_AIRTABLE_API_KEY' ) ) {
			$this->load_dependencies();
		}
	}

	/**
	 * Load the required dependencies for this plugin.
	 *
	 * @since    1.0.0
	 * @access   private
	 */
	private function load_dependencies() {
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-find-a-space-ajax-handler.php';
		require_once plugin_dir_path( __DIR__ ) . 'includes/class-airtable-api.php';

		$this->ajax_handler = new Find_A_Space_Ajax_Handler();

		add_action( 'init', array( $this, 'init_block' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ), 100 );
	}

	public function init_block() {
		register_block_type( plugin_dir_path( __DIR__ ) . 'build' );
	}

	public function enqueue_scripts() {
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
