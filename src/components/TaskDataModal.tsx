import { Show, createMemo, createSignal } from 'solid-js';
import { formatTaskFull, highlightJSON } from '../utils/jsonFormatter.js';

/**
 * Full modal dialog for displaying complete task data
 *
 * @param {Object} props
 * @param {() => boolean} props.visible - Reactive visibility signal
 * @param {() => Object|null} props.task - Reactive task object
 * @param {() => Object|null} props.barPosition - Reactive bar position
 * @param {() => Array} props.relationships - Reactive relationships array
 * @param {Function} props.onClose - Close callback
 */
export function TaskDataModal(props: any) {
    const [copyFeedback, setCopyFeedback] = createSignal('');

    const formatted = createMemo(() => {
        const task = props.task?.();
        if (!task) return null;
        return formatTaskFull(
            task,
            props.barPosition?.(),
            props.relationships?.() || []
        );
    });

    const handleCopy = async () => {
        const data = formatted();
        if (data?.raw) {
            try {
                await navigator.clipboard.writeText(data.raw);
                setCopyFeedback('Copied!');
                setTimeout(() => setCopyFeedback(''), 2000);
            } catch (err) {
                setCopyFeedback('Failed to copy');
                setTimeout(() => setCopyFeedback(''), 2000);
            }
        }
    };

    const handleBackdropClick = (e: any) => {
        if (e.target === e.currentTarget) {
            props.onClose?.();
        }
    };

    const handleKeyDown = (e: any) => {
        if (e.key === 'Escape') {
            props.onClose?.();
        }
    };

    return (
        // @ts-expect-error TS(2307): Cannot find module 'react/jsx-runtime' or its corr... Remove this comment to see the full error message
        <Show when={props.visible?.()}>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'z-index': 2000,
                }}
                onClick={handleBackdropClick}
                onKeyDown={handleKeyDown}
                tabIndex={-1}
            >
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                <div style={{
                    background: '#fff',
                    'border-radius': '8px',
                    width: '90%',
                    'max-width': '600px',
                    'max-height': '80vh',
                    overflow: 'hidden',
                    display: 'flex',
                    'flex-direction': 'column',
                    'box-shadow': '0 10px 40px rgba(0,0,0,0.3)',
                }}>
                    {/* Header */}
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <div style={{
                        display: 'flex',
                        'justify-content': 'space-between',
                        'align-items': 'center',
                        padding: '16px 20px',
                        'border-bottom': '1px solid #eee',
                        'flex-shrink': 0,
                    }}>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <h3 style={{ margin: 0, 'font-size': '16px', 'font-weight': 600 }}>
                            Task Data: {props.task?.()?.name || 'Unknown'}
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </h3>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <button
                            onClick={() => props.onClose?.()}
                            style={{
                                border: 'none',
                                background: 'none',
                                'font-size': '24px',
                                cursor: 'pointer',
                                padding: '4px 8px',
                                color: '#666',
                                'line-height': 1,
                            }}
                            title="Close (Esc)"
                        >
                            &times;
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </button>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </div>

                    {/* Body */}
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    <div style={{
                        padding: '20px',
                        overflow: 'auto',
                        flex: 1,
                    }}>
                        {/* Raw Task Data */}
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={{ 'margin-bottom': '20px' }}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <div style={{
                                display: 'flex',
                                'justify-content': 'space-between',
                                'align-items': 'center',
                                'margin-bottom': '8px',
                            }}>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <span style={{
                                    'font-size': '11px',
                                    'font-weight': 600,
                                    'text-transform': 'uppercase',
                                    color: '#999',
                                    'letter-spacing': '0.5px',
                                }}>
                                    Raw Task Object
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                </span>
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                <button
                                    onClick={handleCopy}
                                    style={{
                                        padding: '4px 10px',
                                        background: copyFeedback() === 'Copied!' ? '#d4edda' : '#e3f2fd',
                                        border: 'none',
                                        'border-radius': '3px',
                                        cursor: 'pointer',
                                        'font-size': '11px',
                                        color: copyFeedback() === 'Copied!' ? '#155724' : '#1976d2',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    {copyFeedback() || 'Copy JSON'}
                                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                                </button>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </div>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <pre
                                style={{
                                    background: '#f8f9fa',
                                    'border-radius': '4px',
                                    padding: '12px',
                                    'font-family': 'monospace',
                                    'font-size': '12px',
                                    'white-space': 'pre-wrap',
                                    'word-break': 'break-all',
                                    overflow: 'auto',
                                    'max-height': '200px',
                                    margin: 0,
                                    'line-height': '1.5',
                                }}
                                innerHTML={highlightJSON(formatted()?.sections?.rawTask || '')}
                            />
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        {/* Position */}
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div style={{ 'margin-bottom': '20px' }}>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={{
                                'font-size': '11px',
                                'font-weight': 600,
                                'text-transform': 'uppercase',
                                color: '#999',
                                'letter-spacing': '0.5px',
                                display: 'block',
                                'margin-bottom': '8px',
                            }}>
                                Computed Position ($bar)
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <pre
                                style={{
                                    background: '#f8f9fa',
                                    'border-radius': '4px',
                                    padding: '12px',
                                    'font-family': 'monospace',
                                    'font-size': '12px',
                                    margin: 0,
                                    'line-height': '1.5',
                                }}
                                innerHTML={highlightJSON(formatted()?.sections?.position || '')}
                            />
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>

                        {/* Relationships */}
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        <div>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <span style={{
                                'font-size': '11px',
                                'font-weight': 600,
                                'text-transform': 'uppercase',
                                color: '#999',
                                'letter-spacing': '0.5px',
                                display: 'block',
                                'margin-bottom': '8px',
                            }}>
                                Relationships
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </span>
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            <pre style={{
                                background: '#fff8e1',
                                'border-radius': '4px',
                                padding: '12px',
                                'font-family': 'monospace',
                                'font-size': '12px',
                                'white-space': 'pre-wrap',
                                margin: 0,
                                'line-height': '1.5',
                                color: '#5d4037',
                            }}>
                                {formatted()?.sections?.relationships}
                            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                            </pre>
                        // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                        </div>
                    // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                    </div>
                // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
                </div>
            // @ts-expect-error TS(7026): JSX element implicitly has type 'any' because no i... Remove this comment to see the full error message
            </div>
        </Show>
    );
}
