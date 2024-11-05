import { createRoot } from 'react-dom/client';
import AppContainer from './app/AppContainer';

const rootElement = document.getElementById('ubc-vpfo-find-a-space-root');

if ( rootElement ) {
	const config = JSON.parse(rootElement.getAttribute('data-config'));
	// Render your React component instead
	const root = createRoot(rootElement);
	root.render(<AppContainer config={ config }/>);
}
