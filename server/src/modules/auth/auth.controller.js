const { success, error } = require('../../utils/apiResponse');
const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    const user = await authService.register({
      email: email.toLowerCase().trim(),
      password,
      firstName,
      lastName,
      phone,
    });

    return success(res, user, 201);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email: email.toLowerCase().trim(), password });

    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await authService.getMe(userId);

    return success(res, user);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
