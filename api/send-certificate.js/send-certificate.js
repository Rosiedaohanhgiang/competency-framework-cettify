/**
 * HÀM GỬI EMAIL CHỨNG CHỈ
 * * Nhiệm vụ:
 * 1. Nhận thông tin tên và email của học viên từ frontend khi họ hoàn thành khóa học.
 * 2. Sử dụng SendGrid để soạn và gửi một email chúc mừng (chứng chỉ).
 * * Yêu cầu cài đặt:
 * - Chạy lệnh `npm install @sendgrid/mail` trong thư mục dự án của bạn.
 * - Thiết lập biến môi trường `SENDGRID_API_KEY` trên Vercel.
 * - Xác thực địa chỉ email người gửi trên SendGrid/Twilio Console.
 */

// Import thư viện của SendGrid
const sgMail = require('@sendgrid/mail');

// Lấy API Key của SendGrid từ biến môi trường và thiết lập cho thư viện
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Hàm chính của Vercel Serverless Function
export default async function handler(req, res) {
  // Chỉ chấp nhận các request gửi lên bằng phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  try {
    // Lấy thông tin tên và email từ body của request mà frontend gửi lên
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Missing name or email.' });
    }

    // Tạo nội dung email
    const msg = {
      to: email, // Người nhận
      from: 'your-verified-email@example.com', // << QUAN TRỌNG: THAY BẰNG EMAIL BẠN ĐÃ XÁC THỰC TRÊN SENDGRID
      subject: `Chúc mừng ${name} đã hoàn thành Khóa học Thiết kế Khung Năng lực!`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1 style="color: #4F46E5;">Chúc mừng bạn, ${name}!</h1>
          <p>Bạn đã hoàn thành xuất sắc khóa học <strong>"Chuyên gia thiết kế Khung năng lực"</strong>.</p>
          <p>Đây là minh chứng cho nỗ lực và kiến thức chuyên sâu bạn đã đạt được trong việc xây dựng và phát triển nhân tài.</p>
          <p>Chúng tôi tin rằng bạn đã sẵn sàng để tạo ra những tác động tích cực cho tổ chức của mình.</p>
          <p>Trân trọng,<br/>Đội ngũ Build Talents</p>
        </div>
      `,
    };

    // Gửi email bằng SendGrid
    await sgMail.send(msg);

    console.log(`Certificate email sent to: ${email}`);
    return res.status(200).json({ success: true, message: 'Certificate email sent successfully.' });

  } catch (error) {
    // Xử lý các lỗi có thể xảy ra (API key sai, email không hợp lệ...)
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body)
    }
    return res.status(500).json({ success: false, message: 'An error occurred while sending the email.' });
  }
}
