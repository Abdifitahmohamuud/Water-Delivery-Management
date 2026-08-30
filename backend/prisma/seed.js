import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Water Delivery Management System data...");

  // 1. System Settings
  let settings = await prisma.systemSettings.findFirst();
  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {
        companyName: "HydroFlow Water Delivery",
        companyPhone: "+252 61 5000000",
        companyEmail: "info@hydroflowwater.com",
        companyAddress: "Km5 Hodan, Mogadishu, Somalia",
        currency: "USD",
        defaultDeliveryFee: 1.5,
        otpExpiration: 600,
        maxOtpAttempts: 3,
        businessHoursEnabled: false,
        allowCustomerCancellation: true,
      },
    });
    console.log("Created default SystemSettings");
  }

  // 2. Water Products
  const productsData = [
    {
      name: "20 Liter Jerrycan",
      description: "Clean, purified drinking water in standard 20L Jerrycan container.",
      unit: "Jerrycan",
      currentPrice: 2.0,
      isActive: true,
    },
    {
      name: "10 Liter Jerrycan",
      description: "Compact 10L purified drinking water Jerrycan for home and small offices.",
      unit: "Jerrycan",
      currentPrice: 1.2,
      isActive: true,
    },
    {
      name: "Large Water Container (18.9L)",
      description: "18.9 Liter reusable dispenser water bottle.",
      unit: "Container",
      currentPrice: 2.5,
      isActive: true,
    },
  ];

  for (const prod of productsData) {
    const existing = await prisma.waterProduct.findFirst({ where: { name: prod.name } });
    if (!existing) {
      await prisma.waterProduct.create({ data: prod });
      console.log(`Created product: ${prod.name}`);
    }
  }

  // Hash passwords
  const passwordHash = await bcrypt.hash("Water123!", 10);

  // 3. Admin User
  let adminUser = await prisma.user.findUnique({ where: { email: "admin@waterdelivery.com" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: "admin@waterdelivery.com",
        phone: "0610000000",
        fullName: "System Administrator",
        password: passwordHash,
        role: "ADMIN",
        accountStatus: "ACTIVE",
      },
    });
    console.log("Created Admin User (admin@waterdelivery.com / Water123!)");
  }

  // 4. Driver User
  let driverUser = await prisma.user.findUnique({ where: { email: "driver@waterdelivery.com" } });
  if (!driverUser) {
    driverUser = await prisma.user.create({
      data: {
        email: "driver@waterdelivery.com",
        phone: "0615550001",
        fullName: "Mohamed Ali",
        password: passwordHash,
        role: "DRIVER",
        accountStatus: "ACTIVE",
        driver: {
          create: {
            vehicleNumber: "WTR-8821",
            vehicleType: "Water Tanker Truck",
            availabilityStatus: "AVAILABLE",
          },
        },
      },
      include: { driver: true },
    });
    console.log("Created Driver User (driver@waterdelivery.com / Water123!)");
  }

  // 5. Customer User
  let customerUser = await prisma.user.findUnique({ where: { email: "customer@waterdelivery.com" } });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        email: "customer@waterdelivery.com",
        phone: "0615550002",
        fullName: "Ahmed Mohamed",
        password: passwordHash,
        role: "CUSTOMER",
        accountStatus: "ACTIVE",
        customer: {
          create: {
            savedAddresses: {
              create: [
                {
                  label: "Home",
                  address: "House 45, Street 12, Hodan District",
                  latitude: 2.0469,
                  longitude: 45.3182,
                  notes: "Gate near the red water tank",
                  isDefault: true,
                },
                {
                  label: "Office",
                  address: "Building B, Floor 3, Taleex Avenue",
                  latitude: 2.042,
                  longitude: 45.321,
                  notes: "Call security upon arrival",
                  isDefault: false,
                },
              ],
            },
          },
        },
      },
      include: { customer: { include: { savedAddresses: true } } },
    });
    console.log("Created Customer User (customer@waterdelivery.com / Water123!)");
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
