import { createSignal } from 'solid-js';
import { createStore, reconcile, produce } from 'solid-js/store';
import { prof } from '../perf/profiler.js';

/**
 * Reactive task store for tracking task and bar positions.
 * Uses createStore for fine-grained reactivity - only components reading
 * specific task paths re-render when those paths change.
 */
export function createTaskStore() {
    // Object of task ID to task data (includes position info)
    // Using createStore for fine-grained reactivity (path-level tracking)
    const [tasks, setTasks] = createStore({});

    // Set of collapsed task IDs (tasks whose children are hidden)
    const [collapsedTasks, setCollapsedTasks] = createSignal(new Set());

    // Drag state - used to defer expensive recalculations during drag
    const [draggingTaskId, setDraggingTaskId] = createSignal(null);

    // Get a specific task by ID
    // Accessing tasks[id] creates fine-grained dependency on just that task
    const getTask = (id: any) => {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        return tasks[id];
    };

    // Get bar position for a task
    // Accessing tasks[id].$bar creates fine-grained dependency
    const getBarPosition = (id: any) => {
        const endProf = prof.start('taskStore.getBarPosition');

        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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

    // Update task in store (replaces entire task)
    const updateTask = (id: any, taskData: any) => {
        // @ts-expect-error TS(2345): Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
        setTasks(id, taskData);
    };

    // Update bar position for a task (fine-grained path update)
    const updateBarPosition = (id: any, position: any) => {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        if (!tasks[id]) return;
        // Use produce for fine-grained update - only triggers subscribers to changed paths
        setTasks(
            produce((state) => {
                // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                if (state[id]) {
                    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                    state[id].$bar = { ...state[id].$bar, ...position };
                }
            }),
        );
    };

    // Batch update multiple tasks (typically on initial load)
    const updateTasks = (tasksArray: any) => {
        const tasksObj = {};
        tasksArray.forEach((task: any) => {
            // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            tasksObj[task.id] = task;
        });
        setTasks(reconcile(tasksObj));
    };

    // Remove task from store
    const removeTask = (id: any) => {
        // @ts-expect-error TS(2345): Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
        setTasks(id, undefined);
    };

    // Clear all tasks
    const clear = () => {
        setTasks(reconcile({}));
    };

    // Get all tasks as array
    const getAllTasks = () => {
        return Object.values(tasks);
    };

    // Get task count (reads all keys, so subscribes to additions/removals)
    const taskCount = () => Object.keys(tasks).length;

    /**
     * Move multiple tasks by deltaX in a single reactive update.
     * Uses produce for fine-grained updates - only affected Bar components re-render.
     *
     * @param {Map<string, {originalX: number}>} taskOriginals - Task ID -> original position
     * @param {number} deltaX - Pixels to move from original position
     */
    const batchMovePositions = (taskOriginals: any, deltaX: any) => {
        setTasks(
            produce((state) => {
                for (const [id, { originalX }] of taskOriginals) {
                    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                    if (state[id]?.$bar) {
                        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                        state[id].$bar.x = originalX + deltaX;
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
    const toggleTaskCollapse = (taskId: any) => {
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
    const isTaskCollapsed = (taskId: any) => collapsedTasks().has(taskId);

    /**
     * Explicitly expand a task (show its descendants).
     * @param {string} taskId - Task ID to expand
     */
    const expandTask = (taskId: any) => {
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
    const collapseTask = (taskId: any) => {
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
    const expandAllTasks = () => {
        setCollapsedTasks(new Set());
    };

    /**
     * Collapse all summary tasks.
     */
    const collapseAllTasks = () => {
        const summaryIds = [];
        for (const task of Object.values(tasks)) {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            if (task.type === 'summary' || (task._children && task._children.length > 0)) {
                // @ts-expect-error TS(2571): Object is of type 'unknown'.
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
