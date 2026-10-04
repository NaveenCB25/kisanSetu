const Procurement = require('../models/Procurement');
const Booking = require('../models/Booking');
const PDFDocument = require('pdfkit');

// @desc    Get digital receipt
// @route   GET /api/procurements/receipt/:bookingId
exports.getReceipt = async (req, res, next) => {
  try {
    const procurement = await Procurement.findOne({ booking: req.params.bookingId })
      .populate({
        path: 'booking',
        select: 'tokenNumber date cropCategory cropName declaredQuantity stageTimestamps',
        populate: [
          { path: 'center', select: 'centerName centerCode address' },
          { path: 'user', select: 'name mobile' },
        ],
      })
      .populate('farmer', 'farmerId village district');

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.json({ success: true, data: procurement });
  } catch (error) {
    next(error);
  }
};

// @desc    Download receipt as PDF
// @route   GET /api/procurements/receipt/:bookingId/pdf
exports.downloadReceiptPDF = async (req, res, next) => {
  try {
    const procurement = await Procurement.findOne({ booking: req.params.bookingId })
      .populate({
        path: 'booking',
        populate: [
          { path: 'center', select: 'centerName centerCode address' },
          { path: 'user', select: 'name mobile' },
        ],
      })
      .populate('farmer', 'farmerId village district');

    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=receipt-${procurement.booking.tokenNumber}.pdf`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('KisanSetu — Procurement Receipt', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('━'.repeat(80), { align: 'center' });
    doc.moveDown();

    // Token & Date
    doc.fontSize(14).text(`Token: ${procurement.booking.tokenNumber}`, { continued: true });
    doc.text(`   Date: ${new Date(procurement.booking.date).toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.moveDown();

    // Farmer Details
    doc.fontSize(12).text('FARMER DETAILS', { underline: true });
    doc.fontSize(10);
    doc.text(`Name: ${procurement.booking.user?.name || 'N/A'}`);
    doc.text(`Farmer ID: ${procurement.farmer?.farmerId || 'N/A'}`);
    doc.text(`Village: ${procurement.farmer?.village || 'N/A'}, District: ${procurement.farmer?.district || 'N/A'}`);
    doc.moveDown();

    // Center Details
    doc.fontSize(12).text('PROCUREMENT CENTER', { underline: true });
    doc.fontSize(10);
    doc.text(`Center: ${procurement.booking.center?.centerName || 'N/A'} (${procurement.booking.center?.centerCode || 'N/A'})`);
    doc.text(`Address: ${procurement.booking.center?.address || 'N/A'}`);
    doc.moveDown();

    // Procurement Details
    doc.fontSize(12).text('PROCUREMENT DETAILS', { underline: true });
    doc.fontSize(10);
    doc.text(`Crop: ${procurement.cropName}`);
    doc.text(`Declared Weight: ${procurement.declaredWeight} quintals`);
    doc.text(`Actual Weight: ${procurement.actualWeight} quintals`);
    doc.text(`Quality Grade: ${procurement.qualityGrade}`);
    doc.text(`Rate per Quintal: ₹${procurement.ratePerQuintal?.toLocaleString()}`);
    doc.moveDown();

    // Payment
    doc.fontSize(14).text(`Total Amount: ₹${procurement.totalAmount?.toLocaleString()}`, { underline: true });
    doc.fontSize(10);
    doc.text(`Payment Status: ${procurement.paymentStatus.toUpperCase()}`);
    if (procurement.paymentDate) {
      doc.text(`Payment Date: ${new Date(procurement.paymentDate).toLocaleDateString('en-IN')}`);
    }
    doc.moveDown(2);

    // Footer
    doc.fontSize(8).text('This is a digitally generated receipt from KisanSetu.', { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
