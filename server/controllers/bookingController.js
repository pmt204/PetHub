const mongoose = require('mongoose');
const moment = require('moment');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Pet = require('../models/Pet');
const Customer = require('../models/Customer');
const Doctor = require('../models/Doctors');
const {createPaymentUrl} = require('./paymentVNPayController');
const {createMoMoPayment} = require('./paymentMoMoController');
const { calculateDistance } = require('../services/mapService');
const SHOP_ADDRESS = "57 Đường Số 31, Linh Đông, Thủ Đức, Thành phố Hồ Chí Minh";

const getTimeString = (date) => {
  const d = new Date(date);
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`; 
};

exports.createUnifiedBooking = async (req, res) => {
    const {
        serviceId,
        petId,
        doctorId,
        bookingDate,       
        checkIn,           
        checkOut,          
        subServiceIds = [],
        notes = '',

        needsTransport = false,
        transportType = null, 
        homeAddress = '',
        selectedTransportServiceId = null
    } = req.body;

    const customerId = req.user.customerId;

    if (!serviceId || !petId || !bookingDate) {
        return res.status(400).json({
            message: 'Thiếu thông tin bắt buộc: dịch vụ, thú cưng, ngày đặt'
        });
    }

    try {
        const mainService = await Service.findById(serviceId);
        if (!mainService) {
            return res.status(404).json({ message: 'Dịch vụ không tồn tại' });
        }

        const pet = await Pet.findById(petId);
        if (!pet || pet.customerId.toString() !== customerId.toString()) {
            return res.status(403).json({ message: 'Thú cưng không thuộc về bạn' });
        }

        const finalBookingDate = new Date(bookingDate);
        if (isNaN(finalBookingDate.getTime())) {
            return res.status(400).json({ message: 'Ngày đặt không hợp lệ' });
        }

        let totalAmount = mainService.price;

        if (mainService.category === 3) {
            if (!checkIn || !checkOut) {
                return res.status(400).json({ message: 'Khách sạn cần ngày nhận và trả phòng' });
            }
            const days = moment(checkOut).diff(moment(checkIn), 'days') || 1;
            totalAmount *= days;
        }

        if (subServiceIds.length > 0) {
            const subs = await Service.find({ _id: { $in: subServiceIds } });
            totalAmount += subs.reduce((sum, s) => sum + s.price, 0);
        }

        let shipmentDetails = null;
        if (needsTransport && homeAddress && selectedTransportServiceId) {
            const transportService = await Service.findById(selectedTransportServiceId);
            if (!transportService || String(transportService.category) !== '4') {
                return res.status(400).json({ message: 'Dịch vụ vận chuyển không hợp lệ' });
            }

            let origin = homeAddress.trim();
            let destination = SHOP_ADDRESS;

            if (transportType === 'return' || transportType === 'both') {
                origin = SHOP_ADDRESS;
                destination = homeAddress.trim();
            }

            const distanceData = await calculateDistance(origin, destination);
            const distanceKm = Math.round((distanceData.distanceValue / 1000) * 10) / 10;
            const trips = transportType === 'both' ? 2 : 1;
            const transportFee = transportService.price * distanceKm * trips;

            totalAmount += transportFee;

            shipmentDetails = {
                pickupAddress: transportType.includes('pickup') ? homeAddress.trim() : SHOP_ADDRESS,
                dropoffAddress: transportType.includes('return') ? homeAddress.trim() : SHOP_ADDRESS,
                distance: distanceKm * trips,
                duration: distanceData.durationText,
                price: transportFee, 
                shipmentType: transportService.name.toLowerCase().includes('express') ? 'express' : 'standard'
            };
        }

        const bookingData = {
            customerId,
            petId,
            serviceId,
            doctorId: mainService.category === 1 ? doctorId : null,
            bookingDate: finalBookingDate,
            checkIn: checkIn ? new Date(checkIn) : undefined,
            checkOut: checkOut ? new Date(checkOut) : undefined,
            subServices: subServiceIds,
            notes: notes.trim(),
            totalAmount: Math.round(totalAmount),
            shipmentDetails: shipmentDetails || undefined,
            status: 'pending',
            paymentStatus: 'pending',
            paymentMethod: 'cod'
        };

        const booking = new Booking(bookingData);
        const savedBooking = await booking.save();

        const populatedBooking = await Booking.findById(savedBooking._id)
            .populate('serviceId', 'name price category')
            .populate('petId', 'name type')
            .populate('customerId', 'name phone')
            .populate('doctorId', 'name image specialty')
            .populate('subServices', 'name price');

        return res.status(201).json({
            success: true,
            message: 'Đặt lịch thành công!',
            data: populatedBooking,
            summary: {
                totalAmount: totalAmount.toLocaleString('vi-VN') + 'đ',
                hasTransport: needsTransport,
                transportFee: needsTransport ? (totalAmount - mainService.price * (mainService.category === 3 ? moment(checkOut).diff(moment(checkIn), 'days') || 1 : 1)) : 0
            }
        });

    } catch (error) {
        console.error('Lỗi tạo đơn gộp:', error);
        return res.status(500).json({
            message: 'Đã có lỗi xảy ra khi đặt lịch',
            error: error.message
        });
    }
};

exports.checkAvailability = async (req, res) => {
    try {
        const { checkIn, checkOut } = req.body;
        const service = await Service.findById(req.params.serviceId);

        if (!service || !service.category || service.category !== 3) {
            return res.status(400).json({ message: 'Dịch vụ không hợp lệ hoặc không phải dịch vụ khách sạn.' });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (isNaN(checkInDate) || isNaN(checkOutDate)) {
            return res.status(400).json({ message: 'Ngày check-in hoặc check-out không hợp lệ.' });
        }

        if (checkOutDate <= checkInDate) {
            return res.status(400).json({ message: 'Ngày check-out phải sau ngày check-in.' });
        }

        const overlappingBookings = await Booking.find({
            serviceId: req.params.serviceId,
            status: { $in: ['pending', 'active', 'completed'] },
            $or: [
                { checkIn: { $lte: checkOutDate }, checkOut: { $gte: checkInDate } },
            ],
        });

        const bookedRooms = overlappingBookings.length;
        const availableRooms = service.totalRooms - bookedRooms;

        if (availableRooms <= 0) {
            return res.status(400).json({ message: 'Không còn phòng trống trong khoảng thời gian đã chọn.' });
        }

        res.json({
            availableRooms,
            totalRooms: service.totalRooms,
            checkIn: checkInDate.toISOString(),
            checkOut: checkOutDate.toISOString(),
        });
    } catch (error) {
        console.error('Error in checkAvailability:', error.message || error);
        res.status(500).json({ message: 'Lỗi khi kiểm tra tính khả dụng.', error: error.message || error });
    }
};

exports.createBooking = async (req, res) => {
    const { bookingDate, serviceId, petId, checkIn, checkOut, subServiceIds, doctorId, notes, paymentMethod } = req.body;

    if (!bookingDate || !serviceId || !petId || !req.user.customerId) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin: bookingDate, serviceId, petId, customerId.' });
    }

    try {
        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Dịch vụ không tồn tại.' });
        }

        let finalBookingDate;
        let totalAmount = 0;
        let finalDoctorId = service.category === 1 ? (doctorId || null) : null;

        if (service.category === 3) {
            if (!checkIn || !checkOut) {
                return res.status(400).json({ message: 'Ngày check-in và check-out là bắt buộc cho dịch vụ khách sạn.' });
            }
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            if (isNaN(checkInDate) || isNaN(checkOutDate) || checkOutDate <= checkInDate) {
                return res.status(400).json({ message: 'Ngày check-in hoặc check-out không hợp lệ hoặc check-out phải sau check-in.' });
            }
            finalBookingDate = checkInDate;
            const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            totalAmount = service.price * (daysDiff > 0 ? daysDiff : 1);
            if (subServiceIds && subServiceIds.length > 0) {
                const SubServiceAsService = mongoose.model('Service'); 
                const subServices = await SubServiceAsService.find({ 
                    _id: { $in: subServiceIds },
                    category: 2 
                });

                if (subServices.length !== subServiceIds.length) {
                    return res.status(400).json({ message: 'Một hoặc nhiều dịch vụ phụ không hợp lệ.' });
                }

                const subServiceTotal = subServices.reduce((sum, sub) => sum + sub.price, 0);
                totalAmount += subServiceTotal; 
            }
        } else {
            const bookingDateObj = new Date(bookingDate);
            if (isNaN(bookingDateObj)) {
                return res.status(400).json({ message: 'Ngày đặt không hợp lệ.' });
            }
            console.log('Creating booking with bookingDate:', bookingDateObj.toISOString()); 
            const startOfDay = new Date(bookingDateObj);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(bookingDateObj);
            endOfDay.setHours(23, 59, 59, 999);

            const bookingTimeStr = getTimeString(bookingDateObj);

            const existingBookings = await Booking.find({
                serviceId,
                status: { $in: ['pending', 'active', 'completed'] },
                bookingDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            const bookedTimes = existingBookings.map(booking => getTimeString(booking.bookingDate));

            if (bookedTimes.includes(bookingTimeStr)) {
                return res.status(400).json({ 
                    message: 'Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác.' 
                });
            }

            finalBookingDate = bookingDateObj;
            totalAmount = service.price;
        }

        if (finalDoctorId) {
            const doctor = await Doctor.findById(finalDoctorId);
            if (!doctor) {
                return res.status(404).json({ message: 'Bác sĩ không tồn tại.' });
            }
        }

        const pet = await Pet.findById(petId);
        if (!pet) {
            return res.status(404).json({ message: 'Thú cưng không tồn tại.' });
        }

        let newBookingData = {
            customerId: req.user.customerId,
            bookingDate: finalBookingDate,
            serviceId,
            petId,
            doctorId: finalDoctorId,
            status: 'pending',
            notes: notes || '',
            totalAmount: totalAmount,
            paymentStatus: 'pending'
        };

        if (service.category === 3) {
            newBookingData.checkIn = new Date(checkIn);
            newBookingData.checkOut = new Date(checkOut);
            newBookingData.subServices = subServiceIds || [];
            const overlappingBookings = await Booking.find({
                serviceId,
                status: { $in: ['pending', 'active', 'completed'] },
                $or: [
                    { checkIn: { $lte: newBookingData.checkOut }, checkOut: { $gte: newBookingData.checkIn } },
                ],
            });

            if (overlappingBookings.length >= service.totalRooms) {
                return res.status(400).json({ message: 'Không còn phòng trống trong khoảng thời gian đã chọn.' });
            }
        }

        const booking = new Booking(newBookingData);
        const newBooking = await booking.save();
        const ipAddress =   req.headers['x-forwarded-for'] || 
                            req.connection.remoteAddress ||
                            req.socket.remoteAddress ||
                            (req.connection.socket ? req.connection.socket.remoteAddress : null);
        let paymentUrl = '';
        let responseMessage = '';
        if (paymentMethod === 'momo') {
            const paymentDataMoMo = {
                amount: newBooking.totalAmount,
                bookingId: newBooking._id.toString(),
            };
            paymentUrl = await createMoMoPayment(paymentDataMoMo);
            responseMessage = 'Booking created. Redirecting to MoMo...';
        } else {
            const paymentDataVNPAY = {
                amount: newBooking.totalAmount,
                orderId: newBooking._id.toString(),
                ipAddr: ipAddress,
            };
            paymentUrl = createPaymentUrl(paymentDataVNPAY);
            responseMessage = 'Booking created. Redirecting to VNPAY...';
        }
        res.status(200).json({
            code: '00',
            message: responseMessage,
            data: paymentUrl
        });
    } catch (error) {
        console.error('Error in createBooking:', error.message || error);
        res.status(500).json({ message: 'Lỗi khi tạo booking.', error: error.message || error.toString() });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const query = req.user.role === 'admin' ? {} : { customerId: req.user.customerId };
        const bookings = await Booking.find(query)
            .populate('serviceId', 'name price category')
            .populate('petId', 'name type')
            .populate('customerId', 'name phone')
            .populate('subServices', 'name price')
            .populate('doctorId', 'name image specialty');
        res.status(200).json(bookings);
    } catch (error) {
        console.error('Error in getAllBookings:', error.message || error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách booking.', error: error.message || error });
    }
};

exports.updateBooking = async (req, res) => {
    const { 
        bookingDate, serviceId, petId, checkIn, checkOut, 
        subServiceIds, doctorId, status, notes, 
        paymentStatus, paymentMethod, paymentDetails 
    } = req.body;

    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking không tồn tại' });

        if (req.user.role !== 'admin' && booking.customerId.toString() !== req.user.customerId) {
            return res.status(403).json({ message: 'Không có quyền cập nhật' });
        }

        if ((booking.status === 'completed' || booking.status === 'canceled') && (status === 'pending' || status === 'active')) {
             return res.status(400).json({ message: `Không thể chuyển từ trạng thái ${booking.status} về ${status}` });
        }

        let needsPriceRecalculation = false;

        if (bookingDate) { booking.bookingDate = new Date(bookingDate); needsPriceRecalculation = true; }
        if (serviceId && serviceId !== booking.serviceId.toString()) { booking.serviceId = serviceId; needsPriceRecalculation = true; }
        if (petId) booking.petId = petId;
        if (doctorId !== undefined) booking.doctorId = doctorId || null;
        
        if (status) {
            const currentService = await Service.findById(booking.serviceId);
            if (status === 'active' && currentService.category === 3) {
                const checkInDate = booking.checkIn;
                const checkOutDate = booking.checkOut;
                
                const overlapping = await Booking.countDocuments({
                    serviceId: booking.serviceId,
                    status: 'active', 
                    _id: { $ne: booking._id },
                    $or: [{ checkIn: { $lte: checkOutDate }, checkOut: { $gte: checkInDate } }]
                });

                if (overlapping >= currentService.totalRooms) {
                    return res.status(400).json({ message: `Hết phòng trong khoảng thời gian này (Đã có ${overlapping} đơn xác nhận).` });
                }
            }
            booking.status = status;
        }

        if (notes !== undefined) booking.notes = notes;
        if (paymentStatus) booking.paymentStatus = paymentStatus;
        if (paymentMethod) booking.paymentMethod = paymentMethod;
        if (paymentDetails) booking.paymentDetails = paymentDetails;

        if (subServiceIds !== undefined) {
            const oldSubs = booking.subServices.map(s => s.toString()).sort().join(',');
            const newSubs = Array.isArray(subServiceIds) ? subServiceIds.sort().join(',') : '';
            if (oldSubs !== newSubs) { booking.subServices = subServiceIds; needsPriceRecalculation = true; }
        }

        if (checkIn || checkOut) {
            if (checkIn) booking.checkIn = new Date(checkIn);
            if (checkOut) booking.checkOut = new Date(checkOut);
            needsPriceRecalculation = true;
        }

        if (needsPriceRecalculation) {
            const currentService = await Service.findById(booking.serviceId);
            let newBaseAmount = 0;

            if (currentService.category === 3) { 
                if (!booking.checkIn || !booking.checkOut) return res.status(400).json({ message: 'Thiếu ngày check-in/out' });
                const days = Math.ceil((booking.checkOut - booking.checkIn) / (1000 * 3600 * 24));
                newBaseAmount = currentService.price * (days > 0 ? days : 1);
            } else if (currentService.category === 4) { 
                newBaseAmount = booking.totalAmount; 
            } else {
                newBaseAmount = currentService.price;
            }

            if (booking.subServices && booking.subServices.length > 0) {
                const SubService = mongoose.model('Service'); 
                const subServices = await SubService.find({ _id: { $in: booking.subServices } });
                newBaseAmount += subServices.reduce((sum, s) => sum + s.price, 0);
            }

            if (currentService.category !== 4 && booking.shipmentDetails && booking.shipmentDetails.price) {
                newBaseAmount += booking.shipmentDetails.price;
            }

            booking.totalAmount = newBaseAmount;
        }

        await booking.save();
        
        const updatedBooking = await Booking.findById(booking._id)
            .populate('serviceId', 'name price category totalRooms') 
            .populate('petId', 'name type')
            .populate('customerId', 'name phone')
            .populate('doctorId', 'name image specialty');

        res.status(200).json(updatedBooking);

    } catch (error) {
        console.error('Lỗi update booking:', error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật đơn hàng', error: error.message });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking không tồn tại.' });
        }

        if (req.user.role !== 'admin' && booking.customerId.toString() !== req.user.customerId) {
            return res.status(403).json({ message: 'Không được phép: Bạn không có quyền xóa booking này.' });
        }

        await booking.deleteOne();
        res.status(200).json({ message: 'Booking đã được xóa.' });
    } catch (error) {
        console.error('Error in deleteBooking:', error.message || error);
        res.status(500).json({ message: 'Lỗi khi xóa booking.', error: error.message || error });
    }
};

exports.getAvailableTimes = async (req, res) => {
    try {
        const { date, doctorId } = req.query;
        const { serviceId } = req.params;

        if (!date) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ngày.' });
        }

        const selectedDate = new Date(date);
        if (isNaN(selectedDate)) {
            return res.status(400).json({ message: 'Ngày không hợp lệ.' });
        }

        const service = await Service.findById(serviceId);
        if (!service || service.category === 3) {
            return res.status(400).json({ message: 'Dịch vụ không hợp lệ hoặc là dịch vụ khách sạn.' });
        }

        const availableTimeSlots = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'
        ];

        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const query = {
            status: { $in: ['pending', 'active', 'completed'] }, 
            bookingDate: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        };

        if (service.category === 1) { 
            const requestedDoctorId = doctorId && doctorId.toLowerCase() !== 'null' ? doctorId : null;
            
            if (requestedDoctorId) {
                const doctor = await Doctor.findById(requestedDoctorId);
                if (!doctor) {
                    return res.status(404).json({ message: 'Không tìm thấy bác sĩ' });
                }
                query.doctorId = requestedDoctorId; 
            } else {
                query.serviceId = serviceId;
                query.doctorId = null; 
            }
        } else {
            query.serviceId = serviceId;
            query.doctorId = null;
        }

        const bookings = await Booking.find(query);
        const bookedTimes = bookings.map(booking => getTimeString(booking.bookingDate));
        
        const availableTimes = availableTimeSlots.filter(
            time => !bookedTimes.includes(time)
        );

        res.json({ availableTimes });
    } catch (error) {
        console.error('Error in getAvailableTimes:', error.message || error);
        res.status(500).json({ message: 'Lỗi khi lấy khung giờ trống.', error: error.message || error });
    }
};

exports.createShipmentBooking = async (req, res) => {
    const {
        serviceId,
        petId,
        bookingDate,              
        pickupAddress,
        dropoffAddress,
        notes = '',
        paymentMethod = 'cod'
    } = req.body;

    const customerId = req.user.customerId;

    if (!serviceId || !petId || !bookingDate || !pickupAddress || !dropoffAddress) {
        return res.status(400).json({
            message: 'Vui lòng cung cấp đầy đủ: dịch vụ, thú cưng, ngày vận chuyển, điểm đón, điểm trả.'
        });
    }

    try {
        const service = await Service.findById(serviceId);
        if (!service || String(service.category) !== '4') {
            return res.status(400).json({ message: 'Dịch vụ không phải là vận chuyển thú cưng.' });
        }

        const pet = await Pet.findById(petId);
        if (!pet) return res.status(404).json({ message: 'Thú cưng không tồn tại.' });
        if (pet.customerId.toString() !== customerId.toString()) {
            return res.status(403).json({ message: 'Bạn không sở hữu thú cưng này.' });
        }

        let distanceData;
        try {
            distanceData = await calculateDistance(pickupAddress, dropoffAddress);
        } catch (err) {
            return res.status(500).json({ message: 'Không thể tính khoảng cách. Vui lòng thử lại.' });
        }

        const isExpress = service.name.toLowerCase().includes('express') || 
                          service.name.toLowerCase().includes('nhanh');
        const shipmentType = isExpress ? 'express' : 'standard';

        const basePrice = service.price; 
        const distanceKm = Math.round((distanceData.distanceValue / 1000) * 10) / 10; 
        const totalAmount = basePrice * distanceKm ;

        const bookingData = {
            customerId,
            petId,
            serviceId,
            bookingDate: new Date(bookingDate),
            shipmentDetails: {
                pickupAddress: pickupAddress.trim(),
                dropoffAddress: dropoffAddress.trim(),
                distance: distanceKm,                            
                duration: distanceData.durationText,             
                shipmentType,
                price: totalAmount 
            },
            notes: notes.trim(),
            totalAmount,
            status: 'pending',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            paymentMethod
        };

        const booking = new Booking(bookingData);
        const savedBooking = await booking.save();

        let paymentUrl = '';
        let responseMessage = 'Đặt vận chuyển thành công!';

        if (paymentMethod === 'momo') {
            const paymentData = {
                amount: totalAmount,
                bookingId: savedBooking._id.toString(),
            };
            paymentUrl = await createMoMoPayment(paymentData);
            responseMessage = 'Chuyển hướng đến MoMo...';
        } else if (paymentMethod === 'vnpay') {
            const ipAddress = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';
            const paymentData = {
                amount: totalAmount,
                orderId: savedBooking._id.toString(),
                ipAddr: ipAddress,
            };
            paymentUrl = createPaymentUrl(paymentData);
            responseMessage = 'Chuyển hướng đến VNPAY...';
        }

        const populatedBooking = await Booking.findById(savedBooking._id)
            .populate('serviceId', 'name price')
            .populate('petId', 'name type')
            .populate('customerId', 'name phone');

        res.status(201).json({
            success: true,
            message: responseMessage,
            data: populatedBooking,
            paymentUrl,
            summary: {
                distance: `${distanceKm} km`,
                duration: distanceData.durationText,
                totalAmount: totalAmount.toLocaleString('vi-VN') + 'đ'
            }
        });

    } catch (error) {
        console.error('Lỗi tạo booking vận chuyển:', error);
        res.status(500).json({
            message: 'Đã có lỗi xảy ra khi đặt vận chuyển.',
            error: error.message
        });
    }
};

module.exports = {
    checkAvailability: exports.checkAvailability,
    createBooking: exports.createBooking,
    createShipmentBooking: exports.createShipmentBooking,
    createUnifiedBooking: exports.createUnifiedBooking,
    getAllBookings: exports.getAllBookings,
    updateBooking: exports.updateBooking,
    deleteBooking: exports.deleteBooking,
    getAvailableTimes: exports.getAvailableTimes
};