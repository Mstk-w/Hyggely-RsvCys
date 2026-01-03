import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { google } from "googleapis";
import { format } from "date-fns";

// Firebase Admin初期化
admin.initializeApp();

// リージョン設定（東京）
setGlobalOptions({ region: "asia-northeast1" });

// Firestore参照
const db = admin.firestore();

// 型定義
interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface ReservationData {
  reservationNumber: string;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
  pickupDate: admin.firestore.Timestamp;
  pickupTimeSlot: string;
  status: string;
  notes: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
}

interface StoreSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  emailTemplates: {
    reservationConfirmation: string;
  };
}

/**
 * Gmail APIを使用してメール送信
 */
async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  // 環境変数からOAuth2認証情報を取得
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn("Gmail credentials not configured. Skipping email send.");
    return;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // メール本文をBase64エンコード
  const emailContent = [
    `To: ${to}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: =?utf-8?B?${Buffer.from(subject).toString("base64")}?=`,
    "",
    body,
  ].join("\n");

  const encodedMessage = Buffer.from(emailContent)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });
}

/**
 * 予約確認メールの本文を生成
 */
function generateReservationEmail(
  reservation: ReservationData,
  customer: CustomerData,
  storeSettings: StoreSettings
): string {
  const pickupDate = reservation.pickupDate.toDate();
  const formattedDate = `${pickupDate.getFullYear()}年${pickupDate.getMonth() + 1}月${pickupDate.getDate()}日`;

  const itemsList = reservation.items
    .map((item) => `  - ${item.name} × ${item.quantity}個 (¥${item.price.toLocaleString()})`)
    .join("\n");

  return `
${customer.name} 様

この度は ${storeSettings.name} をご利用いただき、誠にありがとうございます。
以下の内容でご予約を承りました。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
予約番号: ${reservation.reservationNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【ご予約内容】
${itemsList}

【合計金額】
¥${reservation.totalAmount.toLocaleString()}

【受取日時】
${formattedDate} ${reservation.pickupTimeSlot}

【受取場所】
${storeSettings.name}
${storeSettings.address}
TEL: ${storeSettings.phone}

${reservation.notes ? `【備考】\n${reservation.notes}\n` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ご来店を心よりお待ちしております。

※このメールは自動送信です。
※ご不明な点がございましたら、お電話にてお問い合わせください。

--
${storeSettings.name}
${storeSettings.address}
TEL: ${storeSettings.phone}
Email: ${storeSettings.email}
`.trim();
}

/**
 * メール送信結果をFirestoreに記録
 */
async function updateEmailStatus(
  reservationId: string,
  status: "sent" | "failed",
  errorMessage?: string
): Promise<void> {
  try {
    await db.collection("reservations").doc(reservationId).update({
      emailStatus: status,
      emailSentAt: status === "sent" ? admin.firestore.FieldValue.serverTimestamp() : null,
      emailError: errorMessage || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to update email status:", err);
  }
}

/**
 * 予約作成時にトリガーされるFunction
 * - 顧客へ予約確認メール送信
 * - 管理者へ通知メール送信
 *
 * 注意: メール送信失敗でも予約自体は成功とする
 */
export const onReservationCreated = onDocumentCreated(
  "reservations/{reservationId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const reservationId = event.params.reservationId;
    const reservation = snapshot.data() as ReservationData;
    console.log(`New reservation created: ${reservation.reservationNumber}`);

    let customerEmailSent = false;
    let adminEmailSent = false;

    try {
      // 顧客情報を取得
      const customerDoc = await db
        .collection("customers")
        .doc(reservation.customerId)
        .get();

      if (!customerDoc.exists) {
        console.error(`Customer not found: ${reservation.customerId}`);
        await updateEmailStatus(reservationId, "failed", "顧客情報が見つかりません");
        return;
      }

      const customer = customerDoc.data() as CustomerData;

      // 店舗設定を取得
      const settingsDoc = await db.collection("settings").doc("store").get();
      const storeSettings = settingsDoc.exists
        ? (settingsDoc.data() as StoreSettings)
        : {
            name: "Hyggely",
            email: "info@hyggely.com",
            phone: "0561-XX-XXXX",
            address: "愛知県みよし市三好丘緑2-10-4",
            emailTemplates: {
              reservationConfirmation: "",
            },
          };

      // 予約確認メール送信（顧客宛）- エラーでも処理を継続
      try {
        const emailBody = generateReservationEmail(
          reservation,
          customer,
          storeSettings
        );

        await sendEmail(
          customer.email,
          `【${storeSettings.name}】ご予約確認 (${reservation.reservationNumber})`,
          emailBody
        );

        customerEmailSent = true;
        console.log(`Confirmation email sent to: ${customer.email}`);
      } catch (emailError) {
        console.error("Failed to send customer email:", emailError);
        // 顧客メール失敗でも処理は継続
      }

      // 管理者への通知メール - エラーでも処理を継続
      if (storeSettings.email) {
        try {
          const adminNotification = `
新規予約が入りました。

予約番号: ${reservation.reservationNumber}
お客様名: ${customer.name}
連絡先: ${customer.phone}
メール: ${customer.email}
受取日時: ${reservation.pickupDate.toDate().toLocaleDateString("ja-JP")} ${reservation.pickupTimeSlot}
合計金額: ¥${reservation.totalAmount.toLocaleString()}

商品:
${reservation.items.map((item) => `  - ${item.name} × ${item.quantity}個`).join("\n")}

${reservation.notes ? `備考: ${reservation.notes}` : ""}
`.trim();

          await sendEmail(
            storeSettings.email,
            `【新規予約】${customer.name}様 - ${reservation.reservationNumber}`,
            adminNotification
          );

          adminEmailSent = true;
          console.log(`Admin notification sent to: ${storeSettings.email}`);
        } catch (emailError) {
          console.error("Failed to send admin email:", emailError);
          // 管理者メール失敗でも処理は継続
        }
      }

      // メール送信結果を記録
      if (customerEmailSent) {
        await updateEmailStatus(reservationId, "sent");
      } else {
        await updateEmailStatus(reservationId, "failed", "顧客へのメール送信に失敗しました");
      }

      console.log(`Email processing completed. Customer: ${customerEmailSent}, Admin: ${adminEmailSent}`);
    } catch (error) {
      console.error("Error processing reservation email:", error);
      await updateEmailStatus(
        reservationId,
        "failed",
        error instanceof Error ? error.message : "不明なエラー"
      );
      // メール送信失敗でもthrowしない（予約は成功しているため）
    }
  }
);

/**
 * ヘルスチェック用エンドポイント
 */
export const healthCheck = onRequest((_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

/**
 * 予約番号を生成（一意性を保証）
 */
function generateReservationNumber(): string {
  const date = format(new Date(), "yyyyMMdd");
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `HYG-${date}-${timestamp.slice(-3)}${random}`;
}

/**
 * 予約作成用のCallable Function
 * トランザクションで在庫確認・減少・予約作成を一括処理
 */
interface CreateReservationRequest {
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  pickupDate: string; // ISO date string
  pickupTimeSlot: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
  };
}

interface CreateReservationResponse {
  success: boolean;
  reservationNumber?: string;
  error?: string;
}

export const createReservation = onCall<CreateReservationRequest>(
  async (request): Promise<CreateReservationResponse> => {
    const { items, pickupDate, pickupTimeSlot, customerInfo } = request.data;

    // 入力バリデーション
    if (!items || items.length === 0) {
      throw new HttpsError("invalid-argument", "商品が選択されていません");
    }
    if (!pickupDate || !pickupTimeSlot) {
      throw new HttpsError("invalid-argument", "受取日時が指定されていません");
    }
    if (!customerInfo?.name || !customerInfo?.email || !customerInfo?.phone) {
      throw new HttpsError("invalid-argument", "お客様情報が不完全です");
    }

    try {
      const result = await db.runTransaction(async (transaction) => {
        // 1. 在庫確認（全商品を先に読み取り）
        const stockChecks: Array<{
          ref: admin.firestore.DocumentReference;
          currentStock: number;
          item: typeof items[0];
        }> = [];

        for (const item of items) {
          const productRef = db.collection("products").doc(item.productId);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists) {
            throw new HttpsError(
              "not-found",
              `商品「${item.name}」が見つかりません`
            );
          }

          const productData = productDoc.data();
          const currentStock = productData?.stock ?? 0;

          if (currentStock < item.quantity) {
            throw new HttpsError(
              "failed-precondition",
              `商品「${item.name}」の在庫が不足しています（残り${currentStock}個）`
            );
          }

          stockChecks.push({ ref: productRef, currentStock, item });
        }

        // 2. 予約番号を生成
        const reservationNumber = generateReservationNumber();

        // 3. 顧客IDを生成
        const customerId = customerInfo.email.replace(/[.#$[\]]/g, "_");
        const customerRef = db.collection("customers").doc(customerId);

        // 4. 顧客情報を取得（存在する場合）
        const customerDoc = await transaction.get(customerRef);
        const existingCustomer = customerDoc.exists ? customerDoc.data() : null;

        // 5. 合計金額を計算
        const totalAmount = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // 6. 在庫を減らす
        for (const { ref, currentStock, item } of stockChecks) {
          transaction.update(ref, {
            stock: currentStock - item.quantity,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        // 7. 顧客情報を作成/更新
        const reservationCount = (existingCustomer?.reservationCount ?? 0) + 1;
        const totalSpent = (existingCustomer?.totalSpent ?? 0) + totalAmount;

        transaction.set(
          customerRef,
          {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
            reservationCount,
            totalSpent,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            ...(existingCustomer ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
          },
          { merge: true }
        );

        // 8. 予約を作成
        const reservationRef = db.collection("reservations").doc();
        const pickupDateObj = new Date(pickupDate);

        transaction.set(reservationRef, {
          reservationNumber,
          customerId,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            imageUrl: item.imageUrl || "",
          })),
          totalAmount,
          pickupDate: admin.firestore.Timestamp.fromDate(pickupDateObj),
          pickupTimeSlot,
          status: "pending",
          notes: customerInfo.notes || "",
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return { reservationNumber };
      });

      console.log(`Reservation created: ${result.reservationNumber}`);

      return {
        success: true,
        reservationNumber: result.reservationNumber,
      };
    } catch (error) {
      console.error("Error creating reservation:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        "予約の作成に失敗しました。もう一度お試しください。"
      );
    }
  }
);
