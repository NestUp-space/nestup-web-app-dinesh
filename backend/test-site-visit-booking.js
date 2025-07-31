const axios = require('axios');

// Test site visit booking with CRM integration
async function testSiteVisitBooking() {
  const baseURL = 'http://localhost:8080'; // Adjust port as needed
  
  const testBooking = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    address: {
      street: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    preferredDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    alternateDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    requirements: 'Need interior design consultation for 2BHK apartment',
    source: 'website',
    utmParams: {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'interior_design'
    }
  };

  try {
    console.log('Testing Site Visit Booking API...');
    console.log('Request Data:', JSON.stringify(testBooking, null, 2));
    
    const response = await axios.post(`${baseURL}/api/site-visit/book`, testBooking, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.crmLeadId) {
      console.log('🎉 CRM Integration: SUCCESS - Lead created with ID:', response.data.crmLeadId);
    } else {
      console.log('⚠️  CRM Integration: FAILED or not configured');
    }
    
    if (response.data.calendarEventId) {
      console.log('📅 Calendar Integration: SUCCESS - Event created with ID:', response.data.calendarEventId);
    } else {
      console.log('⚠️  Calendar Integration: FAILED or not configured');
    }
    
    if (response.data.warnings && response.data.warnings.length > 0) {
      console.log('⚠️  Warnings:', response.data.warnings);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.response?.status, error.response?.statusText);
    console.error('Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

// Run the test
testSiteVisitBooking();
