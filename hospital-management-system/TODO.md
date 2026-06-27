# TODO - Fix prescriptions API/frontend integration

- [x] Fix backend route not found for `/api/prescriptions/my` (verify router mounting + order)
- [x] Fix frontend error: `prescriptionService.getMyPrescriptions is not a function` (sync service exports)
- [ ] Fix `/api/prescriptions/` route mismatch (ensure frontend hits `/api/prescriptions/...` paths that exist)
- [x] Verify data availability: ensure prescriptions are created with correct patient sharing flow and list endpoint returns them
- [ ] Run backend/frontend lint/build and do a smoke test on MyPrescriptionsPage

