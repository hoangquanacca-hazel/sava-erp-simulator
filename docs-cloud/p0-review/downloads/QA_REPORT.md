# Independent P0 download completion QA

Target http://127.0.0.1:3017/; date 2026-10-08; current code 3812179 supplied by parent (served asset binding not independently checked).

**UNVERIFIED download completion/bytes/hash**. Fresh CUA IAB tab; all three documented waitForEvent('download', {timeoutMs:10000}) calls were registered before clicking: first FAGLL03 RAW, first FAGLL03 CLEAN, Controls bundle. Each download button click fulfilled; each event wait rejected with exact error: Error: Timed out after 10000ms waiting for download. No download object or verified local path returned. No filesystem download search or invented path was used. This is an evidence/tool blocker, not a confirmed application failure.

Visible Samsung full-delivery case: seven simulation steps completed; generated 11 RAW reports; Data Lab 11/11 PASS; controls 7/7 technical matches. All business statuses remain pending or blocked. No human acceptance.

Initial Webinar OFF, temporarily ON using footer Hoàng Quân (Mr Quân) three clicks and exposed Admin toggle to avoid registration. Restored OFF visibly (Đang Tắt (Bật Gatekeeper)); leads 0. No registration, lead creation, AI, external messages or repo edits.

Evidence: ui-proof.txt, download-controls.jpg (full page), restored-webinar-off.jpg.
