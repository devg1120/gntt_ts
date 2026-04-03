import { createSignal } from 'solid-js';
import { createStore, reconcile, produce } from 'solid-js/store';
import { prof } from '../perf/profiler.js';


import type { BarPosition, ProcessedTask } from '../types';

/** Store's internal task map - keyed by task ID */
interface TaskMap {
    [key: string]: ProcessedTask | undefined;
}

interface BarPositionWithIndex extends BarPosition {
    index?: number;
}

interface BatchOriginal {
    originalX: number;
}

export interface TaskStore {
    tasks: TaskMap;
    getTask: (id: string) => ProcessedTask | undefined;
    getBarPosition: (id: string) => BarPositionWithIndex | null;
    getAllTasks: () => ProcessedTask[];
    taskCount: () => number;
    updateTask: (id: string, taskData: ProcessedTask) => void;
    updateBarPosition: (id: string, position: Partial<BarPosition>) => void;
    updateTasks: (tasksArray: ProcessedTask[]) => void;
    batchMovePositions: (taskOriginals: Map<string, BatchOriginal>, deltaX: number) => void;
    removeTask: (id: string) => void;
    clear: () => void;

    // Subtask collapse state
    collapsedTasks: Accessor<Set<string>>;
    toggleTaskCollapse: (taskId: string) => void;
    isTaskCollapsed: (taskId: string) => boolean;
    expandTask: (taskId: string) => void;
    collapseTask: (taskId: string) => void;
    expandAllTasks: () => void;
    collapseAllTasks: () => void;

    // Drag state - for deferring expensive calculations
    draggingTaskId: Accessor<string | null>;
    setDraggingTaskId: Setter<string | null>;
}

/**
 * Reactive task store for tracking task and bar positions.
 * Uses createStore for fine-grained reactivity - only components reading
 * specific task paths re-render when those paths change.
 */
export function createTaskStore(): TaskStore {
    // Object of task ID to task data (includes position info)
    // Using createStore for fine-grained reactivity (path-level tracking)
    const [tasks, setTasks] = createStore<TaskMap>({});

    // Set of collapsed task IDs (tasks whose children are hidden)
    //const [collapsedTasks, setCollapsedTasks] = createSignal(new Set());
    const [collapsedTasks, setCollapsedTasks] = createSignal<Set<string>>(new Set());


    // Drag state - used to defer expensive recalculations during drag
    //const [draggingTaskId, setDraggingTaskId] = createSignal(null);
    const [draggingTaskId, setDraggingTaskId] = createSignal<string | null>(null);


    // Get a specific task by ID
    // Accessing tasks[id] creates fine-grained dependency on just that task
    //const getTask = (id) => {
    //    return tasks[id];
    //};
    const getTask = (id: string): ProcessedTask | undefined => {
        return tasks[id];
    };
    // Get bar position for a task
    // Accessing tasks[id].$bar creates fine-grained dependency
    /*
    const getBarPosition = (id) => {
        const endProf = prof.start('taskStore.getBarPosition');

        const task = tasks[id];
        if (!task || !task.$bar) {
            endProf();
            return null;
        }

        const result = {
            x: task.$bar.x,
            y: task.$bar.y,
            width: task.$bar.width,
            height: task.$bar.height,
            index: task._index,
        };

        endProf();
        return result;
    };
    */
    const getBarPosition = (id: string): BarPositionWithIndex | null => {
        const endProf = prof.start('taskStore.getBarPosition');

        const task = tasks[id];
        if (!task || !task._bar) {
            endProf();
            return null;
        }

        const result: BarPositionWithIndex = {
            x: task._bar.x,
            y: task._bar.y,
            width: task._bar.width,
            height: task._bar.height,
            index: task._index,
        };

        endProf();
        return result;
    };
    // Update task in store (replaces entire task)
    //const updateTask = (id, taskData) => {
    //    setTasks(id, taskData);
    //};
    const updateTask = (id: string, taskData: ProcessedTask): void => {
        setTasks(id, taskData);
    };
    // Update bar position for a task (fine-grained path update)
    /*
    const updateBarPosition = (id, position) => {
        if (!tasks[id]) return;
        // Use produce for fine-grained update - only triggers subscribers to changed paths
        setTasks(
            produce((state) => {
                if (state[id]) {
                    state[id].$bar = { ...state[id].$bar, ...position };
                }
            }),
        );
    };
    */
    const updateBarPosition = (id: string, position: Partial<BarPosition>): void => {
        if (!tasks[id]) return;
        // Use produce for fine-grained update - only triggers subscribers to changed paths
        setTasks(
            produce((state) => {
                const task = state[id];
                if (task && task._bar) {
                    state[id] = {
                        ...task,
                        _bar: { ...task._bar, ...position },
                    };
                }
            }),
        );
    };
    //  Batch update multiple tasks (typically on initial load)
    /*
    const updateTasks = (tasksArray) => {
        const tasksObj = {};
        tasksArray.forEach((task) => {
            tasksObj[task.id] = task;
        });
        setTasks(reconcile(tasksObj));
    };
    */
    const updateTasks = (tasksArray: ProcessedTask[]): void => {
        const tasksObj: TaskMap = {};
        tasksArray.forEach((task) => {
            tasksObj[task.id] = task;
        });
        setTasks(reconcile(tasksObj));
    };

    // Remove task from store
    //const removeTask = (id) => {
    //    setTasks(id, undefined);
    //};
    const removeTask = (id: string): void => {
        setTasks(id, undefined);
    };
    // Clear all tasks
    //const clear = () => {
    //    setTasks(reconcile({}));
    //};
    const clear = (): void => {
        setTasks(reconcile({}));
    };
    // Get all tasks as array
    //const getAllTasks = () => {
    //    return Object.values(tasks);
    //};
    const getAllTasks = (): ProcessedTask[] => {
        return Object.values(tasks).filter((t): t is ProcessedTask => t !== undefined);
    };

    // Get task count (reads all keys, so subscribes to additions/removals)
    //const taskCount = () => Object.keys(tasks).length;
    const taskCount = (): number => Object.keys(tasks).length;

    /**
     * Move multiple tasks by deltaX in a single reactive update.
     * Uses produce for fine-grained updates - only affected Bar components re-render.
     *
     * @param {Map<string, {originalX: number}>} taskOriginals - Task ID -> original position
     * @param {number} deltaX - Pixels to move from original position
     */
    /*
    const batchMovePositions = (taskOriginals, deltaX) => {
        setTasks(
            produce((state) => {
                for (const [id, { originalX }] of taskOriginals) {
                    if (state[id]?.$bar) {
                        state[id].$bar.x = originalX + deltaX;
                    }
                }
            }),
        );
    };
    */
    const batchMovePositions = (taskOriginals: Map<string, BatchOriginal>, deltaX: number): void => {
        setTasks(
            produce((state) => {
                for (const [id, { originalX }] of taskOriginals) {
                    const task = state[id];
                    if (task?._bar) {
                        state[id] = {
                            ...task,
                            _bar: { ...task._bar, x: originalX + deltaX },
                        };
                    }
                }
            }),
        );
    };
    // --- Subtask Collapse State ---

    /**
     * Toggle collapse state for a task (show/hide its descendants).
     * @param {string} taskId - Task ID to toggle
     */
/*
    const toggleTaskCollapse = (taskId) => {
        setCollapsedTasks((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };
    */
    const toggleTaskCollapse = (taskId: string): void => {
        setCollapsedTasks((prev) => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };
    /**
     * Check if a task is collapsed.
     * @param {string} taskId - Task ID to check
     * @returns {boolean}
     */
    //const isTaskCollapsed = (taskId) => collapsedTasks().has(taskId);
    const isTaskCollapsed = (taskId: string): boolean => collapsedTasks().has(taskId);

    /**
     * Explicitly expand a task (show its descendants).
     * @param {string} taskId - Task ID to expand
     */
/*
    const expandTask = (taskId) => {
        setCollapsedTasks((prev) => {
            if (!prev.has(taskId)) return prev;
            const next = new Set(prev);
            next.delete(taskId);
            return next;
        });
    };
    */
    const expandTask = (taskId: string): void => {
        setCollapsedTasks((prev) => {
            if (!prev.has(taskId)) return prev;
            const next = new Set(prev);
            next.delete(taskId);
            return next;
        });
    };

    /**
     * Explicitly collapse a task (hide its descendants).
     * @param {string} taskId - Task ID to collapse
     */
/*
    const collapseTask = (taskId) => {
        setCollapsedTasks((prev) => {
            if (prev.has(taskId)) return prev;
            const next = new Set(prev);
            next.add(taskId);
            return next;
        });
    };
    */
    const collapseTask = (taskId: string): void => {
        setCollapsedTasks((prev) => {
            if (prev.has(taskId)) return prev;
            const next = new Set(prev);
            next.add(taskId);
            return next;
        });
    };

    /**
     * Expand all collapsed tasks.
     */
/*
    const expandAllTasks = () => {
        setCollapsedTasks(new Set());
    };
    */
    const expandAllTasks = (): void => {
        setCollapsedTasks(new Set<string>());
    };
    /**
     * Collapse all summary tasks.
     */
    /*
    const collapseAllTasks = () => {
        const summaryIds = [];
        for (const task of Object.values(tasks)) {
            if (task.type === 'summary' || (task._children && task._children.length > 0)) {
                summaryIds.push(task.id);
            }
        }
        setCollapsedTasks(new Set(summaryIds));
    };
*/
    const collapseAllTasks = (): void => {
        const summaryIds: string[] = [];
        for (const task of Object.values(tasks)) {
            if (task && (task.type === 'summary' || (task._children && task._children.length > 0))) {
                summaryIds.push(task.id);
            }
        }
        setCollapsedTasks(new Set(summaryIds));
    };

    return {
        tasks,
        getTask,
        getBarPosition,
        getAllTasks,
        taskCount,
        updateTask,
        updateBarPosition,
        updateTasks,
        batchMovePositions,
        removeTask,
        clear,
        // Subtask collapse state
        collapsedTasks,
        toggleTaskCollapse,
        isTaskCollapsed,
        expandTask,
        collapseTask,
        expandAllTasks,
        collapseAllTasks,
        // Drag state - for deferring expensive calculations
        draggingTaskId,
        setDraggingTaskId,
    };
}
