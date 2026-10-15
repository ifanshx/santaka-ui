---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

Tier 2's final component, closing the v1.0 Tier 2 scope. The ARIA tabs pattern has one hard rule this component is built around: only the active tab is in the tab order (roving tabindex); arrow keys move AND activate (automatic activation, the APG default); Home/End jump to the ends; activation wraps, because a dead end in a roving-tabindex widget is a keyboard trap by another name. Arrow semantics invert under RTL, derived from getComputedStyle().direction at interaction time per section 4 -- never a build flag.

The parts communicate through relationships the widget computes and writes -- role, aria-selected, aria-controls on each tab, aria-labelledby on each panel, inactive panels hidden -- because tabs and panels are separately slotted and cannot see each other at authoring time.

Three findings from the test runs are recorded where they happened. Focus moves to the tab host, not the inner button: the host carries the roving tabindex and survives the scoped re-render, while the button node may be replaced mid-flight, silently dropping focus to body and swallowing the next keypress. The event is kebab-case sk-tab-change like every other component event -- Stencil's @Event() emits the declared property name unless eventName is set, a mismatch the probe caught. And the naive watcher emitted twice per activation (the watch fires synchronously mid-write, before the DOM guard can see the applied state), so interaction and prop paths share a flag-guarded show() that emits exactly once.

The @Event() decorator was then removed entirely: it leaks Stencil's internal EventEmitter type into the public .d.ts, breaking package validation (attw InternalResolutionError) -- the baseline passes and only the Tabs addition failed. Manual dispatch with bubbles+composed matches every other component event in the library. Also recorded: sk-tabs joins the boolean-prop exemption (its state is an index, not a flag), the example page gains a Tabs showcase, and one-shot attribute reads in tests became expect.poll because Stencil reflects on its render tick.

The React adapter is fully compositional -- Tabs, TabsList, Tab, TabPanel -- no serialization crosses the boundary. Active is the controlled write; omit it and the widget owns its own state. Runtime budget raised 16 to 17 KB with the rationale recorded in measure-bundle.mjs; the per-component CSS average fell again to 1.92 KB.
