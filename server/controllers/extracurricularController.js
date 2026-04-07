const ExtracurricularActivity = require('../models/ExtracurricularActivity');

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
      // store a relative path like "uploads/filename.pdf" (no absolute Windows paths)
      filePath: `uploads/${req.file.filename}`
    });

    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

exports.getMyExtracurricular = async (req, res, next) => {
  try {
    const items = await ExtracurricularActivity.find({ student: req.user._id }).sort('-dateOfParticipation');
    res.json(items);
  } catch (error) {
    next(error);
  }
};

exports.getAllExtracurricular = async (req, res, next) => {
  try {
    const items = await ExtracurricularActivity.find()
      .populate('student', 'name email')
      .sort('-dateOfParticipation');
    res.json(items);
  } catch (error) {
    next(error);
  }
};

