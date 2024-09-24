/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from '@wordpress/block-editor';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit() {
  const blockProps = useBlockProps();
  const { campus, isFormal } = attributes;

  return (
      <div {...blockProps}>
          <InspectorControls>
              <PanelBody title="Campus Settings">
                  <SelectControl
                      label="Campus"
                      value={campus}
                      options={[
                          { label: 'Vancouver', value: 'Vancouver' },
                          { label: 'Okanagan', value: 'Okanagan' },
                      ]}
                      onChange={(value) => setAttributes({ campus: value })}
                  />
                  <ToggleControl
                      label="Formal"
                      checked={isFormal}
                      onChange={(value) => setAttributes({ isFormal: value })}
                  />
              </PanelBody>
          </InspectorControls>
          <p>
              Campus: {campus} | Formal: {isFormal ? 'Yes' : 'No'}
          </p>
      </div>
  );
}
