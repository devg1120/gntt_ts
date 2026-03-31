import { createSignal } from 'solid-js';
import { Gantt } from './Gantt.jsx';
import { generateSubtaskDemo } from '../utils/subtaskGenerator.js';

/**
 * GanttProjectDemo - Demonstrates expandable subtasks with generated data.
 *
 * Features:
 * - 100 tasks across 5 resources (Alice, Bob, Charlie, Diana, Eve)
 * - Random mix of parent tasks with subtasks and standalone tasks
 * - Three subtask layouts: sequential, parallel, mixed
 * - Dependencies between parent/standalone tasks
 */
export function GanttProjectDemo() {
    // Generate tasks with seeded random (reproducible)
    const { tasks: generatedTasks, resources: generatedResources, expandedTasks } =
        generateSubtaskDemo({
            totalTasks: 100,
            parentTaskRatio: 1.0,  // 100% parents with subtasks
            seed: 12345,
        });

    const [resources] = createSignal(generatedResources);
    const [tasks] = createSignal(generatedTasks);

    // Options - all parent tasks expanded by default
    const [options] = createSignal({
        view_mode: 'Day',
        bar_height: 30,
        padding: 18,
        resourceColumnWidth: 150,
        subtaskHeightRatio: 0.5,
        expandedTasks,
    });

    // Callbacks
    const handleDateChange = (taskId: any, newDates: any) => {
        console.log('Date changed:', taskId, newDates);
    };

    const handleTaskClick = (taskId: any, event: any) => {
        console.log('Task clicked:', taskId);
    };

    // Info box styles
    const infoStyle = {
        padding: '15px',
        background: '#f8fafc',
        'border-radius': '6px',
        'margin-top': '20px',
        'font-size': '14px',
        'line-height': '1.6',
    };

    // Stats for display
    // @ts-expect-error TS(2339): Property 'subtaskLayout' does not exist on type '{... Remove this comment to see the full error message
    const parentCount = generatedTasks.filter(t => t.subtaskLayout).length;
    // @ts-expect-error TS(2339): Property 'parentId' does not exist on type '{ id: ... Remove this comment to see the full error message
    const subtaskCount = generatedTasks.filter(t => t.parentId).length;
    // @ts-expect-error TS(2339): Property 'subtaskLayout' does not exist on type '{... Remove this comment to see the full error message
    const standaloneCount = generatedTasks.filter(t => !t.subtaskLayout && !t.parentId).length;

    return (
        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
        <div style={{ padding: '20px', 'max-width': '1400px', margin: '0 auto' }}>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <h1 style={{ 'margin-bottom': '10px' }}>Subtask Demo</h1>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <p style={{ color: '#666', 'margin-bottom': '20px' }}>
                {generatedTasks.length} tasks across {generatedResources.length} resources
                ({parentCount} parents, {subtaskCount} subtasks, {standaloneCount} standalone)
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </p>

            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={{ border: '1px solid #ddd', 'border-radius': '8px', overflow: 'hidden' }}>
                <Gantt
                    tasks={tasks()}
                    resources={resources()}
                    options={options()}
                    onDateChange={handleDateChange}
                    onTaskClick={handleTaskClick}
                />
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={infoStyle}>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <strong>Subtask Layout Types:</strong>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <ul style={{ margin: '10px 0 0 0', 'padding-left': '20px' }}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li><strong>Sequential</strong>: Subtasks in a single row, back-to-back</li>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li><strong>Parallel</strong>: Subtasks stacked vertically (overlap in time)</li>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li><strong>Mixed</strong>: Auto-computed rows based on time overlap</li>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </ul>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={infoStyle}>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <strong>Generation Config:</strong>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <pre style={{
                    background: '#1e293b',
                    color: '#e2e8f0',
                    padding: '15px',
                    'border-radius': '4px',
                    'margin-top': '10px',
                    overflow: 'auto',
                    'font-size': '12px',
                }}>{`import { generateSubtaskDemo } from '../utils/subtaskGenerator.js';

const { tasks, resources, expandedTasks } = generateSubtaskDemo({
    totalTasks: 100,          // Target number of tasks
    parentTaskRatio: 0.3,     // 30% are parents with subtasks
    minSubtasks: 2,           // Min subtasks per parent
    maxSubtasks: 5,           // Max subtasks per parent
    seed: 12345,              // For reproducibility
// @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
});`}</pre>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>
        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
        </div>
    );
}

export default GanttProjectDemo;
