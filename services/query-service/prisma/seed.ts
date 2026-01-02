/**
 * HealthPay Database Seed
 * Populates initial data for Bill Categories and Billers
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ============================================
  // 1. Bill Categories & Billers
  // ============================================
  console.log('📄 Creating bill categories and billers...');

  const categories = [
    {
      id: 'electricity',
      name: 'كهرباء',
      icon: '⚡',
      order: 1,
      billers: [
        { code: 'south-cairo', name: 'شركة جنوب القاهرة للتوزيع', format: '^\\d{10}$', hint: '10 أرقام' },
        { code: 'north-cairo', name: 'شركة شمال القاهرة للتوزيع', format: '^\\d{10}$', hint: '10 أرقام' },
        { code: 'alexandria', name: 'شركة الإسكندرية للتوزيع', format: '^\\d{10}$', hint: '10 أرقام' },
        { code: 'delta', name: 'شركة شمال الدلتا', format: '^\\d{10}$', hint: '10 أرقام' },
        { code: 'canal', name: 'شركة القناة للتوزيع', format: '^\\d{10}$', hint: '10 أرقام' }
      ]
    },
    {
      id: 'water',
      name: 'مياه',
      icon: '💧',
      order: 2,
      billers: [
        { code: 'cairo-water', name: 'شركة مياه القاهرة الكبرى', format: '^\\d{12}$', hint: '12 رقم' },
        { code: 'alex-water', name: 'شركة مياه الإسكندرية', format: '^\\d{12}$', hint: '12 رقم' },
        { code: 'giza-water', name: 'شركة مياه الجيزة', format: '^\\d{12}$', hint: '12 رقم' }
      ]
    },
    {
      id: 'gas',
      name: 'غاز',
      icon: '🔥',
      order: 3,
      billers: [
        { code: 'town-gas', name: 'تاون جاس', format: '^\\d{10}$', hint: '10 أرقام' },
        { code: 'petrotrade', name: 'بتروتريد', format: '^\\d{10}$', hint: '10 أرقام' }
      ]
    },
    {
      id: 'internet',
      name: 'إنترنت',
      icon: '🌐',
      order: 4,
      billers: [
        { code: 'we-internet', name: 'WE إنترنت', format: '^\\d{10}$', hint: '10 أرقام' },
        { code: 'vodafone-dsl', name: 'فودافون DSL', format: '^\\d{10}$', hint: '10 أرقام' },
        { code: 'orange-dsl', name: 'أورانج DSL', format: '^\\d{10}$', hint: '10 أرقام' },
        { code: 'etisalat-dsl', name: 'اتصالات DSL', format: '^\\d{10}$', hint: '10 أرقام' }
      ]
    },
    {
      id: 'phone',
      name: 'موبايل',
      icon: '📱',
      order: 5,
      billers: [
        { code: 'vodafone', name: 'فودافون', format: '^01[0-9]{9}$', hint: '01xxxxxxxxx' },
        { code: 'orange', name: 'أورانج', format: '^01[0-9]{9}$', hint: '01xxxxxxxxx' },
        { code: 'etisalat', name: 'اتصالات', format: '^01[0-9]{9}$', hint: '01xxxxxxxxx' },
        { code: 'we-mobile', name: 'WE', format: '^01[0-9]{9}$', hint: '01xxxxxxxxx' }
      ]
    },
    {
      id: 'landline',
      name: 'تليفون أرضي',
      icon: '📞',
      order: 6,
      billers: [
        { code: 'we-landline', name: 'المصرية للاتصالات', format: '^0[0-9]{9}$', hint: 'رقم التليفون' }
      ]
    },
    {
      id: 'insurance',
      name: 'تأمين',
      icon: '🛡️',
      order: 7,
      billers: [
        { code: 'misr-insurance', name: 'مصر للتأمين', format: '^\\d{10}$', hint: 'رقم البوليصة' },
        { code: 'ahlia-insurance', name: 'الأهلية للتأمين', format: '^\\d{10}$', hint: 'رقم البوليصة' }
      ]
    },
    {
      id: 'subscription',
      name: 'اشتراكات',
      icon: '📺',
      order: 8,
      billers: [
        { code: 'bein-sports', name: 'beIN Sports', format: '^\\d{10}$', hint: 'رقم المشترك' },
        { code: 'shahid-vip', name: 'شاهد VIP', format: '^\\d{10}$', hint: 'رقم المشترك' }
      ]
    },
    {
      id: 'education',
      name: 'تعليم',
      icon: '🎓',
      order: 9,
      billers: [
        { code: 'cairo-uni', name: 'جامعة القاهرة', format: '^\\d{8}$', hint: 'رقم الطالب' },
        { code: 'ain-shams', name: 'جامعة عين شمس', format: '^\\d{8}$', hint: 'رقم الطالب' },
        { code: 'alexandria-uni', name: 'جامعة الإسكندرية', format: '^\\d{8}$', hint: 'رقم الطالب' }
      ]
    }
  ];

  for (const cat of categories) {
    const category = await prisma.billCategory.upsert({
      where: { id: cat.id },
      update: { name: cat.name, icon: cat.icon, order: cat.order },
      create: { id: cat.id, name: cat.name, icon: cat.icon, order: cat.order }
    });

    for (const b of cat.billers) {
      await prisma.biller.upsert({
        where: { code: b.code },
        update: {
          name: b.name,
          accountFormat: b.format,
          accountHint: b.hint,
          categoryId: category.id
        },
        create: {
          code: b.code,
          name: b.name,
          accountFormat: b.format,
          accountHint: b.hint,
          categoryId: category.id
        }
      });
    }
  }

  console.log(`   ✅ Created ${categories.length} categories with billers\n`);

  // ============================================
  // 2. Demo Merchant
  // ============================================
  console.log('🏪 Creating demo merchant...');

  const hashedPassword = await bcrypt.hash('demo123', 10);

  const merchant = await prisma.merchant.upsert({
    where: { email: 'demo@healthpay.tech' },
    update: {},
    create: {
      id: 'merchant-demo-001',
      name: 'أحمد محمد',
      phone: '01012345678',
      email: 'demo@healthpay.tech',
      password: hashedPassword,
      businessName: 'صيدلية الشفاء',
      businessType: 'pharmacy',
      status: 'ACTIVE'
    }
  });

  console.log(`   ✅ Created merchant: ${merchant.businessName}\n`);

  // ============================================
  // 3. Demo User
  // ============================================
  console.log('👤 Creating demo user...');

  const hashedPin = await bcrypt.hash('1234', 10);

  const user = await prisma.user.upsert({
    where: { phoneNumber: '01098765432' },
    update: {},
    create: {
      id: 'user-demo-001',
      phoneNumber: '01098765432',
      name: 'محمد علي',
      email: 'user@healthpay.tech',
      pin: hashedPin,
      role: 'USER'
    }
  });

  // Create wallet for user
  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      id: 'wallet-demo-001',
      userId: user.id,
      balance: 5000.00,
      pendingBalance: 0,
      currency: 'EGP'
    }
  });

  console.log(`   ✅ Created user: ${user.name} with wallet\n`);

  // ============================================
  // 4. Demo Customers for Merchant
  // ============================================
  console.log('👥 Creating demo customers...');

  const customerData = [
    { name: 'محمد أحمد علي', phone: '01012345678', totalSpent: 12500, count: 45, tags: ['VIP', 'متكرر'] },
    { name: 'سارة محمود', phone: '01123456789', totalSpent: 8900, count: 32, tags: ['متكرر'] },
    { name: 'أحمد حسن', phone: '01234567890', totalSpent: 7200, count: 28, tags: ['متكرر'] },
    { name: 'فاطمة إبراهيم', phone: '01098765432', totalSpent: 5800, count: 21, tags: [] },
    { name: 'علي محمد', phone: '01111111111', totalSpent: 4500, count: 18, tags: [] },
    { name: 'نور الدين', phone: '01222222222', totalSpent: 3200, count: 12, tags: ['جديد'] },
    { name: 'مريم سعيد', phone: '01555555555', totalSpent: 1500, count: 5, tags: ['جديد'] },
    { name: 'يوسف عبدالله', phone: '01066666666', totalSpent: 850, count: 3, tags: ['غير نشط'] }
  ];

  for (const c of customerData) {
    const firstTx = new Date();
    firstTx.setDate(firstTx.getDate() - Math.floor(Math.random() * 180));
    
    const lastTx = new Date();
    lastTx.setDate(lastTx.getDate() - Math.floor(Math.random() * 30));

    await prisma.merchantCustomer.upsert({
      where: {
        merchantId_phone: {
          merchantId: merchant.id,
          phone: c.phone
        }
      },
      update: {},
      create: {
        merchantId: merchant.id,
        name: c.name,
        phone: c.phone,
        totalSpent: c.totalSpent,
        transactionCount: c.count,
        avgTransaction: c.totalSpent / c.count,
        tags: c.tags,
        firstTransaction: firstTx,
        lastTransaction: lastTx
      }
    });
  }

  console.log(`   ✅ Created ${customerData.length} demo customers\n`);

  // ============================================
  // 5. Demo Transactions
  // ============================================
  console.log('💰 Creating demo transactions...');

  const types = ['PAYMENT_REQUEST', 'QR', 'API'];
  const statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING', 'REFUNDED'];

  const customers = await prisma.merchantCustomer.findMany({
    where: { merchantId: merchant.id }
  });

  for (let i = 0; i < 50; i++) {
    const amount = Math.floor(Math.random() * 2000) + 100;
    const fee = Math.round(amount * 0.025 * 100) / 100;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

    await prisma.transaction.create({
      data: {
        type: type as any,
        amount,
        fee,
        net: amount - fee,
        currency: 'EGP',
        status: status as any,
        description: 'دفع مقابل خدمات',
        reference: `TXN-${Date.now()}-${i}`,
        merchantId: merchant.id,
        customerId: customer.id,
        createdAt
      }
    });
  }

  console.log(`   ✅ Created 50 demo transactions\n`);

  // ============================================
  // 6. Demo Payment Requests
  // ============================================
  console.log('📱 Creating demo payment requests...');

  const prStatuses = ['PENDING', 'PAID', 'PAID', 'EXPIRED', 'CANCELLED'];

  for (let i = 0; i < 10; i++) {
    const amount = Math.floor(Math.random() * 1000) + 100;
    const status = prStatuses[Math.floor(Math.random() * prStatuses.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 14));
    
    let expiresAt = new Date(createdAt);
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    let paidAt = null;
    if (status === 'PAID') {
      paidAt = new Date(createdAt);
      paidAt.setHours(paidAt.getHours() + Math.floor(Math.random() * 12));
    }

    await prisma.paymentRequest.create({
      data: {
        merchantId: merchant.id,
        amount,
        description: 'طلب دفع',
        status: status as any,
        customerPhone: customer.phone,
        reference: `REF-${Date.now()}-${i}`,
        expiresAt,
        paidAt,
        createdAt
      }
    });
  }

  console.log(`   ✅ Created 10 demo payment requests\n`);

  console.log('✨ Database seed completed successfully!\n');
  console.log('Demo Credentials:');
  console.log('─────────────────────────────────────');
  console.log('Merchant Login:');
  console.log('  Email: demo@healthpay.tech');
  console.log('  Password: demo123');
  console.log('');
  console.log('User Login:');
  console.log('  Phone: 01098765432');
  console.log('  PIN: 1234');
  console.log('─────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
