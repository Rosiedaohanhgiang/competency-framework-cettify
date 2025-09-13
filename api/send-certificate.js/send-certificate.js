// Dòng này yêu cầu Vercel chỉ triển khai hàm này ở một khu vực cụ thể
export const config = {
  runtime: 'nodejs',
  regions: ['sfo1'],
};

// Import thư viện SendGrid Mail
import sgMail from '@sendgrid/mail';

// Lấy API Key của SendGrid từ biến môi trường trên Vercel
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Hàm chính của Vercel Serverless Function
export default async function handler(req, res) {
  // Chỉ chấp nhận yêu cầu bằng phương thức POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Lấy thông tin tên và email từ nội dung request gửi từ frontend
    const { name, email } = req.body;

    // Kiểm tra xem có đủ thông tin cần thiết không
    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Missing name or email in request body.' });
    }

    // Cấu trúc nội dung email
    const msg = {
      to: email,
      from: {
        email: 'your-verified-email@example.com', // << THAY BẰNG EMAIL BẠN ĐÃ XÁC THỰC TRÊN SENDGRID
        name: 'Build Talents Academy' // Tên người gửi hiển thị trong email
      },
      subject: `Chúc mừng ${name} đã hoàn thành Khóa học Thiết kế Khung Năng lực!`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Chúc mừng bạn, ${name}!</h2>
          <p>Bạn đã hoàn thành xuất sắc khóa học "Chuyên gia thiết kế Khung năng lực".</p>
          <p>Đây là minh chứng cho nỗ lực và kiến thức chuyên sâu bạn đã đạt được.</p>
          <p>Chúng tôi rất mong chờ được thấy những thành công của bạn trong tương lai.</p>
          <p>Trân trọng,<br/><b>Đội ngũ Build Talents</b></p>
        </div>
      `,
    };

    // Gửi email bằng SendGrid
    await sgMail.send(msg);

    console.log(`Certificate sent to ${email}`);
    return res.status(200).json({ success: true, message: 'Certificate email sent successfully.' });

  } catch (error) {
    console.error('Error sending certificate email:', error);
    // Ghi lại lỗi chi tiết từ SendGrid (nếu có) để dễ dàng debug
    if (error.response) {
      console.error(error.response.body);
    }
    return res.status(500).json({ success: false, error: 'An error occurred while sending the email.' });
  }
}

