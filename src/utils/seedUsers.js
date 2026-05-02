import bcrypt from "bcrypt";
import userRepository from "../repositories/UserRepository.js";
import roleRepository from "../repositories/RoleRepository.js";

export default async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@admin.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin#1234";

  const existing = await userRepository.findByEmail(adminEmail);
  if (existing) return;

  let adminRole = await roleRepository.findByName("admin");
  if (!adminRole) adminRole = await roleRepository.create({ name: "admin" });

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "10", 10);
  const hashed = await bcrypt.hash(adminPassword, saltRounds);

  await userRepository.create({
    email: adminEmail,
    password: hashed,
    name: "Admin",
    lastName: "Seed",
    phoneNumber: "0000000000",
    birthdate: new Date("1990-01-01"),
    roles: [adminRole._id],
  });

  console.log(`Seeded admin user: ${adminEmail}`);
}

