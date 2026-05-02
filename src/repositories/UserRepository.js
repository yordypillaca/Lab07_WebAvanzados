import User from "../models/User.js";

class UserRepository {
  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  async findByEmail(email) {
    return User.findOne({ email }).populate("roles").exec();
  }

  async findById(id) {
    return User.findById(id).populate("roles").exec();
  }

  async updatePassword(id, hashedPassword) {
    return User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    ).exec();
  }

  async updateById(id, updates) {
    return User.findByIdAndUpdate(id, updates, { new: true })
      .populate("roles")
      .exec();
  }

  async saveRefreshToken(userId, refreshTokenHash, refreshTokenExpiresAt) {
    return User.findByIdAndUpdate(
      userId,
      { refreshTokenHash, refreshTokenExpiresAt },
      { new: true }
    )
      .populate("roles")
      .exec();
  }

  async getAll() {
    return User.find().populate("roles").exec();
  }
}

export default new UserRepository();

