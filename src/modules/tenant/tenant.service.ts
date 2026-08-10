import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { TenantRepository } from './tenant.repository';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getTenants(): Promise<any[]> {
    const tenants = await this.tenantRepository.findAllTenants();
    return tenants.map(tenant => this.mapTenantResponse(tenant));
  }

  async getTenantBySlug(slug: string): Promise<any | null> {
    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) return null;
    return this.mapTenantResponse(tenant);
  }

  async saveTenant(data: any): Promise<any> {
    // If the tenant already exists, update it. Otherwise, create it.
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      // Update tenant
      const updated = await this.prisma.tenant.update({
        where: { slug: data.slug },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          city: data.city,
          logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
          address: data.address !== undefined ? data.address : undefined,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });

      // Upsert website config
      const website = await this.prisma.website.upsert({
        where: { tenantId: existing.id },
        update: {
          template: data.activeTemplate || 'LUXURY',
          primaryColor: data.accentColor || 'gold',
        },
        create: {
          tenantId: existing.id,
          template: data.activeTemplate || 'LUXURY',
          primaryColor: data.accentColor || 'gold',
          isPublished: true,
        },
      });

      // Upsert website home page
      const homePage = await this.prisma.websitePage.upsert({
        where: {
          websiteId_slug: {
            websiteId: website.id,
            slug: 'home',
          },
        },
        update: {
          title: 'Home',
          isPublished: true,
        },
        create: {
          websiteId: website.id,
          title: 'Home',
          slug: 'home',
          isPublished: true,
        },
      });

      // If sectionsJson is present, update website sections
      if (data.sectionsJson) {
        try {
          const sections = JSON.parse(data.sectionsJson);
          // Delete existing sections
          await this.prisma.websiteSection.deleteMany({
            where: { pageId: homePage.id },
          });

          // Insert new sections
          for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            const secData = { ...sec };
            delete secData.category; // remove category key as it maps to type
            
            // If they have customized the hero title/subtitle or if it's new
            if (sec.category?.toUpperCase() === 'HERO') {
              if (data.tagline) secData.title = data.tagline;
              if (data.subtitle) secData.subtitle = data.subtitle;
            }

            await this.prisma.websiteSection.create({
              data: {
                pageId: homePage.id,
                type: sec.category ? sec.category.toUpperCase() : 'CUSTOM_HTML',
                data: JSON.stringify(secData),
                sortOrder: i,
                isEnabled: true,
              },
            });
          }
        } catch (e) {
          console.error("Failed to parse/save sectionsJson in saveTenant", e);
        }
      } else if (data.tagline || data.subtitle) {
        // If tagline/subtitle are updated individually without full sectionsJson (fallback/legacy)
        const heroSection = await this.prisma.websiteSection.findFirst({
          where: { pageId: homePage.id, type: 'HERO' },
        });
        if (heroSection) {
          let secData: any = {};
          try {
            secData = JSON.parse(heroSection.data);
          } catch {}
          if (data.tagline) secData.title = data.tagline;
          if (data.subtitle) secData.subtitle = data.subtitle;
          await this.prisma.websiteSection.update({
            where: { id: heroSection.id },
            data: { data: JSON.stringify(secData) },
          });
        }
      }

      // Upsert coupon in database if provided
      if (data.couponCode) {
        const couponVal = data.couponDiscount !== undefined ? Number(data.couponDiscount) : 15;
        const existingCoupon = await this.prisma.coupon.findFirst({
          where: {
            tenantId: existing.id,
            code: data.couponCode,
          },
        });

        if (existingCoupon) {
          await this.prisma.coupon.update({
            where: { id: existingCoupon.id },
            data: {
              value: couponVal,
              isActive: true,
            },
          });
        } else {
          await this.prisma.coupon.create({
            data: {
              tenantId: existing.id,
              code: data.couponCode,
              type: 'PERCENTAGE',
              value: couponVal,
              validFrom: new Date(),
              validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              isActive: true,
            },
          });
        }
      }

      // Sync outlets in PostgreSQL database
      if (Array.isArray(data.outlets)) {
        for (const out of data.outlets) {
          const outSlug = out.slug || out.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
          const isTempId = out.id && out.id.startsWith("out_");
          
          if (out.id && !isTempId) {
            // Update existing outlet in DB
            await this.prisma.outlet.update({
              where: { id: out.id },
              data: {
                name: out.name,
                slug: outSlug,
                address: out.address || '',
                city: data.city || 'Calicut',
                phone: out.phone,
                isActive: out.isActive !== false,
              }
            });
          } else {
            // Check if it already exists by tenantId & slug to prevent duplicates
            const existingOutlet = await this.prisma.outlet.findFirst({
              where: { tenantId: existing.id, slug: outSlug }
            });
            if (existingOutlet) {
              await this.prisma.outlet.update({
                where: { id: existingOutlet.id },
                data: {
                  name: out.name,
                  address: out.address || '',
                  phone: out.phone,
                  isActive: true
                }
              });
            } else {
              // Create new outlet in DB
              const newDbOutlet = await this.prisma.outlet.create({
                data: {
                  tenantId: existing.id,
                  name: out.name,
                  slug: outSlug,
                  address: out.address || '',
                  city: data.city || 'Calicut',
                  phone: out.phone,
                  isDefault: false,
                  isActive: true,
                }
              });
              // Seed timings for new outlet
              for (let day = 0; day <= 6; day++) {
                const isClosed = day === 0;
                await this.prisma.outletTiming.create({
                  data: {
                    outletId: newDbOutlet.id,
                    dayOfWeek: day,
                    openTime: '09:00',
                    closeTime: '21:00',
                    isClosed,
                  }
                });
              }
            }
          }
        }
      }

      // Also update owner user password/details if present
      const ownerUser = await this.prisma.user.findFirst({
        where: { tenantId: existing.id, role: 'OWNER' },
      });

      if (ownerUser) {
        const userUpdateData: any = {};
        if (data.email) userUpdateData.email = data.email;
        if (data.ownerName) userUpdateData.name = data.ownerName;
        if (data.ownerPassword) {
          let passwordHash = data.ownerPassword;
          if (!passwordHash.startsWith('$2a$') && !passwordHash.startsWith('$2b$')) {
            passwordHash = await bcrypt.hash(passwordHash, 10);
          }
          userUpdateData.passwordHash = passwordHash;
        }

        if (Object.keys(userUpdateData).length > 0) {
          await this.prisma.user.update({
            where: { id: ownerUser.id },
            data: userUpdateData,
          });
        }
      }

      // Update plan/subscription if provided
      if (data.planName) {
        let plan = await this.prisma.plan.findUnique({
          where: { name: data.planName },
        });

        if (!plan) {
          plan = await this.prisma.plan.create({
            data: {
              name: data.planName,
              priceMonthly: data.monthlyPrice || 1999,
              priceYearly: (data.monthlyPrice || 1999) * 10,
            },
          });
        } else if (data.monthlyPrice !== undefined) {
          await this.prisma.plan.update({
            where: { id: plan.id },
            data: {
              priceMonthly: data.monthlyPrice,
              priceYearly: data.monthlyPrice * 10,
            },
          });
        }

        const currentSub = await this.prisma.subscription.findUnique({
          where: { tenantId: existing.id },
        });

        let newPeriodEnd: Date | undefined = undefined;
        if (data.renew) {
          const days = data.renewDays || 30;
          const baseDate = currentSub && currentSub.currentPeriodEnd > new Date()
            ? currentSub.currentPeriodEnd
            : new Date();
          newPeriodEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
        }

        await this.prisma.subscription.upsert({
          where: { tenantId: existing.id },
          update: {
            planId: plan.id,
            status: data.isActive !== false ? 'ACTIVE' : 'CANCELLED',
            ...(newPeriodEnd ? { currentPeriodEnd: newPeriodEnd } : {}),
          },
          create: {
            tenantId: existing.id,
            planId: plan.id,
            status: data.isActive !== false ? 'ACTIVE' : 'TRIALING',
            currentPeriodStart: new Date(),
            currentPeriodEnd: newPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      const fullUpdated = await this.tenantRepository.findBySlug(data.slug);
      return this.mapTenantResponse(fullUpdated);
    }

    // Creating new tenant, default outlet, and owner user in transaction
    return this.prisma.$transaction(async (tx) => {
      const slug = data.slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const newTenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: slug,
          email: data.email,
          phone: data.phone,
          city: data.city,
          isActive: true,
        },
      });

      // Create default outlet
      const newOutlet = await tx.outlet.create({
        data: {
          tenantId: newTenant.id,
          name: `${data.name} Central`,
          slug: 'central',
          address: data.city || 'Main Street',
          city: data.city || 'Calicut',
          isActive: true,
          isDefault: true,
        },
      });

      // Validate owner password presence and security
      if (!data.ownerPassword) {
        throw new BadRequestException('Owner password is required for tenant onboarding.');
      }
      if (data.ownerPassword.length < 8) {
        throw new BadRequestException('Owner password must be at least 8 characters long.');
      }
      if (data.ownerPassword === `${slug}@123` || data.ownerPassword === 'password123') {
        throw new BadRequestException('Owner password cannot be a weak default value.');
      }

      // Hash owner password (using bcrypt)
      let passwordHash = data.ownerPassword;
      if (!passwordHash.startsWith('$2a$') && !passwordHash.startsWith('$2b$')) {
        passwordHash = await bcrypt.hash(passwordHash, 10);
      }

      // Create owner user
      const ownerUser = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          name: data.ownerName || 'Owner',
          email: data.email,
          phone: data.phone || '+91 99999 99999',
          passwordHash: passwordHash,
          role: 'OWNER',
          isActive: true,
        },
      });

      // Create default service categories
      const groomingCat = await tx.serviceCategory.create({
        data: {
          tenantId: newTenant.id,
          name: 'Grooming',
          description: 'Haircuts, shaves and beard design',
        },
      });

      const colorCat = await tx.serviceCategory.create({
        data: {
          tenantId: newTenant.id,
          name: 'Color',
          description: 'Professional hair coloring, highlights and balayage',
        },
      });

      const therapyCat = await tx.serviceCategory.create({
        data: {
          tenantId: newTenant.id,
          name: 'Therapy',
          description: 'Scalp treatments, spas and hair restoration',
        },
      });

      // Create default services
      const svc1 = await tx.service.create({
        data: {
          tenantId: newTenant.id,
          name: 'Signature Hair Sculpting',
          price: 850,
          duration: 45,
          description: 'Bespoke styling with signature shampoo & scalp conditioning.',
          categoryId: groomingCat.id,
        },
      });

      const svc2 = await tx.service.create({
        data: {
          tenantId: newTenant.id,
          name: 'Royal Shave & Beard Ritual',
          price: 650,
          duration: 40,
          description: 'Straight-razor shave with charcoal scrub and warm lavender towel wraps.',
          categoryId: groomingCat.id,
        },
      });

      const svc3 = await tx.service.create({
        data: {
          tenantId: newTenant.id,
          name: 'Premium French Balayage',
          price: 3400,
          duration: 120,
          description: 'Hand-painted organic highlights for seamless dimension.',
          categoryId: colorCat.id,
        },
      });

      await tx.service.create({
        data: {
          tenantId: newTenant.id,
          name: 'Moroccan Hot Oil Head Spa',
          price: 1800,
          duration: 60,
          description: 'De-stressing ritual utilizing pure argan oil and steam infusion.',
          categoryId: therapyCat.id,
        },
      });

      await tx.service.create({
        data: {
          tenantId: newTenant.id,
          name: 'Advanced Keratin Infusion',
          price: 2900,
          duration: 90,
          description: 'Deep protein reconstruction for intense smooth texture and shine.',
          categoryId: therapyCat.id,
        },
      });

      // 1. Create default product category and products
      const prodCategory = await tx.productCategory.create({
        data: {
          tenantId: newTenant.id,
          name: 'Hair & Beard Care',
          isActive: true,
        },
      });

      await tx.product.create({
        data: {
          tenantId: newTenant.id,
          outletId: newOutlet.id,
          categoryId: prodCategory.id,
          name: 'Volumizing Sea Salt Spray',
          description: 'Adds instant volume and texture with a matte finish.',
          sku: 'PROD-SALT-01',
          price: 1200,
          stockQty: 15,
          trackStock: true,
          isActive: true,
        },
      });

      await tx.product.create({
        data: {
          tenantId: newTenant.id,
          outletId: newOutlet.id,
          categoryId: prodCategory.id,
          name: 'Hydrating Argan Beard Balm',
          description: 'Softens, shapes and conditions facial hair.',
          sku: 'PROD-BALM-02',
          price: 850,
          stockQty: 20,
          trackStock: true,
          isActive: true,
        },
      });

      // 2. Create Stylists / Staff Members
      const stylist1User = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          name: 'Alex Carter',
          email: `alex@${slug}.com`,
          phone: '+91 95555 00001',
          passwordHash: await bcrypt.hash('stylist123', 10),
          role: 'STYLIST',
          outletId: newOutlet.id,
          isActive: true,
        },
      });

      await tx.staffProfile.create({
        data: {
          userId: stylist1User.id,
          specializations: 'Hair Sculpting & Beard ritual',
          rating: 4.9,
          totalRatings: 124,
          workingDays: [1, 2, 3, 4, 5, 6],
        },
      });

      const stylist2User = await tx.user.create({
        data: {
          tenantId: newTenant.id,
          name: 'David Miller',
          email: `david@${slug}.com`,
          phone: '+91 95555 00002',
          passwordHash: await bcrypt.hash('stylist123', 10),
          role: 'STYLIST',
          outletId: newOutlet.id,
          isActive: true,
        },
      });

      await tx.staffProfile.create({
        data: {
          userId: stylist2User.id,
          specializations: 'Balayage & Coloring therapies',
          rating: 4.8,
          totalRatings: 98,
          workingDays: [1, 2, 3, 4, 5, 6],
        },
      });

      // 3. Create Manager User
      await tx.user.create({
        data: {
          tenantId: newTenant.id,
          name: 'Outlet Manager',
          email: `manager@${slug}.com`,
          phone: '+91 95555 00003',
          passwordHash: await bcrypt.hash('manager123', 10),
          role: 'MANAGER',
          outletId: newOutlet.id,
          isActive: true,
        },
      });

      // 4. Create Customers
      const cust1 = await tx.customer.create({
        data: {
          tenantId: newTenant.id,
          outletId: newOutlet.id,
          name: 'John Doe',
          email: `john.doe@gmail.com`,
          phone: '+91 98450 11223',
          dob: new Date('1995-04-12'),
          referralCode: `JOHND-${slug.toUpperCase()}`,
        },
      });

      const cust2 = await tx.customer.create({
        data: {
          tenantId: newTenant.id,
          outletId: newOutlet.id,
          name: 'Sarah Connor',
          email: `sarah.connor@gmail.com`,
          phone: '+91 91234 56789',
          dob: new Date('1998-10-12'),
          referralCode: `SARAH-${slug.toUpperCase()}`,
        },
      });

      // 5. Create Loyalty Program and Accounts
      const program = await tx.loyaltyProgram.create({
        data: {
          tenantId: newTenant.id,
          name: 'Premium Points Club',
          pointsPerRupee: 1.0,
          rupeePerPoint: 0.5,
          minRedeemPoints: 100,
          maxRedeemPct: 0.2,
          isActive: true,
        },
      });

      const loyaltyAcc1 = await tx.loyaltyAccount.create({
        data: {
          tenantId: newTenant.id,
          customerId: cust1.id,
          programId: program.id,
          totalPoints: 350,
          lifetimeEarned: 500,
          lifetimeRedeemed: 150,
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          accountId: loyaltyAcc1.id,
          tenantId: newTenant.id,
          type: 'EARN',
          points: 500,
          description: 'Points earned for checkout purchase',
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          accountId: loyaltyAcc1.id,
          tenantId: newTenant.id,
          type: 'REDEEM',
          points: 150,
          description: 'Points redeemed for discount',
        },
      });

      // Create Loyalty account for Sarah too
      await tx.loyaltyAccount.create({
        data: {
          tenantId: newTenant.id,
          customerId: cust2.id,
          programId: program.id,
          totalPoints: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
        },
      });

      // 6. Create Coupons
      await tx.coupon.create({
        data: {
          tenantId: newTenant.id,
          code: 'WELCOME10',
          type: 'PERCENTAGE',
          trigger: 'MANUAL',
          value: 10,
          minOrderValue: 500,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      });

      // 7. Create Gift Card
      await tx.giftCard.create({
        data: {
          tenantId: newTenant.id,
          code: `GC-WELCOME-500-${slug.toUpperCase()}`,
          initialValue: 500,
          balance: 500,
          customerId: cust1.id,
          status: 'ACTIVE',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      // 8. Create Operational Expenses
      await tx.expense.create({
        data: {
          tenantId: newTenant.id,
          outletId: newOutlet.id,
          category: 'CONSUMABLES',
          amount: 3200,
          description: 'Premium organic Hair Styling Sprays replenishment',
          spentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      });

      // 9. Create dynamic website & home page configuration so storefront looks complete
      const website = await tx.website.create({
        data: {
          tenantId: newTenant.id,
          template: 'LUXURY',
          primaryColor: '#1a1a2e',
          secondaryColor: '#rose-400',
          isPublished: true,
        },
      });

      const mainPage = await tx.websitePage.create({
        data: {
          websiteId: website.id,
          title: 'Home',
          slug: 'home',
          isPublished: true,
        },
      });

      // Seed hero website section
      await tx.websiteSection.create({
        data: {
          pageId: mainPage.id,
          type: 'HERO',
          data: JSON.stringify({
            title: `${data.name} — Premium Salon`,
            subtitle: 'Uncompromising styling craftsmanship and therapy.',
            ctaText: 'Book Now',
            backgroundImage: '',
          }),
          sortOrder: 0,
          isEnabled: true,
        },
      });

      // 10. Consent Templates & Signed Consents
      const consentTemplate = await tx.consentTemplate.create({
        data: {
          tenantId: newTenant.id,
          serviceCategoryId: colorCat.id,
          title: 'French Balayage Skin Allergy Consent',
          content: 'I verify that I have read the terms regarding French Balayage organic highlights and confirm that I have no history of severe chemical hypersensitivity.',
          isActive: true,
        },
      });

      await tx.customerConsent.create({
        data: {
          tenantId: newTenant.id,
          customerId: cust2.id,
          templateId: consentTemplate.id,
          signatureText: 'Sarah Connor',
          ipAddress: '192.168.1.45',
        },
      });

      // 11. Bookings & Invoices
      const pastBooking = await tx.booking.create({
        data: {
          tenantId: newTenant.id,
          outletId: newOutlet.id,
          customerId: cust1.id,
          staffId: stylist1User.id,
          status: 'COMPLETED',
          scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          endsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60000),
          totalDuration: 45,
          totalPrice: 850,
        },
      });

      await tx.bookingItem.create({
        data: {
          bookingId: pastBooking.id,
          serviceId: svc1.id,
          duration: 45,
          price: 850,
        },
      });

      // Create invoice for this past completed booking
      const invoice = await tx.invoice.create({
        data: {
          tenantId: newTenant.id,
          outletId: newOutlet.id,
          customerId: cust1.id,
          bookingId: pastBooking.id,
          invoiceNumber: `INV-${new Date().getFullYear()}-0001`,
          status: 'PAID',
          subtotal: 850,
          discountAmount: 0,
          gstAmount: 0,
          totalAmount: 850,
          paidAmount: 850,
          createdById: ownerUser.id,
        },
      });

      await tx.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          serviceId: svc1.id,
          name: 'Signature Hair Sculpting',
          quantity: 1,
          unitPrice: 850,
          total: 850,
        },
      });

      await tx.payment.create({
        data: {
          tenantId: newTenant.id,
          invoiceId: invoice.id,
          method: 'UPI',
          amount: 850,
        },
      });

      // Create an upcoming booking for cust2 (Sarah Connor)
      const upcomingBooking = await tx.booking.create({
        data: {
          tenantId: newTenant.id,
          outletId: newOutlet.id,
          customerId: cust2.id,
          staffId: stylist2User.id,
          status: 'CONFIRMED',
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 120 * 60000),
          totalDuration: 120,
          totalPrice: 3400,
        },
      });

      // 12. Create Subscription/Plan linkage during onboarding
      if (data.planName) {
        let plan = await tx.plan.findUnique({
          where: { name: data.planName },
        });

        if (!plan) {
          plan = await tx.plan.create({
            data: {
              name: data.planName,
              priceMonthly: data.monthlyPrice || 1999,
              priceYearly: (data.monthlyPrice || 1999) * 10,
            },
          });
        }

        await tx.subscription.create({
          data: {
            tenantId: newTenant.id,
            planId: plan.id,
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      const fullNewTenant = await tx.tenant.findUnique({
        where: { id: newTenant.id },
        include: {
          outlets: true,
          users: true,
          subscription: {
            include: {
              plan: true
            }
          }
        }
      });

      return this.mapTenantResponse(fullNewTenant);
    });
  }

  async deleteTenantBySlug(slug: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (!tenant) return false;

    // Delete in cascade order to prevent foreign key violations.
    // For SQLite/PostgreSQL safety, we do it in a transaction.
    await this.prisma.$transaction(async (tx) => {
      // 1. WhatsApp relations
      await tx.whatsAppMessage.deleteMany({ where: { tenantId: tenant.id } });
      await tx.whatsAppAutoReplyRule.deleteMany({ where: { tenantId: tenant.id } });
      await tx.whatsAppSession.deleteMany({ where: { tenantId: tenant.id } });

      // 2. Website & pages
      await tx.websiteSection.deleteMany({
        where: { page: { website: { tenantId: tenant.id } } },
      });
      await tx.websitePage.deleteMany({
        where: { website: { tenantId: tenant.id } },
      });
      await tx.website.deleteMany({ where: { tenantId: tenant.id } });

      // 3. Loyalty relations
      await tx.loyaltyTransaction.deleteMany({ where: { tenantId: tenant.id } });
      await tx.loyaltyAccount.deleteMany({ where: { tenantId: tenant.id } });
      await tx.loyaltyProgram.deleteMany({ where: { tenantId: tenant.id } });

      // 4. Invoices, Payments, Tips & Bookings
      await tx.payment.deleteMany({ where: { tenantId: tenant.id } });
      await tx.tip.deleteMany({ where: { tenantId: tenant.id } });
      await tx.invoiceItem.deleteMany({
        where: { invoice: { tenantId: tenant.id } },
      });
      await tx.couponUsage.deleteMany({
        where: { invoice: { tenantId: tenant.id } },
      });
      await tx.invoice.deleteMany({ where: { tenantId: tenant.id } });

      await tx.bookingItem.deleteMany({
        where: { booking: { tenantId: tenant.id } },
      });
      await tx.booking.deleteMany({ where: { tenantId: tenant.id } });

      // 5. Consent & templates
      await tx.customerConsent.deleteMany({ where: { tenantId: tenant.id } });
      await tx.consentTemplate.deleteMany({ where: { tenantId: tenant.id } });

      // 6. Customers & Staff relations
      await tx.crmNote.deleteMany({
        where: { customer: { tenantId: tenant.id } },
      });
      await tx.customer.deleteMany({ where: { tenantId: tenant.id } });

      await tx.staffProfile.deleteMany({
        where: { user: { tenantId: tenant.id } },
      });
      await tx.staffLeave.deleteMany({ where: { tenantId: tenant.id } });
      await tx.staffAttendance.deleteMany({ where: { tenantId: tenant.id } });
      await tx.staffCommission.deleteMany({ where: { tenantId: tenant.id } });
      await tx.staffBlockSlot.deleteMany({ where: { tenantId: tenant.id } });
      await tx.payrollPeriod.deleteMany({ where: { tenantId: tenant.id } });

      // 7. Products, categories, suppliers & orders
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrder: { tenantId: tenant.id } },
      });
      await tx.purchaseOrder.deleteMany({ where: { tenantId: tenant.id } });
      await tx.product.deleteMany({ where: { tenantId: tenant.id } });
      await tx.productCategory.deleteMany({ where: { tenantId: tenant.id } });
      await tx.supplier.deleteMany({ where: { tenantId: tenant.id } });

      // 8. Services & categories
      await tx.service.deleteMany({ where: { tenantId: tenant.id } });
      await tx.serviceCategory.deleteMany({ where: { tenantId: tenant.id } });

      // 9. Core configurations
      await tx.expense.deleteMany({ where: { tenantId: tenant.id } });
      await tx.giftCard.deleteMany({ where: { tenantId: tenant.id } });
      await tx.mediaAsset.deleteMany({ where: { tenantId: tenant.id } });
      await tx.notification.deleteMany({ where: { tenantId: tenant.id } });
      await tx.auditLog.deleteMany({ where: { tenantId: tenant.id } });
      await tx.membershipEnrollment.deleteMany({ where: { tenantId: tenant.id } });
      await tx.membershipPlan.deleteMany({ where: { tenantId: tenant.id } });
      await tx.subscription.deleteMany({ where: { tenantId: tenant.id } });
      await tx.outletBlockedDate.deleteMany({ where: { tenantId: tenant.id } });

      // 10. Users, timings & Outlets
      await tx.user.deleteMany({ where: { tenantId: tenant.id } });
      await tx.outletTiming.deleteMany({
        where: { outlet: { tenantId: tenant.id } },
      });
      await tx.outlet.deleteMany({ where: { tenantId: tenant.id } });

      // Finally delete the tenant record
      await tx.tenant.delete({ where: { id: tenant.id } });
    });

    return true;
  }

  private mapTenantResponse(tenant: any): any {
    // Check if there's an owner user to return as ownerPassword
    const owner = tenant.users?.find((u: any) => u.role === 'OWNER');
    
    // Resolve plan details from subscription relationship
    const planName = tenant.subscription?.plan?.name || 'Growth';
    const monthlyPrice = tenant.subscription?.plan?.priceMonthly 
      ? Number(tenant.subscription.plan.priceMonthly) 
      : 5999;

    const subscriptionStatus = tenant.subscription?.status || 'TRIALING';
    const subscriptionExpiresAt = tenant.subscription?.currentPeriodEnd
      ? tenant.subscription.currentPeriodEnd.toISOString().split('T')[0]
      : null;

    // Resolve website template and config fields
    const website = tenant.website;
    const activeTemplate = website?.template || 'LUXURY';
    
    // Resolve tagline, subtitle, coupon details, and sections from website sections
    const homePage = website?.pages?.find((p: any) => p.slug === 'home');
    const heroSection = homePage?.sections?.find((s: any) => s.type === 'HERO');
    let tagline = '';
    let subtitle = '';
    if (heroSection?.data) {
      try {
        const heroData = JSON.parse(heroSection.data);
        tagline = heroData.title || '';
        subtitle = heroData.subtitle || '';
      } catch {}
    }

    // Convert websiteSections to the sections format expected by the frontend
    let sectionsJson = '[]';
    if (homePage?.sections) {
      const mappedSections = homePage.sections
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((sec: any) => {
          let parsedData = {};
          try {
            parsedData = JSON.parse(sec.data);
          } catch {}
          return {
            category: sec.type.toLowerCase(),
            ...parsedData,
          };
        });
      sectionsJson = JSON.stringify(mappedSections);
    }

    // Get default outlet for coupon details
    const defaultOutlet = tenant.outlets?.find((o: any) => o.isDefault);
    const couponCode = defaultOutlet?.couponCode || 'LUXFIRST';
    const couponDiscount = defaultOutlet?.couponDiscount !== undefined ? Number(defaultOutlet.couponDiscount) : 15;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      phone: tenant.phone,
      city: tenant.city,
      isActive: tenant.isActive,
      ownerName: owner?.name || 'Owner',
      ownerPassword: owner?.passwordHash || '',
      outlets: tenant.outlets || [],
      planName: planName,
      monthlyPrice: monthlyPrice,
      subscriptionStatus: subscriptionStatus,
      subscriptionExpiresAt: subscriptionExpiresAt,
      outletsCount: tenant.outlets?.length || 1,
      onboardedAt: tenant.createdAt.toISOString().split('T')[0],
      activeTemplate,
      accentColor: website?.primaryColor || 'gold',
      customTextColor: website?.primaryColor || '',
      customHeadingColor: '',
      customButtonColor: '',
      tagline,
      subtitle,
      couponCode,
      couponDiscount,
      sectionsJson,
    };
  }

  async createDemoBooking(data: any): Promise<any> {
    const { name, businessName, email, phone, city, plan } = data;
    if (!name || !businessName || !email || !phone || !city) {
      throw new BadRequestException('All fields are required');
    }
    return this.prisma.demoBooking.create({
      data: {
        name,
        businessName,
        email,
        phone,
        city,
        plan: plan || 'Growth',
      },
    });
  }

  async getDemoBookings(): Promise<any[]> {
    return this.prisma.demoBooking.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDemoBooking(id: string): Promise<boolean> {
    try {
      await this.prisma.demoBooking.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }
}
