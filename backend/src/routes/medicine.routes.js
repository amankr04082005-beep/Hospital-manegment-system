const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/medicine.controller');
const router = express.Router();
router.use(authenticate);
router.get('/search', ctrl.search);
router.get('/lookup', ctrl.lookupExternal);
router.get('/alternatives-by-name', ctrl.getAlternativesByName);
router.post('/lookup-batch', ctrl.lookupBatch);
// SRS Module 2.4 — Pharmacist permission: Manage Inventory.
router.get('/inventory', ctrl.getInventory);
router.patch('/:id/stock', ctrl.updateStock);
router.get('/:id/alternatives', ctrl.getAlternatives);
module.exports = router;