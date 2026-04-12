import { JSX, createSignal, Show, onCleanup, Accessor } from 'solid-js';
import {
    computeProgressWidth,
    computeExpectedProgress,
    computeLabelPosition,
    snapToGrid,
} from '../utils/barCalculations.js';

import type { LabelPosition } from '../utils/barCalculations.js';

import { useDrag, clamp } from '../hooks/useDrag.js';
import { useGanttEvents } from '../contexts/GanttEvents.jsx';


import type { TaskStore } from '../stores/taskStore';
import type { GanttConfigStore } from '../stores/ganttConfigStore';
import type { ProcessedTask, BarPosition, LockState } from '../types';

interface TaskPosition {
    y: number;
    height?: number;
}

interface BatchOriginal {
    originalX: number;
}

interface ConstrainedResult {
    x?: number;
}

interface BarProps {
    //task: ProcessedTask | Accessor<ProcessedTask>;
    task: ProcessedTask  ;
    taskId?: string | Function;
    taskStore?: TaskStore;
    ganttConfig?: GanttConfigStore;
    taskPosition?: TaskPosition | Accessor<TaskPosition | undefined>;
    visible?: boolean;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    cornerRadius?: number;
    readonly?: boolean;
    readonlyDates?: boolean;
    readonlyProgress?: boolean;
    showExpectedProgress?: boolean;
    columnWidth?: number;
    ignoredPositions?: number[];
    onCollectDependents?: (taskId: string) => Set<string>;
    onCollectDescendants?: (taskId: string) => Set<string>;
    onClampBatchDelta?: (batchOriginals: Map<string, BatchOriginal>, deltaX: number) => number;
    onConstrainPosition?: (taskId: string, x: number, y: number) => ConstrainedResult | null;
    onDateChange?: (taskId: string, position: { x: number; width: number }) => void;
    onResizeEnd?: (taskId: string) => void;
    onProgressChange?: (taskId: string, progress: number) => void;
    onHover?: (taskId: string, clientX: number, clientY: number) => void;
    onHoverEnd?: () => void;
    onTaskClick?: (taskId: string, e: MouseEvent) => void;
}

interface TaskData {
    id: string;
    name: string;
    color: string;
    colorProgress: string;
    progress: number;
    locked: LockState;
    invalid: boolean;
    customClass: string;
    hasChildren: boolean;
    start: Date | string | null;
    end: Date | string | null;
}

/**
 * SolidJS Bar Component
 *
 * Renders a task bar with:
 * - Main bar rectangle
 * - Progress bar
 * - Expected progress bar (optional)
 * - Label
 * - Resize handles (when not readonly)
 * - Drag interactions (bar move, resize, progress)
 *
 * Integrates with taskStore for reactive position updates.
 */
//export function Bar(props) {
export function Bar(props: BarProps): JSX.Element {

    // Get event handlers from context (fallback to props for backwards compatibility)
    const events = useGanttEvents();

    // Get task ID - prefer explicit taskId prop, fallback to task.id
    // taskId prop can be a value OR an accessor function (for <Index> pooling)
    const taskId = ():string => {
        const id = props.taskId;
	//console.log(id);
        return typeof id === 'function' ? id() : id ?? props.task?.id;
        //return  props.task?.id;
    };

    // Get position directly from taskStore - plain function for virtualized components
    // Avoids memo subscription churn during scroll (similar to Arrow.jsx approach)
    // Store access creates fine-grained dependency in calling context
    const getPosition = (): BarPosition => {
        if (props.taskStore && taskId()) {
            const task = props.taskStore.tasks[taskId()];
            if (task?.$bar) {
                return task.$bar;
            }
        }
        // Fallback to direct props
        return {
            x: props.x ?? 0,
            y: props.y ?? 0,
            width: props.width ?? 100,
            height: props.height ?? 30,
        };
    };

    // Configuration - inline accessors (no memo needed for rarely-changing values)
    const barCornerRadius = () => props.ganttConfig?.barCornerRadius?.() ?? props.cornerRadius ?? 3;
    const readonly = () => props.ganttConfig?.readonly?.() ?? props.readonly ?? false;
    const readonlyDates = () => props.ganttConfig?.readonlyDates?.() ?? props.readonlyDates ?? false;
    const readonlyProgress = () => props.ganttConfig?.readonlyProgress?.() ?? props.readonlyProgress ?? false;
    const showExpectedProgress = () => props.ganttConfig?.showExpectedProgress?.() ?? props.showExpectedProgress ?? false;
    const columnWidth = () => props.ganttConfig?.columnWidth?.() ?? props.columnWidth ?? 45;
    const ignoredPositions = () => props.ganttConfig?.ignoredPositions?.() ?? props.ignoredPositions ?? [];

    // Task data - read fresh from store if available
    const task = () => {
        if (props.taskStore && taskId()) {
            return props.taskStore.tasks[taskId()] ?? props.task ?? {};
        }
        return props.task ?? {};
    };

    // Derived position values - call getPosition() for fine-grained store tracking
    const x = (): number => getPosition()?.x ?? 0;
    // Use taskPosition Y if provided (for variable row heights), else fall back to $bar.y
    // taskPosition can be a value OR accessor (for <Index> pooling reactivity)
    const y = (): number => {
        const pos = typeof props.taskPosition === 'function' ? props.taskPosition() : props.taskPosition;
        return pos?.y ?? getPosition()?.y ?? 0;
    };
    const width = (): number => getPosition()?.width ?? 100;
    const height = (): number => getPosition()?.height ?? 30;

    // Minimum bar width (one column)
    const minWidth = ():number => columnWidth();

    // Track if a drag occurred (to distinguish click from drag)
    const [didDrag, setDidDrag] = createSignal(false);

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAG SETUP
    // ═══════════════════════════════════════════════════════════════════════════

    const { dragState, isDragging, startDrag } = useDrag({
        onDragStart: (data, state) => {
            // Store original values
	    /*
            data.originalX = x();
            data.originalY = y();
            data.originalWidth = width();
            data.originalProgress = task().progress ?? 0;
*/
            data['originalX'] = x();
            data['originalY'] = y();
            data['originalWidth'] = width();
            data['originalProgress'] = task().progress;

            // Signal that a drag is in progress (defers expensive recalculations)
            props.taskStore?.setDraggingTaskId?.(task().id);

            // For bar dragging: collect dependent tasks AND descendants ONCE at drag start
            // This enables batch updates during drag for better performance
            if (state === 'dragging_bar') {
                // Collect tasks that should move together
                //const tasksToMove = new Set();
                const tasksToMove = new Set<string>();
/*
                // Add dependency chain (tasks that depend on this one)
                if (props.onCollectDependents) {
                    const dependentIds = props.onCollectDependents(task().id);
                    for (const id of dependentIds) {
                        tasksToMove.add(id);
                    }
                }

                // Add descendants (child tasks for summary bars)
                if (props.onCollectDescendants) {
                    const descendantIds = props.onCollectDescendants(task().id);
                    for (const id of descendantIds) {
                        tasksToMove.add(id);
                    }
                }
*/
                // Add dependency chain (tasks that depend on this one)
                if (props.onCollectDependents) {
                    const dependentIds = props.onCollectDependents(task().id);
                    for (const id of dependentIds) {
                        tasksToMove.add(id);
                    }
                }

                // Add descendants (child tasks for summary bars)
                if (props.onCollectDescendants) {
                    const descendantIds = props.onCollectDescendants(task().id);
                    for (const id of descendantIds) {
                        tasksToMove.add(id);
                    }
                }
                // Store original positions for all tasks in the batch
		/*
                data.dependentOriginals = new Map();
                for (const id of tasksToMove) {
                    const pos = props.taskStore?.getBarPosition(id);
                    if (pos) {
                        data.dependentOriginals.set(id, { originalX: pos.x });
                    }
                }
*/
                const dependentOriginals = new Map<string, BatchOriginal>();
                for (const id of tasksToMove) {
                    const pos = props.taskStore?.getBarPosition(id);
                    if (pos) {
                        dependentOriginals.set(id, { originalX: pos.x });
                    }
                }
                data['dependentOriginals'] = dependentOriginals;
            }
        },

        onDragMove: (move, data, state) => {
            if (!props.taskStore || !task().id) {
                return;
            }

            // Mark that a drag occurred (used to distinguish click from drag)
            setDidDrag(true);

            const colWidth = columnWidth();
            const ignored = ignoredPositions();

            if (state === 'dragging_bar') {
                // Bar movement - snap to grid
		/*
                let newX = snapToGrid(
                    data.originalX + move.deltaX,
                    colWidth,
                    ignored,
                );

                // Calculate delta from original position
                let deltaX = newX - data.originalX;
*/
                const originalX = data['originalX'] as number;
                let newX = snapToGrid(
                    originalX + move.deltaX,
                    colWidth,
                    ignored,
                );

                // Calculate delta from original position
                let deltaX = newX - originalX;

                // Use batch move if we have dependent tasks (for performance)
		/*
                if (
                    data.dependentOriginals?.size > 0 &&
                    props.taskStore.batchMovePositions
                ) {
		*/
                const dependentOriginals = data['dependentOriginals'] as Map<string, BatchOriginal> | undefined;
                if (
                    dependentOriginals && dependentOriginals.size > 0 &&
                    props.taskStore.batchMovePositions
                ) {
                    const dependentOriginals = data['dependentOriginals'] as Map<string, BatchOriginal>;
                    // Clamp deltaX to prevent constraint violations when dragging backward
                    if (props.onClampBatchDelta && deltaX < 0) {
                        deltaX = props.onClampBatchDelta(
                            //data.dependentOriginals,
                            dependentOriginals,
                            deltaX,
                        );
                    }

                    // Batch move all dependent tasks by the same delta
                    // This is much faster than individual constraint resolution
                    props.taskStore.batchMovePositions(
                        //data.dependentOriginals,
                        dependentOriginals,
                        deltaX,
                    );
                } else {
                    // Fallback: apply constraints and update single task
                    if (props.onConstrainPosition) {
                        const constrained = props.onConstrainPosition(
                            task().id,
                            newX,
                            y(),
                        );
                        if (constrained === null) return; // Movement blocked
                        newX = constrained.x ?? newX;
                    }
                    props.taskStore.updateBarPosition(task().id, { x: newX });
                }
            } else if (state === 'dragging_left') {
                // Left handle - resize from start
                const rawDelta = move.deltaX;
                const snappedDelta = Math.round(rawDelta / colWidth) * colWidth;

                //let newX = data.originalX + snappedDelta;
                const originalX = data['originalX'] as number;
                let newX = originalX + snappedDelta;


                //let newWidth = data.originalWidth - snappedDelta;
                const originalWidth = data['originalWidth'] as number;
                let newWidth = originalWidth - snappedDelta;

                // Enforce minimum width
                if (newWidth < minWidth()) {
                    newWidth = minWidth();
                    //newX = data.originalX + data.originalWidth - minWidth();
                    const originalWidth = data['originalWidth'] as number;
                    const originalX = data['originalX'] as number;
                    newX = originalX + originalWidth - minWidth();
                }

                // Skip ignored positions
                newX = snapToGrid(newX, colWidth, ignored);

                // Apply constraints if provided - prevent moving start before predecessor's end
                if (props.onConstrainPosition) {
                    const constrained = props.onConstrainPosition(
                        task().id,
                        newX,
                        y(),
                    );
                    if (constrained === null) return; // Movement blocked
                    // If constraint moved us right, adjust width accordingly
                    //if (constrained.x > newX) {
                    if (constrained.x !== undefined && constrained.x > newX) {
                        newWidth = newWidth - (constrained.x - newX);
                        newX = constrained.x;
                    }
                }

                props.taskStore.updateBarPosition(task().id, {
                    x: newX,
                    width: newWidth,
                });
            } else if (state === 'dragging_right') {
                // Right handle - resize from end
                const rawDelta = move.deltaX;
                const snappedDelta = Math.round(rawDelta / colWidth) * colWidth;

                //let newWidth = data.originalWidth + snappedDelta;
                const originalWidth = data['originalWidth'] as number;
                let newWidth = originalWidth + snappedDelta;


                // Enforce minimum width
                newWidth = Math.max(minWidth(), newWidth);

                props.taskStore.updateBarPosition(task().id, {
                    width: newWidth,
                });
            } else if (state === 'dragging_progress') {
                // Progress handle - update progress percentage
                const barX = x();
                const barWidth = width();
                const ignored = ignoredPositions();
                const colWidth = columnWidth();

                // Calculate new progress X position
                let newProgressX = clamp(
                    data.startSvgX + move.deltaX,
                    barX,
                    barX + barWidth,
                );

                // Calculate progress percentage (accounting for ignored dates)
                const totalIgnoredInBar = ignored.reduce((acc, pos) => {
                    return acc + (pos >= barX && pos < barX + barWidth ? 1 : 0);
                }, 0);
                const effectiveWidth = barWidth - totalIgnoredInBar * colWidth;

                const progressOffset = newProgressX - barX;
                const ignoredInProgress = ignored.reduce((acc, pos) => {
                    return acc + (pos >= barX && pos < newProgressX ? 1 : 0);
                }, 0);
                const effectiveProgress =
                    progressOffset - ignoredInProgress * colWidth;

                const newProgress =
                    effectiveWidth > 0
                        ? clamp(
                              Math.round(
                                  (effectiveProgress / effectiveWidth) * 100,
                              ),
                              0,
                              100,
                          )
                        : 0;

                // Update task progress
                if (props.taskStore) {
                    const currentTask = props.taskStore.getTask(task().id);
                    if (currentTask) {
                        props.taskStore.updateTask(task().id, {
                            ...currentTask,
                            progress: newProgress,
                        });
                    }
                }
            }
        },

        onDragEnd: (move, data, state) => {
            // Clear drag state (allows deferred recalculations to resume)
            props.taskStore?.setDraggingTaskId?.(null);

            // Notify about changes - read directly from store to avoid reactive timing issues
            // Use props callbacks if provided, otherwise use context
            const onDateChange = props.onDateChange ?? events.onDateChange;
            const onResizeEnd = props.onResizeEnd ?? events.onResizeEnd;
            const onProgressChange = props.onProgressChange ?? events.onProgressChange;

            if (
                state === 'dragging_bar' ||
                state === 'dragging_left' ||
                state === 'dragging_right'
            ) {
                const pos = props.taskStore?.getBarPosition(task().id);
                onDateChange?.(task().id, {
                    x: pos?.x ?? x(),
                    width: pos?.width ?? width(),
                });

                // Trigger constraint resolution after resize (width changed)
                if (state === 'dragging_left' || state === 'dragging_right') {
                    onResizeEnd?.(task().id);
                }
            } else if (state === 'dragging_progress') {
                //onProgressChange?.(task().id, task().progress);
                onProgressChange?.(task().id, task().progress ?? 0);
            }
        },
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleBarMouseDown = (e: MouseEvent): void => {
        if (readonly() || readonlyDates() || isLocked()) {
            return;
        }

        // Check if clicking on a handle
        const target = e.target as HTMLElement;
        if (target.classList && target.classList.contains('handle')) {
            return;
        }

        setDidDrag(false); // Reset drag flag on mousedown
        startDrag(e, 'dragging_bar', { taskId: task().id });
    };

    // Hover handlers for task data popup (use context with props fallback)
    const handleMouseEnter = (e: MouseEvent): void => {
        const onHover = props.onHover ?? events.onHover;
        if (onHover && !isDragging()) {
            onHover(task().id, e.clientX, e.clientY);
        }
    };

    const handleMouseLeave = ():void => {
        const onHoverEnd = props.onHoverEnd ?? events.onHoverEnd;
        if (onHoverEnd) {
            onHoverEnd();
        }
    };

    // Click handler for task data modal (only fires if no drag occurred)
    const handleClick = (e: MouseEvent):void => {
        const onTaskClick = props.onTaskClick ?? events.onTaskClick;
        if (!didDrag() && onTaskClick) {
            e.stopPropagation();
            onTaskClick(task().id, e);
        }
    };

    const handleLeftHandleMouseDown = (e: MouseEvent):void => {
        if (readonly() || readonlyDates() || isLocked()) return;
        e.stopPropagation();
        startDrag(e, 'dragging_left', { taskId: task().id });
    };

    const handleRightHandleMouseDown = (e:MouseEvent):void => {
        if (readonly() || readonlyDates() || isLocked()) return;
        e.stopPropagation();
        startDrag(e, 'dragging_right', { taskId: task().id });
    };

    const handleProgressMouseDown = (e: MouseEvent):void => {
        if (readonly() || readonlyProgress() || isLocked())
            return;
        e.stopPropagation();
        startDrag(e, 'dragging_progress', { taskId: task().id });
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════════

    // Progress width calculation
    const progressWidth = ():number => {
        const progress = task().progress ?? 0;
        return computeProgressWidth(
            x(),
            width(),
            progress,
            ignoredPositions(),
            columnWidth(),
        );
    };

    // Expected progress width (if enabled)
    const expectedProgressWidth = ():number => {
        if (!showExpectedProgress()) return 0;

        const taskStart = task()._start ?? task().start;
        const taskEnd = task()._end ?? task().end;
        if (!taskStart || !taskEnd) return 0;

        const expectedPercent = computeExpectedProgress(
            taskStart,
            taskEnd,
            props.ganttConfig?.unit?.() ?? 'day',
            props.ganttConfig?.step?.() ?? 1,
        );

        return computeProgressWidth(
            x(),
            width(),
            expectedPercent,
            ignoredPositions(),
            columnWidth(),
        );
    };

    // Label positioning
    const labelInfo = (): LabelPosition => {
        const name = task().name ?? '';
        return computeLabelPosition(x(), width(), name);
    };

    // Colors
    const barColor = (): string => task().color ?? 'var(--g-bar-color, #b8c2cc)';
    const progressColor = (): string =>
        task().color_progress ?? 'var(--g-bar-progress-color, #a3a3ff)';
    const expectedProgressColor = (): string =>
        'var(--g-expected-progress-color, rgba(0,0,0,0.2))';

    // Check if task has subtasks (for fill opacity)
    const hasSubtasks = (): boolean => task()._children?.length! > 0;

    // Invalid state
    const isInvalid = (): boolean => task().invalid ?? false;

    // Custom class
    const customClass = (): string => task().custom_class ?? '';

    // Handle visibility (show when not fully readonly)
    const showHandles = (): boolean => !readonly();
    const showDateHandles = (): boolean => showHandles() && !readonlyDates();
    const showProgressHandle = (): boolean =>
        showHandles() && !readonlyProgress();

    // Locked state (from constraint system)
    const isLocked = (): LockState  => task().constraints?.locked ?? false;
    

    // Drag state class
    const dragClass = (): string => (isDragging() ? `dragging ${dragState()}` : '');

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    // Visibility prop for virtualization - hidden bars stay in DOM but are not painted
    const visible = (): boolean => props.visible ?? true;

    return (
        <g
            class={`bar-wrapper ${customClass()} ${isInvalid() ? 'invalid' : ''} ${isLocked() ? 'locked' : ''} ${dragClass()}`}
            data-id={task().id}
            onMouseDown={handleBarMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            style={{
                cursor: isLocked()
                    ? 'not-allowed'
                    : readonly()
                      ? 'default'
                      : 'move',
                visibility: visible() ? 'visible' : 'hidden',
            }}
        >
            {/* Main bar group */}
            <g class="bar-group">
                {/* Main bar rectangle - outline style with subtle fill for non-subtask tasks */}
                <rect
                    x={x()}
                    y={y()}
                    width={width()}
                    height={height()}
                    rx={barCornerRadius()}
                    ry={barCornerRadius()}
                    class="bar"
                    style={{
                        fill: isLocked()
                            ? '#7f8c8d'
                            : isDragging()
                              ? '#2c3e50'
                              : barColor(),
                        'fill-opacity': isLocked() || isDragging()
                            ? 1
                            : hasSubtasks()
                              ? 0
                              : 0.1,
                        stroke: isLocked()
                            ? '#c0392b'
                            : barColor(),
                        'stroke-width': isLocked() ? '2' : '1.5',
                        'stroke-dasharray': isLocked() ? '4,4' : 'none',
                        transition: isDragging() ? 'none' : 'fill 0.1s ease',
                    }}
                />

                {/* Expected progress bar (behind actual progress) */}
                <Show
                    when={
                        showExpectedProgress() &&
                        expectedProgressWidth() > 0
                    }
                >
                    <rect
                        x={x()}
                        y={y()}
                        width={expectedProgressWidth()}
                        height={height()}
                        rx={barCornerRadius()}
                        ry={barCornerRadius()}
                        class="bar-expected-progress"
                        style={{ fill: expectedProgressColor() }}
                    />
                </Show>

                {/* Progress bar - subtle fill to match outline style */}
                <rect
                    x={x()}
                    y={y()}
                    width={progressWidth()}
                    height={height()}
                    rx={barCornerRadius()}
                    ry={barCornerRadius()}
                    class="bar-progress"
                    style={{ fill: progressColor(), 'fill-opacity': 0.3 }}
                />

                {/* Label */}
                <text
                    x={labelInfo().x}
                    y={y() + height() / 2}
                    class={`bar-label ${labelInfo().position}`}
                    dominant-baseline="middle"
                    text-anchor={
                        labelInfo().position === 'inside' ? 'middle' : 'start'
                    }
                    style={{ 'pointer-events': 'none' }}
                >
                    {task().name ?? ''}
                </text>

                {/* Lock icon for locked tasks */}
                <Show when={isLocked()}>
                    <text
                        x={x() + width() - 12}
                        y={y() + 12}
                        font-size="10"
                        style={{ 'pointer-events': 'none' }}
                    >
                        🔒
                    </text>
                </Show>
            </g>

            {/* Resize handles group */}
            <Show when={showHandles() && !isLocked()}>
                <g class="handle-group">
                    {/* Left resize handle */}
                    <Show when={showDateHandles()}>
                        <rect
                            x={x() - 2}
                            y={y() + height() / 4}
                            width={4}
                            height={height() / 2}
                            rx={1}
                            class="handle handle-left"
                            onMouseDown={handleLeftHandleMouseDown}
                            style={{
                                fill: 'var(--g-handle-color, #ddd)',
                                cursor: 'ew-resize',
                                opacity: 0,
                            }}
                        />
                    </Show>

                    {/* Right resize handle */}
                    <Show when={showDateHandles()}>
                        <rect
                            x={x() + width() - 2}
                            y={y() + height() / 4}
                            width={4}
                            height={height() / 2}
                            rx={1}
                            class="handle handle-right"
                            onMouseDown={handleRightHandleMouseDown}
                            style={{
                                fill: 'var(--g-handle-color, #ddd)',
                                cursor: 'ew-resize',
                                opacity: 0,
                            }}
                        />
                    </Show>

                    {/* Progress handle (circle) */}
                    <Show when={showProgressHandle() && progressWidth() > 0}>
                        <circle
                            cx={x() + progressWidth()}
                            cy={y() + height() / 2}
                            r={5}
                            class="handle handle-progress"
                            onMouseDown={handleProgressMouseDown}
                            style={{
                                fill: 'var(--g-progress-handle-color, #fff)',
                                stroke: progressColor(),
                                'stroke-width': 2,
                                cursor: 'ew-resize',
                                opacity: 0,
                            }}
                        />
                    </Show>
                </g>
            </Show>
        </g>
    );
}
