// Update the /api/topup/initiate endpoint
app.post('/api/topup/initiate', async (req, res) => {
  try {
    const { userToken, amount, returnUrl } = req.body;
    
    // Validate required fields
      return res.status(400).json({ error: 'userToken is required' });
    }
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    // Get user details from HealthPay to pre-fill OneLink
    let userDetails;
    try {
      const userQuery = `
          user(token: \$token) {
            uid
            mobile
            fullName
            email
          }
        }
      `;
      
      const response = await HealthPayClient.query(userQuery, { token: userToken });
      userDetails = response.data.user;
      
        return res.status(401).json({ error: 'Invalid userToken' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Invalid userToken', details: error.message });
    }
    
    // Generate unique order ID
    const orderId = `TOPUP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    // Store pending transaction
    pendingTransactions.set(orderId, {
      userToken,
      userId: userDetails.uid,
      amount,
      status: 'pending',
      createdAt: new Date(),
    });
    
    // Generate OneLink iframe URL with user details pre-filled
    const iframeUrl = OneLinkService.generateIframeUrl({
      amount,
      orderId,
      userToken,
      customerName: userDetails.fullName || 'HealthPay User',
      customerEmail: userDetails.email || '',
      customerPhone: userDetails.mobile || '',
      returnUrl: returnUrl || `http://104.248.245.150:3005/payment-complete?orderId=${orderId}`,
    });
    
    res.json({
      success: true,
      orderId,
      iframeUrl,
      amount,
      currency: 'EGP',
      customerName: userDetails.fullName,
    });
    
  } catch (error) {
    console.error('Top-up initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate top-up', details: error.message });
  }
});
