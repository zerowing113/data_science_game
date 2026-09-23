# First-mission learner observation guide

Use this guide for [#11](https://github.com/zerowing113/data_science_game/issues/11). An actual learner and observer are required. Automated tests establish technical behavior, not understanding. Leave unobserved items blank.

## Before the session

Use the intended learner's laptop and a verified public ZIP from [Releases](https://github.com/zerowing113/data_science_game/releases). Use the newest preview that includes the visual work in #13–#18. Record its exact tag and checksum below; a local development build is not release acceptance. Keep the prior save-capable version for a separate compatible-replacement check.

| Session field | Observation |
|---|---|
| Date, learner, observer | |
| Release tag, source revision, archive SHA-256 | |
| OS/version, processor/architecture | |
| Browser/version, default browser, fresh or existing profile | |
| Laptop/display size, browser viewport, zoom | |
| Network state before first launch | |
| Download, normal extraction, Explorer/Finder launch | |
| Exact OS prompts and setup assistance | |

Initial supported targets are Windows 11 x64 and macOS 14+ Intel/Apple Silicon with Chrome or Edge. Record other browsers as observations, without assuming support. The owner's earlier Windows/Firefox run used Wi-Fi and showed no warning; it did not establish offline or resume acceptance. Use the [device acceptance procedure](offline-acceptance.md) for platform evidence. Do not disable OS protections if launch is blocked.

Tell the learner: “Try to decide how many mugs to stock. Please say what you think the screen is showing and what you expect your code to do. This is a test of the game, not of you. You can use the hints or stop at any time.” Do not provide the final Python solution up front.

## Observe the journey

Aim for 30–45 minutes, recording actual time rather than forcing completion. Include launch time separately. If the learner is stuck, first ask what they expected; record the obstacle before offering help. Distinguish game hints from observer help and copied code. Do not count assisted completion as independent performance.

| Stage | Planning allowance | Observe | Actual start/end, hints, help, retries, obstacles |
|---|---|---|---|
| Download and launch | Record separately | Normal ZIP extraction, launch prompts, bundled Python startup while disconnected | |
| Explore and forecast | 6–8 min | Historical versus upcoming data, prediction target, feature choice, Python edits, visual/run attribution | |
| Evaluate | 4–5 min | Earlier training/later evaluation, shared baseline dates, daily errors and MAE | |
| Missing-data repair | 5–7 min | Untreated failure, unfinished preparation, learner-written repair, training-only fitting | |
| Feature timing | 4–5 min | Historical score versus forecast feasibility, unavailable closing report, independent repair | |
| Stock the shop | 4–5 min | Committed orders, day playback, lost sales, leftovers, costs and profit | |
| Fresh final challenge | 7–10 min | Independent Python, valid inputs, baseline comparison, stock commitment, three reflections | |
| Stop and resume | Record separately | Same browser profile, retained code, original results and reflections | |

For Step 4, specifically observe whether the learner understands the distinct missing-input and unfinished-placeholder messages. Ask what action is needed before intervening. Selecting median preparation must not be mistaken for completed code. Record whether the revised explanation resolves the previously reported confusion and whether the learner reaches a successful repair.

Check the actual laptop layout: can the learner connect the data, chart, editor, hints, shop and recap without losing their place? Record concrete effects of scrolling, chart inspection, keyboard controls, text size, animation, or reduced-motion preferences. Preserve exact error text and the saved run number for each blocker.

## Ask for explanations

Ask after the relevant activity, without supplying the answer. Record the learner's words and assistance level: independent, after game hint, after observer help, or not demonstrated.

1. What are you predicting, for which dates? Is demand the same as fulfilled sales?
2. Why must training come before the dates you evaluate? Why compare the model and baseline on the same dates?
3. Choose a day on the error chart. How does its prediction error contribute to the score?
4. Where did the missing-data fill value come from? What would change if you learned it from the later inputs?
5. Why can the closing report produce an impressive historical score but fail before the next week? What does an unverified custom run mean?
6. How did your forecast affect orders, lost sales, leftovers and profit? Can high profit alone show that a forecast or feature set is valid?
7. In the final recap, which saved code/run produced these results? Explain your feature, evaluation and stocking decisions.

## Resume and recovery

After recording the final outcome and reflections, use Stop game, close the browser, then reopen Start Game while still disconnected in the same profile. Check the same code, inspected progress, stock decisions, revealed answers and reflections. Playback must view saved outcomes rather than place new orders. A fresh challenge must use fresh dates while keeping the earlier recap.

Cancel Start over and confirm the journey remains. Only after recording the session evidence and agreeing to discard the test journey, confirm Start over and check the empty state. Compatible replacement uses a separate extracted folder, the same profile, and the normal local address; record it separately from an ordinary restart. Follow the linked device procedure for exact details.

## Findings and assessment

| Finding | Stage/run | What the learner did or said | Effect/blocker | Assistance | Fix or follow-up | Recheck result |
|---|---|---|---|---|---|---|
| | | | | | | |

Record actual journey duration against 30–45 minutes, independent versus assisted completion, demonstrated reasoning for each question, abandoned stages, and remaining limitations. Link bounded fixes and their technical verification, then recheck the affected interaction with the learner. Do not create speculative feature work or mark #11 complete solely because browser tests pass.

Session outcome: **Not yet observed.** Project completion still requires the recorded platform acceptance in #10 and the learner evidence in #11.
