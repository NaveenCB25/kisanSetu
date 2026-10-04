const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({ success: false, message: 'Validation error', errors: messages });
    }
    next();
  };
};

// ── Schemas ──────────────────────────────────────────────

const registerFarmerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Enter a valid 10-digit Indian mobile number',
  }),
  password: Joi.string().min(6).max(128).required(),
  village: Joi.string().trim().required(),
  district: Joi.string().trim().required(),
  landSize: Joi.number().positive().required(),
  landUnit: Joi.string().valid('acres', 'hectares', 'bigha').default('acres'),
  mainCrops: Joi.array().items(Joi.string().trim()).min(1).required(),
  preferredLanguage: Joi.string().valid('en', 'hi', 'mr').default('en'),
});

const registerCenterSchema = Joi.object({
  centerName: Joi.string().trim().required(),
  centerCode: Joi.string().trim().uppercase().required(),
  address: Joi.string().trim().required(),
  district: Joi.string().trim().required(),
  numberOfCounters: Joi.number().integer().min(1).default(2),
  dailyCapacity: Joi.number().positive().required(),
  operatingHoursStart: Joi.string().default('08:00'),
  operatingHoursEnd: Joi.string().default('17:00'),
  cropsHandled: Joi.array().items(Joi.string().trim()).min(1).required(),
  operatorName: Joi.string().trim().required(),
  operatorMobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  operatorPassword: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  mobile: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  password: Joi.string().required(),
});

const bookingSchema = Joi.object({
  centerId: Joi.string().required(),
  slotId: Joi.string().required(),
  date: Joi.date().required(),
  cropCategory: Joi.string().trim().required(),
  cropName: Joi.string().trim().required(),
  declaredQuantity: Joi.number().positive().required(),
});

const weighingSchema = Joi.object({
  actualWeight: Joi.number().positive().required(),
  qualityGrade: Joi.string().valid('A', 'B', 'C').required(),
});

const cropRateSchema = Joi.object({
  cropCategory: Joi.string().trim().required(),
  cropName: Joi.string().trim().required(),
  mspRate: Joi.number().positive().required(),
  gradeARate: Joi.number().positive().required(),
  gradeBRate: Joi.number().positive().required(),
  gradeCRate: Joi.number().positive().required(),
  season: Joi.string().valid('kharif', 'rabi', 'zaid', 'all').default('all'),
});

module.exports = {
  validate,
  registerFarmerSchema,
  registerCenterSchema,
  loginSchema,
  bookingSchema,
  weighingSchema,
  cropRateSchema,
};
