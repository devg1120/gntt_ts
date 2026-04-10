import { createSignal, createMemo, For, onMount } from 'solid-js';
import { createTaskStore } from '../stores/taskStore.js';
import { Arrow, ArrowConfig, ARROW_DEFAULTS } from './Arrow.jsx';

import type  { HeadShape, AnchorType, RoutingType } from './Arrow';

import type { ProcessedTask, BarPosition, DependencyType }   from '../types';


/**
 * Comprehensive Arrow Demo Page
 *
 * Demonstrates all Arrow component parameters:
 * - Anchoring (start/end anchors, offsets)
 * - Path routing (straight, orthogonal)
 * - Line styles (stroke, width, opacity, dash, linecap, linejoin)
 * - Arrow heads (shape, size, fill)
 * - Interactive dragging
 */

interface ArrowConfigLocal {
    //from: BarPosition;
    //to: BarPosition;
    from?: string;
    to?: string;
    label?:  string;
    startAnchor?: AnchorType;
    startOffset?: number;
    endAnchor?: AnchorType;
    endOffset?: number;
    routing?: RoutingType;
    curveRadius?: number;
    headSize?: number;
    headShape?: HeadShape;
    headFill?: boolean;
    dependencyType?: DependencyType;
    stroke?: string;
    strokeWidth?: number;
    strokeOpacity?: number;
    strokeDasharray?: string;
    strokeLinecap?: string;
}

export function ArrowDemo() {
    const taskStore = createTaskStore();

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════

    // Global configuration
    /*
    const [config, setConfig] = createSignal({
        // Anchoring
        startAnchor: 'auto',
        startOffset: 0.5,
        endAnchor: 'left',
        endOffset: 0.5,

        // Path
        routing: 'orthogonal',
        curveRadius: 8,

        // Line style
        stroke: '#3498db',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeDasharray: '',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',

        // Arrow head
        headSize: 6,
        headShape: 'chevron',
        headFill: false,
    });
   */
    //const arrowConfig: ArrowConfig = {
    const arrowConfig: ArrowConfigLocal = {
        // Anchoring
        startAnchor: 'auto',
        startOffset: 0.5,
        endAnchor: 'left',
        endOffset: 0.5,

        // Path
        routing: 'orthogonal',
        curveRadius: 8,
        // Line style
        stroke: '#3498db',
        strokeWidth: 2,
        strokeOpacity: 1,
        strokeDasharray: '',
        // Arrow head
        headSize: 6,
        headShape: 'chevron',
        headFill: false,
    };

    const [config, setConfig] = createSignal(arrowConfig);


    // Dragging state
    //const [dragging, setDragging] = createSignal(null);
    const [dragging, setDragging] = createSignal<string | null>(null);
    const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });

    // Debug mode
    const [showDebug, setShowDebug] = createSignal(false);

    // ═══════════════════════════════════════════════════════════════════════════
    // DEMO SCENARIOS
    // ═══════════════════════════════════════════════════════════════════════════

    //const scenarios: ProcessedTask[]   = [
    const scenarios: any   = [
        // Section 1: Anchor Types
        { id: 'anchor-auto-from', name: 'Auto', x: 50, y: 100, w: 70, h: 24 , draggable: true},
        { id: 'anchor-auto-to', name: 'Target', x: 180, y: 160, w: 70, h: 24 },

        { id: 'anchor-top-from', name: 'Top', x: 50, y: 220, w: 70, h: 24 },
        { id: 'anchor-top-to', name: 'Target', x: 180, y: 200, w: 70, h: 24 },

        { id: 'anchor-bottom-from', name: 'Bottom', x: 50, y: 280, w: 70, h: 24 },
        { id: 'anchor-bottom-to', name: 'Target', x: 180, y: 320, w: 70, h: 24 },

        { id: 'anchor-right-from', name: 'Right', x: 50, y: 380, w: 70, h: 24 },
        { id: 'anchor-right-to', name: 'Target', x: 180, y: 380, w: 70, h: 24 },

        // Section 2: Head Shapes
        { id: 'head-chevron-from', name: 'Chevron', x: 300, y: 100, w: 70, h: 24 },
        { id: 'head-chevron-to', name: '', x: 430, y: 100, w: 50, h: 24 },

        { id: 'head-triangle-from', name: 'Triangle', x: 300, y: 150, w: 70, h: 24 },
        { id: 'head-triangle-to', name: '', x: 430, y: 150, w: 50, h: 24 },

        { id: 'head-diamond-from', name: 'Diamond', x: 300, y: 200, w: 70, h: 24 },
        { id: 'head-diamond-to', name: '', x: 430, y: 200, w: 50, h: 24 },

        { id: 'head-circle-from', name: 'Circle', x: 300, y: 250, w: 70, h: 24 },
        { id: 'head-circle-to', name: '', x: 430, y: 250, w: 50, h: 24 },

        { id: 'head-none-from', name: 'None', x: 300, y: 300, w: 70, h: 24 },
        { id: 'head-none-to', name: '', x: 430, y: 300, w: 50, h: 24 },

        // Section 3: Line Styles
        { id: 'style-solid-from', name: 'Solid', x: 300, y: 380, w: 70, h: 24 },
        { id: 'style-solid-to', name: '', x: 430, y: 380, w: 50, h: 24 },

        { id: 'style-dashed-from', name: 'Dashed', x: 300, y: 420, w: 70, h: 24 },
        { id: 'style-dashed-to', name: '', x: 430, y: 420, w: 50, h: 24 },

        { id: 'style-dotted-from', name: 'Dotted', x: 300, y: 460, w: 70, h: 24 },
        { id: 'style-dotted-to', name: '', x: 430, y: 460, w: 50, h: 24 },

        // Section 4: Routing
        { id: 'route-ortho-from', name: 'Orthogonal', x: 550, y: 100, w: 80, h: 24 },
        { id: 'route-ortho-to', name: '', x: 700, y: 180, w: 50, h: 24 },

        { id: 'route-straight-from', name: 'Straight', x: 550, y: 220, w: 80, h: 24 },
        { id: 'route-straight-to', name: '', x: 700, y: 280, w: 50, h: 24 },

        // Section 5: Curve Radius
        { id: 'curve-0-from', name: 'r=0', x: 550, y: 340, w: 50, h: 24 },
        { id: 'curve-0-to', name: '', x: 650, y: 380, w: 50, h: 24 },

        { id: 'curve-10-from', name: 'r=10', x: 550, y: 420, w: 50, h: 24 },
        { id: 'curve-10-to', name: '', x: 650, y: 460, w: 50, h: 24 },

        { id: 'curve-20-from', name: 'r=20', x: 720, y: 340, w: 50, h: 24 },
        { id: 'curve-20-to', name: '', x: 820, y: 420, w: 50, h: 24 },

        // Section 6: Interactive
        { id: 'drag-from', name: 'Drag Me!', x: 550, y: 520, w: 90, h: 28, draggable: true },
        { id: 'drag-to', name: 'Target', x: 720, y: 580, w: 70, h: 28, draggable: true },

        // Section 7: Edge Cases
        { id: 'edge-same-from', name: 'Same Y', x: 50, y: 480, w: 70, h: 24 },
        { id: 'edge-same-to', name: '', x: 180, y: 480, w: 50, h: 24 },

        { id: 'edge-close-from', name: 'Close', x: 50, y: 530, w: 70, h: 24 },
        { id: 'edge-close-to', name: '', x: 130, y: 530, w: 50, h: 24 },

        { id: 'edge-far-from', name: 'Far', x: 50, y: 580, w: 50, h: 24 },
        { id: 'edge-far-to', name: '', x: 200, y: 620, w: 50, h: 24 },
    ];

    // Arrow definitions
    const arrows: ArrowConfigLocal[] = [
        // Anchor demos
        { from: 'anchor-auto-from', to: 'anchor-auto-to', label: 'Auto Anchor', startAnchor: 'auto' },
        { from: 'anchor-top-from', to: 'anchor-top-to', label: 'Top Anchor', startAnchor: 'top', stroke: '#9b59b6' },
        { from: 'anchor-bottom-from', to: 'anchor-bottom-to', label: 'Bottom Anchor', startAnchor: 'bottom', stroke: '#e74c3c' },
        { from: 'anchor-right-from', to: 'anchor-right-to', label: 'Right Anchor', startAnchor: 'right', stroke: '#2ecc71' },

        // Head shape demos
        { from: 'head-chevron-from', to: 'head-chevron-to', headShape: 'chevron', stroke: '#3498db' },
        { from: 'head-triangle-from', to: 'head-triangle-to', headShape: 'triangle', headFill: true, stroke: '#e74c3c' },
        { from: 'head-diamond-from', to: 'head-diamond-to', headShape: 'diamond', headFill: true, stroke: '#9b59b6' },
        { from: 'head-circle-from', to: 'head-circle-to', headShape: 'circle', headFill: true, stroke: '#f39c12' },
        { from: 'head-none-from', to: 'head-none-to', headShape: 'none', headSize: 0, stroke: '#95a5a6' },

        // Line style demos
        { from: 'style-solid-from', to: 'style-solid-to', strokeWidth: 2, stroke: '#2ecc71' },
        { from: 'style-dashed-from', to: 'style-dashed-to', strokeDasharray: '8,4', stroke: '#e67e22' },
        { from: 'style-dotted-from', to: 'style-dotted-to', strokeDasharray: '2,4', strokeLinecap: 'round', stroke: '#9b59b6' },

        // Routing demos
        { from: 'route-ortho-from', to: 'route-ortho-to', routing: 'orthogonal', stroke: '#3498db' },
        { from: 'route-straight-from', to: 'route-straight-to', routing: 'straight', stroke: '#e74c3c' },

        // Curve radius demos
        { from: 'curve-0-from', to: 'curve-0-to', curveRadius: 0, stroke: '#95a5a6' },
        { from: 'curve-10-from', to: 'curve-10-to', curveRadius: 10, stroke: '#3498db' },
        { from: 'curve-20-from', to: 'curve-20-to', curveRadius: 20, stroke: '#2ecc71' },

        // Edge cases
        { from: 'edge-same-from', to: 'edge-same-to', stroke: '#7f8c8d' },
        { from: 'edge-close-from', to: 'edge-close-to', stroke: '#e74c3c' },
        { from: 'edge-far-from', to: 'edge-far-to', stroke: '#27ae60' },
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    onMount(() => {
        // Initialize task store with scenarios
        const tasks = scenarios.map((s: any, i: any) => ({
            id: s.id,
            name: s.name,
            _index: i,
            draggable: s.draggable,
            $bar: { x: s.x, y: s.y, width: s.w, height: s.h }
        }));
        taskStore.updateTasks(tasks);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAG HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    //const handleMouseDown = (taskId: string, event: MouseEvent) => {
    const handleMouseDown = (taskId: string, event: any) => {
        const task = taskStore.getTask(taskId);
        if (!task || !task.draggable) return;

        const svg = event.currentTarget.ownerSVGElement;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        setDragging(taskId);
        setDragOffset({ x: svgP.x - task.$bar?.x!, y: svgP.y - task.$bar?.y! });
        event.preventDefault();
    };

    //const handleMouseMove = (event: MouseEvent) => {
    const handleMouseMove = (event: any) => {
        const taskId = dragging();
        if (!taskId) return;

        const svg = event.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        const offset = dragOffset();
        taskStore.updateBarPosition(taskId, {
            x: svgP.x - offset.x,
            y: svgP.y - offset.y
        });
    };

    const handleMouseUp = () => {
        setDragging(null);
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div style={{ padding: '20px', 'font-family': 'system-ui, sans-serif', 'max-width': '1200px', margin: '0 auto' }}>
            <h1 style={{ 'margin-bottom': '10px' }}>TS Arrow Component Demo</h1>
            <p style={{ color: '#666', 'margin-bottom': '20px' }}>
                Comprehensive demonstration of all Arrow component parameters.
                The Arrow is a <strong>pure visual renderer</strong> - it has no knowledge of constraints or task semantics.
            </p>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* CONFIGURATION PANEL */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SVG CANVAS */}
            {/* ═══════════════════════════════════════════════════════════════════ */}

            <svg
                width="900"
                height="680"
                style={{
                    border: '2px solid #dee2e6',
                    'border-radius': '8px',
                    'background-color': '#fff',
                    display: 'block'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Background grid */}
                <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="0.5" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Section headers */}
                <text x="120" y="70" text-anchor="middle" font-size="14" font-weight="bold" fill="#495057">
                    ANCHOR TYPES
                </text>
                <text x="380" y="70" text-anchor="middle" font-size="14" font-weight="bold" fill="#495057">
                    HEAD SHAPES
                </text>
                <text x="380" y="355" text-anchor="middle" font-size="14" font-weight="bold" fill="#495057">
                    LINE STYLES
                </text>
                <text x="680" y="70" text-anchor="middle" font-size="14" font-weight="bold" fill="#495057">
                    ROUTING
                </text>
                <text x="680" y="315" text-anchor="middle" font-size="14" font-weight="bold" fill="#495057">
                    CURVE RADIUS
                </text>
                <text x="680" y="495" text-anchor="middle" font-size="14" font-weight="bold" fill="#495057">
                    INTERACTIVE
                </text>
                <text x="120" y="455" text-anchor="middle" font-size="14" font-weight="bold" fill="#495057">
                    EDGE CASES
                </text>

                {/* Divider lines */}
                <line x1="270" y1="50" x2="270" y2="500" stroke="#e9ecef" stroke-width="2" stroke-dasharray="4,4" />
                <line x1="520" y1="50" x2="520" y2="650" stroke="#e9ecef" stroke-width="2" stroke-dasharray="4,4" />

                {/* Arrow layer */}
                <g class="arrows">
                    {/* Static arrows */}
		    
                    <For each={arrows}>
                        {(arrow) => (

                            <Arrow
                                taskStore={taskStore}
                                fromId={arrow.from}
                                toId={arrow.to}
                                startAnchor={arrow.startAnchor ?? 'auto'}
                                startOffset={arrow.startOffset}
                                endAnchor={arrow.endAnchor ?? 'left'}
                                endOffset={arrow.endOffset}
                                routing={arrow.routing ?? 'orthogonal'}
                                curveRadius={arrow.curveRadius ?? 8}
                                stroke={arrow.stroke ?? '#3498db'}
                                strokeWidth={arrow.strokeWidth ?? 2}
                                strokeOpacity={arrow.strokeOpacity ?? 1}
                                strokeDasharray={arrow.strokeDasharray}
                                headShape={arrow.headShape ?? 'chevron'}
                                headSize={arrow.headSize ?? 6}
                                headFill={arrow.headFill ?? false}
                            />
                        )}
                    </For>
		    

                    {/* Interactive arrow - bound directly to config signal for reactivity */}
		        
                    <Arrow
                        taskStore={taskStore}
                        fromId="drag-from"
                        toId="drag-to"
                        startAnchor={config().startAnchor}
                        startOffset={config().startOffset}
                        endAnchor={config().endAnchor}
                        endOffset={config().endOffset}
                        routing={config().routing}
                        curveRadius={config().curveRadius}
                        stroke={config().stroke}
                        strokeWidth={config().strokeWidth}
                        strokeOpacity={config().strokeOpacity}
                        strokeDasharray={config().strokeDasharray}
                        headShape={config().headShape}
                        headSize={config().headSize}
                        headFill={config().headFill}
                    />
		   
                </g>

                {/* Task bars */}
                <g class="tasks">
                    <For each={scenarios}>
                        {(scenario) => {
                            const pos = () => taskStore.getBarPosition(scenario.id);
                            const task = () => taskStore.getTask(scenario.id);
                            const isDragging = () => dragging() === scenario.id;
                            const isDraggable = () => task()?.draggable;

                            return (
                                <g>
                                    <rect
                                        x={pos()?.x}
                                        y={pos()?.y}
                                        width={pos()?.width}
                                        height={pos()?.height}
                                        fill={isDragging() ? '#2c3e50' : (isDraggable() ? '#3498db' : '#6c757d')}
                                        rx="4"
                                        style={{
                                            cursor: isDraggable() ? 'move' : 'default',
                                            stroke: isDragging() ? '#1a252f' : (isDraggable() ? '#2980b9' : '#495057'),
                                            'stroke-width': isDragging() ? '3' : '2'
                                        }}
                                        onMouseDown={(e) => handleMouseDown(scenario.id, e)}
                                    />
                                    {scenario.name && (
                                        <text
                                            x={(pos()?.x || 0) + (pos()?.width || 0) / 2}
                                            y={(pos()?.y || 0) + (pos()?.height || 0) / 2 + 4}
                                            text-anchor="middle"
                                            fill="white"
                                            font-size="11"
                                            font-weight="600"
                                            style={{ 'pointer-events': 'none' }}
                                        >
                                            {scenario.name}
                                        </text>
                                    )}

                                    {/* Debug info */}
                                    {showDebug() && (
                                        <text
                                            x={(pos()?.x || 0)}
                                            y={(pos()?.y || 0) - 4}
                                            font-size="9"
                                            fill="#adb5bd"
                                            style={{ 'pointer-events': 'none' }}
                                        >
                                            ({Math.round(pos()?.x || 0)}, {Math.round(pos()?.y || 0)})
                                        </text>
                                    )}
                                </g>
                            );
                        }}
                    </For>
                </g>
            </svg>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* REFERENCE */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
    </div>
    );
}
