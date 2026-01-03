const admin = require('firebase-admin');
const serviceAccount = require('./hyggely-reservation-firebase-adminsdk-fbsvc-64a1370fa1.json');

// Firebase Admin SDK初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const products = [
  { id: 'PRD001', name: 'プレミアムカンパーニュ', price: 1200 },
  { id: 'PRD002', name: 'プレミアムカンパーニュ 1/2', price: 650 },
  { id: 'PRD003', name: 'レーズン&クルミ', price: 1400 },
  { id: 'PRD004', name: 'レーズン&クルミ 1/2', price: 750 },
  { id: 'PRD005', name: 'いちじく&クルミ', price: 450 },
  { id: 'PRD006', name: '4種のMIXナッツ', price: 450 },
  { id: 'PRD007', name: 'MIXドライフルーツ', price: 450 },
  { id: 'PRD008', name: 'アールグレイ', price: 400 },
  { id: 'PRD009', name: 'チョコレート', price: 500 },
  { id: 'PRD010', name: 'チーズ', price: 500 },
  { id: 'PRD011', name: 'ひまわりの種', price: 450 },
  { id: 'PRD012', name: 'デーツ', price: 450 },
  { id: 'PRD013', name: 'カレーパン', price: 500 },
  { id: 'PRD014', name: 'バターロール', price: 270 },
  { id: 'PRD015', name: 'ショコラロール', price: 320 },
  { id: 'PRD016', name: '自家製クリームパン', price: 400 },
  { id: 'PRD017', name: '自家製あんバター', price: 430 },
  { id: 'PRD018', name: '抹茶&ホワイトチョコ', price: 450 },
  { id: 'PRD019', name: '黒ごまパン', price: 220 },
  { id: 'PRD020', name: 'レーズンジャムとクリームチーズのパン', price: 400 },
  { id: 'PRD021', name: 'ピーナッツクリームパン', price: 400 },
  { id: 'PRD022', name: 'あん食パン', price: 450 },
  { id: 'PRD023', name: 'コーンパン', price: 450 },
  { id: 'PRD024', name: 'レモンとクリームチーズのミニ食パン', price: 500 },
  { id: 'PRD025', name: 'ピザ マルゲリータ', price: 1200 },
  { id: 'PRD026', name: 'ピタパンサンド', price: 900 },
  { id: 'PRD027', name: 'フォカッチャ', price: 340 },
  { id: 'PRD028', name: 'かぼちゃパン', price: 450 },
];

async function seedProducts() {
  console.log('商品データ投入を開始...\n');

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    await db.collection('products').doc(product.id).set({
      name: product.name,
      description: '',
      price: product.price,
      stock: 10,
      imageUrl: '',
      category: 'パン',
      isAvailable: true,
      sortOrder: i + 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✓ ${product.id}: ${product.name} (¥${product.price.toLocaleString()})`);
  }

  console.log(`\n全${products.length}商品の登録が完了しました！`);
}

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('エラー:', error);
    process.exit(1);
  });
