import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Careva demo...');

  // Clean up existing data in reverse topological order to avoid FK errors
  console.log('Cleaning up existing data...');
  const tables = [
    { name: 'tip', action: () => prisma.tip.deleteMany({}) },
    { name: 'payment', action: () => prisma.payment.deleteMany({}) },
    { name: 'invoiceItem', action: () => prisma.invoiceItem.deleteMany({}) },
    { name: 'invoice', action: () => prisma.invoice.deleteMany({}) },
    { name: 'bookingItem', action: () => prisma.bookingItem.deleteMany({}) },
    { name: 'booking', action: () => prisma.booking.deleteMany({}) },
    { name: 'customerConsent', action: () => prisma.customerConsent.deleteMany({}) },
    { name: 'consentTemplate', action: () => prisma.consentTemplate.deleteMany({}) },
    { name: 'whatsAppMessage', action: () => prisma.whatsAppMessage.deleteMany({}) },
    { name: 'whatsAppAutoReplyRule', action: () => prisma.whatsAppAutoReplyRule.deleteMany({}) },
    { name: 'whatsAppSession', action: () => prisma.whatsAppSession.deleteMany({}) },
    { name: 'crmNote', action: () => prisma.crmNote.deleteMany({}) },
    { name: 'couponUsage', action: () => prisma.couponUsage.deleteMany({}) },
    { name: 'coupon', action: () => prisma.coupon.deleteMany({}) },
    { name: 'loyaltyTransaction', action: () => prisma.loyaltyTransaction.deleteMany({}) },
    { name: 'loyaltyAccount', action: () => prisma.loyaltyAccount.deleteMany({}) },
    { name: 'loyaltyProgram', action: () => prisma.loyaltyProgram.deleteMany({}) },
    { name: 'staffAttendance', action: () => prisma.staffAttendance.deleteMany({}) },
    { name: 'payrollPeriod', action: () => prisma.payrollPeriod.deleteMany({}) },
    { name: 'staffLeave', action: () => prisma.staffLeave.deleteMany({}) },
    { name: 'outletBlockedDate', action: () => prisma.outletBlockedDate.deleteMany({}) },
    { name: 'staffBlockSlot', action: () => prisma.staffBlockSlot.deleteMany({}) },
    { name: 'staffCommission', action: () => prisma.staffCommission.deleteMany({}) },
    { name: 'staffProfile', action: () => prisma.staffProfile.deleteMany({}) },
    { name: 'purchaseOrderItem', action: () => prisma.purchaseOrderItem.deleteMany({}) },
    { name: 'purchaseOrder', action: () => prisma.purchaseOrder.deleteMany({}) },
    { name: 'product', action: () => prisma.product.deleteMany({}) },
    { name: 'productCategory', action: () => prisma.productCategory.deleteMany({}) },
    { name: 'supplier', action: () => prisma.supplier.deleteMany({}) },
    { name: 'customerSegment', action: () => prisma.customerSegment.deleteMany({}) },
    { name: 'giftCard', action: () => prisma.giftCard.deleteMany({}) },
    { name: 'expense', action: () => prisma.expense.deleteMany({}) },
    { name: 'websiteSection', action: () => prisma.websiteSection.deleteMany({}) },
    { name: 'websitePage', action: () => prisma.websitePage.deleteMany({}) },
    { name: 'website', action: () => prisma.website.deleteMany({}) },
    { name: 'service', action: () => prisma.service.deleteMany({}) },
    { name: 'serviceCategory', action: () => prisma.serviceCategory.deleteMany({}) },
    { name: 'membershipEnrollment', action: () => prisma.membershipEnrollment.deleteMany({}) },
    { name: 'membershipPlan', action: () => prisma.membershipPlan.deleteMany({}) },
    { name: 'auditLog', action: () => prisma.auditLog.deleteMany({}) },
    { name: 'mediaAsset', action: () => prisma.mediaAsset.deleteMany({}) },
    { name: 'notification', action: () => prisma.notification.deleteMany({}) },
    { name: 'user', action: () => prisma.user.deleteMany({}) },
    { name: 'outletTiming', action: () => prisma.outletTiming.deleteMany({}) },
    { name: 'outlet', action: () => prisma.outlet.deleteMany({}) },
    { name: 'subscription', action: () => prisma.subscription.deleteMany({}) },
    { name: 'customer', action: () => prisma.customer.deleteMany({}) },
    { name: 'tenant', action: () => prisma.tenant.deleteMany({}) },
    { name: 'plan', action: () => prisma.plan.deleteMany({}) },
  ];

  for (const table of tables) {
    try {
      await table.action();
      console.log(`✓ Deleted ${table.name}`);
    } catch (e: any) {
      console.error(`✗ Failed to delete ${table.name}: ${e.message.split('\n')[0]}`);
    }
  }

  // 1. Seed Plans
  const plansData = [
    {
      name: 'Essential',
      priceMonthly: 999,
      priceYearly: 9990,
      maxOutlets: 1,
      maxStaff: 5,
      maxCustomers: 500,
      whatsappEnabled: false,
      cmsEnabled: false,
      loyaltyEnabled: false,
      couponsEnabled: false,
      reportsEnabled: false,
      analyticsEnabled: false,
    },
    {
      name: 'Growth',
      priceMonthly: 2499,
      priceYearly: 24990,
      maxOutlets: 3,
      maxStaff: 15,
      maxCustomers: 2000,
      whatsappEnabled: true,
      cmsEnabled: true,
      loyaltyEnabled: true,
      couponsEnabled: true,
      reportsEnabled: true,
      analyticsEnabled: true,
    },
    {
      name: 'Premium',
      priceMonthly: 4999,
      priceYearly: 49990,
      maxOutlets: 10,
      maxStaff: 50,
      maxCustomers: 10000,
      whatsappEnabled: true,
      cmsEnabled: true,
      loyaltyEnabled: true,
      couponsEnabled: true,
      reportsEnabled: true,
      analyticsEnabled: true,
    },
  ];

  const plans: Record<string, any> = {};
  for (const plan of plansData) {
    const createdPlan = await prisma.plan.create({
      data: plan,
    });
    plans[plan.name] = createdPlan;
  }
  console.log('Plans seeded.');

  // 2. Seed 2 Clients (Tenants)
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Lavender Spa Retreat',
      slug: 'lavendersparetreat',
      phone: '+91 99999 55555',
      email: 'owner@lavenderspa.com',
      city: 'Calicut',
      address: 'Near Beach Road, Calicut',
    }
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Glow Salon',
      slug: 'glowsalon',
      phone: '+91 98765 43210',
      email: 'jane@glowsalon.com',
      city: 'Mumbai',
      address: 'Bandras Main St, Mumbai',
    }
  });
  console.log('2 Clients (Tenants) seeded.');

  // Seed Subscriptions for both tenants
  await prisma.subscription.create({
    data: {
      tenantId: tenant1.id,
      planId: plans['Premium'].id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }
  });

  await prisma.subscription.create({
    data: {
      tenantId: tenant2.id,
      planId: plans['Growth'].id,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }
  });

  // Seed Outlets
  const outlet1 = await prisma.outlet.create({
    data: {
      tenantId: tenant1.id,
      name: 'Lavender Spa Calicut',
      slug: 'calicut',
      address: 'Calicut Main Road',
      city: 'Calicut',
      phone: '+91 99999 88888',
      isDefault: true,
    }
  });

  const outlet2 = await prisma.outlet.create({
    data: {
      tenantId: tenant2.id,
      name: 'Glow Salon Bandra',
      slug: 'bandra',
      address: 'Bandra West',
      city: 'Mumbai',
      phone: '+91 98765 11111',
      isDefault: true,
    }
  });
  console.log('Outlets seeded.');

  // Seed Outlet Timings
  for (const outlet of [outlet1, outlet2]) {
    for (let day = 0; day <= 6; day++) {
      await prisma.outletTiming.create({
        data: {
          outletId: outlet.id,
          dayOfWeek: day,
          openTime: '09:00',
          closeTime: '21:00',
          isClosed: day === 0, // Sunday closed
        }
      });
    }
  }

  // Seed Stylists (Users + StaffProfiles)
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Stylists for Tenant 1
  const stylist1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      outletId: outlet1.id,
      name: 'David Miller',
      email: 'david@lavenderspa.com',
      phone: '+91 90000 11111',
      passwordHash,
      role: 'STYLIST',
    }
  });
  await prisma.staffProfile.create({
    data: {
      userId: stylist1.id,
      specializations: 'Balayage & Coloring therapies',
      rating: 4.8,
      totalRatings: 98,
      workingDays: [1, 2, 3, 4, 5, 6],
    }
  });

  const stylist2 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      outletId: outlet1.id,
      name: 'Alex Carter',
      email: 'alex@lavenderspa.com',
      phone: '+91 90000 22222',
      passwordHash,
      role: 'STYLIST',
    }
  });
  await prisma.staffProfile.create({
    data: {
      userId: stylist2.id,
      specializations: 'Hair Sculpting & Beard ritual',
      rating: 4.9,
      totalRatings: 124,
      workingDays: [1, 2, 3, 4, 5, 6],
    }
  });

  // Stylists for Tenant 2
  const stylist3 = await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      outletId: outlet2.id,
      name: 'Sarah Connor',
      email: 'sarah@glowsalon.com',
      phone: '+91 90000 33333',
      passwordHash,
      role: 'STYLIST',
    }
  });
  await prisma.staffProfile.create({
    data: {
      userId: stylist3.id,
      specializations: 'Nail Art & Manicure',
      rating: 4.7,
      totalRatings: 45,
      workingDays: [1, 2, 3, 4, 5, 6],
    }
  });
  console.log('Stylists and StaffProfiles seeded.');

  // Seed Owners (Users)
  await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      name: 'Farhan',
      email: 'owner@lavenderspa.com',
      phone: '+91 99999 55555',
      passwordHash,
      role: 'OWNER',
    }
  });

  await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      name: 'Jane Doe',
      email: 'jane@glowsalon.com',
      phone: '+91 98765 43210',
      passwordHash,
      role: 'OWNER',
    }
  });
  console.log('Owners seeded.');

  // 3. Seed 5 Services per client
  const categoriesData = [
    { name: 'Grooming', description: 'Haircuts, shaves and beard design' },
    { name: 'Color', description: 'Professional hair coloring, highlights and balayage' },
    { name: 'Therapy', description: 'Scalp treatments, spas and hair restoration' }
  ];

  for (const tenant of [tenant1, tenant2]) {
    const catMapping: Record<string, string> = {};
    for (const cat of categoriesData) {
      const dbCat = await prisma.serviceCategory.create({
        data: {
          tenantId: tenant.id,
          name: cat.name,
          description: cat.description,
        }
      });
      catMapping[cat.name] = dbCat.id;
    }

    const servicesData = [
      { name: 'Signature Hair Sculpting', categoryName: 'Grooming', duration: 45, price: 850, description: 'Bespoke styling with signature shampoo & scalp conditioning.' },
      { name: 'Premium French Balayage', categoryName: 'Color', duration: 120, price: 3400, description: 'Hand-painted organic highlights for seamless dimension.' },
      { name: 'Moroccan Hot Oil Head Spa', categoryName: 'Therapy', duration: 60, price: 1800, description: 'De-stressing ritual utilizing pure argan oil and steam infusion.' },
      { name: 'Royal Shave & Beard Ritual', categoryName: 'Grooming', duration: 40, price: 650, description: 'Straight-razor shave with charcoal scrub and warm lavender towel wraps.' },
      { name: 'Advanced Keratin Infusion', categoryName: 'Therapy', duration: 90, price: 2900, description: 'Deep protein reconstruction for intense smooth texture and shine.' }
    ];

    for (const s of servicesData) {
      await prisma.service.create({
        data: {
          tenantId: tenant.id,
          categoryId: catMapping[s.categoryName],
          name: s.name,
          price: s.price,
          duration: s.duration,
          description: s.description,
        }
      });
    }
  }
  console.log('5 Services per client seeded.');

  // 4. Seed Customers (Clients/Customers)
  const customer1 = await prisma.customer.create({
    data: {
      tenantId: tenant1.id,
      name: 'Rohan Sharma',
      phone: '+91 99001 12233',
      email: 'rohan@example.com',
      passwordHash,
      gender: 'MALE',
      totalVisits: 5,
      totalSpend: 4250,
    }
  });

  const customer2 = await prisma.customer.create({
    data: {
      tenantId: tenant1.id,
      name: 'Priya Patel',
      phone: '+91 99002 23344',
      email: 'priya@example.com',
      passwordHash,
      gender: 'FEMALE',
      totalVisits: 3,
      totalSpend: 6800,
    }
  });

  const customer3 = await prisma.customer.create({
    data: {
      tenantId: tenant2.id,
      name: 'Amit Verma',
      phone: '+91 99003 34455',
      email: 'amit@example.com',
      passwordHash,
      gender: 'MALE',
      totalVisits: 1,
      totalSpend: 850,
    }
  });
  console.log('Customers seeded.');

  // 5. Seed Product Vendors (Suppliers)
  const vendor1 = await prisma.supplier.create({
    data: {
      tenantId: tenant1.id,
      name: "L'Oréal Professionnel",
      contactName: 'Ramesh Kumar',
      email: 'info@loreal.in',
      phone: '+91 22 6600 5500',
    }
  });

  const vendor2 = await prisma.supplier.create({
    data: {
      tenantId: tenant1.id,
      name: 'Kérastase India',
      contactName: 'Sanjay Dutt',
      email: 'support@kerastase.in',
      phone: '+91 22 6600 7700',
    }
  });
  console.log('Product Vendors seeded.');

  // 6. Seed Products
  const prodCat1 = await prisma.productCategory.create({
    data: {
      tenantId: tenant1.id,
      name: 'Hair Care',
    }
  });

  const prodCat2 = await prisma.productCategory.create({
    data: {
      tenantId: tenant1.id,
      name: 'Styling Products',
    }
  });

  const product1 = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      categoryId: prodCat1.id,
      name: "L'Oréal Serie Expert Shampoo",
      description: 'Shampoo for damaged hair',
      price: 1200,
      costPrice: 800,
      stockQty: 50,
      supplierId: vendor1.id,
    }
  });

  const product2 = await prisma.product.create({
    data: {
      tenantId: tenant1.id,
      categoryId: prodCat2.id,
      name: 'Kérastase Elixir Ultime Oil',
      description: 'Premium hair nourishing oil',
      price: 3800,
      costPrice: 2600,
      stockQty: 25,
      supplierId: vendor2.id,
    }
  });
  console.log('Products seeded.');

  // 7. Seed Coupons
  const coupon1 = await prisma.coupon.create({
    data: {
      tenantId: tenant1.id,
      code: 'DEMO20',
      type: 'PERCENTAGE',
      value: 20,
      minOrderValue: 1000,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    }
  });

  const coupon2 = await prisma.coupon.create({
    data: {
      tenantId: tenant1.id,
      code: 'LUXFIRST',
      type: 'PERCENTAGE',
      value: 15,
      minOrderValue: 500,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    }
  });
  console.log('Coupons seeded.');

  // 8. Seed Packages (MembershipPlans)
  const package1 = await prisma.membershipPlan.create({
    data: {
      tenantId: tenant1.id,
      name: 'Wellness Glow Pass',
      description: 'Includes 2 Head Spas and 1 Haircut monthly',
      price: 5000,
      duration: 'Monthly',
      services: 'Moroccan Hot Oil Head Spa, Signature Hair Sculpting',
    }
  });

  const package2 = await prisma.membershipPlan.create({
    data: {
      tenantId: tenant1.id,
      name: 'Royal Grooming Club',
      description: 'Includes unlimited shaves and 3 haircuts',
      price: 12000,
      duration: 'Quarterly',
      services: 'Royal Shave & Beard Ritual, Signature Hair Sculpting',
    }
  });
  console.log('Packages (MembershipPlans) seeded.');

  // 9. Seed Bookinglists (Bookings)
  const service1 = await prisma.service.findFirst({ where: { tenantId: tenant1.id, name: 'Signature Hair Sculpting' } });
  const service2 = await prisma.service.findFirst({ where: { tenantId: tenant1.id, name: 'Moroccan Hot Oil Head Spa' } });

  if (service1 && service2) {
    const booking1 = await prisma.booking.create({
      data: {
        tenantId: tenant1.id,
        outletId: outlet1.id,
        customerId: customer1.id,
        staffId: stylist1.id,
        status: 'PENDING',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
        endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
        totalDuration: 45,
        totalPrice: service1.price,
        items: {
          create: {
            serviceId: service1.id,
            duration: service1.duration,
            price: service1.price,
            staffId: stylist1.id,
          }
        }
      }
    });

    const booking2 = await prisma.booking.create({
      data: {
        tenantId: tenant1.id,
        outletId: outlet1.id,
        customerId: customer2.id,
        staffId: stylist2.id,
        status: 'COMPLETED',
        scheduledAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        endsAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        totalDuration: 60,
        totalPrice: service2.price,
        items: {
          create: {
            serviceId: service2.id,
            duration: service2.duration,
            price: service2.price,
            staffId: stylist2.id,
          }
        }
      }
    });
    console.log('Bookings seeded.');

    // 10. Seed Invoices for completed bookings
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant1.id,
        outletId: outlet1.id,
        customerId: customer2.id,
        bookingId: booking2.id,
        invoiceNumber: 'INV-2026-0001',
        status: 'PAID',
        subtotal: service2.price,
        discountAmount: 0,
        gstAmount: 0,
        totalAmount: service2.price,
        paidAmount: service2.price,
        items: {
          create: {
            serviceId: service2.id,
            name: service2.name,
            quantity: 1,
            unitPrice: service2.price,
            total: service2.price,
          }
        },
        payments: {
          create: {
            tenantId: tenant1.id,
            method: 'CARD',
            amount: service2.price,
          }
        }
      }
    });
    console.log('Invoices seeded.');
  }

  // Create website configurations so landing pages load fine
  for (const tenant of [tenant1, tenant2]) {
    await prisma.website.create({
      data: {
        tenantId: tenant.id,
        template: tenant.id === tenant1.id ? 'LUXURY' : 'MINIMAL',
        isPublished: true,
      }
    });
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
