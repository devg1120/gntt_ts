import { render } from 'solid-js/web';
import { BarDemo } from '../components/BarDemo.jsx';

// @ts-expect-error TS(2307): Cannot find module 'react/jsx-runtime' or its corr... Remove this comment to see the full error message
render(() => <BarDemo />, document.getElementById('app'));
