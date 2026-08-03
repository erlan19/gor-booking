import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { store, type Court, type User } from "./db.js";

function hash(pw: string) {
  return bcrypt.hashSync(pw, 10);
}

if (store.users.length === 0) {
  const users: User[] = [
    {
      id: nanoid(10),
      name: "Admin GOR",
      email: "admin@gor.id",
      passwordHash: hash("admin123"),
      role: "admin",
      phone: "081200000001",
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(10),
      name: "Kasir GOR",
      email: "kasir@gor.id",
      passwordHash: hash("kasir123"),
      role: "cashier",
      phone: "081200000002",
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(10),
      name: "Budi Santoso",
      email: "budi@mail.com",
      passwordHash: hash("client123"),
      role: "client",
      phone: "081200000003",
      createdAt: new Date().toISOString(),
    },
  ];
  store.users.push(...users);
  console.log("Seeded users:", users.map((u) => `${u.email} / role=${u.role}`));
}

if (store.courts.length === 0) {
  const courts: Court[] = [
    {
      id: nanoid(8),
      name: "Lapangan Futsal A",
      type: "Futsal",
      pricePerHour: 150000,
      location: "Lantai 1",
      description: "Vinyl flooring, indoor, pencahayaan LED penuh.",
      active: true,
    },
    {
      id: nanoid(8),
      name: "Lapangan Futsal B",
      type: "Futsal",
      pricePerHour: 140000,
      location: "Lantai 1",
      description: "Rumput sintetis, indoor.",
      active: true,
    },
    {
      id: nanoid(8),
      name: "Badminton Court 1",
      type: "Badminton",
      pricePerHour: 60000,
      location: "Lantai 2",
      description: "Lantai vinyl standar BWF.",
      active: true,
    },
    {
      id: nanoid(8),
      name: "Badminton Court 2",
      type: "Badminton",
      pricePerHour: 60000,
      location: "Lantai 2",
      description: "Lantai vinyl standar BWF.",
      active: true,
    },
    {
      id: nanoid(8),
      name: "Lapangan Basket Indoor",
      type: "Basket",
      pricePerHour: 200000,
      location: "Lantai 1",
      description: "Full court, ring standar FIBA.",
      active: true,
    },
    {
      id: nanoid(8),
      name: "Lapangan Voli",
      type: "Voli",
      pricePerHour: 100000,
      location: "Lantai 2",
      description: "Indoor, net standar kompetisi.",
      active: true,
    },
  ];
  store.courts.push(...courts);
  console.log("Seeded courts:", courts.map((c) => c.name));
}

store.save();
console.log("Seed selesai.");
