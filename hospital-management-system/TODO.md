# Hospital Management System - TODO

## Forward appointment to doctor fix
- [x] Update `getTodaysAppointments()` date filtering to be UTC-safe / date-only to ensure receptionist queue loads the right appointments.
- [ ] (Optional) Add minimal backend logs around `forwardToDoctor` to confirm status transitions.
- [ ] Test end-to-end: Patient books appointment -> Receptionist queue shows it -> Forward -> Doctor queue shows patient.


