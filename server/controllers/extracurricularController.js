const ExtracurricularActivity = require('../models/ExtracurricularActivity');
const path = require('path');

function toStoredFilename(filePath = '') {
  const raw = String(filePath || '');
  const normalized = raw.replace(/\\/g, '/').trim();
  return path.basename(normalized);
}

function toPublicFileUrl(req, fileName = '') {
  return `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(fileName)}`;
}

function formatExtracurricularRecord(item, req) {
  if (!item) return item;
  const plain = item.toObject ? item.toObject() : item;
  const fileName = toStoredFilename(plain.filePath);
  return {
    ...plain,
    filePath: fileName,
    fileUrl: fileName ? toPublicFileUrl(req, fileName) : ''
  };
}

exports.createExtracurricular = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Proof file is required' });
    }

    const record = await ExtracurricularActivity.create({
      student: req.user._id,
      eventName: req.body.eventName,
      eventType: req.body.eventType,
      dateOfParticipation: req.body.dateOfParticipation,
      description: req.body.description,
      // Persist only the uploaded filename in MongoDB.
      filePath: req.file.filename
    });

    res.status(201).json(formatExtracurricularRecord(record, req));
  } catch (error) {
    next(error);
  }
};

exports.getMyExtracurricular = async (req, res, next) => {
  try {
    const items = await ExtracurricularActivity.find({ student: req.user._id }).sort('-dateOfParticipation');
    res.json(items.map((item) => formatExtracurricularRecord(item, req)));
  } catch (error) {
    next(error);
  }
};

exports.getAllExtracurricular = async (req, res, next) => {
  try {
    const items = await ExtracurricularActivity.find()
      .populate('student', 'name email')
      .sort('-dateOfParticipation');
    res.json(items.map((item) => formatExtracurricularRecord(item, req)));
  } catch (error) {
    next(error);
  }
};

