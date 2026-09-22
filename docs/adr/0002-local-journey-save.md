# Save one journey in the browser

Ticket #12 stores one versioned JSON journey in localStorage at the game's origin. Normal offline launches retain `http://127.0.0.1:43127`, so replacing the download or restarting the launcher finds the same save in the same browser profile. No account, network service, or live Python worker is involved.

The save retains editable inputs and original experiment evidence, inspected practice progress, hints, stocking commitments, final challenge number, revealed submissions, reflection drafts, and recaps. Every edit saves locally. Synchronous changes from one action are committed in one storage write so a failed write cannot mix a new run source with an old result. Reopening starts fresh Python sessions; unfinished runs become interrupted attempts with their original source.

Changing browser/profile/computer, using private browsing, clearing site data, or changing the origin does not carry the journey across. Compatible updates retain the format; incompatible or malformed saves block resume and remain untouched. The UI offers a raw backup download before an explicitly confirmed Start over. Backup import and multiple profiles are outside this slice.

Write failures keep the current journey in memory, retain the last stored data, and display a persistent warning with retry and backup controls. A browser Web Lock grants one game tab write access for its lifetime. Other tabs show a resume instruction without mounting editable workspaces or allowing deletion; close the active tab and reload to transfer access. Chrome/Edge on the local game origin support this lock. The storage comparison also detects changes from older game versions that do not acquire the lock. Start over requires confirmation and only resets the workspace after storage clearing succeeds.

Owner-confirmed verification seams: player-visible browser journeys for reload/reopen, final results, interrupted runs, storage errors, and Start over, plus the same browser profile across a full packaged launcher restart.
