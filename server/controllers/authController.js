const User = require('../models/User');
const Farmer = require('../models/Farmer');
const ProcurementCenter = require('../models/ProcurementCenter');
const { generateToken } = require('../middleware/auth');

// @desc    Register a farmer
// @route   POST /api/auth/register/farmer
exports.registerFarmer = async (req, res, next) => {
  try {
    const { name, mobile, password, village, district, landSize, landUnit, mainCrops, preferredLanguage } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Mobile number already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      mobile,
      password,
      role: 'farmer',
      preferredLanguage: preferredLanguage || 'en',
    });

    // Create farmer profile
    const farmer = await Farmer.create({
      user: user._id,
      village,
      district,
      landSize,
      landUnit: landUnit || 'acres',
      mainCrops,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: {
        user: { _id: user._id, name: user.name, mobile: user.mobile, role: user.role },
        farmer: { farmerId: farmer.farmerId, village: farmer.village, district: farmer.district },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a procurement center (pending approval)
// @route   POST /api/auth/register/center
exports.registerCenter = async (req, res, next) => {
  try {
    const {
      centerName, centerCode, address, district, numberOfCounters,
      dailyCapacity, operatingHoursStart, operatingHoursEnd,
      cropsHandled, operatorName, operatorMobile, operatorPassword,
    } = req.body;

    // Check if operator already exists
    const existingUser = await User.findOne({ mobile: operatorMobile });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Operator mobile already registered' });
    }

    // Check if center code exists
    const existingCenter = await ProcurementCenter.findOne({ centerCode });
    if (existingCenter) {
      return res.status(400).json({ success: false, message: 'Center code already exists' });
    }

    // Create operator user
    const operator = await User.create({
      name: operatorName,
      mobile: operatorMobile,
      password: operatorPassword,
      role: 'operator',
    });

    // Create center (pending approval)
    const center = await ProcurementCenter.create({
      centerName,
      centerCode,
      address,
      district,
      numberOfCounters,
      dailyCapacity,
      operatingHours: { start: operatingHoursStart, end: operatingHoursEnd },
      cropsHandled,
      operator: operator._id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Center registration submitted for admin approval',
      data: {
        center: { centerName: center.centerName, centerCode: center.centerCode, status: center.status },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { mobile, email, password } = req.body;
    const identifier = mobile || email;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide mobile number and password' });
    }

    // Match mobile number (strip non-digits if needed)
    const cleanMobile = identifier.replace(/[^0-9]/g, '');
    const user = await User.findOne({
      $or: [
        { mobile: cleanMobile },
        { mobile: identifier },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateToken(user._id);

    // Get additional profile data
    let profile = null;
    if (user.role === 'farmer') {
      profile = await Farmer.findOne({ user: user._id });
    } else if (user.role === 'operator') {
      profile = await ProcurementCenter.findOne({ operator: user._id });
      if (profile && profile.status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Your center registration is pending admin approval',
        });
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          preferredLanguage: user.preferredLanguage,
        },
        profile,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'farmer') {
      profile = await Farmer.findOne({ user: user._id });
    } else if (user.role === 'operator') {
      profile = await ProcurementCenter.findOne({ operator: user._id });
    }

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          mobile: user.mobile,
          role: user.role,
          preferredLanguage: user.preferredLanguage,
        },
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update FCM token
// @route   PUT /api/auth/fcm-token
exports.updateFcmToken = async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ success: true, message: 'FCM token updated' });
  } catch (error) {
    next(error);
  }
};
