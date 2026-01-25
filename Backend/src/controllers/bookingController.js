const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const Notification = require('../models/Notification'); // 👈 Notification Model Import

// @desc    Create new Booking Request
// @route   POST /api/booking/create
// @access  Private (User only)
exports.createBooking = async (req, res) => {
  console.log("\n--- FRONTEND REQUEST DATA ---");
  console.log("Type:", req.body.serviceType);
  console.log("Lat:", req.body.latitude);
  console.log("Long:", req.body.longitude);
  console.log("-----------------------------\n");
  try {
    const { 
      serviceType, 
      patientName, 
      patientAge, 
      patientGender, 
      patientPhone, 
      patientProblem,
      scheduledDate, 
      latitude, 
      longitude, 
      address 
    } = req.body;

    // 1. Validation
    if (!latitude || !longitude || !serviceType || !address) {
      return res.status(400).json({ message: 'Location, Address and Service Type are required' });
    }

    // 2. Pehle Booking Save karo (Pending Status)
    const newBooking = await Booking.create({
      customer: req.user._id,
      serviceType,
      patientDetails: {
        name: patientName,
        age: patientAge,
        gender: patientGender,
        phone: patientPhone,
        problemDescription: patientProblem
      },
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address
      },
      scheduledDate: scheduledDate || Date.now(),
      fare: { estimated: 0, currency: 'INR' },
      status: 'pending',
      timeline: [
        {
          status: 'pending',
          timestamp: new Date(),
          message: 'Booking request created'
        }
      ]
    });

    // 3. Ab Nearby Vendors Dhoondo (7km Radius)
    const nearbyVendors = await Vendor.find({
      isVerified: true,
      isAvailable: true, 
      serviceType: serviceType,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: 7000 // 7km
        }
      }
    });

    const io = req.app.get('io');

    // 4. Case Handle karo: Agar Vendor Nahi Mila ❌
    if (nearbyVendors.length === 0) {
      newBooking.timeline.push({
        status: 'pending',
        timestamp: new Date(),
        message: 'System check: No vendors found in 7km radius'
      });
      await newBooking.save();

      return res.status(201).json({ 
        success: true,
        message: 'Booking saved, but no vendors are nearby. Request queued.',
        bookingId: newBooking._id,
        nearbyVendorsCount: 0,
        status: 'queued'
      });
    }

    // 5. Agar Vendors Mile -> Notify & Save to DB ✅
    // Loop through vendors to save notification FIRST, then emit
    for (const vendor of nearbyVendors) {
        
        // A. Save Notification to Database (PERSISTENCE) 💾
        const notif = await Notification.create({
            recipient: vendor._id,
            onModel: 'Vendor', // 👈 Batana padega ki ye Vendor hai
            title: 'New Emergency Request!',
            message: `New ${serviceType} request at ${address}`,
            type: 'NEW_REQUEST',
            bookingId: newBooking._id
        });

        // B. Notification Socket Emit (Bell Icon ke liye) 🔔
        io.to(vendor._id.toString()).emit('new_notification', notif);

        // C. Request Popup Socket Emit (30s Modal ke liye) 📱
        const popupPayload = {
            bookingId: newBooking._id,
            patientName,
            serviceType,
            location: address,
            scheduledDate: newBooking.scheduledDate,
            fare: newBooking.fare
        };
        io.to(vendor._id.toString()).emit('new_request', popupPayload);
        
        console.log(`🔔 Notified Vendor (DB+Socket): ${vendor.name}`);
    }
    console.log(`3. FOUND VENDORS: ${nearbyVendors.length}`);
    // Update Timeline
    newBooking.timeline.push({
      status: 'pending',
      timestamp: new Date(),
      message: `${nearbyVendors.length} vendors notified`
    });
    await newBooking.save();

    res.status(201).json({
      success: true,
      message: `Request sent to ${nearbyVendors.length} nearby vendors`,
      bookingId: newBooking._id,
      nearbyVendorsCount: nearbyVendors.length
    });

  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Vendor Accepts a Booking
// @route   PATCH /api/booking/accept
// @access  Private (Vendor only)
exports.acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const vendorId = req.user._id;

    const booking = await Booking.findById(bookingId);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Race Condition Check
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Too late! This booking has already been accepted.' 
      });
    }

    // 1. OTP Generate
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    // 2. Booking Update
    booking.vendor = vendorId;
    booking.status = 'accepted';
    booking.otp = { code: otpCode, verified: false };
    
    booking.timeline.push({
      status: 'accepted',
      timestamp: new Date(),
      message: `Accepted by vendor: ${req.user.name}`
    });

    await booking.save();

    // 3. Notify User (Save to DB + Socket) ✅
    // Ye step bahut zaroori hai User ko history dikhane ke liye
    const notif = await Notification.create({
        recipient: booking.customer,
        onModel: 'User', // 👈 User ke liye notification
        title: 'Booking Accepted!',
        message: `${req.user.name} has accepted your request. OTP is ${otpCode}`,
        type: 'BOOKING_ACCEPTED',
        bookingId: booking._id
    });

    const io = req.app.get('io');
    
    // A. Send Notification (Bell Icon) 🔔
    io.to(booking.customer.toString()).emit('new_notification', notif);

    // B. Send Live Update (OTP Screen Update) 📱
    io.to(booking.customer.toString()).emit('booking_accepted', {
      bookingId: booking._id,
      vendorName: req.user.name,
      vendorPhone: req.user.phone,
      otp: otpCode,
      serviceType: booking.serviceType
    });

    // 4. Response to Vendor
    res.status(200).json({
      success: true,
      message: 'Booking accepted. Navigate to location.',
      booking: {
        _id: booking._id,
        patientDetails: booking.patientDetails,
        location: booking.location,
        status: 'accepted'
      }
    });

  } catch (error) {
    console.error("Accept Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Verify OTP & Start Job
// @route   POST /api/booking/start-job
// @access  Private (Vendor only)
exports.startJob = async (req, res) => {
  try {
    const { bookingId, otp } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Security & Status Checks
    if (booking.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.status !== 'accepted') {
      return res.status(400).json({ message: `Cannot start job. Status: ${booking.status}` });
    }

    // OTP Check
    if (booking.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update Status
    booking.status = 'in_progress';
    booking.otp.verified = true;
    booking.timeline.push({
      status: 'in_progress',
      timestamp: new Date(),
      message: 'OTP verified. Job started.'
    });

    await booking.save();

    // Notify User (DB + Socket) ✅
    const notif = await Notification.create({
        recipient: booking.customer,
        onModel: 'User',
        title: 'Service Started',
        message: `Your service for ${booking.serviceType} has started.`,
        type: 'SYSTEM',
        bookingId: booking._id
    });

    const io = req.app.get('io');
    
    // Emit Notification & Status Update
    io.to(booking.customer.toString()).emit('new_notification', notif);
    io.to(booking.customer.toString()).emit('job_status_update', { status: 'in_progress' });

    res.status(200).json({
      success: true,
      message: 'OTP Verified! Job Started.',
      bookingId: booking._id,
      status: 'in_progress'
    });

  } catch (error) {
    console.error("Start Job Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Complete Job & Collect Payment
// @route   POST /api/booking/complete-job
// @access  Private (Vendor only)
exports.completeJob = async (req, res) => {
  try {
    const { bookingId, finalAmount, paymentMode } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (booking.status !== 'in_progress') {
      return res.status(400).json({ message: `Cannot complete job. Status: ${booking.status}` });
    }

    // Update Booking
    booking.status = 'completed';
    booking.fare.final = finalAmount || booking.fare.estimated;
    booking.payment.mode = paymentMode || 'cash';
    booking.payment.status = 'completed';
    
    booking.timeline.push({
      status: 'completed',
      timestamp: new Date(),
      message: `Job completed. Payment: ${paymentMode || 'cash'}`
    });

    await booking.save();

    // Notify User (Bill) - DB Save ✅
    const notif = await Notification.create({
        recipient: booking.customer,
        onModel: 'User',
        title: 'Service Completed',
        message: `Your service is done. Final Bill: ₹${booking.fare.final}`,
        type: 'SYSTEM',
        bookingId: booking._id
    });

    const io = req.app.get('io');
    
    // Send Notification + Event
    io.to(booking.customer.toString()).emit('new_notification', notif);
    io.to(booking.customer.toString()).emit('job_completed', {
      bookingId: booking._id,
      amount: booking.fare.final,
      message: 'Job Completed. Please rate your vendor!'
    });

    res.status(200).json({
      success: true,
      message: 'Job Completed Successfully!',
      booking
    });

  } catch (error) {
    console.error("Complete Job Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ... Upar ka create, accept, start, complete code same rahega ...

// @desc    Get All Bookings for Logged In User or Vendor
// @route   GET /api/booking/my-bookings
// @access  Private
// @desc    Get Single Booking Details by ID
// @route   GET /api/booking/:id
// @access  Private
exports.getBookingDetails = async (req, res) => { // 👈 Yahan naam change kar diya
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('vendor', 'name phone serviceType location');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Security Check: Sirf wahi banda dekh paye jo is booking se juda hai
    const isCustomer = booking.customer._id.toString() === req.user._id.toString();
    const isVendor = booking.vendor && booking.vendor._id.toString() === req.user._id.toString();

    if (!isCustomer && !isVendor && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to view this booking' });
    }

    res.status(200).json({
      success: true,
      booking
    });

  } catch (error) {
    console.error("Booking Details Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get Single Booking Details by ID
// @route   GET /api/booking/:id
// @access  Private
exports.getMyBookings = async (req, res) => {
  try {
    // 1. Log print kar ke dekh ki ID sahi aa rahi hai ya nahi
    console.log("Logged In User ID:", req.user._id);
    console.log("Logged In Role:", req.user.role);

    // 2. Query banao based on role
    // Agar User hai -> toh 'customer' field check karo
    // Agar Vendor hai -> toh 'vendor' field check karo
    // Hum $or use karenge taaki safe rahe
    
    const bookings = await Booking.find({
      $or: [
        { customer: req.user._id }, // Main customer hu?
        { vendor: req.user._id }    // Ya main assigned vendor hu?
      ]
    })
    .populate('customer', 'name phone') // Customer ki details dikhao
    .populate('vendor', 'name phone serviceType') // Vendor ki details dikhao
    .sort({ createdAt: -1 }); // Newest pehle

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });

  } catch (error) {
    console.error("Get Bookings Error:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ... Upar ka code same rahega ...

// @desc    Cancel Booking (User or Vendor)
// @route   PUT /api/booking/cancel
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Check ownership
    const isUser = booking.customer.toString() === req.user._id.toString();
    const isVendor = booking.vendor && booking.vendor.toString() === req.user._id.toString();

    if (!isUser && !isVendor) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Logic: Agar trip start ho gayi, toh cancel nahi kar sakte (optional)
    if (booking.status === 'in_progress' || booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel ongoing or completed trip' });
    }

    booking.status = 'cancelled';
    booking.cancelReason = reason || 'Cancelled by user/vendor';
    booking.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      message: `Cancelled by ${req.user.name}`
    });

    await booking.save();

    // Notify Other Party (Optional implementation needed here)

    res.status(200).json({ success: true, message: 'Booking Cancelled', booking });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update Booking Details (User only - Before Acceptance)
// @route   PUT /api/booking/update
// @access  Private
exports.updateBooking = async (req, res) => {
  try {
    const { bookingId, patientDetails, location } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Sirf User update kar sakta hai
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Sirf Pending status mein update allow karo
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update after vendor acceptance' });
    }

    // Update Fields
    if (patientDetails) booking.patientDetails = { ...booking.patientDetails, ...patientDetails };
    if (location) booking.location = { ...booking.location, ...location };

    await booking.save();

    res.status(200).json({ success: true, message: 'Booking Updated', booking });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};