import { createSignal, createMemo, onMount, onCleanup, Show } from 'solid-js';
import { Gantt } from './Gantt.jsx';
// @ts-expect-error TS(2732): Cannot find module '../data/calendar.json'. Consid... Remove this comment to see the full error message
import calendarData from '../data/calendar.json';
import {
    startRecording,
    stopRecording,
    clearRecording,
    analyzeCallTree,
    formatAnalysis,
    formatCallTree,
    instrument,
} from '../perf/instrumentation/callTree.js';

// Import Arrow functions to instrument
import * as ArrowModule from './Arrow.jsx';

/**
 * GanttProfiler - Dedicated profiling component with function call instrumentation.
 *
 * Instruments hot paths and shows exactly where time is spent.
 */
export function GanttProfiler() {
    const [tasks, setTasks] = createSignal([]);
    const [recording, setRecording] = createSignal(false);
    const [analysisText, setAnalysisText] = createSignal('');
    const [callTreeText, setCallTreeText] = createSignal('');
    const [viewMode, setViewMode] = createSignal('Hour');
    const [showCallTree, setShowCallTree] = createSignal(false);
    const [frameCount, setFrameCount] = createSignal(0);
    const [scrollEvents, setScrollEvents] = createSignal(0);

    // Refs for instrumented store
    let ganttRef = null;
    let instrumentedStore = false;
    let scrollEventCount = 0;
    let rafCount = 0;
    let rafId: any = null;

    // Instrument the taskStore methods after Gantt mounts
    const instrumentStore = () => {
        if (instrumentedStore) return;

        // Find the gantt's internal store via DOM traversal hack
        // The store methods are the hot paths we need to profile
        const scrollArea = document.querySelector('.gantt-scroll-area');
        if (!scrollArea) {
            console.warn('Cannot find scroll area - store not instrumented');
            return;
        }

        // We'll instrument via the global window hook instead
        // The Gantt component exposes taskStore on window for debugging
        // @ts-expect-error TS(2339): Property '__ganttTaskStore' does not exist on type... Remove this comment to see the full error message
        if (window.__ganttTaskStore) {
            // @ts-expect-error TS(2339): Property '__ganttTaskStore' does not exist on type... Remove this comment to see the full error message
            const store = window.__ganttTaskStore;

            // Instrument hot methods
            const hotMethods = ['getBarPosition', 'getTask', 'updateBarPosition'];
            for (const method of hotMethods) {
                if (store[method] && !store[method].__instrumented) {
                    const original = store[method].bind(store);
                    store[method] = instrument(original, `taskStore.${method}`);
                    store[method].__instrumented = true;
                }
            }
            instrumentedStore = true;
            console.log('TaskStore instrumented:', hotMethods);
        }
    };

    // Start profiling
    const startProfile = () => {
        clearRecording();
        scrollEventCount = 0;
        rafCount = 0;
        setScrollEvents(0);
        setFrameCount(0);
        startRecording();
        setRecording(true);

        // Track frames
        const countFrames = () => {
            if (!recording()) return;
            rafCount++;
            setFrameCount(rafCount);
            rafId = requestAnimationFrame(countFrames);
        };
        rafId = requestAnimationFrame(countFrames);

        console.log('Profiling started - scroll the chart then click Stop');
    };

    // Stop profiling and show results
    const stopProfile = () => {
        stopRecording();
        setRecording(false);
        if (rafId) cancelAnimationFrame(rafId);

        setScrollEvents(scrollEventCount);

        const analysis = formatAnalysis();
        setAnalysisText(analysis);

        const tree = formatCallTree(5);
        setCallTreeText(tree);

        console.log('\n=== FUNCTION CALL ANALYSIS ===\n');
        console.log(analysis);
        console.log('\n=== CALL TREE (first 5 levels) ===\n');
        console.log(tree.slice(0, 5000));
    };

    // Automated scroll test
    const runScrollTest = (direction = 'horizontal') => {
        const scrollArea = document.querySelector('.gantt-scroll-area');
        if (!scrollArea) return;

        startProfile();

        const duration = 3000;
        const startTime = performance.now();
        let dir = 1;
        let pos = direction === 'horizontal' ? scrollArea.scrollLeft : scrollArea.scrollTop;

        const scroll = () => {
            const elapsed = performance.now() - startTime;
            if (elapsed > duration) {
                stopProfile();
                return;
            }

            const delta = dir * (direction === 'horizontal' ? 150 : 80);
            pos += delta;

            if (direction === 'horizontal') {
                if (pos > scrollArea.scrollWidth - scrollArea.clientWidth - 300) dir = -1;
                else if (pos < 300) dir = 1;
                scrollArea.scrollLeft = pos;
            } else {
                if (pos > scrollArea.scrollHeight - scrollArea.clientHeight - 200) dir = -1;
                else if (pos < 200) dir = 1;
                scrollArea.scrollTop = pos;
            }

            scrollEventCount++;
            setTimeout(scroll, 16);
        };

        scroll();
    };

    // Track scroll events
    onMount(() => {
        setTasks(calendarData.tasks);

        // Wait for Gantt to render then instrument
        setTimeout(instrumentStore, 500);

        const scrollArea = document.querySelector('.gantt-scroll-area');
        if (scrollArea) {
            const onScroll = () => {
                if (recording()) scrollEventCount++;
            };
            scrollArea.addEventListener('scroll', onScroll, { passive: true });
            onCleanup(() => scrollArea.removeEventListener('scroll', onScroll));
        }
    });

    const options = createMemo(() => ({
        view_mode: viewMode(),
        bar_height: 20,
        padding: 8,
        column_width: viewMode() === 'Hour' ? 25 : 30,
    }));

    return (
        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
        <div style={{
            display: 'flex',
            'flex-direction': 'column',
            height: '100vh',
            'font-family': 'system-ui, sans-serif',
            overflow: 'hidden',
        }}>
            {/* Header */}
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={{
                padding: '10px 15px',
                background: '#1e293b',
                color: 'white',
                display: 'flex',
                gap: '15px',
                'align-items': 'center',
                'flex-wrap': 'wrap',
            }}>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <h1 style={{ margin: 0, 'font-size': '18px' }}>Function Profiler</h1>

                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <div style={{ display: 'flex', gap: '8px' }}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <button
                        onClick={recording() ? stopProfile : startProfile}
                        style={{
                            padding: '6px 14px',
                            background: recording() ? '#ef4444' : '#22c55e',
                            color: 'white',
                            border: 'none',
                            'border-radius': '4px',
                            cursor: 'pointer',
                            'font-weight': 'bold',
                        }}
                    >
                        {recording() ? '⏹ Stop' : '⏺ Record'}
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </button>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <button
                        onClick={() => runScrollTest('horizontal')}
                        disabled={recording()}
                        style={{
                            padding: '6px 14px',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            'border-radius': '4px',
                            cursor: recording() ? 'not-allowed' : 'pointer',
                            opacity: recording() ? 0.5 : 1,
                        }}
                    >
                        H-Scroll Test
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </button>

                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <button
                        onClick={() => runScrollTest('vertical')}
                        disabled={recording()}
                        style={{
                            padding: '6px 14px',
                            background: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            'border-radius': '4px',
                            cursor: recording() ? 'not-allowed' : 'pointer',
                            opacity: recording() ? 0.5 : 1,
                        }}
                    >
                        V-Scroll Test
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </button>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </div>

                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    'font-family': 'monospace',
                    'font-size': '13px',
                }}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <span>Frames: <strong style={{ color: '#4ade80' }}>{frameCount()}</strong></span>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <span>Scrolls: <strong style={{ color: '#4ade80' }}>{scrollEvents()}</strong></span>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <span>Tasks: <strong style={{ color: '#4ade80' }}>{tasks().length}</strong></span>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </div>

                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <select
                    value={viewMode()}
                    onChange={(e: any) => setViewMode(e.target.value)}
                    style={{
                        padding: '5px 10px',
                        'border-radius': '4px',
                        border: '1px solid #475569',
                        background: '#334155',
                        color: 'white',
                    }}
                >
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <option value="Hour">Hour</option>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <option value="Day">Day</option>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <option value="Week">Week</option>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </select>

                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <label style={{ display: 'flex', 'align-items': 'center', gap: '5px' }}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <input
                        type="checkbox"
                        checked={showCallTree()}
                        onChange={(e: any) => setShowCallTree(e.target.checked)}
                    />
                    Show Call Tree
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </label>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>

            {/* Main content */}
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div style={{ display: 'flex', flex: 1, 'min-height': 0 }}>
                {/* Gantt chart */}
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <div style={{
                    flex: analysisText() ? '0 0 60%' : '1',
                    'min-width': 0,
                    border: '1px solid #e2e8f0',
                }}>
                    <Gantt
                        ref={ganttRef}
                        tasks={tasks()}
                        options={options()}
                    />
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </div>

                {/* Analysis panel */}
                // @ts-expect-error TS(2769): No overload matches this call.
                <Show when={analysisText()}>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <div style={{
                        flex: '0 0 40%',
                        display: 'flex',
                        'flex-direction': 'column',
                        'border-left': '2px solid #1e293b',
                        overflow: 'hidden',
                    }}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={{
                            padding: '10px',
                            background: '#f1f5f9',
                            'font-weight': 'bold',
                            'border-bottom': '1px solid #e2e8f0',
                        }}>
                            Function Call Analysis
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <pre style={{
                            flex: showCallTree() ? '0 0 50%' : 1,
                            margin: 0,
                            padding: '10px',
                            overflow: 'auto',
                            'font-size': '11px',
                            'line-height': '1.4',
                            background: '#0f172a',
                            color: '#e2e8f0',
                        }}>
                            {analysisText()}
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </pre>

                        // @ts-expect-error TS(2769): No overload matches this call.
                        <Show when={showCallTree() && callTreeText()}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <div style={{
                                padding: '10px',
                                background: '#f1f5f9',
                                'font-weight': 'bold',
                                'border-bottom': '1px solid #e2e8f0',
                                'border-top': '1px solid #e2e8f0',
                            }}>
                                Call Tree (first 5 levels)
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </div>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <pre style={{
                                flex: 1,
                                margin: 0,
                                padding: '10px',
                                overflow: 'auto',
                                'font-size': '10px',
                                'line-height': '1.3',
                                background: '#1e293b',
                                color: '#cbd5e1',
                            }}>
                                {callTreeText()}
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </pre>
                        </Show>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </div>
                </Show>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>
        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
        </div>
    );
}

export default GanttProfiler;
