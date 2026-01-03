const admin = require('firebase-admin');

// Firebase Admin SDK初期化（Application Default Credentials使用）
admin.initializeApp({
  projectId: 'hyggely-reservation'
});

const db = admin.firestore();

const ADMIN_UID = 'TpErKajKM2O0Avporgrt28QwpMw2';

async function seedData() {
  console.log('初期データ投入を開始...');

  // 1. 管理者登録
  console.log('1. 管理者を登録中...');
  await db.collection('admins').doc(ADMIN_UID).set({
    email: 'admin@hyggely.com',
    name: '管理者',
    role: 'owner'
  });
  console.log('   ✓ 管理者を登録しました');

  // 2. 店舗設定
  console.log('2. 店舗設定を登録中...');
  await db.collection('settings').doc('store').set({
    name: 'Hyggely',
    address: '愛知県みよし市三好丘緑2-10-4',
    phone: '0561-XX-XXXX',
    email: 'hyggely2021@gmail.com',
    defaultTimeSlots: [
      '10:00-11:00',
      '11:00-12:00',
      '12:00-13:00',
      '13:00-14:00',
      '14:00-15:00',
      '15:00-16:00',
      '16:00-17:00'
    ],
    regularBusinessDays: [3, 6], // 水曜=3, 土曜=6
    emailTemplates: {
      reservationConfirmation: '',
      reservationCancellation: '',
      reminderEmail: ''
    }
  });
  console.log('   ✓ 店舗設定を登録しました');

  // 3. サンプル商品
  console.log('3. サンプル商品を登録中...');
  const products = [
    {
      name: 'カンパーニュ プレーン',
      description: 'シンプルで飽きのこない定番のカンパーニュ。外はパリッと、中はもっちりとした食感が特徴です。',
      price: 800,
      stock: 10,
      imageUrl: '',
      category: 'カンパーニュ',
      isAvailable: true,
      sortOrder: 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'カンパーニュ くるみ',
      description: '香ばしいくるみをたっぷり練り込んだカンパーニュ。くるみの風味と食感がアクセント。',
      price: 900,
      stock: 8,
      imageUrl: '',
      category: 'カンパーニュ',
      isAvailable: true,
      sortOrder: 2,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'カンパーニュ レーズン',
      description: '甘みのあるレーズンを贅沢に使用。朝食やおやつにぴったりです。',
      price: 900,
      stock: 8,
      imageUrl: '',
      category: 'カンパーニュ',
      isAvailable: true,
      sortOrder: 3,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'カンパーニュ チョコ＆オレンジ',
      description: 'ビターチョコとオレンジピールの絶妙な組み合わせ。特別な日のギフトにも。',
      price: 1000,
      stock: 5,
      imageUrl: '',
      category: 'カンパーニュ',
      isAvailable: true,
      sortOrder: 4,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const product of products) {
    await db.collection('products').add(product);
    console.log(`   ✓ ${product.name} を登録しました`);
  }

  // 4. 営業日設定（今月と来月）
  console.log('4. 営業日設定を登録中...');
  const now = new Date();
  const months = [
    { year: now.getFullYear(), month: now.getMonth() + 1 },
    { year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), month: now.getMonth() === 11 ? 1 : now.getMonth() + 2 }
  ];

  for (const { year, month } of months) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const businessDays = {};

    // その月の日数を取得
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();

      // 水曜(3)と土曜(6)を営業日として設定
      if (dayOfWeek === 3 || dayOfWeek === 6) {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        businessDays[dateKey] = {
          isOpen: true,
          timeSlots: [
            '10:00-11:00',
            '11:00-12:00',
            '12:00-13:00',
            '13:00-14:00',
            '14:00-15:00',
            '15:00-16:00',
            '16:00-17:00'
          ],
          note: ''
        };
      }
    }

    await db.collection('businessDays').doc(monthKey).set(businessDays);
    console.log(`   ✓ ${monthKey} の営業日を登録しました`);
  }

  console.log('\n初期データ投入が完了しました！');
}

seedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });
