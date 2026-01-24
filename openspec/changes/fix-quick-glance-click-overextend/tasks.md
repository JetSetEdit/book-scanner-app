## 1. Highlight fix

- [x] 1.1 In `components/content-warnings-list.tsx`, in the `focusWarningId` `useEffect`, remove the highlight classes `-mx-4` and `px-4` from the `element.classList.add(...)` and `element.classList.remove(...)` calls.
- [x] 1.2 Replace with a layout-safe highlight (e.g. `ring-2 ring-primary/30 ring-offset-2` and `rounded-2xl`, or `bg-primary/10 rounded-2xl` without negative margin). Ensure the same `setTimeout` still removes the highlight after 2 seconds.
- [x] 1.3 Manually verify: click a Quick Glance item on a book page and confirm the matching warning is highlighted without horizontal overflow, scrollbars, or the row extending beyond its container. Check on mobile and desktop.

## 2. Scroll behavior (optional)

- [x] 2.1 If `scrollIntoView({ behavior: 'smooth', block: 'center' })` causes excessive or jarring scrolling, change `block` to `'nearest'` or `'start'` and re-verify. If the current behavior is acceptable, leave as-is.
