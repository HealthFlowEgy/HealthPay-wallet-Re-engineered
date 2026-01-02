/**
 * HealthPay OneLink Top-Up Widget
 * 
 * Embeddable widget for wallet top-up with OneLink payment
 * 
 * Usage:
 * 
 * <div id="healthpay-topup-widget"></div>
 * <script src="healthpay-topup-widget.js"></script>
 * <script>
 *   HealthPayTopup.init({
 *     container: '#healthpay-topup-widget',
 *     apiUrl: 'https://your-api.com',
 *     userToken: 'user-jwt-token',
 *     onSuccess: (result) => console.log('Success:', result),
 *     onError: (error) => console.error('Error:', error),
 *   });
 * </script>
 */

(function(window) {
  'use strict';

  const HealthPayTopup = {
    config: {
      container: null,
      apiUrl: '',
      userToken: '',
      amounts: [50, 100, 200, 500, 1000, 2000],
      currency: 'EGP',
      theme: {
        primary: '#2e7d32',
        primaryDark: '#1a5f2a',
        background: '#f5f5f5',
        text: '#333',
        border: '#e0e0e0',
      },
      onSuccess: null,
      onError: null,
      onCancel: null,
    },

    /**
     * Initialize the widget
     */
    init: function(options) {
      this.config = { ...this.config, ...options };
      
      if (!this.config.container) {
        console.error('HealthPayTopup: container is required');
        return;
      }
      
      if (!this.config.apiUrl) {
        console.error('HealthPayTopup: apiUrl is required');
        return;
      }
      
      if (!this.config.userToken) {
        console.error('HealthPayTopup: userToken is required');
        return;
      }

      this.render();
      this.attachEvents();
    },

    /**
     * Render the widget
     */
    render: function() {
      const container = document.querySelector(this.config.container);
      if (!container) {
        console.error('HealthPayTopup: container element not found');
        return;
      }

      container.innerHTML = `
        <style>
          .hpt-widget {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 400px;
            margin: 0 auto;
          }
          .hpt-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .hpt-header {
            background: linear-gradient(135deg, ${this.config.theme.primaryDark}, ${this.config.theme.primary});
            color: white;
            padding: 24px;
            text-align: center;
          }
          .hpt-header h3 {
            margin: 0 0 8px;
            font-size: 18px;
            font-weight: 600;
          }
          .hpt-balance {
            font-size: 14px;
            opacity: 0.9;
          }
          .hpt-balance span {
            font-size: 24px;
            font-weight: bold;
          }
          .hpt-body {
            padding: 24px;
          }
          .hpt-section-title {
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
          }
          .hpt-amounts {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .hpt-amount-btn {
            padding: 14px 8px;
            border: 2px solid ${this.config.theme.border};
            border-radius: 10px;
            background: white;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .hpt-amount-btn:hover {
            border-color: ${this.config.theme.primary};
            background: ${this.config.theme.primary}10;
          }
          .hpt-amount-btn.selected {
            border-color: ${this.config.theme.primary};
            background: ${this.config.theme.primary};
            color: white;
          }
          .hpt-custom-amount {
            margin-bottom: 20px;
          }
          .hpt-input-group {
            display: flex;
            border: 2px solid ${this.config.theme.border};
            border-radius: 10px;
            overflow: hidden;
          }
          .hpt-input-group:focus-within {
            border-color: ${this.config.theme.primary};
          }
          .hpt-input-prefix {
            padding: 14px 16px;
            background: #f5f5f5;
            font-weight: 600;
            color: #666;
          }
          .hpt-input {
            flex: 1;
            padding: 14px 16px;
            border: none;
            font-size: 18px;
            font-weight: 500;
            outline: none;
          }
          .hpt-submit-btn {
            width: 100%;
            padding: 16px;
            background: ${this.config.theme.primary};
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          .hpt-submit-btn:hover {
            background: ${this.config.theme.primaryDark};
          }
          .hpt-submit-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
          .hpt-footer {
            text-align: center;
            padding: 16px;
            background: #f9f9f9;
            font-size: 12px;
            color: #999;
          }
          .hpt-footer svg {
            vertical-align: middle;
            margin-right: 4px;
          }
          .hpt-loading {
            display: none;
            text-align: center;
            padding: 40px;
          }
          .hpt-loading.show {
            display: block;
          }
          .hpt-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid ${this.config.theme.primary};
            border-radius: 50%;
            animation: hpt-spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes hpt-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .hpt-iframe-container {
            display: none;
          }
          .hpt-iframe-container.show {
            display: block;
          }
          .hpt-iframe-container iframe {
            width: 100%;
            height: 500px;
            border: none;
          }
          .hpt-back-btn {
            display: block;
            width: 100%;
            padding: 12px;
            margin-top: 12px;
            background: none;
            border: 2px solid ${this.config.theme.border};
            border-radius: 8px;
            color: #666;
            cursor: pointer;
          }
          .hpt-error {
            background: #ffebee;
            color: #c62828;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            display: none;
          }
          .hpt-error.show {
            display: block;
          }
        </style>

        <div class="hpt-widget">
          <div class="hpt-card">
            <div class="hpt-header">
              <h3>💳 Wallet Top-Up</h3>
              <div class="hpt-balance">
                Current Balance: <span id="hpt-balance">--</span> ${this.config.currency}
              </div>
            </div>

            <!-- Amount Selection Form -->
            <div class="hpt-body" id="hpt-form-view">
              <div class="hpt-error" id="hpt-error"></div>
              
              <div class="hpt-section-title">Quick Amount</div>
              <div class="hpt-amounts" id="hpt-quick-amounts">
                ${this.config.amounts.map(amt => `
                  <button class="hpt-amount-btn" data-amount="${amt}">
                    ${amt} ${this.config.currency}
                  </button>
                `).join('')}
              </div>

              <div class="hpt-section-title">Or Enter Custom Amount</div>
              <div class="hpt-custom-amount">
                <div class="hpt-input-group">
                  <span class="hpt-input-prefix">${this.config.currency}</span>
                  <input type="number" class="hpt-input" id="hpt-custom-input" 
                    placeholder="0.00" min="1" step="0.01">
                </div>
              </div>

              <button class="hpt-submit-btn" id="hpt-submit-btn" disabled>
                Continue to Payment
              </button>
            </div>

            <!-- Loading State -->
            <div class="hpt-loading" id="hpt-loading-view">
              <div class="hpt-spinner"></div>
              <p>Preparing payment...</p>
            </div>

            <!-- Iframe Payment -->
            <div class="hpt-iframe-container" id="hpt-iframe-view">
              <iframe id="hpt-payment-iframe" allow="payment"></iframe>
              <div style="padding: 0 24px 24px;">
                <button class="hpt-back-btn" id="hpt-cancel-btn">Cancel Payment</button>
              </div>
            </div>

            <div class="hpt-footer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
              Secure payment powered by OneLink
            </div>
          </div>
        </div>
      `;

      // Load initial balance
      this.loadBalance();
    },

    /**
     * Attach event listeners
     */
    attachEvents: function() {
      const self = this;
      let selectedAmount = 0;

      // Quick amount buttons
      document.querySelectorAll('.hpt-amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.hpt-amount-btn').forEach(b => b.classList.remove('selected'));
          this.classList.add('selected');
          selectedAmount = parseFloat(this.dataset.amount);
          document.getElementById('hpt-custom-input').value = '';
          self.updateSubmitButton(selectedAmount);
        });
      });

      // Custom amount input
      const customInput = document.getElementById('hpt-custom-input');
      customInput.addEventListener('input', function() {
        document.querySelectorAll('.hpt-amount-btn').forEach(b => b.classList.remove('selected'));
        selectedAmount = parseFloat(this.value) || 0;
        self.updateSubmitButton(selectedAmount);
      });

      // Submit button
      document.getElementById('hpt-submit-btn').addEventListener('click', function() {
        if (selectedAmount > 0) {
          self.initiateTopup(selectedAmount);
        }
      });

      // Cancel button
      document.getElementById('hpt-cancel-btn').addEventListener('click', function() {
        self.showFormView();
        if (self.config.onCancel) {
          self.config.onCancel();
        }
      });

      // Listen for payment completion from iframe
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'ONELINK_PAYMENT_COMPLETE') {
          self.handlePaymentComplete(event.data);
        }
      });
    },

    /**
     * Update submit button state
     */
    updateSubmitButton: function(amount) {
      const btn = document.getElementById('hpt-submit-btn');
      if (amount > 0) {
        btn.disabled = false;
        btn.textContent = `Pay ${amount.toFixed(2)} ${this.config.currency}`;
      } else {
        btn.disabled = true;
        btn.textContent = 'Continue to Payment';
      }
    },

    /**
     * Load user balance
     */
    loadBalance: async function() {
      try {
        const response = await fetch(`${this.config.apiUrl}/api/wallet/balance`, {
          headers: {
            'x-user-token': this.config.userToken,
          },
        });
        const data = await response.json();
        document.getElementById('hpt-balance').textContent = 
          (data.userWallet?.total || 0).toFixed(2);
      } catch (error) {
        console.error('Failed to load balance:', error);
      }
    },

    /**
     * Initiate top-up
     */
    initiateTopup: async function(amount) {
      this.showLoadingView();
      this.hideError();

      try {
        const response = await fetch(`${this.config.apiUrl}/api/topup/initiate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userToken: this.config.userToken,
            amount: amount,
          }),
        });

        const data = await response.json();

        if (data.success) {
          this.showIframeView(data.iframeUrl);
          this.currentOrderId = data.orderId;
        } else {
          this.showError(data.error || 'Failed to initiate payment');
          this.showFormView();
        }
      } catch (error) {
        this.showError(error.message || 'Network error');
        this.showFormView();
        if (this.config.onError) {
          this.config.onError(error);
        }
      }
    },

    /**
     * Handle payment completion
     */
    handlePaymentComplete: async function(data) {
      if (data.status === 'success') {
        // Refresh balance
        await this.loadBalance();
        
        if (this.config.onSuccess) {
          this.config.onSuccess({
            orderId: this.currentOrderId,
            amount: data.amount,
            transactionId: data.transactionId,
          });
        }
      } else {
        if (this.config.onError) {
          this.config.onError(new Error(data.message || 'Payment failed'));
        }
      }
      
      this.showFormView();
    },

    /**
     * View helpers
     */
    showFormView: function() {
      document.getElementById('hpt-form-view').style.display = 'block';
      document.getElementById('hpt-loading-view').classList.remove('show');
      document.getElementById('hpt-iframe-view').classList.remove('show');
    },

    showLoadingView: function() {
      document.getElementById('hpt-form-view').style.display = 'none';
      document.getElementById('hpt-loading-view').classList.add('show');
      document.getElementById('hpt-iframe-view').classList.remove('show');
    },

    showIframeView: function(url) {
      document.getElementById('hpt-form-view').style.display = 'none';
      document.getElementById('hpt-loading-view').classList.remove('show');
      document.getElementById('hpt-iframe-view').classList.add('show');
      document.getElementById('hpt-payment-iframe').src = url;
    },

    showError: function(message) {
      const errorEl = document.getElementById('hpt-error');
      errorEl.textContent = message;
      errorEl.classList.add('show');
    },

    hideError: function() {
      document.getElementById('hpt-error').classList.remove('show');
    },
  };

  // Export to window
  window.HealthPayTopup = HealthPayTopup;

})(window);
