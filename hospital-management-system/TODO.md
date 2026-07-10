# hospital-management-system - TODO

- [x] Identify likely failure: consultation-notes endpoint uses wrong RBAC permission.
- [x] Update backend route guard for `POST /api/prescriptions/:id/consultation-notes` from `prescription:approve` to `consultation:conduct`.
- [ ] Ensure `consultation:conduct` exists in `backend/src/config/roles.js` for `doctor` (add if missing).
- [ ] Restart backend and test doctor voice/consultation flow.
- [ ] If still failing, capture Network error (status + response message) and patch remaining mismatch.


