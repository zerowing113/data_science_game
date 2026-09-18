# Issue #7 implementation review

Scope: [Turn a forecast into a stocking decision](https://github.com/zerowing113/data_science_game/issues/7).

Baseline: `7fb6b6c224b579a484fa919d3913a9bb57b59494` (HEAD at task start). Independent standards and specification reviewers inspected the staged implementation before commit.

## Standards

0 remaining findings. The initial review identified nonblocking duplication between displayed business rules and simulation constants. Prices, leftover recovery, and capacity messages now derive from `shopRules`; the reviewer verified the correction. No documented-standard violations or other actionable baseline smells were identified.

## Spec

0 findings. Live issue #7 and SPEC stories 24–26 are covered: explicit source forecast selection, business rules before commitment, daily quantities, numerical and visual outcomes, distinct demand and fulfilled sales, saved source experiments, and exact/under/over browser checks. Historical evaluation remains separate from upcoming forecasts. Replays identify already revealed demand.

Final review findings: Standards 0; Spec 0.

## Validation

- Tests exercise the learner interface with actual browser Python. The exact-stock test failed before the stocking interface existed, then passed. The comparison test failed before the saved comparison table existed, then passed.
- Independent demand fixture: 76 + 78 + 80 + 82 + 96 + 98 + 88 = 598 mugs.
- Exact stock: 598 fulfilled, zero lost/leftover; 598 × ($12 − $5) = $4,186 profit.
- Understock at 60/day: 420 fulfilled, 178 lost, zero leftover; 420 × ($12 − $5) = $2,940 profit.
- Overstock at 100/day: 598 fulfilled, zero lost, 102 leftover; 598 × $12 + 102 × $1 − 700 × $5 = $3,778 profit.
- Daily assertions verify no carried inventory or backorders. Accessible chart values match numerical outcomes.
- Invalid blank, negative, fractional, and over-capacity stock cannot advance. Zero stock loses all 598 sales with zero profit. A one-mug replay earns $7 and preserves the original outcome.
- New forecasts do not silently replace selected plans. Failed Python attempts and resets preserve the saved source forecast. Saved decisions retain source code, expectation, settings, predictions, and output.
- Typechecking and the production build passed. Production browser smoke checks reported no page errors or mobile page overflow. Desktop and 390px layouts were visually inspected; wide tables use local scrolling.
- Final full browser suite: 17 passed (2.2 minutes), including evaluation, forecasting, exploration, recovery, and stocking. An earlier suite was stopped after two passing tests to finish the pricing-copy correction; the final run used all corrected sources.

Records remain in the current browser session. Demand stays out of the Python upcoming-week input tables. Publishing and recap lessons remain separate work.
