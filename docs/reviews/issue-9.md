# Ticket 9 review: fresh-data final challenge

Baseline: `d27e9f62df73e0c41ba5a0ad574245cb0282f233`. Review scope: staged implementation against this baseline. Spec: GitHub ticket #9 and SPEC stories 20, 30–32.

## Standards

Independent review found no documented-standard violations. It identified a reset updater reading a mutable ref after that ref was cleared, which could lose an interrupted attempt's source. Fixed by capturing the attempt before scheduling the updater. A new real-Python browser regression checks retained source and rejection of a failed rerun after a successful forecast.

The reviewer also suggested extracting the repeated reflection predicate. Both the button and completion transition now use `reflectionComplete`. Follow-up review verified both fixes; no remaining findings.

## Spec

Independent review reported no findings: fresh deterministic data, minimal scaffold, submission-only answer reveal, same-row baseline scoring, supported-code feature/split validity, stock and reflection requirements, fresh retries, and actual experiment evidence satisfy the ticket. No scope creep identified. Reviewers inspected code and tests; execution evidence below comes from the implementing agent.

## Verification

- Initial browser test failed because the final challenge entry did not exist, then passed after implementation.
- Four focused browser scenarios pass with real pandas/scikit-learn: full completion; failed/leaked and unverified high-profit rejection; inaccurate valid forecast and invalid/changed inputs; interrupted source preservation and failed-rerun rejection.
- Demonstrated two-feature LinearRegression on challenges 1, 2, 3: model MAE rounds to 0.00; baseline MAEs are 8.00, 4.00, 8.00. Independently expected exact-stock profits are $6,076, $5,684, $7,644. Trend-only challenge 1 has MAE 11.56 and cannot complete.
- `npm run build` passes, including TypeScript checking.
- Production preview at port 4175 completed challenge 1 with no page errors. Inspected desktop and 390px mobile screenshots; tables scroll within their containers and the page has no horizontal overflow.
- Full suite: `npm test -- --output=test-results/issue9-final` — all 30 browser tests passed in 6.9 minutes, including the complete guided journey into and back from the final challenge, all prior lessons, concurrent Python startup, recovery, and stocking arithmetic.

## Boundaries

The supported program contract compares Python syntax with the taught LinearRegression recipes, accepting comments and whitespace. Other code may execute but remains unverified for completion. Future answers are excluded from learner Python inputs and hidden in the normal UI until stock submission; this client-side exercise is not an anti-cheating system.

Reflection checks text presence only, not semantic understanding. Recaps retain actual final attempts, stock outcomes, explanations, and explicitly inspected practice evidence. Reload starts a new in-memory session. Fresh retries increment a deterministic challenge number and retain earlier results as previously revealed evidence.

No private deployment or observed learner playtest was performed. Those remain tickets #10 and #11.
