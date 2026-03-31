import { createSignal } from 'solid-js';
import { Gantt } from './Gantt.jsx';

/**
 * GanttDemo - Interactive demo for the main Gantt component.
 */
export function GanttDemo() {
    // Sample tasks - each on its own row via resource
    const [tasks, setTasks] = createSignal([
        {
            id: 'task-1',
            name: 'Project Planning',
            start: '2024-01-01',
            end: '2024-01-05',
            progress: 100,
            resource: 'Planning',
            color: '#3b82f6',
            color_progress: '#1d4ed8',
        },
        {
            id: 'task-2',
            name: 'Design Phase',
            start: '2024-01-06',
            end: '2024-01-12',
            progress: 80,
            dependencies: 'task-1',
            resource: 'Design',
            color: '#8b5cf6',
            color_progress: '#6d28d9',
        },
        {
            id: 'task-3',
            name: 'Development',
            start: '2024-01-13',
            end: '2024-01-25',
            progress: 45,
            dependencies: 'task-2',
            resource: 'Development',
            color: '#10b981',
            color_progress: '#059669',
        },
        {
            id: 'task-4',
            name: 'Testing',
            start: '2024-01-26',
            end: '2024-01-30',
            progress: 20,
            dependencies: 'task-3',
            resource: 'QA',
            color: '#f59e0b',
            color_progress: '#d97706',
        },
        {
            id: 'task-5',
            name: 'Documentation',
            start: '2024-01-15',
            end: '2024-01-28',
            progress: 30,
            dependencies: 'task-2',
            resource: 'Docs',
            color: '#ec4899',
            color_progress: '#db2777',
        },
        {
            id: 'task-6',
            name: 'Deployment',
            start: '2024-01-31',
            end: '2024-02-02',
            progress: 0,
            dependencies: 'task-4,task-5',
            resource: 'DevOps',
            color: '#ef4444',
            color_progress: '#dc2626',
        },
    ]);

    // Options
    const [options] = createSignal({
        view_mode: 'Day',
        bar_height: 30,
        padding: 18,
        column_width: 45,
        upper_header_height: 45,
        lower_header_height: 30,
        lines: 'both',
        scroll_to: 'start',
    });

    // Event handlers
    const handleDateChange = (taskId: any, position: any) => {
        console.log('Date changed:', taskId, position);
    };

    const handleProgressChange = (taskId: any, progress: any) => {
        console.log('Progress changed:', taskId, progress);
    };

    const handleTaskClick = (taskId: any, event: any) => {
        console.log('Task clicked:', taskId);
    };

    // Styles
    const containerStyle = {
        'max-width': '1200px',
        margin: '0 auto',
        padding: '20px',
        'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    };

    const headerStyle = {
        'margin-bottom': '20px',
    };

    const ganttWrapperStyle = {
        border: '1px solid #e0e0e0',
        'border-radius': '8px',
        overflow: 'hidden',
        'background-color': '#fff',
    };

    const infoStyle = {
        'margin-top': '20px',
        padding: '15px',
        'background-color': '#f5f5f5',
        'border-radius': '8px',
        'font-size': '14px',
    };

    return (
        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
        <div style={containerStyle}>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={headerStyle}>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>
                    SolidJS Gantt Chart
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </h1>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <p style={{ margin: 0, color: '#666' }}>
                    Full Gantt chart with grid, headers, tasks, and dependency arrows.
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </p>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={ganttWrapperStyle}>
                <Gantt
                    tasks={tasks()}
                    options={options()}
                    onDateChange={handleDateChange}
                    onProgressChange={handleProgressChange}
                    onTaskClick={handleTaskClick}
                />
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={infoStyle}>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <strong>Features:</strong>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <ul style={{ margin: '10px 0 0 0', 'padding-left': '20px' }}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li>Grid with background, rows, and vertical tick lines</li>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li>Date headers showing months and days</li>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li>Draggable task bars with grid snapping</li>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li>Resizable bars (drag left/right edges)</li>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li>Progress bar adjustment</li>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li>Dependency arrows with smart routing</li>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <li>Horizontal scrolling</li>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </ul>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <p style={{ margin: '10px 0 0 0' }}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <strong>Try:</strong> Drag tasks horizontally, resize from edges,
                    or drag the progress handle. Check the console for events.
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </p>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>
        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
        </div>
    );
}

export default GanttDemo;
