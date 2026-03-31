import {
    createSignal,
    createMemo,
    For,
    Show,
    onMount,
    onCleanup,
    batch,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { Bar } from './Bar.jsx';
import { Arrow } from './Arrow.jsx';
import { TaskDataPopup } from './TaskDataPopup.jsx';
import { TaskDataModal } from './TaskDataModal.jsx';
import { createTaskStore } from '../stores/taskStore.js';
import { createGanttConfigStore } from '../stores/ganttConfigStore.js';
import {
    resolveMovement,
    resolveAfterResize,
    DEPENDENCY_TYPES,
} from '../utils/constraintResolver.js';

// ============================================================================
// PRESETS
// ============================================================================
const PRESETS = {
    default: {
        name: 'Default',
        taskConfig: {
            name: 'Task',
            color: '#b8c2cc',
            color_progress: '#a3a3ff',
            progress: 50,
            cornerRadius: 3,
            locked: false,
            invalid: false,
        },
        arrowConfig: {
            startAnchor: 'auto',
            endAnchor: 'auto',
            startOffset: null, // null = auto (use smart calculation)
            endOffset: 0.5,
            routing: 'orthogonal',
            curveRadius: 5,
            stroke: '#666',
            strokeWidth: 1.4,
            strokeOpacity: 1,
            strokeDasharray: '',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            headShape: 'chevron',
            headSize: 5,
            headFill: false,
        },
        constraintConfig: {
            type: 'FS', // FS, SS, FF, SF
            lag: 0, // Offset (positive = delay, negative = lead)
            elastic: true, // true = minimum distance, false = fixed distance
        },
        globalConfig: {
            readonly: false,
            readonlyDates: false,
            readonlyProgress: false,
            showExpectedProgress: false,
            snapToGrid: true,
            columnWidth: 45,
        },
    },
    colorful: {
        name: 'Colorful',
        taskConfig: {
            name: 'Colorful Task',
            color: '#e74c3c',
            color_progress: '#c0392b',
            progress: 75,
            cornerRadius: 6,
            locked: false,
            invalid: false,
        },
        arrowConfig: {
            startAnchor: 'auto',
            endAnchor: 'auto',
            startOffset: null, // null = auto
            endOffset: 0.5,
            routing: 'orthogonal',
            curveRadius: 10,
            stroke: '#9b59b6',
            strokeWidth: 2.5,
            strokeOpacity: 1,
            strokeDasharray: '',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            headShape: 'triangle',
            headSize: 8,
            headFill: true,
        },
        constraintConfig: {
            type: 'FS',
            lag: 0,
            elastic: true,
        },
        globalConfig: {
            readonly: false,
            readonlyDates: false,
            readonlyProgress: false,
            showExpectedProgress: false,
            snapToGrid: true,
            columnWidth: 45,
        },
    },
    minimal: {
        name: 'Minimal',
        taskConfig: {
            name: 'Minimal',
            color: '#95a5a6',
            color_progress: '#7f8c8d',
            progress: 30,
            cornerRadius: 0,
            locked: false,
            invalid: false,
        },
        arrowConfig: {
            startAnchor: 'right',
            endAnchor: 'left',
            startOffset: 0.5,
            endOffset: 0.5,
            routing: 'straight',
            curveRadius: 0,
            stroke: '#bdc3c7',
            strokeWidth: 1,
            strokeOpacity: 0.6,
            strokeDasharray: '',
            strokeLinecap: 'butt',
            strokeLinejoin: 'miter',
            headShape: 'none',
            headSize: 5,
            headFill: false,
        },
        constraintConfig: {
            type: 'FS',
            lag: 0,
            elastic: true,
        },
        globalConfig: {
            readonly: false,
            readonlyDates: false,
            readonlyProgress: false,
            showExpectedProgress: false,
            snapToGrid: true,
            columnWidth: 45,
        },
    },
    constrained: {
        name: 'Constrained',
        taskConfig: {
            name: 'Constrained',
            color: '#3498db',
            color_progress: '#2980b9',
            progress: 60,
            cornerRadius: 3,
            locked: false,
            invalid: false,
        },
        arrowConfig: {
            startAnchor: 'auto',
            endAnchor: 'auto',
            startOffset: null, // null = auto
            endOffset: 0.5,
            routing: 'orthogonal',
            curveRadius: 5,
            stroke: '#e67e22',
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeDasharray: '',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            headShape: 'chevron',
            headSize: 6,
            headFill: false,
        },
        constraintConfig: {
            type: 'FS',
            lag: 20,
            elastic: true,
        },
        globalConfig: {
            readonly: false,
            readonlyDates: false,
            readonlyProgress: false,
            showExpectedProgress: false,
            snapToGrid: true,
            columnWidth: 45,
        },
    },
    locked: {
        name: 'Locked',
        taskConfig: {
            name: 'Locked Task',
            color: '#7f8c8d',
            color_progress: '#95a5a6',
            progress: 50,
            cornerRadius: 3,
            locked: true,
            invalid: false,
        },
        arrowConfig: {
            startAnchor: 'auto',
            endAnchor: 'auto',
            startOffset: null, // null = auto
            endOffset: 0.5,
            routing: 'orthogonal',
            curveRadius: 5,
            stroke: '#c0392b',
            strokeWidth: 1.5,
            strokeOpacity: 1,
            strokeDasharray: '4,4',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            headShape: 'chevron',
            headSize: 5,
            headFill: false,
        },
        constraintConfig: {
            type: 'FS',
            lag: 0,
            elastic: true,
        },
        globalConfig: {
            readonly: false,
            readonlyDates: false,
            readonlyProgress: false,
            showExpectedProgress: false,
            snapToGrid: true,
            columnWidth: 45,
        },
    },
    fixedOffset: {
        name: 'Fixed Offset',
        taskConfig: {
            name: 'Linked Task',
            color: '#9b59b6',
            color_progress: '#8e44ad',
            progress: 40,
            cornerRadius: 3,
            locked: false,
            invalid: false,
        },
        arrowConfig: {
            startAnchor: 'auto',
            endAnchor: 'auto',
            startOffset: null, // null = auto
            endOffset: 0.5,
            routing: 'orthogonal',
            curveRadius: 5,
            stroke: '#9b59b6',
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeDasharray: '8,4',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            headShape: 'none',
            headSize: 5,
            headFill: false,
        },
        constraintConfig: {
            type: 'FS',
            lag: 80, // Fixed gap between tasks
            elastic: false, // Fixed = tasks move together
        },
        globalConfig: {
            readonly: false,
            readonlyDates: false,
            readonlyProgress: false,
            showExpectedProgress: false,
            snapToGrid: true,
            columnWidth: 45,
        },
    },
    // New presets for other dependency types
    startToStart: {
        name: 'Start-to-Start',
        taskConfig: {
            name: 'Parallel Start',
            color: '#2ecc71',
            color_progress: '#27ae60',
            progress: 50,
            cornerRadius: 3,
            locked: false,
            invalid: false,
        },
        arrowConfig: {
            startAnchor: 'auto',
            endAnchor: 'auto',
            startOffset: null,
            endOffset: 0.5,
            routing: 'orthogonal',
            curveRadius: 5,
            stroke: '#27ae60',
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeDasharray: '',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            headShape: 'chevron',
            headSize: 5,
            headFill: false,
        },
        constraintConfig: {
            type: 'SS',
            lag: 0,
            elastic: true,
        },
        globalConfig: {
            readonly: false,
            readonlyDates: false,
            readonlyProgress: false,
            showExpectedProgress: false,
            snapToGrid: true,
            columnWidth: 45,
        },
    },
    finishToFinish: {
        name: 'Finish-to-Finish',
        taskConfig: {
            name: 'Sync End',
            color: '#e74c3c',
            color_progress: '#c0392b',
            progress: 50,
            cornerRadius: 3,
            locked: false,
            invalid: false,
        },
        arrowConfig: {
            startAnchor: 'auto',
            endAnchor: 'auto',
            startOffset: null,
            endOffset: 0.5,
            routing: 'orthogonal',
            curveRadius: 5,
            stroke: '#c0392b',
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeDasharray: '',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            headShape: 'chevron',
            headSize: 5,
            headFill: false,
        },
        constraintConfig: {
            type: 'FF',
            lag: 0,
            elastic: true,
        },
        globalConfig: {
            readonly: false,
            readonlyDates: false,
            readonlyProgress: false,
            showExpectedProgress: false,
            snapToGrid: true,
            columnWidth: 45,
        },
    },
};

// ============================================================================
// STYLES
// ============================================================================
const styles = {
    container: {
        'font-family':
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    header: {
        'text-align': 'center',
        'margin-bottom': '20px',
    },
    title: {
        margin: '0 0 8px 0',
        'font-size': '28px',
        'font-weight': '600',
    },
    subtitle: {
        margin: 0,
        color: '#666',
        'font-size': '14px',
    },
    presetBar: {
        display: 'flex',
        gap: '8px',
        'justify-content': 'center',
        'margin-bottom': '20px',
        'flex-wrap': 'wrap',
    },
    presetButton: {
        padding: '8px 16px',
        'border-radius': '4px',
        border: '1px solid #ddd',
        background: '#fff',
        cursor: 'pointer',
        'font-size': '13px',
        transition: 'all 0.2s',
    },
    presetButtonActive: {
        background: '#3498db',
        color: '#fff',
        'border-color': '#3498db',
    },
    configRow: {
        display: 'grid',
        'grid-template-columns': '1fr 1fr',
        gap: '20px',
        'margin-bottom': '20px',
    },
    panel: {
        background: '#f8f9fa',
        padding: '15px',
        'border-radius': '8px',
    },
    panelTitle: {
        margin: '0 0 12px 0',
        'font-size': '14px',
        'font-weight': '600',
        color: '#333',
    },
    fieldset: {
        border: '1px solid #dee2e6',
        padding: '10px',
        'border-radius': '4px',
        'margin-bottom': '10px',
    },
    legend: {
        'font-size': '11px',
        'font-weight': 'bold',
        color: '#6c757d',
        padding: '0 5px',
    },
    control: {
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
        'margin-bottom': '8px',
        'font-size': '12px',
    },
    label: {
        'min-width': '100px',
        color: '#555',
    },
    input: {
        flex: 1,
    },
    textInput: {
        padding: '4px 8px',
        border: '1px solid #ddd',
        'border-radius': '3px',
        'font-size': '12px',
        width: '100%',
    },
    colorInput: {
        width: '40px',
        height: '24px',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
    },
    select: {
        padding: '4px 8px',
        border: '1px solid #ddd',
        'border-radius': '3px',
        'font-size': '12px',
        width: '100%',
    },
    slider: {
        width: '100%',
    },
    checkbox: {
        cursor: 'pointer',
    },
    sliderValue: {
        'min-width': '40px',
        'text-align': 'right',
        color: '#888',
        'font-size': '11px',
    },
    constraintSection: {
        background: '#fff3cd',
        padding: '15px',
        'border-radius': '8px',
        'border-left': '4px solid #ffc107',
        'margin-bottom': '20px',
    },
    constraintTitle: {
        margin: '0 0 12px 0',
        'font-size': '14px',
        'font-weight': '600',
    },
    constraintRow: {
        display: 'flex',
        gap: '20px',
        'flex-wrap': 'wrap',
    },
    constraintControl: {
        display: 'flex',
        'align-items': 'center',
        gap: '8px',
    },
    numberInput: {
        width: '60px',
        padding: '4px 8px',
        border: '1px solid #ddd',
        'border-radius': '3px',
        'font-size': '12px',
    },
    svgContainer: {
        background: '#fff',
        border: '1px solid #ddd',
        'border-radius': '8px',
        'margin-bottom': '20px',
        overflow: 'hidden',
    },
    infoBox: {
        background: '#e7f5ff',
        padding: '15px',
        'border-radius': '8px',
        'border-left': '4px solid #339af0',
    },
    infoTitle: {
        margin: '0 0 8px 0',
        'font-size': '14px',
        'font-weight': '600',
    },
    infoText: {
        margin: 0,
        'font-size': '13px',
        'line-height': '1.5',
    },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ShowcaseDemo() {
    // Task store and config store
    const taskStore = createTaskStore();
    const ganttConfig = createGanttConfigStore({
        columnWidth: 45,
        barHeight: 30,
    });

    // Configuration state
    const [taskConfig, setTaskConfig] = createStore({
        ...PRESETS.default.taskConfig,
    });
    const [taskBConfig, setTaskBConfig] = createStore({
        name: 'Task B',
        color: '#27ae60',
        color_progress: '#2ecc71',
        progress: 50,
        locked: false,
    });
    const [taskCConfig, setTaskCConfig] = createStore({
        name: 'Task C',
        color: '#3498db',
        color_progress: '#2980b9',
        progress: 50,
        locked: false,
    });
    const [taskDConfig, setTaskDConfig] = createStore({
        name: 'Task D',
        color: '#9b59b6',
        color_progress: '#8e44ad',
        progress: 50,
        locked: false,
    });
    const [arrowConfig, setArrowConfig] = createStore({
        ...PRESETS.default.arrowConfig,
    });
    const [constraintConfig, setConstraintConfig] = createStore({
        ...PRESETS.default.constraintConfig,
    });
    const [globalConfig, setGlobalConfig] = createStore({
        ...PRESETS.default.globalConfig,
    });
    const [activePreset, setActivePreset] = createSignal('default');

    // Task data popup/modal state
    const [hoveredTaskId, setHoveredTaskId] = createSignal(null);
    const [popupPosition, setPopupPosition] = createSignal({ x: 0, y: 0 });
    const [popupVisible, setPopupVisible] = createSignal(false);
    const [modalTaskId, setModalTaskId] = createSignal(null);
    const [modalVisible, setModalVisible] = createSignal(false);

    // Computed values for popup/modal
    const hoveredTask = createMemo(() => {
        const id = hoveredTaskId();
        return id ? taskStore.getTask(id) : null;
    });
    const hoveredBarPosition = createMemo(() => {
        const id = hoveredTaskId();
        return id ? taskStore.getBarPosition(id) : null;
    });
    const modalTask = createMemo(() => {
        const id = modalTaskId();
        return id ? taskStore.getTask(id) : null;
    });
    const modalBarPosition = createMemo(() => {
        const id = modalTaskId();
        return id ? taskStore.getBarPosition(id) : null;
    });

    // Initialize tasks - positions for FS (Finish-to-Start) demo
    const initializeTasks = () => {
        const tasks = [
            {
                id: 'task-a',
                name: 'Task A',
                progress: taskConfig.progress,
                color: taskConfig.color,
                color_progress: taskConfig.color_progress,
                constraints: { locked: taskConfig.locked },
                invalid: taskConfig.invalid,
                _index: 0,
                $bar: { x: 80, y: 70, width: 120, height: 30 },
            },
            {
                id: 'task-b',
                name: taskBConfig.name,
                progress: taskBConfig.progress,
                color: taskBConfig.color,
                color_progress: taskBConfig.color_progress,
                constraints: { locked: taskBConfig.locked },
                _index: 1,
                $bar: { x: 200, y: 120, width: 120, height: 30 },
            },
            {
                id: 'task-c',
                name: taskCConfig.name,
                progress: taskCConfig.progress,
                color: taskCConfig.color,
                color_progress: taskCConfig.color_progress,
                constraints: { locked: taskCConfig.locked },
                _index: 2,
                $bar: { x: 320, y: 170, width: 120, height: 30 },
            },
            {
                id: 'task-d',
                name: taskDConfig.name,
                progress: taskDConfig.progress,
                color: taskDConfig.color,
                color_progress: taskDConfig.color_progress,
                constraints: { locked: taskDConfig.locked },
                _index: 3,
                $bar: { x: 440, y: 220, width: 120, height: 30 },
            },
        ];
        taskStore.updateTasks(tasks);
    };

    onMount(() => {
        initializeTasks();
    });

    // Update Task A when config changes
    const updateTaskA = () => {
        const taskA = taskStore.getTask('task-a');
        if (taskA) {
            taskStore.updateTask('task-a', {
                ...taskA,
                name: taskConfig.name,
                progress: taskConfig.progress,
                color: taskConfig.color,
                color_progress: taskConfig.color_progress,
                constraints: { locked: taskConfig.locked },
                invalid: taskConfig.invalid,
            });
        }
    };

    // Update Task B when config changes
    const updateTaskB = () => {
        const taskB = taskStore.getTask('task-b');
        if (taskB) {
            taskStore.updateTask('task-b', {
                ...taskB,
                name: taskBConfig.name,
                progress: taskBConfig.progress,
                color: taskBConfig.color,
                color_progress: taskBConfig.color_progress,
                constraints: { locked: taskBConfig.locked },
            });
        }
    };

    // Relationships based on constraint config using new dependency type API
    // Chain: A → B → C → D
    const relationships = createMemo(() => {
        const type = constraintConfig.type || 'FS';
        const lag = constraintConfig.lag || 0;
        const elastic = constraintConfig.elastic !== false;

        return [
            { from: 'task-a', to: 'task-b', type, lag, elastic },
            { from: 'task-b', to: 'task-c', type, lag, elastic },
            { from: 'task-c', to: 'task-d', type, lag, elastic },
        ];
    });

    // Task positions for each constraint type to demonstrate behavior
    const PRESET_POSITIONS = {
        // FS: Tasks chained end-to-start (B starts where A ends)
        default: {
            'task-a': { x: 80, y: 70, width: 120 },
            'task-b': { x: 200, y: 120, width: 120 },
            'task-c': { x: 320, y: 170, width: 120 },
            'task-d': { x: 440, y: 220, width: 120 },
        },
        colorful: {
            'task-a': { x: 80, y: 70, width: 120 },
            'task-b': { x: 200, y: 120, width: 120 },
            'task-c': { x: 320, y: 170, width: 120 },
            'task-d': { x: 440, y: 220, width: 120 },
        },
        minimal: {
            'task-a': { x: 80, y: 70, width: 120 },
            'task-b': { x: 200, y: 120, width: 120 },
            'task-c': { x: 320, y: 170, width: 120 },
            'task-d': { x: 440, y: 220, width: 120 },
        },
        constrained: {
            'task-a': { x: 80, y: 70, width: 120 },
            'task-b': { x: 220, y: 120, width: 120 },
            'task-c': { x: 360, y: 170, width: 120 },
            'task-d': { x: 500, y: 220, width: 120 },
        },
        locked: {
            'task-a': { x: 80, y: 70, width: 120 },
            'task-b': { x: 200, y: 120, width: 120 },
            'task-c': { x: 320, y: 170, width: 120 },
            'task-d': { x: 440, y: 220, width: 120 },
        },
        fixedOffset: {
            'task-a': { x: 80, y: 70, width: 120 },
            'task-b': { x: 280, y: 120, width: 120 },
            'task-c': { x: 480, y: 170, width: 120 },
            'task-d': { x: 680, y: 220, width: 120 },
        },
        // SS: Tasks start at same position (parallel work)
        startToStart: {
            'task-a': { x: 80, y: 70, width: 150 },
            'task-b': { x: 80, y: 120, width: 120 },
            'task-c': { x: 80, y: 170, width: 100 },
            'task-d': { x: 80, y: 220, width: 80 },
        },
        // FF: Tasks end at same position (synchronized finish)
        finishToFinish: {
            'task-a': { x: 80, y: 70, width: 150 },
            'task-b': { x: 110, y: 120, width: 120 },
            'task-c': { x: 150, y: 170, width: 80 },
            'task-d': { x: 180, y: 220, width: 50 },
        },
    };

    // Apply preset
    const applyPreset = (presetKey: any) => {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        const preset = PRESETS[presetKey];
        const positions =
            // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            PRESET_POSITIONS[presetKey] || PRESET_POSITIONS.default;

        // Batch all store updates to prevent timing issues
        batch(() => {
            setTaskConfig(preset.taskConfig);
            setArrowConfig(preset.arrowConfig);
            setConstraintConfig(preset.constraintConfig);
            setGlobalConfig(preset.globalConfig);
            setActivePreset(presetKey);
            // Reset task configs to defaults
            setTaskBConfig({
                name: 'Task B',
                color: '#27ae60',
                color_progress: '#2ecc71',
                progress: 50,
                locked: false,
            });
            setTaskCConfig({
                name: 'Task C',
                color: '#3498db',
                color_progress: '#2980b9',
                progress: 50,
                locked: false,
            });
            setTaskDConfig({
                name: 'Task D',
                color: '#9b59b6',
                color_progress: '#8e44ad',
                progress: 50,
                locked: false,
            });
        });

        // Reset task positions based on preset
        taskStore.updateBarPosition('task-a', {
            ...positions['task-a'],
            y: 70,
            height: 30,
        });
        taskStore.updateBarPosition('task-b', {
            ...positions['task-b'],
            y: 120,
            height: 30,
        });
        taskStore.updateBarPosition('task-c', {
            ...positions['task-c'],
            y: 170,
            height: 30,
        });
        taskStore.updateBarPosition('task-d', {
            ...positions['task-d'],
            y: 220,
            height: 30,
        });

        // Directly update task A with preset values
        const taskA = taskStore.getTask('task-a');
        if (taskA) {
            taskStore.updateTask('task-a', {
                ...taskA,
                name: preset.taskConfig.name,
                progress: preset.taskConfig.progress,
                color: preset.taskConfig.color,
                color_progress: preset.taskConfig.color_progress,
                constraints: { locked: preset.taskConfig.locked },
                invalid: preset.taskConfig.invalid,
            });
        }

        // Reset Tasks B, C, D in store
        const taskB = taskStore.getTask('task-b');
        if (taskB) {
            taskStore.updateTask('task-b', {
                ...taskB,
                name: 'Task B',
                progress: 50,
                color: '#27ae60',
                color_progress: '#2ecc71',
                constraints: { locked: false },
            });
        }
        const taskC = taskStore.getTask('task-c');
        if (taskC) {
            taskStore.updateTask('task-c', {
                ...taskC,
                name: 'Task C',
                progress: 50,
                color: '#3498db',
                color_progress: '#2980b9',
                constraints: { locked: false },
            });
        }
        const taskD = taskStore.getTask('task-d');
        if (taskD) {
            taskStore.updateTask('task-d', {
                ...taskD,
                name: 'Task D',
                progress: 50,
                color: '#9b59b6',
                color_progress: '#8e44ad',
                constraints: { locked: false },
            });
        }
    };

    // Constraint callback for Bar components - uses the constraint resolver
    const handleConstrainPosition = (taskId: any, newX: any, newY: any) => {
        const result = resolveMovement(
            taskId,
            newX,
            newY,
            taskStore,
            relationships(),
            { pixelsPerTimeUnit: 1 },
        );

        if (result === null) {
            // Movement blocked (e.g., task is locked)
            return null;
        }

        if (result.type === 'batch') {
            // Fixed offset: update all linked tasks
            // @ts-expect-error TS(2532): Object is possibly 'undefined'.
            result.updates.forEach((update) => {
                if (update.taskId !== taskId) {
                    taskStore.updateBarPosition(update.taskId, {
                        x: update.x,
                        y: update.y,
                    });
                }
            });
            // Return the position for the dragged task
            // @ts-expect-error TS(2532): Object is possibly 'undefined'.
            const draggedUpdate = result.updates.find(
                (u) => u.taskId === taskId,
            );
            return { x: draggedUpdate?.x ?? newX, y: draggedUpdate?.y ?? newY };
        }

        return { x: result.x, y: result.y };
    };

    // Handle resize end - trigger constraint resolution after duration change
    const handleResizeEnd = (taskId: any) => {
        resolveAfterResize(taskId, taskStore, relationships(), {
            pixelsPerTimeUnit: 1,
        });
    };

    // Handle task hover (show popup)
    const handleTaskHover = (taskId: any, x: any, y: any) => {
        setHoveredTaskId(taskId);
        setPopupPosition({ x, y });
        setPopupVisible(true);
    };

    // Handle task hover end (hide popup)
    const handleTaskHoverEnd = () => {
        setPopupVisible(false);
        setHoveredTaskId(null);
    };

    // Handle task click (show modal)
    const handleTaskClick = (taskId: any) => {
        setModalTaskId(taskId);
        setModalVisible(true);
        setPopupVisible(false); // Hide popup when modal opens
    };

    // Handle modal close
    const handleModalClose = () => {
        setModalVisible(false);
        setModalTaskId(null);
    };

    // Get positions for arrows
    const getTaskAPos = () =>
        taskStore.getBarPosition('task-a') || {
            x: 80,
            y: 70,
            width: 120,
            height: 30,
        };
    const getTaskBPos = () =>
        taskStore.getBarPosition('task-b') || {
            x: 200,
            y: 120,
            width: 120,
            height: 30,
        };
    const getTaskCPos = () =>
        taskStore.getBarPosition('task-c') || {
            x: 320,
            y: 170,
            width: 120,
            height: 30,
        };
    const getTaskDPos = () =>
        taskStore.getBarPosition('task-d') || {
            x: 440,
            y: 220,
            width: 120,
            height: 30,
        };

    // Info text based on constraints
    const getInfoText = () => {
        const parts = [];
        const type = constraintConfig.type || 'FS';
        const lag = constraintConfig.lag || 0;
        const elastic = constraintConfig.elastic !== false;

        // Dependency type description with constraint edge explanation
        const typeDescriptions = {
            FS: 'Finish-to-Start: Each successor starts after predecessor finishes (B.start >= A.end)',
            SS: 'Start-to-Start: Each successor starts when predecessor starts (B.start >= A.start)',
            FF: 'Finish-to-Finish: Each successor finishes when predecessor finishes (B.end >= A.end)',
            SF: 'Start-to-Finish: Each successor finishes when predecessor starts (B.end >= A.start)',
        };
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        parts.push(`${type} - ${typeDescriptions[type]}.`);

        // Chain description
        parts.push('Chain: A→B→C→D. Drag A right to push the whole chain.');

        // Lag description
        if (lag !== 0) {
            if (lag > 0) {
                parts.push(`Lag: +${lag}px delay between tasks.`);
            } else {
                parts.push(`Lead: ${lag}px overlap allowed.`);
            }
        }

        // Elastic vs fixed
        if (elastic) {
            parts.push(
                'Elastic: Lag is a minimum distance. Tasks can be further apart.',
            );
        } else {
            parts.push(
                'Fixed: Exact distance maintained. All linked tasks move together.',
            );
        }

        // Locked tasks
        if (taskConfig.locked) {
            parts.push('Task A Locked: Cannot be moved.');
        }
        if (taskBConfig.locked) {
            parts.push('Task B Locked: Cannot be moved.');
        }

        return parts.join(' ');
    };

    return (
        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
        <div style={styles.container}>
            {/* Header */}
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={styles.header}>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <h1 style={styles.title}>Props Showcase</h1>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <p style={styles.subtitle}>
                    Interactive demonstration of all task and connector
                    configuration options
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </p>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            {/* Preset Buttons */}
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={styles.presetBar}>
                // @ts-expect-error TS(2741): Property 'children' is missing in type '{ each: [s... Remove this comment to see the full error message
                <For each={Object.entries(PRESETS)}>
                    // @ts-expect-error TS(7031): Binding element 'key' implicitly has an 'any' type... Remove this comment to see the full error message
                    {([key, preset]) => (
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <button
                            style={{
                                ...styles.presetButton,
                                ...(activePreset() === key
                                    ? styles.presetButtonActive
                                    : {}),
                            }}
                            onClick={() => applyPreset(key)}
                        >
                            {preset.name}
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </button>
                    )}
                </For>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            {/* Configuration Panels */}
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={styles.configRow}>
                {/* Task Configuration */}
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <div style={styles.panel}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <h3 style={styles.panelTitle}>Task Configuration</h3>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <fieldset style={styles.fieldset}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <legend style={styles.legend}>Visual</legend>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Name:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="text"
                                value={taskConfig.name}
                                onInput={(e: any) => {
                                    setTaskConfig('name', e.target.value);
                                    updateTaskA();
                                }}
                                style={styles.textInput}
                            />
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Color:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="color"
                                value={taskConfig.color}
                                onInput={(e: any) => {
                                    setTaskConfig('color', e.target.value);
                                    updateTaskA();
                                }}
                                style={styles.colorInput}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span
                                style={{ color: '#888', 'font-size': '11px' }}
                            >
                                {taskConfig.color}
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Progress Color:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="color"
                                value={taskConfig.color_progress}
                                onInput={(e: any) => {
                                    setTaskConfig(
                                        'color_progress',
                                        e.target.value,
                                    );
                                    updateTaskA();
                                }}
                                style={styles.colorInput}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span
                                style={{ color: '#888', 'font-size': '11px' }}
                            >
                                {taskConfig.color_progress}
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Progress:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={taskConfig.progress}
                                onInput={(e: any) => {
                                    setTaskConfig(
                                        'progress',
                                        parseInt(e.target.value),
                                    );
                                    updateTaskA();
                                }}
                                style={styles.slider}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.sliderValue}>
                                {taskConfig.progress}%
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Corner Radius:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="range"
                                min="0"
                                max="15"
                                value={taskConfig.cornerRadius}
                                onInput={(e: any) => setTaskConfig(
                                    'cornerRadius',
                                    parseInt(e.target.value),
                                )
                                }
                                style={styles.slider}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.sliderValue}>
                                {taskConfig.cornerRadius}px
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </fieldset>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <fieldset style={styles.fieldset}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <legend style={styles.legend}>State</legend>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <label
                                style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <input
                                    type="checkbox"
                                    checked={taskConfig.locked}
                                    onChange={(e: any) => {
                                        setTaskConfig(
                                            'locked',
                                            e.target.checked,
                                        );
                                        updateTaskA();
                                    }}
                                    style={styles.checkbox}
                                />
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span>Locked</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </label>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <label
                                style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <input
                                    type="checkbox"
                                    checked={taskConfig.invalid}
                                    onChange={(e: any) => {
                                        setTaskConfig(
                                            'invalid',
                                            e.target.checked,
                                        );
                                        updateTaskA();
                                    }}
                                    style={styles.checkbox}
                                />
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span>Invalid</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </label>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </fieldset>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <fieldset style={styles.fieldset}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <legend style={styles.legend}>Interactions</legend>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <label
                                style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <input
                                    type="checkbox"
                                    checked={globalConfig.readonly}
                                    onChange={(e: any) => setGlobalConfig(
                                        'readonly',
                                        e.target.checked,
                                    )
                                    }
                                    style={styles.checkbox}
                                />
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span>Readonly (all)</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </label>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <label
                                style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <input
                                    type="checkbox"
                                    checked={globalConfig.readonlyDates}
                                    onChange={(e: any) => setGlobalConfig(
                                        'readonlyDates',
                                        e.target.checked,
                                    )
                                    }
                                    style={styles.checkbox}
                                />
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span>Readonly Dates</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </label>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <label
                                style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <input
                                    type="checkbox"
                                    checked={globalConfig.readonlyProgress}
                                    onChange={(e: any) => setGlobalConfig(
                                        'readonlyProgress',
                                        e.target.checked,
                                    )
                                    }
                                    style={styles.checkbox}
                                />
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span>Readonly Progress</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </label>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <label
                                style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <input
                                    type="checkbox"
                                    checked={globalConfig.showExpectedProgress}
                                    onChange={(e: any) => setGlobalConfig(
                                        'showExpectedProgress',
                                        e.target.checked,
                                    )
                                    }
                                    style={styles.checkbox}
                                />
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span>Show Expected Progress</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </label>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Grid Snap:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <label
                                style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    'min-width': '60px',
                                }}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <input
                                    type="checkbox"
                                    checked={globalConfig.snapToGrid}
                                    onChange={(e: any) => setGlobalConfig(
                                        'snapToGrid',
                                        e.target.checked,
                                    )
                                    }
                                    style={styles.checkbox}
                                />
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span style={{ 'font-size': '11px' }}>
                                    Enable
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                </span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </label>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="range"
                                min="1"
                                max="90"
                                step="1"
                                value={globalConfig.columnWidth}
                                disabled={!globalConfig.snapToGrid}
                                onInput={(e: any) => setGlobalConfig(
                                    'columnWidth',
                                    parseInt(e.target.value),
                                )
                                }
                                style={{
                                    ...styles.slider,
                                    opacity: globalConfig.snapToGrid ? 1 : 0.5,
                                }}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.sliderValue}>
                                {globalConfig.snapToGrid
                                    ? `${globalConfig.columnWidth}px`
                                    : 'off'}
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </fieldset>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </div>

                {/* Arrow Configuration */}
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <div style={styles.panel}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <h3 style={styles.panelTitle}>Connector Configuration</h3>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <fieldset style={styles.fieldset}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <legend style={styles.legend}>Anchoring</legend>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Start Anchor:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <select
                                value={arrowConfig.startAnchor}
                                onChange={(e: any) => setArrowConfig(
                                    'startAnchor',
                                    e.target.value,
                                )
                                }
                                style={styles.select}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="auto">Auto</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="top">Top</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="bottom">Bottom</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="left">Left</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="right">Right</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="center">Center</option>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </select>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>End Anchor:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <select
                                value={arrowConfig.endAnchor}
                                onChange={(e: any) => setArrowConfig('endAnchor', e.target.value)
                                }
                                style={styles.select}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="auto">Auto</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="left">Left</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="top">Top</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="bottom">Bottom</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="right">Right</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="center">Center</option>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </select>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Start Offset:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <label
                                style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    'min-width': '50px',
                                }}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <input
                                    type="checkbox"
                                    checked={arrowConfig.startOffset === null}
                                    onChange={() =>
                                        setArrowConfig(
                                            'startOffset',
                                            // @ts-expect-error TS(2345): Argument of type '0.5 | null' is not assignable to... Remove this comment to see the full error message
                                            arrowConfig.startOffset === null
                                                ? 0.5
                                                : null,
                                        )
                                    }
                                    style={styles.checkbox}
                                />
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span style={{ 'font-size': '11px' }}>
                                    Auto
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                </span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </label>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={arrowConfig.startOffset ?? 0.9}
                                disabled={arrowConfig.startOffset === null}
                                onInput={(e: any) => setArrowConfig(
                                    'startOffset',
                                    // @ts-expect-error TS(2345): Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
                                    parseFloat(e.target.value),
                                )
                                }
                                style={{
                                    ...styles.slider,
                                    opacity:
                                        arrowConfig.startOffset === null
                                            ? 0.5
                                            : 1,
                                }}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.sliderValue}>
                                {arrowConfig.startOffset === null
                                    ? 'auto'
                                    // @ts-expect-error TS(2339): Property 'toFixed' does not exist on type 'never'.
                                    : arrowConfig.startOffset.toFixed(2)}
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>End Offset:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={arrowConfig.endOffset}
                                onInput={(e: any) => setArrowConfig(
                                    'endOffset',
                                    parseFloat(e.target.value),
                                )
                                }
                                style={styles.slider}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.sliderValue}>
                                {arrowConfig.endOffset.toFixed(2)}
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </fieldset>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <fieldset style={styles.fieldset}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <legend style={styles.legend}>Path Shape</legend>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Routing:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <select
                                value={arrowConfig.routing}
                                onChange={(e: any) => setArrowConfig('routing', e.target.value)
                                }
                                style={styles.select}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="orthogonal">Orthogonal</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="straight">Straight</option>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </select>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Curve Radius:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="range"
                                min="0"
                                max="30"
                                value={arrowConfig.curveRadius}
                                onInput={(e: any) => setArrowConfig(
                                    'curveRadius',
                                    parseInt(e.target.value),
                                )
                                }
                                style={styles.slider}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.sliderValue}>
                                {arrowConfig.curveRadius}px
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </fieldset>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <fieldset style={styles.fieldset}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <legend style={styles.legend}>Line Style</legend>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Color:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="color"
                                value={arrowConfig.stroke}
                                onInput={(e: any) => setArrowConfig('stroke', e.target.value)
                                }
                                style={styles.colorInput}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span
                                style={{ color: '#888', 'font-size': '11px' }}
                            >
                                {arrowConfig.stroke}
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Width:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="range"
                                min="0.5"
                                max="6"
                                step="0.5"
                                value={arrowConfig.strokeWidth}
                                onInput={(e: any) => setArrowConfig(
                                    'strokeWidth',
                                    parseFloat(e.target.value),
                                )
                                }
                                style={styles.slider}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.sliderValue}>
                                {arrowConfig.strokeWidth}px
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Opacity:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={arrowConfig.strokeOpacity}
                                onInput={(e: any) => setArrowConfig(
                                    'strokeOpacity',
                                    parseFloat(e.target.value),
                                )
                                }
                                style={styles.slider}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.sliderValue}>
                                {arrowConfig.strokeOpacity.toFixed(1)}
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Dash Pattern:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <select
                                value={arrowConfig.strokeDasharray}
                                onChange={(e: any) => setArrowConfig(
                                    'strokeDasharray',
                                    e.target.value,
                                )
                                }
                                style={styles.select}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="">Solid</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="8,4">Dashed (8,4)</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="4,4">Dashed (4,4)</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="2,4">Dotted (2,4)</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="12,4,4,4">Dash-Dot</option>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </select>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </fieldset>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <fieldset style={styles.fieldset}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <legend style={styles.legend}>Arrow Head</legend>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Shape:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <select
                                value={arrowConfig.headShape}
                                onChange={(e: any) => setArrowConfig('headShape', e.target.value)
                                }
                                style={styles.select}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="chevron">Chevron</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="triangle">Triangle</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="diamond">Diamond</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="circle">Circle</option>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <option value="none">None</option>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </select>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.label}>Size:</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="range"
                                min="0"
                                max="15"
                                value={arrowConfig.headSize}
                                onInput={(e: any) => setArrowConfig(
                                    'headSize',
                                    parseInt(e.target.value),
                                )
                                }
                                style={styles.slider}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={styles.sliderValue}>
                                {arrowConfig.headSize}px
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={styles.control}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <label
                                style={{
                                    display: 'flex',
                                    'align-items': 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <input
                                    type="checkbox"
                                    checked={arrowConfig.headFill}
                                    onChange={(e: any) => setArrowConfig(
                                        'headFill',
                                        e.target.checked,
                                    )
                                    }
                                    style={styles.checkbox}
                                />
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span>Fill Head</span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </label>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </fieldset>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </div>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            {/* Relationship Constraints */}
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={styles.constraintSection}>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <h3 style={styles.constraintTitle}>Dependency Constraint</h3>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <div style={styles.constraintRow}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <div style={styles.constraintControl}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <span style={{ 'min-width': '40px' }}>Type:</span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <select
                            value={constraintConfig.type || 'FS'}
                            onChange={(e: any) => setConstraintConfig('type', e.target.value)
                            }
                            style={styles.select}
                        >
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <option value="FS">FS (Finish-to-Start)</option>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <option value="SS">SS (Start-to-Start)</option>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <option value="FF">FF (Finish-to-Finish)</option>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <option value="SF">SF (Start-to-Finish)</option>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </select>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </div>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <div style={styles.constraintControl}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <span style={{ 'min-width': '30px' }}>Lag:</span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <input
                            type="number"
                            min="-200"
                            max="200"
                            value={constraintConfig.lag ?? 0}
                            onInput={(e: any) => setConstraintConfig(
                                'lag',
                                e.target.value
                                    ? parseInt(e.target.value)
                                    : 0,
                            )
                            }
                            style={styles.numberInput}
                        />
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <span style={{ color: '#666', 'font-size': '11px' }}>
                            px (negative = lead)
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </span>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </div>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <div style={styles.constraintControl}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <label
                            style={{
                                display: 'flex',
                                'align-items': 'center',
                                gap: '6px',
                                cursor: 'pointer',
                            }}
                        >
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="checkbox"
                                checked={constraintConfig.elastic !== false}
                                onChange={(e: any) => setConstraintConfig(
                                    'elastic',
                                    e.target.checked,
                                )
                                }
                                style={styles.checkbox}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span>Elastic (lag is minimum)</span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </label>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </div>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <div
                        style={{
                            ...styles.constraintControl,
                            'border-left': '1px solid #ffc107',
                            'padding-left': '12px',
                        }}
                    >
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <label
                            style={{
                                display: 'flex',
                                'align-items': 'center',
                                gap: '6px',
                                cursor: 'pointer',
                            }}
                        >
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <input
                                type="checkbox"
                                checked={taskBConfig.locked}
                                onChange={(e: any) => {
                                    setTaskBConfig('locked', e.target.checked);
                                    updateTaskB();
                                }}
                                style={styles.checkbox}
                            />
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span>Task B Locked</span>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </label>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </div>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </div>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            {/* Live Preview */}
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={styles.svgContainer}>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <svg
                    width="100%"
                    height="300"
                    viewBox="0 0 900 300"
                    style={{ display: 'block' }}
                >
                    {/* Grid pattern */}
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <defs>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <pattern
                            id="showcase-grid"
                            width="45"
                            height="45"
                            patternUnits="userSpaceOnUse"
                        >
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <path
                                d="M 45 0 L 0 0 0 45"
                                fill="none"
                                stroke="#f0f0f0"
                                stroke-width="0.5"
                            />
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </pattern>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </defs>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <rect
                        width="100%"
                        height="100%"
                        fill="url(#showcase-grid)"
                    />

                    {/* Header area */}
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <rect x="0" y="0" width="800" height="50" fill="#f8f9fa" />
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <text
                        x="400"
                        y="30"
                        text-anchor="middle"
                        font-size="12"
                        fill="#666"
                    >
                        Drag tasks to test interactions and constraints
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </text>

                    {/* Arrow A→B */}
                    <Arrow
                        from={getTaskAPos()}
                        to={getTaskBPos()}
                        dependencyType={constraintConfig.type || 'FS'}
                        startAnchor={arrowConfig.startAnchor}
                        endAnchor={arrowConfig.endAnchor}
                        startOffset={arrowConfig.startOffset ?? undefined}
                        endOffset={arrowConfig.endOffset}
                        routing={arrowConfig.routing}
                        curveRadius={arrowConfig.curveRadius}
                        stroke={arrowConfig.stroke}
                        strokeWidth={arrowConfig.strokeWidth}
                        strokeOpacity={arrowConfig.strokeOpacity}
                        strokeDasharray={arrowConfig.strokeDasharray}
                        strokeLinecap={arrowConfig.strokeLinecap}
                        strokeLinejoin={arrowConfig.strokeLinejoin}
                        headShape={arrowConfig.headShape}
                        headSize={arrowConfig.headSize}
                        headFill={arrowConfig.headFill}
                    />

                    {/* Arrow B→C */}
                    <Arrow
                        from={getTaskBPos()}
                        to={getTaskCPos()}
                        dependencyType={constraintConfig.type || 'FS'}
                        startAnchor={arrowConfig.startAnchor}
                        endAnchor={arrowConfig.endAnchor}
                        startOffset={arrowConfig.startOffset ?? undefined}
                        endOffset={arrowConfig.endOffset}
                        routing={arrowConfig.routing}
                        curveRadius={arrowConfig.curveRadius}
                        stroke={arrowConfig.stroke}
                        strokeWidth={arrowConfig.strokeWidth}
                        strokeOpacity={arrowConfig.strokeOpacity}
                        strokeDasharray={arrowConfig.strokeDasharray}
                        strokeLinecap={arrowConfig.strokeLinecap}
                        strokeLinejoin={arrowConfig.strokeLinejoin}
                        headShape={arrowConfig.headShape}
                        headSize={arrowConfig.headSize}
                        headFill={arrowConfig.headFill}
                    />

                    {/* Arrow C→D */}
                    <Arrow
                        from={getTaskCPos()}
                        to={getTaskDPos()}
                        dependencyType={constraintConfig.type || 'FS'}
                        startAnchor={arrowConfig.startAnchor}
                        endAnchor={arrowConfig.endAnchor}
                        startOffset={arrowConfig.startOffset ?? undefined}
                        endOffset={arrowConfig.endOffset}
                        routing={arrowConfig.routing}
                        curveRadius={arrowConfig.curveRadius}
                        stroke={arrowConfig.stroke}
                        strokeWidth={arrowConfig.strokeWidth}
                        strokeOpacity={arrowConfig.strokeOpacity}
                        strokeDasharray={arrowConfig.strokeDasharray}
                        strokeLinecap={arrowConfig.strokeLinecap}
                        strokeLinejoin={arrowConfig.strokeLinejoin}
                        headShape={arrowConfig.headShape}
                        headSize={arrowConfig.headSize}
                        headFill={arrowConfig.headFill}
                    />

                    {/* Task A */}
                    <Bar
                        task={{
                            id: 'task-a',
                            name: taskConfig.name,
                            progress: taskConfig.progress,
                            color: taskConfig.color,
                            color_progress: taskConfig.color_progress,
                            constraints: { locked: taskConfig.locked },
                            invalid: taskConfig.invalid,
                        }}
                        taskStore={taskStore}
                        cornerRadius={taskConfig.cornerRadius}
                        readonly={globalConfig.readonly}
                        readonlyDates={globalConfig.readonlyDates}
                        readonlyProgress={globalConfig.readonlyProgress}
                        showExpectedProgress={globalConfig.showExpectedProgress}
                        columnWidth={
                            globalConfig.snapToGrid
                                ? globalConfig.columnWidth
                                : 1
                        }
                        onConstrainPosition={handleConstrainPosition}
                        onResizeEnd={handleResizeEnd}
                        onHover={handleTaskHover}
                        onHoverEnd={handleTaskHoverEnd}
                        onTaskClick={handleTaskClick}
                    />

                    {/* Task B */}
                    <Bar
                        task={{
                            id: 'task-b',
                            name: taskBConfig.name,
                            progress: taskBConfig.progress,
                            color: taskBConfig.color,
                            color_progress: taskBConfig.color_progress,
                            constraints: { locked: taskBConfig.locked },
                        }}
                        taskStore={taskStore}
                        cornerRadius={3}
                        readonly={globalConfig.readonly}
                        readonlyDates={globalConfig.readonlyDates}
                        readonlyProgress={globalConfig.readonlyProgress}
                        columnWidth={
                            globalConfig.snapToGrid
                                ? globalConfig.columnWidth
                                : 1
                        }
                        onConstrainPosition={handleConstrainPosition}
                        onResizeEnd={handleResizeEnd}
                        onHover={handleTaskHover}
                        onHoverEnd={handleTaskHoverEnd}
                        onTaskClick={handleTaskClick}
                    />

                    {/* Task C */}
                    <Bar
                        task={{
                            id: 'task-c',
                            name: taskCConfig.name,
                            progress: taskCConfig.progress,
                            color: taskCConfig.color,
                            color_progress: taskCConfig.color_progress,
                            constraints: { locked: taskCConfig.locked },
                        }}
                        taskStore={taskStore}
                        cornerRadius={3}
                        readonly={globalConfig.readonly}
                        readonlyDates={globalConfig.readonlyDates}
                        readonlyProgress={globalConfig.readonlyProgress}
                        columnWidth={
                            globalConfig.snapToGrid
                                ? globalConfig.columnWidth
                                : 1
                        }
                        onConstrainPosition={handleConstrainPosition}
                        onResizeEnd={handleResizeEnd}
                        onHover={handleTaskHover}
                        onHoverEnd={handleTaskHoverEnd}
                        onTaskClick={handleTaskClick}
                    />

                    {/* Task D */}
                    <Bar
                        task={{
                            id: 'task-d',
                            name: taskDConfig.name,
                            progress: taskDConfig.progress,
                            color: taskDConfig.color,
                            color_progress: taskDConfig.color_progress,
                            constraints: { locked: taskDConfig.locked },
                        }}
                        taskStore={taskStore}
                        cornerRadius={3}
                        readonly={globalConfig.readonly}
                        readonlyDates={globalConfig.readonlyDates}
                        readonlyProgress={globalConfig.readonlyProgress}
                        columnWidth={
                            globalConfig.snapToGrid
                                ? globalConfig.columnWidth
                                : 1
                        }
                        onConstrainPosition={handleConstrainPosition}
                        onResizeEnd={handleResizeEnd}
                        onHover={handleTaskHover}
                        onHoverEnd={handleTaskHoverEnd}
                        onTaskClick={handleTaskClick}
                    />
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </svg>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            {/* Info Box */}
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={styles.infoBox}>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <h4 style={styles.infoTitle}>Current Behavior</h4>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <p style={styles.infoText}>{getInfoText()}</p>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            {/* Task Data Popup (hover) */}
            <TaskDataPopup
                visible={popupVisible}
                position={popupPosition}
                task={hoveredTask}
                barPosition={hoveredBarPosition}
            />

            {/* Task Data Modal (click) */}
            <TaskDataModal
                visible={modalVisible}
                task={modalTask}
                barPosition={modalBarPosition}
                relationships={relationships}
                onClose={handleModalClose}
            />
        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
        </div>
    );
}
