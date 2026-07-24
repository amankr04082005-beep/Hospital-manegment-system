const Medicine = require('../models/Medicine');
const { findAlternativesFromDrugDatabase, lookupDrug, lookupMultipleDrugs } = require('../services/drugDatabase.service');


// GET /api/medicines/search?q=Dolo  — Module 6: Search by brand/generic/composition
async function search(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const results = await Medicine.find({
      $or: [
        { brandName: new RegExp(q, 'i') },
        { genericName: new RegExp(q, 'i') },
        { composition: new RegExp(q, 'i') },
      ],
    }).limit(20);

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}

// GET /api/medicines/lookup?name=Ibuprofen — external lookup (local -> OpenFDA -> RxNorm)
async function lookupExternal(req, res, next) {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ success: false, message: 'name query param is required.' });

    const result = await lookupDrug(name);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

// POST /api/medicines/lookup-batch  Body: { names: ["Ibuprofen", "Paracetamol"] }
async function lookupBatch(req, res, next) {
  try {
    const { names } = req.body;
    if (!Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ success: false, message: 'names must be a non-empty array.' });
    }

    const results = await lookupMultipleDrugs(names);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}

// GET /api/medicines/:id/alternatives — same composition, different brand
async function getAlternatives(req, res, next) {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });

    const localAlternatives = await Medicine.find({
      composition: medicine.composition,
      _id: { $ne: medicine._id },
    });

    if (localAlternatives.length > 0) {
      return res.json({ success: true, data: localAlternatives, source: 'local' });
    }

    const externalDrugs = await findAlternativesFromDrugDatabase(
      medicine.genericName || medicine.brandName
    );

    const formattedExternal = externalDrugs
      .filter((d) => d.product_name)
      .map((d) => ({
        brandName: d.product_name,
        genericName: medicine.genericName,
        composition: medicine.composition,
        manufacturer: d.manufacturer || null,
        countryCode: d.country_code || null,
        source: 'drug_database_api',
      }));

    res.json({ success: true, data: formattedExternal, source: 'external' });
  } catch (error) {
    next(error);
  }
}

// GET /api/medicines/inventory
async function getInventory(req, res, next) {
  try {
    const medicines = await Medicine.find().sort({ stockQuantity: 1, brandName: 1 });
    res.json({ success: true, data: medicines });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/medicines/:id/stock  (Pharmacist only)
async function updateStock(req, res, next) {
  try {
    if (req.user.role !== 'pharmacist' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only pharmacists can update inventory.' });
    }

    const { adjustment, expiryDate } = req.body;
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found.' });

    if (typeof adjustment === 'number') {
      medicine.stockQuantity = Math.max(0, medicine.stockQuantity + adjustment);
      if (adjustment > 0) medicine.lastRestockedAt = new Date();
    }
    if (expiryDate) medicine.expiryDate = expiryDate;

    await medicine.save();
    res.json({ success: true, data: medicine });
  } catch (error) {
    next(error);
  }
}

module.exports = { search, lookupExternal, lookupBatch, getAlternatives, getInventory, updateStock };