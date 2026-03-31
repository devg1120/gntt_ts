import { render } from 'solid-js/web';
import { ConstraintDemo } from '../components/ConstraintDemo';

const root = document.getElementById('app');

if (root) {
    // @ts-expect-error TS(2307): Cannot find module 'react/jsx-runtime' or its corr... Remove this comment to see the full error message
    render(() => <ConstraintDemo />, root);
} else {
    console.error('Root element not found');
}
