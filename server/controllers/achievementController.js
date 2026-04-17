const Achievement = require('../models/Achievement');
const path = require('path');

function toStoredFilename(filePath = '') {
  const raw = String(filePath || '');
  const normalized = raw.replace(/\\/g, '/').trim();
  return path.basename(normalized);
}

function toPublicFileUrl(req, fileName = '') {
  return `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(fileName)}`;
}

function formatAchievementRecord(item, req) {
  if (!item) return item;
  const plain = item.toObject ? item.toObject() : item;
  const fileName = toStoredFilename(plain.filePath);
  return {
    ...plain,
    filePath: fileName,
    fileUrl: fileName ? toPublicFileUrl(req, fileName) : ''
  };
}

exports.createAchievement = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Certificate PDF is required' });
    }

    const achievement = await Achievement.create({
      student: req.user._id,
      title: req.body.title,
      platform: req.body.platform,
      description: req.body.description,
      // Persist only the uploaded filename in MongoDB.
      filePath: req.file.filename
    });

    res.status(201).json(formatAchievementRecord(achievement, req));
  } catch (error) {
    next(error);
  }
};

exports.getMyAchievements = async (req, res, next) => {
  try {
    const items = await Achievement.find({ student: req.user._id }).sort('-submittedAt');
    res.json(items.map((item) => formatAchievementRecord(item, req)));
  } catch (error) {
    next(error);
  }
};

exports.getAllAchievements = async (req, res, next) => {
  try {
    const items = await Achievement.find()
      .populate('student', 'name email')
      .sort('-submittedAt');
    res.json(items.map((item) => formatAchievementRecord(item, req)));
  } catch (error) {
    next(error);
  }
};

