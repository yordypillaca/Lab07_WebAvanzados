import userService from "../services/UserService.js";
import { parseOrThrow, updateMeSchema } from "../utils/validators.js";

class UserController {
  async getAll(req, res, next) {
    try {
      const users = await userService.getAll();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await userService.getById(req.userId);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req, res, next) {
    try {
      const updates = parseOrThrow(updateMeSchema, req.body || {});
      const updated = await userService.updateById(req.userId, updates);
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();

