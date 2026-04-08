/**
 * 🔍 PG Lead Scraper — Google Maps Edition
 * Scrapes PG listings from Google Maps with ratings, phone numbers, and bad reviews.
 * 
 * Usage: node scrape-leads.js "PG in Karve Nagar"
 *        node scrape-leads.js "PG in Kothrud"
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const SEARCH_QUERY = process.argv[2] || "PG in Karve Nagar Pune";
const OUTPUT_FILE = path.join(__dirname, "pg_leads.json");

// Random delay to mimic human behavior
const delay = (min, max) => new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

async function scrapeGoogleMaps() {
  console.log(`\n🔍 Scraping Google Maps for: "${SEARCH_QUERY}"\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Set a realistic user agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  const url = `https://www.google.com/maps/search/${encodeURIComponent(SEARCH_QUERY)}/`;
  console.log(`📍 Opening: ${url}`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await delay(3000, 5000);

  // ── STEP 1: Scroll sidebar to load all results ─────────────────────────
  console.log("📜 Scrolling sidebar to load all results...");

  const SCROLL_CONTAINER = 'div[role="feed"]';
  
  // Wait for feed to appear
  try {
    await page.waitForSelector(SCROLL_CONTAINER, { timeout: 15000 });
  } catch {
    console.log("⚠️  Could not find results feed. Trying alternative selector...");
    // Try the main scrollable area
    const altSelector = 'div[role="main"] div.m6QErb';
    try {
      await page.waitForSelector(altSelector, { timeout: 10000 });
    } catch {
      console.error("❌ No results container found. Google may have blocked or changed layout.");
      await browser.close();
      return [];
    }
  }

  let previousCount = 0;
  let sameCountRounds = 0;
  
  for (let i = 0; i < 30; i++) {
    // Scroll within the feed container
    await page.evaluate((selector) => {
      const feed = document.querySelector(selector);
      if (feed) feed.scrollTop = feed.scrollHeight;
    }, SCROLL_CONTAINER);

    await delay(2000, 4000);

    const currentCount = await page.evaluate((selector) => {
      const feed = document.querySelector(selector);
      if (!feed) return 0;
      return feed.querySelectorAll('div.Nv2PK').length || 
             feed.querySelectorAll('a[href*="/maps/place/"]').length;
    }, SCROLL_CONTAINER);

    console.log(`   Scroll ${i + 1}: Found ${currentCount} listings`);

    if (currentCount === previousCount) {
      sameCountRounds++;
      if (sameCountRounds >= 3) {
        console.log("   ✅ All results loaded.");
        break;
      }
    } else {
      sameCountRounds = 0;
    }
    previousCount = currentCount;
  }

  // ── STEP 2: Extract basic listing data ─────────────────────────────────
  console.log("\n📋 Extracting listing data...");

  const listings = await page.evaluate(() => {
    const results = [];
    // Google Maps listing cards
    const cards = document.querySelectorAll('div.Nv2PK');
    
    cards.forEach((card) => {
      try {
        const linkEl = card.querySelector('a.hfpxzc');
        const nameEl = card.querySelector('.qBF1Pd') || card.querySelector('div.fontHeadlineSmall');
        const ratingEl = card.querySelector('.MW4etd');
        const reviewCountEl = card.querySelector('.UY7F9');
        const categoryEl = card.querySelector('.W4Efsd .W4Efsd span:nth-child(1)');
        
        const name = nameEl?.textContent?.trim() || "";
        const rating = ratingEl?.textContent?.trim() || "";
        const reviewText = reviewCountEl?.textContent?.trim() || "";
        const reviewCount = reviewText.replace(/[^0-9]/g, "") || "0";
        const href = linkEl?.getAttribute("href") || "";

        if (name) {
          results.push({
            pg_name: name,
            rating: rating,
            review_count: parseInt(reviewCount),
            href: href,
            phone: "",
            address: "",
            bad_review_text: "",
          });
        }
      } catch (e) {
        // Skip malformed cards
      }
    });

    return results;
  });

  console.log(`   Found ${listings.length} PG listings`);

  // ── STEP 3: Click into each listing for phone + bad reviews ────────────
  console.log("\n📞 Extracting phone numbers and bad reviews...\n");

  const leads = [];

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    
    // Check if blacklisted before processing
    const BLACKLIST = ["stanza", "zolo", "isthara", "helloworld", "stayabode", "colive", "your-space"];
    const nameLower = (listing.pg_name || "").toLowerCase();
    const isMatched = BLACKLIST.some((badKeyword) => nameLower.includes(badKeyword));

    if (isMatched) {
      console.log(`   [${i + 1}/${listings.length}] 🛑 SKIPPING (Blacklisted): ${listing.pg_name}...`);
      continue;
    }

    console.log(`   [${i + 1}/${listings.length}] 🚀 Processing: ${listing.pg_name}...`);

    try {
      // Click on the listing
      const cards = await page.$$('div.Nv2PK');
      if (cards[i]) {
        await cards[i].click();
        await delay(3000, 5000);
      }

      // Extract phone number
      const phone = await page.evaluate(() => {
        // Look for phone in the detail panel
        const phoneButton = document.querySelector('button[data-tooltip="Copy phone number"]');
        if (phoneButton) {
          const text = phoneButton.closest('[data-item-id]')?.textContent || "";
          const match = text.match(/[\d\s-]{10,}/);
          return match ? match[0].replace(/[\s-]/g, "") : "";
        }
        
        // Alternative: search for phone-like patterns in aria-labels
        const allButtons = document.querySelectorAll('button[aria-label*="Phone"]');
        for (const btn of allButtons) {
          const label = btn.getAttribute("aria-label") || "";
          const match = label.match(/[\d]{10}/);
          if (match) return match[0];
        }

        // Try data-item-id approach
        const phoneEl = document.querySelector('[data-item-id^="phone:"]');
        if (phoneEl) {
          const id = phoneEl.getAttribute("data-item-id") || "";
          return id.replace("phone:tel:", "").replace("phone:", "").replace(/\+91\s?/, "");
        }

        return "";
      });

      // Extract address
      const address = await page.evaluate(() => {
        const addressEl = document.querySelector('button[data-item-id="address"]');
        if (addressEl) return addressEl.textContent?.trim() || "";
        
        const addrEl = document.querySelector('[data-item-id^="address"]');
        if (addrEl) return addrEl.textContent?.trim() || "";
        
        return "";
      });

      // Try to get bad reviews
      let badReview = "";
      try {
        // Click on reviews tab
        const reviewTab = await page.$('button[aria-label*="Reviews"]');
        if (reviewTab && listing.review_count > 0) {
          await reviewTab.click();
          await delay(2000, 3000);

          // Sort by lowest rating
          const sortButton = await page.$('button[aria-label="Sort reviews"]');
          if (sortButton) {
            await sortButton.click();
            await delay(1000, 2000);
            
            // Click "Lowest rating"
            const menuItems = await page.$$('div[role="menuitemradio"]');
            for (const item of menuItems) {
              const text = await page.evaluate(el => el.textContent, item);
              if (text?.includes("Lowest")) {
                await item.click();
                await delay(2000, 3000);
                break;
              }
            }
          }

          // Grab first bad review text
          badReview = await page.evaluate(() => {
            const reviews = document.querySelectorAll('.jftiEf');
            for (const review of reviews) {
              const stars = review.querySelectorAll('.hCCjke.google-symbols[aria-label*="star"]');
              const ratingLabel = review.querySelector('[aria-label*="star"]');
              const label = ratingLabel?.getAttribute("aria-label") || "";
              
              // Check if it's a 1 or 2 star review
              if (label.includes("1 star") || label.includes("2 star")) {
                const textEl = review.querySelector('.wiI7pd');
                if (textEl) return textEl.textContent?.trim()?.substring(0, 200) || "";
              }
            }
            
            // Fallback: just grab any review text
            const firstReview = document.querySelector('.wiI7pd');
            return firstReview?.textContent?.trim()?.substring(0, 200) || "";
          });
        }
      } catch (e) {
        // Reviews extraction failed, continue
      }

      // Go back to results
      const backButton = await page.$('button[aria-label="Back"]');
      if (backButton) {
        await backButton.click();
        await delay(2000, 3000);
      }

      const cleanPhone = phone.replace(/\D/g, "").slice(-10);

      leads.push({
        pg_name: listing.pg_name,
        phone: cleanPhone,
        rating: listing.rating,
        review_count: listing.review_count,
        address: address,
        bad_review_text: badReview,
      });

      if (cleanPhone) {
        console.log(`      ✅ Phone: ${cleanPhone} | Rating: ${listing.rating} | Reviews: ${listing.review_count}`);
      } else {
        console.log(`      ⚠️  No phone found | Rating: ${listing.rating}`);
      }

    } catch (err) {
      console.log(`      ❌ Error: ${err.message}`);
      leads.push({
        pg_name: listing.pg_name,
        phone: "",
        rating: listing.rating,
        review_count: listing.review_count,
        address: "",
        bad_review_text: "",
      });
    }
  }

  await browser.close();

  // Filter: only leads with phone numbers
  const validLeads = leads.filter(l => l.phone.length === 10);
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Results: ${leads.length} total, ${validLeads.length} with phone numbers`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Save all leads (with and without phones)
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validLeads, null, 2));
  console.log(`💾 Saved ${validLeads.length} leads to ${OUTPUT_FILE}\n`);

  return validLeads;
}

// Run
scrapeGoogleMaps().catch(err => {
  console.error("❌ Scraper crashed:", err.message);
  process.exit(1);
});
