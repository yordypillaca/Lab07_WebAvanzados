import userRepository from "../repositories/UserRepository.js";

class UserService {
  async getAll() {
    const users = await userRepository.getAll();
    return users.map((u) => this.toDto(u));
  }

  toDto(user) {
    const toUtcOffset = (d) => {
      if (!d) return undefined;
      const iso = new Date(d).toISOString(); // ...Z
      return iso.replace("Z", "+00:00");
    };

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      birthdate: toUtcOffset(user.birthdate),
      age: user.age,
      url_profile: user.url_profile,
      address: user.address,
      roles: (user.roles || []).map((r) => r.name),
      createdAt: toUtcOffset(user.createdAt),
      updatedAt: toUtcOffset(user.updatedAt),
    };
  }

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const err = new Error("Usuario no encontrado");
      err.status = 404;
      throw err;
    }
    return this.toDto(user);
  }

  async updateById(id, updates) {
    const allowed = {
      name: updates.name,
      lastName: updates.lastName,
      phoneNumber: updates.phoneNumber,
      birthdate: updates.birthdate,
      url_profile: updates.url_profile,
      address: updates.address,
    };

    if (allowed.birthdate) allowed.birthdate = new Date(allowed.birthdate);

    const user = await userRepository.updateById(id, allowed);
    if (!user) {
      const err = new Error("Usuario no encontrado");
      err.status = 404;
      throw err;
    }
    return this.toDto(user);
  }
}

export default new UserService();

