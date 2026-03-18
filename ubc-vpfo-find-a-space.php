<?php
/**
 * Plugin Name:       UBC VPFO Find A Space
 * Description:       Example block scaffolded with Create Block tool.
 * Requires at least: 6.6
 * Requires PHP:      7.0
 * Version:           1.0.1
 * Author:            Paperleaf ZGM
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ubc-vpfo-find-a-space
 *
 * @package CreateBlock
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

use UbcVpfoFindASpace\Find_A_Space;

require_once 'vendor/autoload.php';

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'UBC_VPFO_FIND_A_SPACE_VERSION', '1.0.4' );

require plugin_dir_path( __FILE__ ) . 'includes/class-find-a-space.php';

/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function run_ubc_vpfo_find_a_space() {
	// Instantiating the plugin class will register
	// hooks related to plugin functionality.
	new Find_A_Space();
}
run_ubc_vpfo_find_a_space();
