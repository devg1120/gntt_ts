import { createSignal } from 'solid-js'
import solidLogo from './assets/solid.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
//import { Gantt } from './gantt/index';
import { Gantt } from '../../src/index';


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
	readonly: false,
    });

    // Event handlers
    const handleDateChange = (taskId, position) => {
        console.log('Date changed:', taskId, position);
    };

    const handleProgressChange = (taskId, progress) => {
        console.log('Progress changed:', taskId, progress);
    };

    const handleTaskClick = (taskId, event) => {
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
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>
                    SolidJS Gantt Chart
                </h1>
                <p style={{ margin: 0, color: '#666' }}>
                    Full Gantt chart with grid, headers, tasks, and dependency arrows.
                </p>
            </div>

            <div style={ganttWrapperStyle}>
                <Gantt
                    tasks={tasks()}
                    options={options()}
                    onDateChange={handleDateChange}
                    onProgressChange={handleProgressChange}
                    onTaskClick={handleTaskClick}
                />
            </div>

            <div style={infoStyle}>
                <strong>Features:</strong>
                <ul style={{ margin: '10px 0 0 0', 'padding-left': '20px' }}>
                    <li>Grid with background, rows, and vertical tick lines</li>
                    <li>Date headers showing months and days</li>
                    <li>Draggable task bars with grid snapping</li>
                    <li>Resizable bars (drag left/right edges)</li>
                    <li>Progress bar adjustment</li>
                    <li>Dependency arrows with smart routing</li>
                    <li>Horizontal scrolling</li>
                </ul>
                <p style={{ margin: '10px 0 0 0' }}>
                    <strong>Try:</strong> Drag tasks horizontally, resize from edges,
                    or drag the progress handle. Check the console for events.
                </p>
            </div>
        </div>
    );
}

function GanttSubtaskDemo() {
    // Resources - includes summary task rows and regular resources
    const [resources] = createSignal([
        'Projects',
        'Design Team',
        'Alice',
        'Bob',
        'Dev Team',
        'Charlie',
        'Diana',
        'QA',
        'Eve',
        'Frank',  // Single-resource subtask demo
    ]);

    // Hierarchical tasks with parentId relationships
    const [tasks] = createSignal([
        // === PROJECT 1: Website Redesign ===
        {
            id: 'project-1',
            name: 'Website Redesign',
            start: '2024-01-01',
            end: '2024-01-30',
            progress: 45,
            type: 'summary',
            resource: 'Projects',
            color: '#1e40af',
        },

        // Phase 1: Design (under Project 1)
        {
            id: 'phase-1',
            name: 'Design Phase',
            start: '2024-01-01',
            end: '2024-01-15',
            progress: 80,
            type: 'summary',
            parentId: 'project-1',
            resource: 'Design Team',
            color: '#7c3aed',
        },

        // Design tasks (under Phase 1)
        {
            id: 'task-1',
            name: 'Wireframes',
            start: '2024-01-01',
            end: '2024-01-05',
            progress: 100,
            parentId: 'phase-1',
            resource: 'Alice',
            color: '#8b5cf6',
        },
        {
            id: 'task-2',
            name: 'Visual Mockups',
            start: '2024-01-06',
            end: '2024-01-10',
            progress: 100,
            parentId: 'phase-1',
            resource: 'Bob',
            color: '#8b5cf6',
            dependencies: 'task-1',
        },
        {
            id: 'task-3',
            name: 'Design Review',
            start: '2024-01-11',
            end: '2024-01-15',
            progress: 40,
            parentId: 'phase-1',
            resource: 'Alice',
            color: '#8b5cf6',
            dependencies: 'task-2',
        },

        // Phase 2: Development (under Project 1)
        {
            id: 'phase-2',
            name: 'Development Phase',
            start: '2024-01-16',
            end: '2024-01-30',
            progress: 20,
            type: 'summary',
            parentId: 'project-1',
            resource: 'Dev Team',
            color: '#0369a1',
        },

        // Dev tasks (under Phase 2)
        {
            id: 'task-4',
            name: 'Frontend Build',
            start: '2024-01-16',
            end: '2024-01-24',
            progress: 30,
            parentId: 'phase-2',
            resource: 'Charlie',
            color: '#0ea5e9',
            dependencies: 'task-3',
        },
        {
            id: 'task-5',
            name: 'Backend API',
            start: '2024-01-18',
            end: '2024-01-26',
            progress: 20,
            parentId: 'phase-2',
            resource: 'Diana',
            color: '#0ea5e9',
        },
        {
            id: 'task-6',
            name: 'Integration',
            start: '2024-01-27',
            end: '2024-01-30',
            progress: 0,
            parentId: 'phase-2',
            resource: 'Charlie',
            color: '#0ea5e9',
            dependencies: 'task-4,task-5',
        },

        // === PROJECT 2: Mobile App ===
        {
            id: 'project-2',
            name: 'Mobile App',
            start: '2024-01-08',
            end: '2024-01-25',
            progress: 35,
            type: 'summary',
            resource: 'Projects',
            color: '#047857',
        },

        // Mobile tasks (flat, under Project 2)
        {
            id: 'task-7',
            name: 'App Architecture',
            start: '2024-01-08',
            end: '2024-01-12',
            progress: 100,
            parentId: 'project-2',
            resource: 'Diana',
            color: '#10b981',
        },
        {
            id: 'task-8',
            name: 'Core Features',
            start: '2024-01-13',
            end: '2024-01-20',
            progress: 40,
            parentId: 'project-2',
            resource: 'Charlie',
            color: '#10b981',
            dependencies: 'task-7',
        },
        {
            id: 'task-9',
            name: 'QA Testing',
            start: '2024-01-21',
            end: '2024-01-25',
            progress: 0,
            parentId: 'project-2',
            resource: 'Eve',
            color: '#10b981',
            dependencies: 'task-8',
        },

        // === FRANK'S SPRINT (Single-resource subtasks) ===
        {
            id: 'frank-sprint',
            name: "Frank's Sprint",
            start: '2024-01-02',
            end: '2024-01-19',
            progress: 60,
            type: 'summary',
            resource: 'Frank',
            color: '#dc2626',
        },
        {
            id: 'frank-task-1',
            name: 'Setup environment',
            start: '2024-01-02',
            end: '2024-01-03',
            progress: 100,
            parentId: 'frank-sprint',
            resource: 'Frank',
            color: '#ef4444',
        },
        {
            id: 'frank-task-2',
            name: 'Write unit tests',
            start: '2024-01-04',
            end: '2024-01-08',
            progress: 100,
            parentId: 'frank-sprint',
            resource: 'Frank',
            color: '#ef4444',
            dependencies: 'frank-task-1',
        },
        {
            id: 'frank-task-3',
            name: 'Code review',
            start: '2024-01-09',
            end: '2024-01-11',
            progress: 50,
            parentId: 'frank-sprint',
            resource: 'Frank',
            color: '#ef4444',
            dependencies: 'frank-task-2',
        },
        {
            id: 'frank-task-4',
            name: 'Deploy to staging',
            start: '2024-01-12',
            end: '2024-01-15',
            progress: 0,
            parentId: 'frank-sprint',
            resource: 'Frank',
            color: '#ef4444',
            dependencies: 'frank-task-3',
        },
        {
            id: 'frank-task-5',
            name: 'Documentation',
            start: '2024-01-16',
            end: '2024-01-19',
            progress: 0,
            parentId: 'frank-sprint',
            resource: 'Frank',
            color: '#ef4444',
            dependencies: 'frank-task-4',
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
    const handleDateChange = (taskId, position) => {
        console.log('Date changed:', taskId, position);
    };

    const handleProgressChange = (taskId, progress) => {
        console.log('Progress changed:', taskId, progress);
    };

    const handleTaskClick = (taskId, event) => {
        console.log('Task clicked:', taskId);
    };

    // Styles
    const containerStyle = {
        'max-width': '1400px',
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
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>
                    Subtasks Demo
                </h1>
                <p style={{ margin: 0, color: '#666' }}>
                    Hierarchical tasks with collapsible subtasks. Click the chevron icons to collapse/expand.
                </p>
            </div>

            <div style={ganttWrapperStyle}>
                <Gantt
                    tasks={tasks()}
                    resources={resources()}
                    options={options()}
                    onDateChange={handleDateChange}
                    onProgressChange={handleProgressChange}
                    onTaskClick={handleTaskClick}
                />
            </div>

            <div style={infoStyle}>
                <strong>Subtask Features:</strong>
                <ul style={{ margin: '10px 0 0 0', 'padding-left': '20px' }}>
                    <li>Click chevron icons on summary bars to collapse/expand children</li>
                    <li>Cross-resource: parent bar visible, children on different rows</li>
                    <li>Single-resource: children shown inline, parent hidden when expanded</li>
                    <li>Dragging a parent moves all its children together</li>
                    <li>Unlimited nesting depth (project &gt; phase &gt; task)</li>
                </ul>
                <p style={{ margin: '10px 0 0 0' }}>
                    <strong>Data Structure:</strong>
                </p>
                <pre style={{
                    'background-color': '#fff',
                    padding: '10px',
                    'border-radius': '4px',
                    overflow: 'auto',
                    'font-size': '12px',
                }}>
{`// Parent task (summary)
{
  id: 'project-1',
  name: 'Website Redesign',
  type: 'summary',
  resource: 'Projects',
  ...
}

// Child task
{
  id: 'task-1',
  name: 'Wireframes',
  parentId: 'project-1',  // Links to parent
  resource: 'Alice',
  ...
}`}
                </pre>
            </div>
        </div>
    );
}

function App() {
  const [count, setCount] = createSignal(0)

    const tasks = [
        { id: '1', name: 'Task 1', start: '2025-01-01', end: '2025-01-05', progress: 50 },
        { id: '2', name: 'Task 2', start: '2025-01-03', end: '2025-01-08', progress: 0,
          dependencies: [{ id: '1' }] },
    ];

  return (
  <>
    <Gantt tasks={tasks} />
    <GanttDemo  />
    <GanttSubtaskDemo />
  </>
  )
}

export default App
