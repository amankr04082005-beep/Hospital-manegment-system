# TODO

## Appointment visibility fix — Patient "My appointments"

- [ ] Investigate why the frontend shows "No appointments yet" even after booking.
- [ ] Verify API response shape from `GET /appointments/mine` and how frontend renders it.
 - [ ] Ensure patient appointments load correctly and that upcoming follow-ups do not break page render.
- [ ] Add defensive rendering + mapping for potential response variations.
- [ ] Add console logging or UI fallback if API returns unexpected format.
- [ ] Implement fix in `frontend/src/pages/patient/MyAppointmentsPage.jsx` (and any needed service/controller updates).
- [ ] Run frontend build/tests and verify appointment list renders.

