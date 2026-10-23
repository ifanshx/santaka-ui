---
"@santaka-ui/core": minor
"@santaka-ui/react": minor
"@santaka-ui/web-components": minor
---

Form participation is the feature, not an enhancement: attachInternals(), setFormValue() on every change, and all three callbacks the section 4 contract requires. A disabled field is withheld from the submission; a read-only one is not, which is the whole difference between them. Validation is deliberately native, so the browser does the checking and the error bubble appears in the user's own language.

Three defects were found by writing the tests, and each was a real accessibility or API bug rather than a test artifact. The host and its inner input shared one id, so a label pointing at it resolved to the host and clicking the label focused nothing. readOnly did not survive being set as an attribute, because Stencil's camelCase-to-kebab mapping produces read-only rather than the native readonly, so <sk-input readonly> silently rendered an editable field. And a sk-value-change event fired for programmatic value updates as well as user edits, which is the rule that keeps a controlled component from looping.

The conformance test's component list is now derived from the component directories. A hand-maintained list had silently stopped covering sk-input the moment it was added, which is exactly the decay the test exists to prevent. ADR-013 records readOnly joining the ARIA-mirroring list, since section 4's list omits it and read-only means something disabled cannot.

The React adapter generates its id with useId as section 4 requires. Wiring its change event needed the literal lowercase on-sk-value-change prop: React lowercases an unknown on* prop on a custom element, so the camelCase form is set as an attribute rather than as a listener.
