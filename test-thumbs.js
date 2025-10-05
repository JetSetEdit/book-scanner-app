const puppeteer = require('puppeteer');

async function testThumbsFunctionality() {
  console.log('🚀 Starting thumbs functionality test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 1000 // Slow down actions for better visibility
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to debug page
    console.log('📱 Navigating to debug page...');
    await page.goto('http://localhost:3000/debug-thumbs', { 
      waitUntil: 'networkidle2' 
    });
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="thumbs-up"], button:has-text("👍")', { timeout: 10000 });
    
    // Take initial screenshot
    await page.screenshot({ path: 'thumbs-initial.png' });
    console.log('📸 Initial screenshot saved as thumbs-initial.png');
    
    // Get initial counts
    const initialHelpfulCount = await page.evaluate(() => {
      const button = document.querySelector('button:has-text("👍")') || 
                    document.querySelector('button[aria-label*="helpful"]') ||
                    Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('👍'));
      return button ? parseInt(button.textContent.match(/\d+/)?.[0] || '0') : 0;
    });
    
    const initialNotHelpfulCount = await page.evaluate(() => {
      const button = document.querySelector('button:has-text("👎")') || 
                    document.querySelector('button[aria-label*="not helpful"]') ||
                    Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('👎'));
      return button ? parseInt(button.textContent.match(/\d+/)?.[0] || '0') : 0;
    });
    
    console.log(`📊 Initial counts - Helpful: ${initialHelpfulCount}, Not Helpful: ${initialNotHelpfulCount}`);
    
    // Click thumbs up button
    console.log('👍 Clicking thumbs up button...');
    await page.click('button:has-text("👍")');
    
    // Wait for the optimistic update
    await page.waitForTimeout(1000);
    
    // Take screenshot after thumbs up
    await page.screenshot({ path: 'thumbs-after-up.png' });
    console.log('📸 After thumbs up screenshot saved as thumbs-after-up.png');
    
    // Wait for server response and page refresh
    await page.waitForTimeout(3000);
    
    // Get updated counts
    const updatedHelpfulCount = await page.evaluate(() => {
      const button = document.querySelector('button:has-text("👍")') || 
                    document.querySelector('button[aria-label*="helpful"]') ||
                    Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('👍'));
      return button ? parseInt(button.textContent.match(/\d+/)?.[0] || '0') : 0;
    });
    
    console.log(`📊 Updated counts - Helpful: ${updatedHelpfulCount}, Not Helpful: ${initialNotHelpfulCount}`);
    
    // Verify the count increased
    if (updatedHelpfulCount > initialHelpfulCount) {
      console.log('✅ SUCCESS: Thumbs up count increased correctly!');
    } else {
      console.log('❌ FAILURE: Thumbs up count did not increase');
    }
    
    // Click thumbs down button
    console.log('👎 Clicking thumbs down button...');
    await page.click('button:has-text("👎")');
    
    // Wait for the optimistic update
    await page.waitForTimeout(1000);
    
    // Take screenshot after thumbs down
    await page.screenshot({ path: 'thumbs-after-down.png' });
    console.log('📸 After thumbs down screenshot saved as thumbs-after-down.png');
    
    // Wait for server response and page refresh
    await page.waitForTimeout(3000);
    
    // Get final counts
    const finalNotHelpfulCount = await page.evaluate(() => {
      const button = document.querySelector('button:has-text("👎")') || 
                    document.querySelector('button[aria-label*="not helpful"]') ||
                    Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('👎'));
      return button ? parseInt(button.textContent.match(/\d+/)?.[0] || '0') : 0;
    });
    
    console.log(`📊 Final counts - Helpful: ${updatedHelpfulCount}, Not Helpful: ${finalNotHelpfulCount}`);
    
    // Verify the count increased
    if (finalNotHelpfulCount > initialNotHelpfulCount) {
      console.log('✅ SUCCESS: Thumbs down count increased correctly!');
    } else {
      console.log('❌ FAILURE: Thumbs down count did not increase');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'thumbs-final.png' });
    console.log('📸 Final screenshot saved as thumbs-final.png');
    
    console.log('🎉 Test completed! Check the screenshots to verify the functionality.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'thumbs-error.png' });
    console.log('📸 Error screenshot saved as thumbs-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testThumbsFunctionality().catch(console.error);

