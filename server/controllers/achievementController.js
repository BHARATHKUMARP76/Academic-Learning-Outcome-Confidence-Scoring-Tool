const Achievement = require('../models/Achievement');

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
      // store a relative path like "uploads/filename.pdf" (no absolute Windows paths)
      filePath: `uploads/${req.file.filename}`
    });

    res.status(201).json(achievement);
  } catch (error) {
    next(error);
  }
};

exports.getMyAchievements = async (req, res, next) => {
  try {
    const items = await Achievement.find({ student: req.user._id }).sort('-submittedAt');
    res.json(items);
  } catch (error) {
    next(error);
  }
};

exports.getAllAchievements = async (req, res, next) => {
  try {
    const items = await Achievement.find()
      .populate('student', 'name email')
      .sort('-submittedAt');
    res.json(items);
  } catch (error) {
    next(error);
  }
};

