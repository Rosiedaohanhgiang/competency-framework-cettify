/**
 * HÀM KIỂM TRA QUYỀN TRUY CẬP
 * * Nhiệm vụ:
 * 1. Xác thực token của người dùng được gửi từ frontend.
 * 2. Lấy email của người dùng từ token.
 * 3. Kiểm tra xem email này có tồn tại trong "danh sách trắng" (collection 'authorizedUsers') trên Firestore hay không.
 * 4. Trả về kết quả cho phép hoặc từ chối truy cập.
 * * Yêu cầu cài đặt:
 * - Chạy lệnh `npm install firebase-admin` trong thư mục dự án của bạn.
 * - Thiết lập biến môi trường `FIREBASE_SERVICE_ACCOUNT_BASE64` trên Vercel.
 */

// Import Firebase Admin SDK, là công cụ để backend giao tiếp an toàn với Firebase
const admin = require('firebase-admin');

// Lấy thông tin service account từ biến môi trường đã được mã hóa Base64
// Đây là cách an toàn để lưu trữ "chìa khóa bí mật" của Firebase
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));

// Khởi tạo Firebase Admin SDK. Chỉ khởi tạo một lần duy nhất.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Lấy đối tượng để tương tác với cơ sở dữ liệu Firestore
const db = admin.firestore();

// Hàm chính của Vercel Serverless Function, sẽ được Vercel tự động gọi khi có request
export default async function handler(req, res) {
  // Chỉ chấp nhận các request gửi lên bằng phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).send({ message: 'Only GET requests allowed' });
  }

  try {
    const { authorization } = req.headers;

    // Kiểm tra xem frontend có gửi token lên không
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).send({ authorized: false, message: 'Missing or invalid authorization token.' });
    }

    // Tách lấy token từ header 'Authorization: Bearer <token>'
    const token = authorization.split('Bearer ')[1];
    
    // Dùng Firebase Admin để xác thực token. Nếu token hợp lệ, ta sẽ lấy được thông tin người dùng.
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userEmail = decodedToken.email;

    // Truy vấn vào collection 'authorizedUsers' trên Firestore
    const usersRef = db.collection('authorizedUsers');
    const snapshot = await usersRef.where('email', '==', userEmail).limit(1).get();

    // Nếu không tìm thấy document nào có email trùng khớp...
    if (snapshot.empty) {
      // ...thì từ chối truy cập.
      console.log(`Authorization denied for email: ${userEmail}`);
      return res.status(403).send({ authorized: false });
    }
    
    // Nếu tìm thấy, cho phép truy cập.
    console.log(`Authorization granted for email: ${userEmail}`);
    return res.status(200).send({ authorized: true });

  } catch (error) {
    // Xử lý các lỗi có thể xảy ra (token hết hạn, cấu hình sai...)
    console.error('Error verifying token or checking Firestore:', error);
    return res.status(500).send({ authorized: false, message: 'Internal Server Error' });
  }
}
