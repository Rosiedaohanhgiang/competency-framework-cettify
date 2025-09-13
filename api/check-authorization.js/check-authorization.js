// Dòng này yêu cầu Vercel chỉ triển khai hàm này ở một khu vực cụ thể (optional but good practice)
export const config = {
  runtime: 'nodejs',
  regions: ['sfo1'], // San Francisco West, bạn có thể chọn khu vực gần người dùng
};

// Import Firebase Admin SDK để tương tác với dịch vụ Firebase từ backend
import admin from 'firebase-admin';

// Hàm helper để khởi tạo Firebase Admin một cách an toàn
function initializeFirebaseAdmin() {
  // Kiểm tra xem app đã được khởi tạo chưa để tránh lỗi khởi tạo lại
  if (!admin.apps.length) {
    // Lấy thông tin xác thực từ biến môi trường trên Vercel
    // Đây là cách an toàn nhất để lưu trữ "chìa khóa bí mật"
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

// Khởi tạo Firebase Admin
initializeFirebaseAdmin();
const db = admin.firestore();
const auth = admin.auth();

// Hàm chính của Vercel Serverless Function
export default async function handler(req, res) {
  // Chỉ chấp nhận yêu cầu bằng phương thức GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { authorization } = req.headers;

    // Kiểm tra xem header Authorization có tồn tại và đúng định dạng không
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ authorized: false, error: 'Missing or invalid authorization token.' });
    }

    // Tách lấy token
    const token = authorization.split('Bearer ')[1];
    
    // Xác thực token bằng Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    const userEmail = decodedToken.email;

    // Truy vấn vào collection 'authorizedUsers' trong Firestore
    const usersRef = db.collection('authorizedUsers');
    const snapshot = await usersRef.where('email', '==', userEmail).limit(1).get();

    // Nếu không tìm thấy email nào trong collection
    if (snapshot.empty) {
      console.log(`Authorization failed for email: ${userEmail}`);
      return res.status(403).json({ authorized: false });
    }
    
    // Nếu tìm thấy, cấp quyền truy cập
    console.log(`Authorization successful for email: ${userEmail}`);
    return res.status(200).json({ authorized: true });

  } catch (error) {
    console.error('Authorization check error:', error);
    // Trả về lỗi nếu token không hợp lệ hoặc có lỗi server
    return res.status(401).json({ authorized: false, error: 'Invalid token or server error.' });
  }
}

