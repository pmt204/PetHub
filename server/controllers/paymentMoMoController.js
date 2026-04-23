const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');

exports.createMoMoPayment = async (paymentData) => {

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const redirectUrl = process.env.MOMO_RETURN_URL; 
  const ipnUrl = process.env.MOMO_IPN_URL || process.env.MOMO_NOTIFY_URL; 
  const apiEndpoint = process.env.MOMO_API_ENDPOINT;

  if (!partnerCode || !accessKey || !secretKey || !redirectUrl || !ipnUrl || !apiEndpoint) {
    throw new Error('Thiếu cấu hình MoMo (.env): cần MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_RETURN_URL, MOMO_IPN_URL/MOMO_NOTIFY_URL, MOMO_API_ENDPOINT');
  }

  const { amount, bookingId } = paymentData;
  
  const orderInfo = `Thanh toan dat lich ${bookingId}`;
  const requestId = uuidv4(); 
  const orderId = `${bookingId}:${requestId}`; 
    const requestType = "payWithATM";
  const extraData = ""; 

  const rawSignature = 
        `accessKey=${accessKey}` +
        `&amount=${amount}` +
        `&extraData=${extraData}` +
    `&ipnUrl=${ipnUrl}` +
    `&orderId=${orderId}` +
    `&orderInfo=${orderInfo}` +
        `&partnerCode=${partnerCode}` +
    `&redirectUrl=${redirectUrl}` +
    `&requestId=${requestId}` +
    `&requestType=${requestType}`; 

  const hmac = crypto.createHmac('sha256', secretKey); 
  const signature = hmac.update(rawSignature).digest('hex');

  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount: amount.toString(),
    orderId,
    orderInfo,
    redirectUrl, 
    ipnUrl, 
    extraData,
    requestType,
    signature,
    lang: 'vi'
  };

  try {
    const response = await axios.post(apiEndpoint, requestBody);
    
        if (response.data.resultCode !== 0) {
            console.error("MoMo trả về lỗi:", response.data.message);
            throw new Error(response.data.message);
        }
    
    return response.data.payUrl; 
    
  } catch (error) {
    console.error("Lỗi khi gọi API MoMo:", error.response ? error.response.data : error.message);
    throw new Error(error.response?.data?.message || "Không thể tạo thanh toán MoMo.");
  }
};

exports.createMoMoPaymentLink = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;
    if (!bookingId || !amount) {
      return res.status(400).json({ message: 'Thiếu bookingId hoặc amount' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking không tồn tại' });
    }

    const finalAmount = Number(amount) || Number(booking.totalAmount) || 0;
    if (!finalAmount) {
      return res.status(400).json({ message: 'Số tiền không hợp lệ' });
    }

    const payUrl = await exports.createMoMoPayment({ amount: finalAmount, bookingId });
    return res.status(200).json({ code: '00', message: 'OK', data: payUrl });
 s } catch (error) {
    console.error('Error in createMoMoPaymentLink:', error.message || error);
    return res.status(500).json({ message: 'Không thể tạo link thanh toán MoMo', error: error.message || error });
 }
};

exports.momoReturn = async (req, res) => {
  const secretKey = process.env.MOMO_SECRET_KEY; 
  const clientUrl = process.env.CLIENT_URL;
  const accessKey = process.env.MOMO_ACCESS_KEY;

  const queryParams = req.query;
  const signature = queryParams.signature;

  const rawSignature = 
        `accessKey=${accessKey}` +
        `&amount=${queryParams.amount}` +
        `&extraData=${queryParams.extraData}` +
    `&message=${queryParams.message}` +
    `&orderId=${queryParams.orderId}` +
    `&orderInfo=${queryParams.orderInfo}` +
    `&orderType=${queryParams.orderType}` +
        `&partnerCode=${queryParams.partnerCode}` +
    `&payType=${queryParams.payType}` +
    `&requestId=${queryParams.requestId}` +
    `&responseTime=${queryParams.responseTime}` +
        `&resultCode=${queryParams.resultCode}` + 
    `&transId=${queryParams.transId}`;

  const hmac = crypto.createHmac('sha256', secretKey); 
  const signed = hmac.update(rawSignature).digest('hex');

  const bookingId = queryParams.orderId.split(':')[0]; 
  let redirectUrl = `${clientUrl}/payment-result?orderId=${bookingId}`;

  if (signature === signed) {
    if (queryParams.resultCode == '0') {
      console.log(`(MoMo Return) Giao dịch ${bookingId} thành công.`);
      try {
        await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'success', paymentMethod: 'momo',paymentDetails: queryParams });
        redirectUrl += '&success=true&message=Payment successful';
      } catch (error) {
        console.error('Lỗi cập nhật CSDL (MoMo Return):', error);
        redirectUrl += '&success=false&message=Error updating database';
      }
    } else {
      console.log(`(MoMo Return) Giao dịch ${bookingId} thất bại.`);
      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'failed' });
      redirectUrl += `&success=false&message=${queryParams.message}`;
    }
  } else {
    console.log('Chữ ký MoMo không hợp lệ (Return).');
        console.log('Chữ ký nhận được:', signature);
        console.log('Chữ ký tính toán:', signed);
        console.log('Chuỗi gốc đã ký:', rawSignature);
    redirectUrl += '&success=false&message=Invalid signature';
  }
  
  res.redirect(redirectUrl);
};

exports.momoNotify = async (req, res) => {
  
  const secretKey = process.env.MOMO_SECRET_KEY; 
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const bodyParams = req.body;
  const signature = bodyParams.signature;

  const rawSignature = 
        `accessKey=${accessKey}` +
        `&amount=${bodyParams.amount}` +
        `&extraData=${bodyParams.extraData}` +
    `&message=${bodyParams.message}` +
    `&orderId=${bodyParams.orderId}` +
    `&orderInfo=${bodyParams.orderInfo}` +
    `&orderType=${bodyParams.orderType}` +
        `&partnerCode=${bodyParams.partnerCode}` +
    `&payType=${bodyParams.payType}` +
    `&requestId=${bodyParams.requestId}` +
    `&responseTime=${bodyParams.responseTime}` +
        `&resultCode=${bodyParams.resultCode}` + 
    `&transId=${bodyParams.transId}`;

  const hmac = crypto.createHmac('sha256', secretKey); 
  const signed = hmac.update(rawSignature).digest('hex');

  const bookingId = bodyParams.orderId.split(':')[0]; 

  if (signature === signed) {
    try {
      const booking = await Booking.findById(bookingId);
      if (booking && booking.paymentStatus === 'pending') {
        if (bodyParams.resultCode == '0') {
          await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'success', paymentMethod: 'momo' });
          console.log(`(MoMo IPN) Cập nhật ${bookingId} thành công.`);
        } else {
          await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'failed', paymentMethod: 'momo' });
          console.log(`(MoMo IPN) Cập nhật ${bookingId} thất bại.`);
        }
      }
      res.status(204).send();
    } catch (error) {
      console.error('Lỗi CSDL (MoMo IPN):', error);
      res.status(500).send(); 
    }
  } else {
    console.log('Chữ ký MoMo không hợp lệ (IPN).');
    res.status(400).send(); 
  }
};