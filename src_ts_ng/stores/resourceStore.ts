import { createSignal, createMemo } from 'solid-js';
import {
    normalizeResources,
    computeDisplayResources,
} from '../utils/resourceProcessor.js';

/**
 * Reactive resource store for managing resource groups and collapse state.
 *
 * Resources can be:
 * - Simple strings: ['A', 'B', 'C'] (auto-converted to typed objects)
 * - Typed objects: [{ id: 'A', type: 'resource' }, ...]
 * - With groups: [{ id: 'Team1', type: 'group' }, { id: 'A', type: 'resource', group: 'Team1' }, ...]
 */
export function createResourceStore(initialResources = []) {
    // Normalized resources (all converted to typed objects)
    const [resources, setResources] = createSignal(
        normalizeResources(initialResources),
    );

    // Set of collapsed group IDs
    const [collapsedGroups, setCollapsedGroups] = createSignal(new Set());

    // Computed: visible resources with display indices
    // Filters out resources in collapsed groups
    const displayResources = createMemo(() =>
        computeDisplayResources(resources(), collapsedGroups()),
    );

    // Computed: Map of resource ID to display index (for Y positioning)
    const resourceIndexMap = createMemo(() => {
        const map = new Map();
        const display = displayResources();
        for (let i = 0; i < display.length; i++) {
            map.set(display[i].id, i);
        }
        return map;
    });

    // Computed: count of visible rows
    const displayCount = createMemo(() => displayResources().length);

    // Toggle a group's collapsed state
    const toggleGroup = (groupId: any) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    // Expand a group
    const expandGroup = (groupId: any) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            next.delete(groupId);
            return next;
        });
    };

    // Collapse a group
    const collapseGroup = (groupId: any) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            next.add(groupId);
            return next;
        });
    };

    // Check if a group is collapsed
    const isGroupCollapsed = (groupId: any) => {
        return collapsedGroups().has(groupId);
    };

    // Update resources (normalizes input)
    const updateResources = (newResources: any) => {
        setResources(normalizeResources(newResources));
    };

    // Get all groups
    const getGroups = createMemo(() => {
        return resources().filter((r: any) => r.type === 'group');
    });

    // Expand all groups
    const expandAll = () => {
        setCollapsedGroups(new Set());
    };

    // Collapse all groups
    const collapseAll = () => {
        const groups = getGroups();
        setCollapsedGroups(new Set(groups.map((g: any) => g.id)));
    };

    return {
        // Signals
        resources,
        collapsedGroups,

        // Computed
        displayResources,
        resourceIndexMap,
        displayCount,
        getGroups,

        // Actions
        updateResources,
        toggleGroup,
        expandGroup,
        collapseGroup,
        isGroupCollapsed,
        expandAll,
        collapseAll,
    };
}
