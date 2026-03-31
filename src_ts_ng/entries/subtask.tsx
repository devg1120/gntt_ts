import { render } from 'solid-js/web';
import { GanttProjectDemo } from '../components/GanttProjectDemo.jsx';

// @ts-expect-error TS(2307): Cannot find module 'react/jsx-runtime' or its corr... Remove this comment to see the full error message
render(() => <GanttProjectDemo />, document.getElementById('root'));
