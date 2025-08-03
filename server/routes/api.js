const express = require('express');
const axios = require('axios');
const router = express.Router();

const REBRANDLY_API_KEY = process.env.REBRANDLY_API_KEY;
const REBRANDLY_BASE_URL = 'https://api.rebrandly.com/v1';

// Validate URL function
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Validate custom slug
const isValidSlug = (slug) => {
  if (!slug) return true; // Optional field
  
  // Allow letters, numbers, hyphens, and underscores
  const slugRegex = /^[a-zA-Z0-9_-]+$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
};

// POST /api/shorten - Shorten URL
router.post('/shorten', async (req, res) => {
  try {
    const { url, customSlug } = req.body;

    // Input validation
    if (!url || !url.trim()) {
      return res.status(400).json({ 
        error: 'URL is required',
        code: 'MISSING_URL'
      });
    }

    if (!isValidUrl(url.trim())) {
      return res.status(400).json({ 
        error: 'Please enter a valid URL',
        code: 'INVALID_URL'
      });
    }

    if (customSlug && !isValidSlug(customSlug.trim())) {
      return res.status(400).json({ 
        error: 'Custom slug must be 3-50 characters and contain only letters, numbers, hyphens, and underscores',
        code: 'INVALID_SLUG'
      });
    }

    // Prepare request data for Rebrandly
    const rebrandlyData = {
      destination: url.trim(),
      domain: { fullName: "rebrand.ly" }
    };

    // Add custom slug if provided
    if (customSlug && customSlug.trim()) {
      rebrandlyData.slashtag = customSlug.trim();
    }

    console.log('📤 Sending request to Rebrandly:', {
      destination: rebrandlyData.destination,
      slashtag: rebrandlyData.slashtag || 'auto-generated'
    });

    // Make request to Rebrandly API
    const response = await axios.post(
      `${REBRANDLY_BASE_URL}/links`,
      rebrandlyData,
      {
        headers: {
          'apikey': REBRANDLY_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      }
    );

    console.log('✅ Rebrandly response received:', response.data.shortUrl);

    // Return success response
    res.json({
      success: true,
      shortUrl: response.data.shortUrl,
      originalUrl: url.trim(),
      id: response.data.id,
      customSlug: response.data.slashtag || null,
      createdAt: response.data.createdAt
    });

  } catch (error) {
    console.error('❌ Rebrandly API Error:', error.response?.data || error.message);
    
    // Handle specific Rebrandly API errors
    if (error.response?.status === 403) {
      res.status(403).json({ 
        error: 'Invalid API key or quota exceeded',
        code: 'API_KEY_ERROR'
      });
    } else if (error.response?.status === 422) {
      const errorMessage = error.response.data?.errors?.[0]?.message || 'Invalid URL or custom slug already exists';
      res.status(422).json({ 
        error: errorMessage,
        code: 'VALIDATION_ERROR'
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT'
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ 
        error: 'Request timeout. Please try again.',
        code: 'TIMEOUT'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to shorten URL. Please try again.',
        code: 'INTERNAL_ERROR'
      });
    }
  }
});

// GET /api/test - Test API key
router.get('/test', async (req, res) => {
  try {
    console.log('🔍 Testing Rebrandly API key...');
    
    const response = await axios.get(`${REBRANDLY_BASE_URL}/account`, {
      headers: {
        'apikey': REBRANDLY_API_KEY
      },
      timeout: 5000
    });
    
    console.log('✅ API key test successful');
    
    res.json({
      success: true,
      message: 'API key is valid',
      account: {
        id: response.data.id,
        email: response.data.email,
        fullName: response.data.fullName,
        createdAt: response.data.createdAt
      }
    });
  } catch (error) {
    console.error('❌ API key test failed:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'API key test failed',
      code: error.response?.status === 403 ? 'INVALID_API_KEY' : 'TEST_FAILED',
      details: error.response?.data || error.message
    });
  }
});

// GET /api/stats - Get account stats (optional)
router.get('/stats', async (req, res) => {
  try {
    const response = await axios.get(`${REBRANDLY_BASE_URL}/account`, {
      headers: {
        'apikey': REBRANDLY_API_KEY
      }
    });
    
    res.json({
      success: true,
      stats: {
        linksCreated: response.data.linksCreated || 0,
        linksLimit: response.data.linksLimit || 'Unlimited',
        clicksTracked: response.data.clicksTracked || 0
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account stats'
    });
  }
});

module.exports = router;