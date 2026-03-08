import { Language } from "@/i18n/translations";

export interface GuideStep {
  title: string;
  desc: string;
  warning?: string;
  tip?: string;
  image?: string;
}

export interface GuideSection {
  title: string;
  steps: GuideStep[];
}

export interface VideoTutorial {
  title: string;
  description: string;
  videoId: string;
}

export interface GuideContent {
  pageTitle: string;
  pageSubtitle: string;
  ownerTab: string;
  tenantTab: string;
  ownerSections: GuideSection[];
  tenantSections: GuideSection[];
  ownerVideos: VideoTutorial[];
  tenantVideos: VideoTutorial[];
  videoSectionTitle: string;
  videoSectionDesc: string;
  stepLabel: string;
  needHelp: string;
  needHelpDesc: string;
  warningLabel: string;
  tipLabel: string;
  importantLabel: string;
}

export const guideTranslations: Record<Language, GuideContent> = {
  en: {
    pageTitle: "User Guide",
    pageSubtitle: "Complete step-by-step guide for PG Owners and Tenants",
    ownerTab: "For PG Owners",
    tenantTab: "For Tenants",
    stepLabel: "Step",
    needHelp: "Need More Help?",
    needHelpDesc: "Contact our support team at support@pgmanager.in or visit the Help Center for more assistance.",
    warningLabel: "⚠️ Important",
    tipLabel: "💡 Tip",
    importantLabel: "Important",
    videoSectionTitle: "📹 Video Tutorials",
    videoSectionDesc: "Watch these step-by-step walkthrough videos to understand the complete flow.",
    ownerVideos: [
      { title: "How to Set Up Your PG Property", description: "Complete walkthrough of creating your account, adding properties, rooms, and managing settings.", videoId: "owner-setup-demo" },
      { title: "How to Invite & Manage Tenants", description: "Learn how to send invite codes, track tenant payments, and handle complaints.", videoId: "owner-tenants-demo" },
      { title: "Payment Tracking & Reports", description: "See how to track rent payments, approve proofs, and generate reports.", videoId: "owner-payments-demo" },
    ],
    tenantVideos: [
      { title: "How to Join Your PG as a Tenant", description: "Step-by-step guide to signing up, entering your invite code, and accessing your dashboard.", videoId: "tenant-onboard-demo" },
      { title: "Paying Rent & Uploading Proof", description: "Learn how to view your rent, upload payment proof, and download receipts.", videoId: "tenant-payment-demo" },
      { title: "Using Tenant Features", description: "Explore complaints, meal menus, announcements, community chat, and more.", videoId: "tenant-features-demo" },
    ],
    ownerSections: [
      {
        title: "1. Account Creation & Login",
        steps: [
          {
            title: "Open the PG Manager Website",
            desc: "Visit pgbuddy.lovable.app in your browser. Click the 'Get Started Free' or 'Sign Up' button on the home page.",
            image: "/guide/signup-page.jpg",
          },
          {
            title: "Select 'PG Owner' Role",
            desc: "On the signup page, you will see two options: 'PG Owner' and 'Tenant'. Click on 'PG Owner' — this is very important! If you choose the wrong role, you will not see the owner dashboard.",
            warning: "You MUST select 'PG Owner' during signup. You cannot change your role later. If you accidentally select 'Tenant', you will need to create a new account with a different email.",
          },
          {
            title: "Fill In Your Details",
            desc: "Enter your Full Name, Email Address, and a Password (minimum 6 characters). Use a real email address — you will need to verify it.",
          },
          {
            title: "Verify Your Email",
            desc: "After clicking 'Create Account', check your email inbox (and spam/junk folder) for a verification link from PG Manager. Click the link to activate your account. You cannot log in until you verify your email.",
            warning: "If you don't see the verification email, check your spam folder. The link expires in 24 hours.",
            tip: "Use a Gmail or personal email for best deliverability. Some corporate emails may block verification mails.",
          },
          {
            title: "Log In",
            desc: "Go back to the website, click 'Sign In', enter your email and password. You will be redirected to your Owner Dashboard.",
          },
        ],
      },
      {
        title: "2. Setting Up Your Property",
        steps: [
          {
            title: "Navigate to Properties",
            desc: "After logging in, you'll see your Owner Dashboard. Click on 'Properties' in the left sidebar menu. If this is your first time, the page will be empty.",
            image: "/guide/owner-dashboard.jpg",
          },
          {
            title: "Add a New Property",
            desc: "Click the 'Add Property' button. Fill in: PG Name (e.g., 'Sunshine PG Hostel'), Full Address, City, Locality/Area, Description, Gender Preference (Boys/Girls/Co-ed), Contact Phone Number, Amenities (WiFi, AC, Parking, Laundry, Meals, TV — check all that apply), and House Rules.",
            image: "/guide/add-property.jpg",
            tip: "Add a detailed description and select all amenities — this helps tenants find your PG when browsing.",
          },
          {
            title: "Create Rooms",
            desc: "Go to 'Rooms' in the sidebar. Click 'Add Room'. For each room, enter: Room Number (e.g., '101', '102'), Room Type (Single/Double/Triple/Dormitory), Monthly Rent Amount (₹), Security Deposit Amount (₹), Bed Capacity (how many people can stay). Repeat this for every room in your property.",
            tip: "You can add rooms one by one. Make sure the rent amount is correct — tenants will see this amount in their payment section.",
          },
        ],
      },
      {
        title: "3. Inviting Tenants (Most Important Step!)",
        steps: [
          {
            title: "Go to Invitations Page",
            desc: "Click 'Invitations' in the sidebar. This is where you invite tenants to join your PG on the platform.",
            image: "/guide/invite-tenant.jpg",
          },
          {
            title: "Create a New Invitation",
            desc: "Click 'Create Invitation'. Fill in: Tenant's Full Name, Tenant's Email Address, Tenant's Phone Number, Select the Property, Select the Room to assign them to.",
            warning: "The EMAIL ADDRESS you enter here MUST be the EXACT SAME email the tenant uses to create their account. If the emails don't match, the tenant will NOT be linked to their room and won't see any data. Double-check with your tenant before creating the invitation!",
          },
          {
            title: "Share the Invite Code",
            desc: "After creating the invitation, you'll receive an invite code (e.g., 'ABC123XY'). Share this code with your tenant via WhatsApp, SMS, or in person. The tenant needs this code to complete their onboarding.",
            warning: "Invite codes expire in 7 days. If the tenant doesn't use it in time, you'll need to create a new invitation.",
            tip: "Screenshot the invite code and send it on WhatsApp to your tenant along with a message like: 'Download PG Manager and sign up with [their email]. Then use invite code [code] to join your room.'",
          },
        ],
      },
      {
        title: "4. Managing Rent & Payments",
        steps: [
          {
            title: "Set Up Payment Information",
            desc: "Go to 'Payment Settings' in the sidebar. Add your UPI ID (e.g., yourname@upi), Bank Account Number, IFSC Code, Account Holder Name, and optionally upload a QR code image. This information is shown to tenants so they know where to send rent.",
            tip: "Adding a UPI QR code makes it easiest for tenants to pay. They can simply scan and pay.",
          },
          {
            title: "Track Rent Payments",
            desc: "Go to 'Payments' to see all monthly rent records. Each row shows: Tenant Name, Room Number, Month, Amount, Status (Paid/Pending/Overdue). You can mark payments as 'Paid' when you receive the money, or they can upload payment proof.",
            image: "/guide/payments-page.jpg",
          },
          {
            title: "Track Expenses",
            desc: "Go to 'Expenses' to log property expenses like maintenance, cleaning supplies, groceries (if you provide meals), electricity bills, etc. Select a category, enter the amount and date. This helps you track your profit and loss.",
          },
        ],
      },
      {
        title: "5. Communication & Daily Management",
        steps: [
          {
            title: "Post Announcements",
            desc: "Go to 'Announcements' to send important messages to all tenants — like water supply timings, maintenance schedules, festival holidays, new rules, etc. Set priority (Normal/High/Urgent) so tenants know what's important.",
          },
          {
            title: "Handle Complaints",
            desc: "Go to 'Complaints' to view issues raised by tenants. Each complaint shows the category (Maintenance, Noise, Cleanliness, etc.), description, and status. Click on a complaint to add resolution notes and mark it as resolved.",
          },
          {
            title: "Set Meal Menu",
            desc: "If you provide meals, go to 'Meal Menu' to set the daily schedule. Enter Breakfast, Lunch, Dinner, and Snacks items for each day. Tenants can view this from their dashboard.",
          },
          {
            title: "Manage Utility Bills",
            desc: "Go to 'Utility Bills' to track electricity and water consumption per room. Enter previous and current meter readings — the system automatically calculates units consumed and the bill amount based on the rate per unit.",
          },
          {
            title: "Visitor Log",
            desc: "Go to 'Visitor Log' to maintain a record of all visitors. Enter visitor name, phone number, purpose of visit, which tenant they're visiting, and check-in/check-out times. This is useful for security purposes.",
          },
          {
            title: "Review Documents",
            desc: "Go to 'Documents' to see ID proofs uploaded by tenants (Aadhaar, PAN, etc.). You can approve or reject documents and add notes. This helps maintain proper KYC records.",
          },
        ],
      },
    ],
    tenantSections: [
      {
        title: "1. Account Creation & Login",
        steps: [
          {
            title: "Open the PG Manager Website",
            desc: "Visit pgbuddy.lovable.app in your browser. Click 'Get Started Free' or 'Sign Up'.",
            image: "/guide/signup-page.jpg",
          },
          {
            title: "Select 'Tenant' Role",
            desc: "On the signup page, click on 'Tenant'. Do NOT select 'PG Owner' — that is only for people who own a PG hostel.",
            warning: "You MUST select 'Tenant' during signup. If you select the wrong role, you won't see the tenant dashboard and will need to create a new account.",
          },
          {
            title: "Use the SAME Email Your Owner Provided",
            desc: "Your PG owner has already created an invitation using your email address. When you sign up, you MUST use the EXACT SAME email address that your owner used in the invitation. If the emails don't match, your room assignment will NOT work and you won't see your PG details.",
            warning: "ASK YOUR PG OWNER which email they used for your invitation. Sign up with that EXACT email. Example: If your owner entered 'rahul.kumar@gmail.com', you must sign up with 'rahul.kumar@gmail.com' — not 'rahulkumar@gmail.com' or any other variation.",
          },
          {
            title: "Fill In Your Details & Verify Email",
            desc: "Enter your Full Name, the correct Email Address, and a Password (min 6 characters). Click 'Create Account'. Check your email for a verification link and click it to activate your account.",
            tip: "If you don't see the verification email, check your spam/junk folder. Wait 2-3 minutes before trying again.",
          },
          {
            title: "Log In to Your Dashboard",
            desc: "After verification, go back and click 'Sign In'. Enter your email and password. You'll be taken to your Tenant Dashboard where you can see your room details, payments, and more.",
          },
        ],
      },
      {
        title: "2. Onboarding Checklist",
        steps: [
          {
            title: "Complete Your Profile",
            desc: "Go to 'Profile Settings' (click your name/avatar in the sidebar). Add your Phone Number and City. Having a complete profile helps your owner manage things better.",
            image: "/guide/tenant-onboarding.jpg",
          },
          {
            title: "Accept Room Assignment",
            desc: "If your PG owner created an invitation for you, your room will be automatically assigned when you sign up with the matching email. Go to 'Onboarding' page to see your assignment status. If it shows 'Room Assigned' with a green checkmark, you're all set!",
            warning: "If Room Assignment shows as incomplete, it means the email you signed up with doesn't match the invitation. Contact your PG owner to verify the email.",
          },
          {
            title: "Upload ID Proof",
            desc: "Go to 'Documents' → Click 'Upload Document'. Select Document Type (Aadhaar Card, PAN Card, Passport, Driving License, etc.). Upload a clear photo or scan of your ID. Your PG owner will review and approve it.",
            tip: "Take a clear, well-lit photo of your ID. Make sure all text is readable. Blurry photos will be rejected.",
          },
          {
            title: "Add Emergency Contact",
            desc: "Go to 'Profile Settings' and scroll to Emergency Contact section. Add your emergency contact person's Full Name and Phone Number (usually a parent or guardian). This is required for safety.",
          },
          {
            title: "Make First Rent Payment",
            desc: "Go to 'Payments' to see your monthly rent amount. Pay using your owner's UPI ID or bank details (shown on the Payments page). After paying, you can upload payment proof (screenshot of UPI transaction, bank transfer receipt, etc.).",
          },
        ],
      },
      {
        title: "3. Daily Usage",
        steps: [
          {
            title: "View Your Dashboard",
            desc: "Your Tenant Dashboard shows: Room details, Current month's rent status, Recent announcements from your owner, Quick links to all features. Check it regularly for updates.",
          },
          {
            title: "Pay Monthly Rent",
            desc: "Each month, go to 'Payments' to see your rent due. Pay via the UPI/bank details shown. After payment, click 'Upload Proof' to attach your payment receipt. Your owner will verify and mark it as paid.",
            tip: "Pay before the due date to avoid being marked as 'Overdue'. Upload proof immediately after payment for quick verification.",
          },
          {
            title: "Check Meal Menu",
            desc: "If your PG provides meals, go to 'Meal Menu' to see today's and this week's food schedule — Breakfast, Lunch, Dinner, and Snacks.",
          },
          {
            title: "Raise a Complaint",
            desc: "Having an issue? Go to 'Complaints' → 'New Complaint'. Select a Category (Maintenance, Cleanliness, Noise, Food, WiFi, Other), write a Title and Description explaining the problem. Your owner will see it and respond.",
            tip: "Be specific in your complaint description. Instead of 'AC not working', write 'AC in Room 101 is making noise and not cooling since yesterday evening'.",
          },
          {
            title: "View Announcements & Notices",
            desc: "Check 'Announcements' for messages from your PG owner — water timing changes, maintenance schedules, etc. Check 'Notices' for vacancy notices and important updates.",
          },
          {
            title: "Community Chat",
            desc: "Use 'Community Chat' to talk with other tenants in your PG. Share information, coordinate events, or just have conversations with your PG mates.",
          },
          {
            title: "View Utility Bills",
            desc: "Go to 'Utility Bills' to see your electricity and water bills. It shows meter readings, units consumed, rate per unit, and total amount. Pay these separately from rent.",
          },
          {
            title: "Leave a Review",
            desc: "Go to 'Reviews' to rate your PG experience (1-5 stars) and write a review. You can choose to post anonymously. Your review helps future tenants and gives feedback to your owner.",
          },
        ],
      },
    ],
  },
  hi: {
    pageTitle: "उपयोगकर्ता गाइड",
    pageSubtitle: "PG मालिकों और किरायेदारों के लिए संपूर्ण चरण-दर-चरण मार्गदर्शिका",
    ownerTab: "PG मालिकों के लिए",
    tenantTab: "किरायेदारों के लिए",
    stepLabel: "चरण",
    needHelp: "और मदद चाहिए?",
    needHelpDesc: "हमारी सहायता टीम से support@pgmanager.in पर संपर्क करें या सहायता केंद्र पर जाएं।",
    warningLabel: "⚠️ महत्वपूर्ण",
    tipLabel: "💡 सुझाव",
    importantLabel: "महत्वपूर्ण",
    videoSectionTitle: "📹 वीडियो ट्यूटोरियल",
    videoSectionDesc: "पूरा फ्लो समझने के लिए ये वीडियो देखें।",
    ownerVideos: [
      { title: "PG प्रॉपर्टी कैसे सेट करें", description: "अकाउंट बनाना, प्रॉपर्टी जोड़ना, कमरे और सेटिंग्स मैनेज करना।", videoId: "owner-setup-demo" },
      { title: "किरायेदारों को कैसे आमंत्रित करें", description: "इनवाइट कोड भेजना, भुगतान ट्रैक करना और शिकायतें संभालना।", videoId: "owner-tenants-demo" },
      { title: "भुगतान ट्रैकिंग और रिपोर्ट", description: "किराया भुगतान ट्रैक करें, प्रूफ अप्रूव करें।", videoId: "owner-payments-demo" },
    ],
    tenantVideos: [
      { title: "किरायेदार के रूप में कैसे जुड़ें", description: "साइन अप, इनवाइट कोड डालना और डैशबोर्ड एक्सेस।", videoId: "tenant-onboard-demo" },
      { title: "किराया भुगतान और प्रूफ अपलोड", description: "किराया देखें, भुगतान प्रूफ अपलोड करें, रसीद डाउनलोड करें।", videoId: "tenant-payment-demo" },
      { title: "किरायेदार सुविधाएं", description: "शिकायतें, मील मेनू, घोषणाएं, चैट और अधिक।", videoId: "tenant-features-demo" },
    ],
    ownerSections: [
      {
        title: "1. अकाउंट बनाना और लॉगिन",
        steps: [
          {
            title: "PG Manager वेबसाइट खोलें",
            desc: "अपने ब्राउज़र में pgbuddy.lovable.app खोलें। होम पेज पर 'Get Started Free' या 'Sign Up' बटन पर क्लिक करें।",
            image: "/guide/signup-page.jpg",
          },
          {
            title: "'PG Owner' भूमिका चुनें",
            desc: "साइनअप पेज पर दो विकल्प दिखेंगे: 'PG Owner' और 'Tenant'। 'PG Owner' पर क्लिक करें — यह बहुत ज़रूरी है! अगर आप गलत भूमिका चुनते हैं तो आपको मालिक का डैशबोर्ड नहीं दिखेगा।",
            warning: "साइनअप के समय आपको 'PG Owner' चुनना ज़रूरी है। बाद में भूमिका बदली नहीं जा सकती। अगर गलती से 'Tenant' चुन लिया तो नए ईमेल से नया अकाउंट बनाना होगा।",
          },
          {
            title: "अपनी जानकारी भरें",
            desc: "पूरा नाम, ईमेल पता, और पासवर्ड (कम से कम 6 अक्षर) दर्ज करें। असली ईमेल पता इस्तेमाल करें — आपको इसे वेरिफाई करना होगा।",
          },
          {
            title: "अपना ईमेल वेरिफाई करें",
            desc: "'Create Account' पर क्लिक करने के बाद, अपने ईमेल इनबॉक्स (और स्पैम/जंक फ़ोल्डर) में PG Manager से वेरिफिकेशन लिंक देखें। लिंक पर क्लिक करके अकाउंट एक्टिवेट करें।",
            warning: "अगर वेरिफिकेशन ईमेल नहीं दिखता तो स्पैम फ़ोल्डर जांचें। लिंक 24 घंटे में एक्सपायर होता है।",
            tip: "Gmail या पर्सनल ईमेल इस्तेमाल करें। कुछ ऑफिस ईमेल वेरिफिकेशन मेल ब्लॉक कर सकते हैं।",
          },
          {
            title: "लॉगिन करें",
            desc: "वेबसाइट पर वापस जाएं, 'Sign In' पर क्लिक करें, ईमेल और पासवर्ड डालें। आप अपने Owner Dashboard पर पहुंच जाएंगे।",
          },
        ],
      },
      {
        title: "2. अपनी प्रॉपर्टी सेटअप करें",
        steps: [
          {
            title: "Properties पर जाएं",
            desc: "लॉगिन के बाद बाएं साइडबार में 'Properties' पर क्लिक करें। पहली बार में यह पेज खाली होगा।",
            image: "/guide/owner-dashboard.jpg",
          },
          {
            title: "नई प्रॉपर्टी जोड़ें",
            desc: "'Add Property' बटन पर क्लिक करें। भरें: PG का नाम, पूरा पता, शहर, इलाका, विवरण, लड़के/लड़कियों/Co-ed प्रेफरेंस, फ़ोन नंबर, सुविधाएं (WiFi, AC, पार्किंग, लॉन्ड्री, खाना, TV), और नियम।",
            image: "/guide/add-property.jpg",
            tip: "विस्तृत विवरण और सभी सुविधाएं जोड़ें — इससे किरायेदारों को आपका PG ढूंढने में मदद मिलती है।",
          },
          {
            title: "कमरे बनाएं",
            desc: "साइडबार में 'Rooms' पर जाएं, 'Add Room' क्लिक करें। हर कमरे के लिए भरें: कमरा नंबर (जैसे '101'), प्रकार (सिंगल/डबल/ट्रिपल), मासिक किराया (₹), सिक्योरिटी डिपॉजिट (₹), कितने लोग रह सकते हैं।",
            tip: "किराया राशि सही भरें — किरायेदारों को यही राशि पेमेंट सेक्शन में दिखेगी।",
          },
        ],
      },
      {
        title: "3. किरायेदारों को आमंत्रित करें (सबसे ज़रूरी कदम!)",
        steps: [
          {
            title: "Invitations पेज पर जाएं",
            desc: "साइडबार में 'Invitations' पर क्लिक करें। यहां से आप किरायेदारों को प्लेटफ़ॉर्म पर जोड़ सकते हैं।",
            image: "/guide/invite-tenant.jpg",
          },
          {
            title: "नया निमंत्रण बनाएं",
            desc: "'Create Invitation' पर क्लिक करें। भरें: किरायेदार का पूरा नाम, ईमेल पता, फ़ोन नंबर, प्रॉपर्टी चुनें, कमरा चुनें।",
            warning: "जो ईमेल पता आप यहां डालते हैं वो बिल्कुल वही होना चाहिए जो किरायेदार अपना अकाउंट बनाते समय इस्तेमाल करेगा। अगर ईमेल मैच नहीं होता तो किरायेदार अपने कमरे से लिंक नहीं होगा और उसे कोई डेटा नहीं दिखेगा। निमंत्रण बनाने से पहले अपने किरायेदार से ईमेल की पुष्टि करें!",
          },
          {
            title: "इनवाइट कोड शेयर करें",
            desc: "निमंत्रण बनाने के बाद एक इनवाइट कोड मिलेगा (जैसे 'ABC123XY')। यह कोड WhatsApp, SMS या व्यक्तिगत रूप से अपने किरायेदार को दें।",
            warning: "इनवाइट कोड 7 दिन में एक्सपायर होता है। अगर किरायेदार समय पर इस्तेमाल नहीं करता तो नया निमंत्रण बनाना होगा।",
            tip: "WhatsApp पर इस तरह मैसेज भेजें: 'PG Manager पर [इस ईमेल] से साइनअप करें और इनवाइट कोड [कोड] डालें।'",
          },
        ],
      },
      {
        title: "4. किराया और पेमेंट प्रबंधन",
        steps: [
          {
            title: "पेमेंट जानकारी सेट करें",
            desc: "'Payment Settings' में जाएं। अपना UPI ID, बैंक अकाउंट नंबर, IFSC कोड, अकाउंट होल्डर नाम जोड़ें। QR कोड इमेज भी अपलोड कर सकते हैं। यह जानकारी किरायेदारों को दिखाई जाती है।",
            tip: "UPI QR कोड जोड़ना सबसे आसान है — किरायेदार स्कैन करके सीधे पेमेंट कर सकते हैं।",
          },
          {
            title: "किराया पेमेंट ट्रैक करें",
            desc: "'Payments' में सभी मासिक किराया रिकॉर्ड दिखते हैं — किरायेदार का नाम, कमरा, महीना, राशि, स्थिति (Paid/Pending/Overdue)। पैसे मिलने पर 'Paid' मार्क करें।",
            image: "/guide/payments-page.jpg",
          },
          {
            title: "खर्चे ट्रैक करें",
            desc: "'Expenses' में प्रॉपर्टी के खर्चे दर्ज करें — मेंटेनेंस, सफाई, ग्रॉसरी, बिजली बिल आदि। कैटेगरी चुनें, राशि और तारीख डालें।",
          },
        ],
      },
      {
        title: "5. संचार और दैनिक प्रबंधन",
        steps: [
          {
            title: "घोषणाएं पोस्ट करें",
            desc: "'Announcements' में सभी किरायेदारों को संदेश भेजें — पानी की टाइमिंग, मेंटेनेंस शेड्यूल, त्योहार की छुट्टी, नए नियम आदि।",
          },
          {
            title: "शिकायतें संभालें",
            desc: "'Complaints' में किरायेदारों की शिकायतें देखें। समाधान नोट्स जोड़ें और हल होने पर मार्क करें।",
          },
          {
            title: "खाने का मेनू सेट करें",
            desc: "अगर खाना देते हैं तो 'Meal Menu' में रोज़ का शेड्यूल सेट करें — नाश्ता, दोपहर का खाना, रात का खाना, स्नैक्स।",
          },
          {
            title: "यूटिलिटी बिल प्रबंधित करें",
            desc: "'Utility Bills' में बिजली और पानी की खपत ट्रैक करें। पिछली और वर्तमान मीटर रीडिंग डालें — सिस्टम अपने आप बिल कैलकुलेट करता है।",
          },
          {
            title: "विज़िटर लॉग",
            desc: "'Visitor Log' में सभी मेहमानों का रिकॉर्ड रखें — नाम, फ़ोन, उद्देश्य, चेक-इन/चेक-आउट समय।",
          },
          {
            title: "दस्तावेज़ की समीक्षा करें",
            desc: "'Documents' में किरायेदारों द्वारा अपलोड किए गए ID प्रूफ देखें। अनुमोदित या अस्वीकृत करें।",
          },
        ],
      },
    ],
    tenantSections: [
      {
        title: "1. अकाउंट बनाना और लॉगिन",
        steps: [
          {
            title: "PG Manager वेबसाइट खोलें",
            desc: "ब्राउज़र में pgbuddy.lovable.app खोलें। 'Get Started Free' या 'Sign Up' पर क्लिक करें।",
            image: "/guide/signup-page.jpg",
          },
          {
            title: "'Tenant' भूमिका चुनें",
            desc: "साइनअप पेज पर 'Tenant' पर क्लिक करें। 'PG Owner' न चुनें — वह सिर्फ PG मालिकों के लिए है।",
            warning: "साइनअप के समय 'Tenant' चुनना ज़रूरी है। गलत भूमिका चुनने पर नया अकाउंट बनाना होगा।",
          },
          {
            title: "वही ईमेल इस्तेमाल करें जो मालिक ने दिया है",
            desc: "आपके PG मालिक ने आपके ईमेल से निमंत्रण बनाया है। साइनअप करते समय बिल्कुल वही ईमेल इस्तेमाल करें। अगर ईमेल अलग हुआ तो कमरा असाइनमेंट काम नहीं करेगा।",
            warning: "अपने PG मालिक से पूछें कि उन्होंने कौन सा ईमेल डाला है। उसी ईमेल से साइनअप करें। उदाहरण: अगर मालिक ने 'rahul.kumar@gmail.com' डाला है तो आपको भी 'rahul.kumar@gmail.com' से साइनअप करना होगा।",
          },
          {
            title: "जानकारी भरें और ईमेल वेरिफाई करें",
            desc: "पूरा नाम, सही ईमेल, और पासवर्ड डालें। 'Create Account' पर क्लिक करें। ईमेल में वेरिफिकेशन लिंक आएगा — उस पर क्लिक करें।",
            tip: "वेरिफिकेशन ईमेल नहीं दिखे तो स्पैम फ़ोल्डर जांचें। 2-3 मिनट इंतज़ार करें।",
          },
          {
            title: "डैशबोर्ड पर लॉगिन करें",
            desc: "वेरिफिकेशन के बाद 'Sign In' पर क्लिक करें। ईमेल और पासवर्ड डालें। आप अपने Tenant Dashboard पर पहुंच जाएंगे।",
          },
        ],
      },
      {
        title: "2. ऑनबोर्डिंग चेकलिस्ट",
        steps: [
          {
            title: "प्रोफ़ाइल पूरा करें",
            desc: "'Profile Settings' में जाएं। फ़ोन नंबर और शहर जोड़ें।",
            image: "/guide/tenant-onboarding.jpg",
          },
          {
            title: "कमरा असाइनमेंट स्वीकारें",
            desc: "अगर मालिक ने निमंत्रण बनाया है और आपने सही ईमेल से साइनअप किया है, तो कमरा अपने आप असाइन हो जाएगा। 'Onboarding' पेज पर स्थिति देखें।",
            warning: "अगर कमरा असाइनमेंट अधूरा दिखता है, तो ईमेल मैच नहीं हो रहा। अपने PG मालिक से संपर्क करें।",
          },
          {
            title: "ID प्रूफ अपलोड करें",
            desc: "'Documents' → 'Upload Document' पर जाएं। दस्तावेज़ प्रकार चुनें (आधार, PAN, पासपोर्ट, ड्राइविंग लाइसेंस)। साफ़ फोटो अपलोड करें।",
            tip: "अपनी ID की साफ़, अच्छी रोशनी वाली फोटो लें। धुंधली फोटो अस्वीकार हो जाएगी।",
          },
          {
            title: "आपातकालीन संपर्क जोड़ें",
            desc: "'Profile Settings' में Emergency Contact सेक्शन में नाम और फ़ोन नंबर जोड़ें (आमतौर पर माता-पिता)।",
          },
          {
            title: "पहला किराया भुगतान करें",
            desc: "'Payments' में मासिक किराया देखें। मालिक के UPI या बैंक डिटेल्स से पेमेंट करें। पेमेंट के बाद रसीद अपलोड करें।",
          },
        ],
      },
      {
        title: "3. दैनिक उपयोग",
        steps: [
          {
            title: "डैशबोर्ड देखें",
            desc: "Tenant Dashboard पर कमरे की जानकारी, किराया स्थिति, हाल की घोषणाएं दिखती हैं। नियमित रूप से जांचें।",
          },
          {
            title: "मासिक किराया भुगतान करें",
            desc: "हर महीने 'Payments' में किराया देखें। UPI/बैंक से भुगतान करें। भुगतान के बाद 'Upload Proof' पर क्लिक करें।",
            tip: "समय पर भुगतान करें ताकि 'Overdue' न दिखे। भुगतान के तुरंत बाद प्रूफ अपलोड करें।",
          },
          {
            title: "खाने का मेनू देखें",
            desc: "'Meal Menu' में आज का और इस हफ़्ते का खाने का शेड्यूल देखें।",
          },
          {
            title: "शिकायत दर्ज करें",
            desc: "'Complaints' → 'New Complaint' पर जाएं। कैटेगरी चुनें, शीर्षक और विवरण लिखें।",
            tip: "शिकायत में विस्तार से लिखें। 'AC नहीं चल रहा' की जगह 'कमरा 101 का AC कल शाम से आवाज़ कर रहा है और ठंडा नहीं कर रहा' लिखें।",
          },
          {
            title: "घोषणाएं और नोटिस देखें",
            desc: "'Announcements' में मालिक के संदेश देखें। 'Notices' में ज़रूरी अपडेट्स देखें।",
          },
          {
            title: "कम्युनिटी चैट",
            desc: "'Community Chat' में अपने PG के अन्य किरायेदारों से बात करें।",
          },
          {
            title: "यूटिलिटी बिल देखें",
            desc: "'Utility Bills' में बिजली और पानी के बिल देखें — मीटर रीडिंग, खपत, और कुल राशि।",
          },
          {
            title: "रिव्यू दें",
            desc: "'Reviews' में अपने PG को रेटिंग (1-5 स्टार) और रिव्यू दें। गुमनाम रूप से भी दे सकते हैं।",
          },
        ],
      },
    ],
  },
  mr: {
    pageTitle: "वापरकर्ता मार्गदर्शक",
    pageSubtitle: "PG मालक आणि भाडेकरूंसाठी संपूर्ण स्टेप-बाय-स्टेप मार्गदर्शक",
    ownerTab: "PG मालकांसाठी",
    tenantTab: "भाडेकरूंसाठी",
    stepLabel: "पायरी",
    needHelp: "अधिक मदत हवी आहे?",
    needHelpDesc: "आमच्या सपोर्ट टीमशी support@pgmanager.in वर संपर्क साधा.",
    warningLabel: "⚠️ महत्त्वाचे",
    tipLabel: "💡 टीप",
    importantLabel: "महत्त्वाचे",
    videoSectionTitle: "📹 व्हिडिओ ट्यूटोरियल",
    videoSectionDesc: "संपूर्ण प्रवाह समजून घेण्यासाठी हे व्हिडिओ पहा.",
    ownerVideos: [
      { title: "PG प्रॉपर्टी कशी सेट करावी", description: "खाते तयार करणे, प्रॉपर्टी जोडणे, खोल्या आणि सेटिंग्ज.", videoId: "owner-setup-demo" },
      { title: "भाडेकरूंना कसे आमंत्रित करावे", description: "इन्व्हाइट कोड पाठवणे, पेमेंट ट्रॅक करणे.", videoId: "owner-tenants-demo" },
      { title: "पेमेंट ट्रॅकिंग आणि रिपोर्ट", description: "भाडे पेमेंट ट्रॅक करा, प्रूफ मंजूर करा.", videoId: "owner-payments-demo" },
    ],
    tenantVideos: [
      { title: "भाडेकरू म्हणून कसे सामील व्हावे", description: "साइन अप, इन्व्हाइट कोड टाका आणि डॅशबोर्ड.", videoId: "tenant-onboard-demo" },
      { title: "भाडे भरणे आणि प्रूफ अपलोड", description: "भाडे पहा, पेमेंट प्रूफ अपलोड करा.", videoId: "tenant-payment-demo" },
      { title: "भाडेकरू सुविधा", description: "तक्रारी, जेवण मेनू, घोषणा, चॅट.", videoId: "tenant-features-demo" },
    ],
    ownerSections: [
      {
        title: "1. खाते तयार करणे आणि लॉगिन",
        steps: [
          { title: "PG Manager वेबसाइट उघडा", desc: "ब्राउझरमध्ये pgbuddy.lovable.app उघडा. 'Get Started Free' किंवा 'Sign Up' बटणावर क्लिक करा.", image: "/guide/signup-page.jpg" },
          { title: "'PG Owner' भूमिका निवडा", desc: "साइनअप पेजवर 'PG Owner' वर क्लिक करा. चुकीची भूमिका निवडल्यास मालक डॅशबोर्ड दिसणार नाही.", warning: "साइनअप वेळी 'PG Owner' निवडणे अनिवार्य आहे. नंतर बदलता येत नाही." },
          { title: "तपशील भरा", desc: "पूर्ण नाव, ईमेल आणि पासवर्ड (किमान 6 अक्षरे) भरा." },
          { title: "ईमेल सत्यापित करा", desc: "'Create Account' नंतर ईमेलमध्ये verification लिंक तपासा. लिंकवर क्लिक करून खाते activate करा.", warning: "Spam फोल्डर तपासा. लिंक 24 तासांत expire होते." },
          { title: "लॉगिन करा", desc: "'Sign In' वर क्लिक करा, ईमेल आणि पासवर्ड टाका. Owner Dashboard उघडेल." },
        ],
      },
      {
        title: "2. प्रॉपर्टी सेटअप करा",
        steps: [
          { title: "Properties वर जा", desc: "डॅशबोर्डमध्ये 'Properties' वर क्लिक करा.", image: "/guide/owner-dashboard.jpg" },
          { title: "नवीन प्रॉपर्टी जोडा", desc: "'Add Property' वर क्लिक करा. PG नाव, पत्ता, शहर, सुविधा, नियम भरा.", image: "/guide/add-property.jpg" },
          { title: "खोल्या तयार करा", desc: "'Rooms' मध्ये जा, खोली नंबर, प्रकार, भाडे, डिपॉझिट, क्षमता भरा." },
        ],
      },
      {
        title: "3. भाडेकरूंना आमंत्रित करा (सर्वात महत्त्वाचे!)",
        steps: [
          { title: "Invitations पेजवर जा", desc: "'Invitations' वर क्लिक करा.", image: "/guide/invite-tenant.jpg" },
          { title: "नवीन आमंत्रण तयार करा", desc: "भाडेकरूचे नाव, ईमेल, फोन, प्रॉपर्टी, खोली निवडा.", warning: "तुम्ही इथे जो ईमेल टाकता तो भाडेकरू अकाउंट बनवताना वापरत असलेल्या ईमेलशी बरोबर जुळला पाहिजे. ईमेल जुळले नाही तर भाडेकरूला कोणताही डेटा दिसणार नाही!" },
          { title: "इनव्हाइट कोड शेअर करा", desc: "कोड WhatsApp, SMS किंवा वैयक्तिकरित्या भाडेकरूला द्या.", warning: "कोड 7 दिवसांत expire होतो.", tip: "WhatsApp वर मेसेज पाठवा: 'PG Manager वर [या ईमेलने] साइनअप करा आणि कोड [कोड] वापरा.'" },
        ],
      },
      {
        title: "4. भाडे आणि पेमेंट व्यवस्थापन",
        steps: [
          { title: "पेमेंट माहिती सेट करा", desc: "'Payment Settings' मध्ये UPI ID, बँक तपशील, QR कोड जोडा." },
          { title: "भाडे पेमेंट ट्रॅक करा", desc: "'Payments' मध्ये सर्व रेकॉर्ड पहा. पैसे मिळाल्यावर 'Paid' मार्क करा.", image: "/guide/payments-page.jpg" },
          { title: "खर्च ट्रॅक करा", desc: "'Expenses' मध्ये देखभाल, ग्रॉसरी इ. खर्च नोंदवा." },
        ],
      },
      {
        title: "5. संवाद आणि दैनंदिन व्यवस्थापन",
        steps: [
          { title: "घोषणा पोस्ट करा", desc: "'Announcements' मधून सर्व भाडेकरूंना संदेश पाठवा." },
          { title: "तक्रारी सोडवा", desc: "'Complaints' मध्ये तक्रारी पहा आणि सोडवा." },
          { title: "जेवणाचे मेनू सेट करा", desc: "'Meal Menu' मध्ये दैनिक शेड्यूल सेट करा." },
          { title: "युटिलिटी बिले", desc: "'Utility Bills' मध्ये वीज-पाणी वापर ट्रॅक करा." },
          { title: "विजिटर लॉग", desc: "'Visitor Log' मध्ये पाहुण्यांचे रेकॉर्ड ठेवा." },
          { title: "कागदपत्रे तपासा", desc: "'Documents' मध्ये भाडेकरूंचे ID प्रूफ पहा." },
        ],
      },
    ],
    tenantSections: [
      {
        title: "1. खाते तयार करणे आणि लॉगिन",
        steps: [
          { title: "PG Manager वेबसाइट उघडा", desc: "pgbuddy.lovable.app उघडा. 'Sign Up' वर क्लिक करा.", image: "/guide/signup-page.jpg" },
          { title: "'Tenant' भूमिका निवडा", desc: "'Tenant' वर क्लिक करा.", warning: "'PG Owner' निवडू नका — ते फक्त मालकांसाठी आहे." },
          { title: "मालकांनी दिलेला तोच ईमेल वापरा", desc: "तुमच्या PG मालकांनी ज्या ईमेलने आमंत्रण तयार केले तोच ईमेल साइनअप करताना वापरा.", warning: "ईमेल जुळले नाही तर खोली assignment काम करणार नाही. मालकांना विचारा कोणता ईमेल वापरला." },
          { title: "तपशील भरा आणि ईमेल सत्यापित करा", desc: "पूर्ण नाव, योग्य ईमेल, पासवर्ड भरा. 'Create Account' नंतर ईमेलमध्ये verification लिंक क्लिक करा." },
          { title: "डॅशबोर्डवर लॉगिन करा", desc: "ईमेल सत्यापनानंतर 'Sign In' करा. Tenant Dashboard उघडेल." },
        ],
      },
      {
        title: "2. ऑनबोर्डिंग चेकलिस्ट",
        steps: [
          { title: "प्रोफाइल पूर्ण करा", desc: "'Profile Settings' मध्ये फोन नंबर आणि शहर जोडा.", image: "/guide/tenant-onboarding.jpg" },
          { title: "खोली assignment स्वीकारा", desc: "योग्य ईमेलने साइनअप केल्यावर खोली आपोआप assign होते.", warning: "Assignment अपूर्ण दिसत असल्यास ईमेल जुळत नाही. मालकांशी संपर्क साधा." },
          { title: "ID प्रूफ अपलोड करा", desc: "'Documents' → 'Upload Document' मध्ये आधार, PAN इ. अपलोड करा.", tip: "स्पष्ट फोटो काढा. धूसर फोटो नाकारले जातील." },
          { title: "आपत्कालीन संपर्क जोडा", desc: "Emergency Contact मध्ये नाव आणि फोन नंबर भरा." },
          { title: "पहिले भाडे भरा", desc: "'Payments' मध्ये भाडे पहा. UPI/बँकने भरा आणि पावती अपलोड करा." },
        ],
      },
      {
        title: "3. दैनंदिन वापर",
        steps: [
          { title: "डॅशबोर्ड पहा", desc: "खोली माहिती, भाडे स्थिती, घोषणा नियमितपणे तपासा." },
          { title: "मासिक भाडे भरा", desc: "दर महिन्याला 'Payments' मध्ये भाडे भरा आणि प्रूफ अपलोड करा.", tip: "वेळेवर भरा म्हणजे 'Overdue' दिसणार नाही." },
          { title: "जेवणाचे मेनू पहा", desc: "'Meal Menu' मध्ये दैनिक शेड्यूल पहा." },
          { title: "तक्रार नोंदवा", desc: "'Complaints' → 'New Complaint' मध्ये समस्या लिहा.", tip: "तक्रारीत तपशीलवार लिहा." },
          { title: "घोषणा आणि नोटिस", desc: "'Announcements' आणि 'Notices' मध्ये अपडेट्स पहा." },
          { title: "कम्युनिटी चॅट", desc: "इतर भाडेकरूंशी 'Community Chat' मध्ये बोला." },
          { title: "युटिलिटी बिले", desc: "'Utility Bills' मध्ये वीज-पाणी बिल पहा." },
          { title: "रिव्ह्यू द्या", desc: "'Reviews' मध्ये रेटिंग आणि रिव्ह्यू द्या." },
        ],
      },
    ],
  },
  ta: {
    pageTitle: "பயனர் வழிகாட்டி",
    pageSubtitle: "PG உரிமையாளர்கள் மற்றும் குடியிருப்பாளர்களுக்கான முழுமையான வழிகாட்டி",
    ownerTab: "PG உரிமையாளர்களுக்கு",
    tenantTab: "குடியிருப்பாளர்களுக்கு",
    stepLabel: "படி",
    needHelp: "மேலும் உதவி வேண்டுமா?",
    needHelpDesc: "support@pgmanager.in இல் எங்கள் ஆதரவு குழுவை தொடர்புகொள்ளுங்கள்.",
    warningLabel: "⚠️ முக்கியம்",
    tipLabel: "💡 குறிப்பு",
    importantLabel: "முக்கியம்",
    videoSectionTitle: "📹 வீடியோ வழிகாட்டிகள்",
    videoSectionDesc: "முழு செயல்முறையை புரிந்துகொள்ள இந்த வீடியோக்களைப் பாருங்கள்.",
    ownerVideos: [
      { title: "PG சொத்தை எவ்வாறு அமைப்பது", description: "கணக்கு உருவாக்கம், சொத்து சேர்த்தல், அறைகள்.", videoId: "owner-setup-demo" },
      { title: "குடியிருப்பாளர்களை அழைப்பது", description: "அழைப்புக் குறியீடு அனுப்புதல், கட்டணம் கண்காணிப்பு.", videoId: "owner-tenants-demo" },
      { title: "கட்டண கண்காணிப்பு", description: "வாடகை கட்டணம் கண்காணிக்கவும்.", videoId: "owner-payments-demo" },
    ],
    tenantVideos: [
      { title: "குடியிருப்பாளராக சேர்வது", description: "பதிவு செய்து அழைப்புக் குறியீடு உள்ளிடவும்.", videoId: "tenant-onboard-demo" },
      { title: "வாடகை செலுத்துதல்", description: "வாடகை பார்க்கவும், ஆதாரம் பதிவேற்றவும்.", videoId: "tenant-payment-demo" },
      { title: "குடியிருப்பாளர் அம்சங்கள்", description: "புகார்கள், உணவு, அறிவிப்புகள், அரட்டை.", videoId: "tenant-features-demo" },
    ],
    ownerSections: [
      {
        title: "1. கணக்கு உருவாக்கம் & உள்நுழைவு",
        steps: [
          { title: "PG Manager வலைத்தளத்தைத் திறக்கவும்", desc: "pgbuddy.lovable.app என்ற முகவரியைத் திறந்து 'Sign Up' கிளிக் செய்யுங்கள்.", image: "/guide/signup-page.jpg" },
          { title: "'PG Owner' பங்கைத் தேர்ந்தெடுக்கவும்", desc: "'PG Owner' மீது கிளிக் செய்யுங்கள்.", warning: "பதிவு செய்யும்போது 'PG Owner' தேர்வு செய்வது கட்டாயம். பிறகு மாற்ற இயலாது." },
          { title: "விவரங்களை நிரப்பவும்", desc: "முழு பெயர், மின்னஞ்சல், கடவுச்சொல் (குறைந்தது 6 எழுத்துகள்) உள்ளிடவும்." },
          { title: "மின்னஞ்சலை சரிபார்க்கவும்", desc: "உங்கள் மின்னஞ்சலில் வரும் சரிபார்ப்பு இணைப்பை கிளிக் செய்யுங்கள்.", warning: "Spam கோப்புறையைச் சரிபார்க்கவும். இணைப்பு 24 மணி நேரத்தில் காலாவதியாகும்." },
          { title: "உள்நுழையவும்", desc: "'Sign In' கிளிக் செய்து மின்னஞ்சல் மற்றும் கடவுச்சொல் உள்ளிடவும்." },
        ],
      },
      {
        title: "2. சொத்தை அமைக்கவும்",
        steps: [
          { title: "Properties க்கு செல்லுங்கள்", desc: "Dashboard இல் 'Properties' கிளிக் செய்யுங்கள்.", image: "/guide/owner-dashboard.jpg" },
          { title: "புதிய சொத்தைச் சேர்க்கவும்", desc: "'Add Property' கிளிக் செய்து PG பெயர், முகவரி, நகரம், வசதிகள், விதிகள் நிரப்பவும்.", image: "/guide/add-property.jpg" },
          { title: "அறைகளை உருவாக்கவும்", desc: "'Rooms' → 'Add Room' இல் அறை எண், வகை, வாடகை, வைப்புத்தொகை நிரப்பவும்." },
        ],
      },
      {
        title: "3. குடியிருப்பாளர்களை அழைக்கவும் (மிக முக்கியம்!)",
        steps: [
          { title: "Invitations பக்கத்திற்குச் செல்லவும்", desc: "'Invitations' கிளிக் செய்யுங்கள்.", image: "/guide/invite-tenant.jpg" },
          { title: "புதிய அழைப்பை உருவாக்கவும்", desc: "குடியிருப்பாளர் பெயர், மின்னஞ்சல், தொலைபேசி, சொத்து, அறை தேர்ந்தெடுக்கவும்.", warning: "நீங்கள் இங்கே உள்ளிடும் மின்னஞ்சல் குடியிருப்பாளர் கணக்கு உருவாக்கும்போது பயன்படுத்தும் மின்னஞ்சலுடன் சரியாகப் பொருந்த வேண்டும். பொருந்தவில்லை என்றால் தரவு எதுவும் தெரியாது!" },
          { title: "அழைப்புக் குறியீட்டைப் பகிரவும்", desc: "குறியீட்டை WhatsApp, SMS மூலம் பகிரவும்.", warning: "குறியீடு 7 நாட்களில் காலாவதியாகும்." },
        ],
      },
      {
        title: "4. வாடகை & கட்டண மேலாண்மை",
        steps: [
          { title: "கட்டணத் தகவலை அமைக்கவும்", desc: "'Payment Settings' இல் UPI ID, வங்கி விவரங்கள் சேர்க்கவும்." },
          { title: "வாடகை கட்டணங்களைக் கண்காணிக்கவும்", desc: "'Payments' இல் அனைத்து பதிவுகளைப் பார்க்கவும்.", image: "/guide/payments-page.jpg" },
          { title: "செலவுகளைக் கண்காணிக்கவும்", desc: "'Expenses' இல் பராமரிப்பு, மளிகை போன்ற செலவுகளைப் பதிவு செய்யுங்கள்." },
        ],
      },
      {
        title: "5. தொடர்பு & தினசரி மேலாண்மை",
        steps: [
          { title: "அறிவிப்புகளை வெளியிடுங்கள்", desc: "'Announcements' மூலம் அனைத்து குடியிருப்பாளர்களுக்கும் செய்திகள் அனுப்புங்கள்." },
          { title: "புகார்களை தீர்க்கவும்", desc: "'Complaints' இல் புகார்களைப் பார்த்து தீர்க்கவும்." },
          { title: "உணவு பட்டியல்", desc: "'Meal Menu' இல் தினசரி அட்டவணை அமைக்கவும்." },
          { title: "பயன்பாட்டு பில்கள்", desc: "'Utility Bills' இல் மின்சாரம் மற்றும் நீர் பயன்பாட்டைக் கண்காணிக்கவும்." },
          { title: "பார்வையாளர் பதிவு", desc: "'Visitor Log' இல் பார்வையாளர் பதிவுகளை வைக்கவும்." },
          { title: "ஆவணங்களை சரிபார்க்கவும்", desc: "'Documents' இல் குடியிருப்பாளர்களின் ID ஆதாரங்களைப் பார்க்கவும்." },
        ],
      },
    ],
    tenantSections: [
      {
        title: "1. கணக்கு உருவாக்கம் & உள்நுழைவு",
        steps: [
          { title: "வலைத்தளத்தைத் திறக்கவும்", desc: "pgbuddy.lovable.app திறந்து 'Sign Up' கிளிக் செய்யுங்கள்.", image: "/guide/signup-page.jpg" },
          { title: "'Tenant' தேர்ந்தெடுக்கவும்", desc: "'Tenant' கிளிக் செய்யுங்கள்.", warning: "'PG Owner' தேர்வு செய்யாதீர்கள்." },
          { title: "உரிமையாளர் கொடுத்த அதே மின்னஞ்சலைப் பயன்படுத்தவும்", desc: "உரிமையாளர் அழைப்பில் பயன்படுத்திய அதே மின்னஞ்சலில் பதிவு செய்யுங்கள்.", warning: "மின்னஞ்சல் பொருந்தவில்லை என்றால் அறை ஒதுக்கீடு வேலை செய்யாது. உரிமையாளரிடம் கேளுங்கள்." },
          { title: "விவரங்களை நிரப்பி மின்னஞ்சலை சரிபார்க்கவும்", desc: "பெயர், மின்னஞ்சல், கடவுச்சொல் நிரப்பி சரிபார்ப்பு இணைப்பை கிளிக் செய்யுங்கள்." },
          { title: "உள்நுழையவும்", desc: "சரிபார்ப்புக்குப் பிறகு 'Sign In' செய்யுங்கள்." },
        ],
      },
      {
        title: "2. ஆன்போர்டிங் சரிபார்ப்புப் பட்டியல்",
        steps: [
          { title: "சுயவிவரத்தை நிறைவு செய்யுங்கள்", desc: "தொலைபேசி எண் மற்றும் நகரத்தைச் சேர்க்கவும்.", image: "/guide/tenant-onboarding.jpg" },
          { title: "அறை ஒதுக்கீட்டை ஏற்கவும்", desc: "சரியான மின்னஞ்சலில் பதிவு செய்தால் அறை தானாக ஒதுக்கப்படும்.", warning: "ஒதுக்கீடு முழுமையடையவில்லை என்றால் உரிமையாளரைத் தொடர்புகொள்ளுங்கள்." },
          { title: "ID ஆதாரத்தை பதிவேற்றவும்", desc: "'Documents' → 'Upload Document' இல் ஆதார், PAN போன்றவற்றைப் பதிவேற்றுங்கள்." },
          { title: "அவசர தொடர்பை சேர்க்கவும்", desc: "Emergency Contact இல் பெயர் மற்றும் எண் நிரப்பவும்." },
          { title: "முதல் வாடகையை செலுத்தவும்", desc: "'Payments' இல் வாடகையைப் பார்த்து UPI/வங்கி மூலம் செலுத்தி ரசீது பதிவேற்றுங்கள்." },
        ],
      },
      {
        title: "3. தினசரி பயன்பாடு",
        steps: [
          { title: "டாஷ்போர்டைப் பார்க்கவும்", desc: "அறை விவரங்கள், வாடகை நிலை, அறிவிப்புகளை தொடர்ந்து பார்க்கவும்." },
          { title: "மாத வாடகை செலுத்தவும்", desc: "ஒவ்வொரு மாதமும் 'Payments' இல் வாடகை செலுத்தி ரசீது பதிவேற்றுங்கள்.", tip: "தாமதமாகாமல் செலுத்துங்கள்." },
          { title: "உணவு பட்டியல்", desc: "'Meal Menu' இல் தினசரி உணவு அட்டவணையைப் பார்க்கவும்." },
          { title: "புகார் செய்யுங்கள்", desc: "'Complaints' → 'New Complaint' இல் விவரமாக எழுதுங்கள்." },
          { title: "அறிவிப்புகள்", desc: "'Announcements' மற்றும் 'Notices' பார்க்கவும்." },
          { title: "சமூக அரட்டை", desc: "'Community Chat' இல் மற்ற குடியிருப்பாளர்களுடன் பேசுங்கள்." },
          { title: "பயன்பாட்டு பில்கள்", desc: "'Utility Bills' இல் மின்சாரம் மற்றும் நீர் பில் பார்க்கவும்." },
          { title: "மதிப்பாய்வு", desc: "'Reviews' இல் மதிப்பீடு மற்றும் கருத்து தெரிவிக்கவும்." },
        ],
      },
    ],
  },
  te: {
    pageTitle: "వినియోగదారు గైడ్",
    pageSubtitle: "PG యజమానులు మరియు అద్దెదారుల కోసం పూర్తి దశల వారీ గైడ్",
    ownerTab: "PG యజమానుల కోసం",
    tenantTab: "అద్దెదారుల కోసం",
    stepLabel: "దశ",
    needHelp: "మరింత సహాయం కావాలా?",
    needHelpDesc: "support@pgmanager.in కు ఇమెయిల్ పంపండి.",
    warningLabel: "⚠️ ముఖ్యం",
    tipLabel: "💡 చిట్కా",
    importantLabel: "ముఖ్యం",
    videoSectionTitle: "📹 వీడియో ట్యుటోరియల్స్",
    videoSectionDesc: "పూర్తి ప్రవాహాన్ని అర్థం చేసుకోవడానికి ఈ వీడియోలు చూడండి.",
    ownerVideos: [
      { title: "PG ప్రాపర్టీని ఎలా సెటప్ చేయాలి", description: "ఖాతా సృష్టించడం, ప్రాపర్టీ జోడించడం, గదులు.", videoId: "owner-setup-demo" },
      { title: "అద్దెదారులను ఆహ్వానించడం", description: "ఆహ్వాన కోడ్ పంపడం, చెల్లింపులు ట్రాక్ చేయడం.", videoId: "owner-tenants-demo" },
      { title: "చెల్లింపు ట్రాకింగ్", description: "అద్దె చెల్లింపులు ట్రాక్ చేయండి.", videoId: "owner-payments-demo" },
    ],
    tenantVideos: [
      { title: "అద్దెదారుగా చేరడం", description: "సైన్ అప్, ఆహ్వాన కోడ్ నమోదు చేయండి.", videoId: "tenant-onboard-demo" },
      { title: "అద్దె చెల్లించడం", description: "అద్దె చూడండి, రుజువు అప్‌లోడ్ చేయండి.", videoId: "tenant-payment-demo" },
      { title: "అద్దెదారు ఫీచర్లు", description: "ఫిర్యాదులు, భోజనం, ప్రకటనలు, చాట్.", videoId: "tenant-features-demo" },
    ],
    ownerSections: [
      {
        title: "1. ఖాతా సృష్టించడం & లాగిన్",
        steps: [
          { title: "వెబ్‌సైట్ తెరవండి", desc: "pgbuddy.lovable.app తెరిచి 'Sign Up' క్లిక్ చేయండి.", image: "/guide/signup-page.jpg" },
          { title: "'PG Owner' ఎంచుకోండి", desc: "'PG Owner' మీద క్లిక్ చేయండి.", warning: "సైన్అప్ సమయంలో 'PG Owner' ఎంచుకోవడం తప్పనిసరి." },
          { title: "వివరాలు నమోదు చేయండి", desc: "పూర్తి పేరు, ఇమెయిల్, పాస్‌వర్డ్ నమోదు చేయండి." },
          { title: "ఇమెయిల్ వెరిఫై చేయండి", desc: "ఇమెయిల్‌లో వచ్చిన వెరిఫికేషన్ లింక్ క్లిక్ చేయండి.", warning: "Spam ఫోల్డర్ చెక్ చేయండి." },
          { title: "లాగిన్ చేయండి", desc: "'Sign In' క్లిక్ చేసి ఇమెయిల్, పాస్‌వర్డ్ ఎంటర్ చేయండి." },
        ],
      },
      {
        title: "2. ప్రాపర్టీ సెటప్",
        steps: [
          { title: "Properties కి వెళ్ళండి", desc: "డ్యాష్‌బోర్డ్‌లో 'Properties' క్లిక్ చేయండి.", image: "/guide/owner-dashboard.jpg" },
          { title: "కొత్త ప్రాపర్టీ జోడించండి", desc: "PG పేరు, చిరునామా, నగరం, సౌకర్యాలు, నియమాలు నమోదు చేయండి.", image: "/guide/add-property.jpg" },
          { title: "గదులు సృష్టించండి", desc: "గది నంబర్, రకం, అద్దె, డిపాజిట్ నమోదు చేయండి." },
        ],
      },
      {
        title: "3. అద్దెదారులను ఆహ్వానించండి (అత్యంత ముఖ్యం!)",
        steps: [
          { title: "Invitations పేజీకి వెళ్ళండి", desc: "'Invitations' క్లిక్ చేయండి.", image: "/guide/invite-tenant.jpg" },
          { title: "కొత్త ఆహ్వానం సృష్టించండి", desc: "అద్దెదారు పేరు, ఇమెయిల్, ఫోన్, ప్రాపర్టీ, గది ఎంచుకోండి.", warning: "మీరు ఇక్కడ ఎంటర్ చేసే ఇమెయిల్ అద్దెదారు అకౌంట్ క్రియేట్ చేసేటప్పుడు వాడే ఇమెయిల్‌తో సరిగ్గా సరిపోలాలి. సరిపోలకపోతే డేటా కనిపించదు!" },
          { title: "ఇన్‌వైట్ కోడ్ షేర్ చేయండి", desc: "కోడ్‌ను WhatsApp, SMS ద్వారా షేర్ చేయండి.", warning: "కోడ్ 7 రోజుల్లో ఎక్స్‌పైర్ అవుతుంది." },
        ],
      },
      {
        title: "4. అద్దె & చెల్లింపుల నిర్వహణ",
        steps: [
          { title: "చెల్లింపు సమాచారం సెట్ చేయండి", desc: "UPI ID, బ్యాంక్ వివరాలు జోడించండి." },
          { title: "అద్దె చెల్లింపులు ట్రాక్ చేయండి", desc: "'Payments'లో అన్ని రికార్డులు చూడండి.", image: "/guide/payments-page.jpg" },
          { title: "ఖర్చులు ట్రాక్ చేయండి", desc: "'Expenses'లో నిర్వహణ ఖర్చులు నమోదు చేయండి." },
        ],
      },
      {
        title: "5. కమ్యూనికేషన్ & రోజువారీ నిర్వహణ",
        steps: [
          { title: "ప్రకటనలు పోస్ట్ చేయండి", desc: "'Announcements' ద్వారా సందేశాలు పంపండి." },
          { title: "ఫిర్యాదులు పరిష్కరించండి", desc: "'Complaints'లో ఫిర్యాదులు చూసి పరిష్కరించండి." },
          { title: "భోజన మెనూ", desc: "'Meal Menu'లో రోజువారీ షెడ్యూల్ సెట్ చేయండి." },
          { title: "యుటిలిటీ బిల్లులు", desc: "'Utility Bills'లో విద్యుత్ నీటి వాడకం ట్రాక్ చేయండి." },
          { title: "సందర్శకుల లాగ్", desc: "'Visitor Log'లో రికార్డులు ఉంచండి." },
          { title: "పత్రాలు సమీక్షించండి", desc: "'Documents'లో ID ప్రూఫ్‌లు చూడండి." },
        ],
      },
    ],
    tenantSections: [
      {
        title: "1. ఖాతా సృష్టించడం & లాగిన్",
        steps: [
          { title: "వెబ్‌సైట్ తెరవండి", desc: "'Sign Up' క్లిక్ చేయండి.", image: "/guide/signup-page.jpg" },
          { title: "'Tenant' ఎంచుకోండి", desc: "'Tenant' క్లిక్ చేయండి.", warning: "'PG Owner' ఎంచుకోకండి." },
          { title: "యజమాని ఇచ్చిన అదే ఇమెయిల్ వాడండి", desc: "యజమాని ఆహ్వానంలో వాడిన అదే ఇమెయిల్‌తో సైన్అప్ చేయండి.", warning: "ఇమెయిల్ సరిపోలకపోతే గది అసైన్‌మెంట్ పనిచేయదు." },
          { title: "వివరాలు నమోదు చేసి ఇమెయిల్ వెరిఫై చేయండి", desc: "పేరు, ఇమెయిల్, పాస్‌వర్డ్ ఎంటర్ చేసి వెరిఫికేషన్ లింక్ క్లిక్ చేయండి." },
          { title: "లాగిన్ చేయండి", desc: "వెరిఫికేషన్ తర్వాత 'Sign In' చేయండి." },
        ],
      },
      {
        title: "2. ఆన్‌బోర్డింగ్ చెక్‌లిస్ట్",
        steps: [
          { title: "ప్రొఫైల్ పూర్తి చేయండి", desc: "ఫోన్ నంబర్, నగరం జోడించండి.", image: "/guide/tenant-onboarding.jpg" },
          { title: "గది అసైన్‌మెంట్", desc: "సరైన ఇమెయిల్‌తో సైన్అప్ చేస్తే గది ఆటోమేటిగ్గా అసైన్ అవుతుంది.", warning: "అసైన్‌మెంట్ అసంపూర్ణం అయితే యజమానిని సంప్రదించండి." },
          { title: "ID ప్రూఫ్ అప్‌లోడ్ చేయండి", desc: "ఆధార్, PAN మొదలైనవి అప్‌లోడ్ చేయండి." },
          { title: "ఎమర్జెన్సీ కాంటాక్ట్ జోడించండి", desc: "పేరు మరియు ఫోన్ నంబర్ నమోదు చేయండి." },
          { title: "మొదటి అద్దె చెల్లించండి", desc: "'Payments'లో అద్దె చూసి UPI/బ్యాంక్ ద్వారా చెల్లించండి." },
        ],
      },
      {
        title: "3. రోజువారీ వాడకం",
        steps: [
          { title: "డ్యాష్‌బోర్డ్ చూడండి", desc: "గది వివరాలు, అద్దె స్థితి, ప్రకటనలు చూడండి." },
          { title: "నెలవారీ అద్దె చెల్లించండి", desc: "ప్రతి నెల అద్దె చెల్లించి ప్రూఫ్ అప్‌లోడ్ చేయండి." },
          { title: "భోజన మెనూ", desc: "'Meal Menu'లో రోజువారీ షెడ్యూల్ చూడండి." },
          { title: "ఫిర్యాదు చేయండి", desc: "'Complaints' → 'New Complaint'లో వివరంగా రాయండి." },
          { title: "ప్రకటనలు & నోటీసులు", desc: "'Announcements' మరియు 'Notices' చూడండి." },
          { title: "కమ్యూనిటీ చాట్", desc: "ఇతర అద్దెదారులతో చాట్ చేయండి." },
          { title: "యుటిలిటీ బిల్లులు", desc: "విద్యుత్ నీటి బిల్లులు చూడండి." },
          { title: "రివ్యూ ఇవ్వండి", desc: "రేటింగ్ మరియు రివ్యూ ఇవ్వండి." },
        ],
      },
    ],
  },
  kn: {
    pageTitle: "ಬಳಕೆದಾರ ಮಾರ್ಗದರ್ಶಿ",
    pageSubtitle: "PG ಮಾಲೀಕರು ಮತ್ತು ಬಾಡಿಗೆದಾರರಿಗೆ ಸಂಪೂರ್ಣ ಹಂತ-ಹಂತದ ಮಾರ್ಗದರ್ಶಿ",
    ownerTab: "PG ಮಾಲೀಕರಿಗೆ", tenantTab: "ಬಾಡಿಗೆದಾರರಿಗೆ",
    stepLabel: "ಹಂತ", needHelp: "ಹೆಚ್ಚಿನ ಸಹಾಯ ಬೇಕೇ?",
    needHelpDesc: "support@pgmanager.in ಗೆ ಇಮೇಲ್ ಮಾಡಿ.",
    warningLabel: "⚠️ ಮುಖ್ಯ", tipLabel: "💡 ಸಲಹೆ", importantLabel: "ಮುಖ್ಯ",
    videoSectionTitle: "📹 ವೀಡಿಯೊ ಟ್ಯುಟೋರಿಯಲ್‌ಗಳು",
    videoSectionDesc: "ಸಂಪೂರ್ಣ ಹರಿವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಈ ವೀಡಿಯೊಗಳನ್ನು ನೋಡಿ.",
    ownerVideos: [
      { title: "PG ಆಸ್ತಿ ಹೇಗೆ ಸೆಟಪ್ ಮಾಡುವುದು", description: "ಖಾತೆ ರಚನೆ, ಆಸ್ತಿ ಸೇರಿಸುವುದು, ಕೊಠಡಿಗಳು.", videoId: "owner-setup-demo" },
      { title: "ಬಾಡಿಗೆದಾರರನ್ನು ಆಹ್ವಾನಿಸುವುದು", description: "ಆಹ್ವಾನ ಕೋಡ್ ಕಳುಹಿಸುವುದು, ಪಾವತಿ ಟ್ರ್ಯಾಕ್.", videoId: "owner-tenants-demo" },
      { title: "ಪಾವತಿ ಟ್ರ್ಯಾಕಿಂಗ್", description: "ಬಾಡಿಗೆ ಪಾವತಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.", videoId: "owner-payments-demo" },
    ],
    tenantVideos: [
      { title: "ಬಾಡಿಗೆದಾರರಾಗಿ ಸೇರುವುದು", description: "ಸೈನ್ ಅಪ್, ಆಹ್ವಾನ ಕೋಡ್ ನಮೂದಿಸಿ.", videoId: "tenant-onboard-demo" },
      { title: "ಬಾಡಿಗೆ ಪಾವತಿ", description: "ಬಾಡಿಗೆ ನೋಡಿ, ಪುರಾವೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.", videoId: "tenant-payment-demo" },
      { title: "ಬಾಡಿಗೆದಾರ ವೈಶಿಷ್ಟ್ಯಗಳು", description: "ದೂರುಗಳು, ಊಟ, ಪ್ರಕಟಣೆಗಳು, ಚಾಟ್.", videoId: "tenant-features-demo" },
    ],
    ownerSections: [
      { title: "1. ಖಾತೆ ರಚನೆ & ಲಾಗಿನ್", steps: [
        { title: "ವೆಬ್‌ಸೈಟ್ ತೆರೆಯಿರಿ", desc: "pgbuddy.lovable.app ತೆರೆದು 'Sign Up' ಕ್ಲಿಕ್ ಮಾಡಿ.", image: "/guide/signup-page.jpg" },
        { title: "'PG Owner' ಆಯ್ಕೆ ಮಾಡಿ", desc: "'PG Owner' ಕ್ಲಿಕ್ ಮಾಡಿ.", warning: "ಸೈನ್ ಅಪ್ ಸಮಯದಲ್ಲಿ 'PG Owner' ಆಯ್ಕೆ ಮಾಡುವುದು ಕಡ್ಡಾಯ." },
        { title: "ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ", desc: "ಪೂರ್ಣ ಹೆಸರು, ಇಮೇಲ್, ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ." },
        { title: "ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ", desc: "ಇಮೇಲ್‌ನಲ್ಲಿ ಬಂದ ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ.", warning: "Spam ಫೋಲ್ಡರ್ ಪರಿಶೀಲಿಸಿ." },
        { title: "ಲಾಗಿನ್ ಮಾಡಿ", desc: "'Sign In' ಕ್ಲಿಕ್ ಮಾಡಿ." },
      ]},
      { title: "2. ಆಸ್ತಿ ಸೆಟಪ್", steps: [
        { title: "Properties ಗೆ ಹೋಗಿ", desc: "'Properties' ಕ್ಲಿಕ್ ಮಾಡಿ.", image: "/guide/owner-dashboard.jpg" },
        { title: "ಹೊಸ ಆಸ್ತಿ ಸೇರಿಸಿ", desc: "PG ಹೆಸರು, ವಿಳಾಸ, ನಗರ, ಸೌಲಭ್ಯಗಳು ಭರ್ತಿ ಮಾಡಿ.", image: "/guide/add-property.jpg" },
        { title: "ಕೊಠಡಿಗಳನ್ನು ರಚಿಸಿ", desc: "ಕೊಠಡಿ ಸಂಖ್ಯೆ, ಪ್ರಕಾರ, ಬಾಡಿಗೆ, ಠೇವಣಿ ನಮೂದಿಸಿ." },
      ]},
      { title: "3. ಬಾಡಿಗೆದಾರರನ್ನು ಆಹ್ವಾನಿಸಿ (ಅತ್ಯಂತ ಮುಖ್ಯ!)", steps: [
        { title: "Invitations ಪುಟಕ್ಕೆ ಹೋಗಿ", desc: "'Invitations' ಕ್ಲಿಕ್ ಮಾಡಿ.", image: "/guide/invite-tenant.jpg" },
        { title: "ಹೊಸ ಆಹ್ವಾನ ರಚಿಸಿ", desc: "ಬಾಡಿಗೆದಾರರ ಹೆಸರು, ಇಮೇಲ್, ಫೋನ್, ಆಸ್ತಿ, ಕೊಠಡಿ ಆಯ್ಕೆ ಮಾಡಿ.", warning: "ನೀವು ಇಲ್ಲಿ ನಮೂದಿಸುವ ಇಮೇಲ್ ಬಾಡಿಗೆದಾರರು ಖಾತೆ ರಚಿಸುವಾಗ ಬಳಸುವ ಇಮೇಲ್‌ಗೆ ಸರಿಯಾಗಿ ಹೊಂದಬೇಕು!" },
        { title: "ಕೋಡ್ ಹಂಚಿಕೊಳ್ಳಿ", desc: "WhatsApp/SMS ಮೂಲಕ ಕೋಡ್ ಹಂಚಿ.", warning: "ಕೋಡ್ 7 ದಿನಗಳಲ್ಲಿ ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ." },
      ]},
      { title: "4. ಬಾಡಿಗೆ & ಪಾವತಿ", steps: [
        { title: "ಪಾವತಿ ಮಾಹಿತಿ ಸೆಟ್ ಮಾಡಿ", desc: "UPI ID, ಬ್ಯಾಂಕ್ ವಿವರ ಸೇರಿಸಿ." },
        { title: "ಬಾಡಿಗೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ", desc: "'Payments'ನಲ್ಲಿ ರೆಕಾರ್ಡ್ ನೋಡಿ.", image: "/guide/payments-page.jpg" },
        { title: "ಖರ್ಚು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ", desc: "'Expenses'ನಲ್ಲಿ ಖರ್ಚು ದಾಖಲಿಸಿ." },
      ]},
      { title: "5. ಸಂವಹನ & ನಿರ್ವಹಣೆ", steps: [
        { title: "ಪ್ರಕಟಣೆಗಳು", desc: "'Announcements' ಮೂಲಕ ಸಂದೇಶ ಕಳುಹಿಸಿ." },
        { title: "ದೂರುಗಳು", desc: "'Complaints'ನಲ್ಲಿ ದೂರುಗಳನ್ನು ಪರಿಹರಿಸಿ." },
        { title: "ಊಟದ ಮೆನು", desc: "'Meal Menu'ನಲ್ಲಿ ಶೆಡ್ಯೂಲ್ ಸೆಟ್ ಮಾಡಿ." },
        { title: "ಯುಟಿಲಿಟಿ ಬಿಲ್", desc: "ವಿದ್ಯುತ್ ನೀರು ಬಳಕೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ." },
        { title: "ಸಂದರ್ಶಕ ಲಾಗ್", desc: "ಸಂದರ್ಶಕರ ದಾಖಲೆ ಇಡಿ." },
        { title: "ದಾಖಲೆಗಳು", desc: "ID ಪ್ರೂಫ್ ಪರಿಶೀಲಿಸಿ." },
      ]},
    ],
    tenantSections: [
      { title: "1. ಖಾತೆ ರಚನೆ", steps: [
        { title: "ವೆಬ್‌ಸೈಟ್ ತೆರೆಯಿರಿ", desc: "'Sign Up' ಕ್ಲಿಕ್ ಮಾಡಿ.", image: "/guide/signup-page.jpg" },
        { title: "'Tenant' ಆಯ್ಕೆ ಮಾಡಿ", desc: "'Tenant' ಕ್ಲಿಕ್ ಮಾಡಿ.", warning: "'PG Owner' ಆಯ್ಕೆ ಮಾಡಬೇಡಿ." },
        { title: "ಮಾಲೀಕರು ಕೊಟ್ಟ ಅದೇ ಇಮೇಲ್ ಬಳಸಿ", desc: "ಮಾಲೀಕರು ಆಹ್ವಾನದಲ್ಲಿ ಬಳಸಿದ ಅದೇ ಇಮೇಲ್‌ನಿಂದ ಸೈನ್ ಅಪ್ ಮಾಡಿ.", warning: "ಇಮೇಲ್ ಹೊಂದಿಕೆಯಾಗದಿದ್ದರೆ ಕೊಠಡಿ ನಿಯೋಜನೆ ಕೆಲಸ ಮಾಡುವುದಿಲ್ಲ." },
        { title: "ವಿವರ ಭರ್ತಿ ಮಾಡಿ & ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ", desc: "ಹೆಸರು, ಇಮೇಲ್, ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ, ಲಿಂಕ್ ಕ್ಲಿಕ್ ಮಾಡಿ." },
        { title: "ಲಾಗಿನ್ ಮಾಡಿ", desc: "ಪರಿಶೀಲನೆ ನಂತರ 'Sign In' ಮಾಡಿ." },
      ]},
      { title: "2. ಆನ್‌ಬೋರ್ಡಿಂಗ್", steps: [
        { title: "ಪ್ರೊಫೈಲ್ ಪೂರ್ಣ ಮಾಡಿ", desc: "ಫೋನ್ ಸಂಖ್ಯೆ, ನಗರ ಸೇರಿಸಿ.", image: "/guide/tenant-onboarding.jpg" },
        { title: "ಕೊಠಡಿ ನಿಯೋಜನೆ", desc: "ಸರಿಯಾದ ಇಮೇಲ್‌ನಿಂದ ಸೈನ್ ಅಪ್ ಮಾಡಿದರೆ ಕೊಠಡಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ನಿಯೋಜಿಸಲ್ಪಡುತ್ತದೆ.", warning: "ಅಪೂರ್ಣವಾಗಿದ್ದರೆ ಮಾಲೀಕರನ್ನು ಸಂಪರ್ಕಿಸಿ." },
        { title: "ID ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", desc: "ಆಧಾರ್, PAN ಅಪ್‌ಲೋಡ್ ಮಾಡಿ." },
        { title: "ತುರ್ತು ಸಂಪರ್ಕ", desc: "ಹೆಸರು ಮತ್ತು ಫೋನ್ ನಂಬರ್ ಸೇರಿಸಿ." },
        { title: "ಮೊದಲ ಬಾಡಿಗೆ", desc: "UPI/ಬ್ಯಾಂಕ್ ಮೂಲಕ ಪಾವತಿಸಿ ರಸೀದಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ." },
      ]},
      { title: "3. ದೈನಂದಿನ ಬಳಕೆ", steps: [
        { title: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನೋಡಿ", desc: "ಕೊಠಡಿ ವಿವರ, ಬಾಡಿಗೆ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ." },
        { title: "ಮಾಸಿಕ ಬಾಡಿಗೆ", desc: "ಪ್ರತಿ ತಿಂಗಳು ಪಾವತಿಸಿ ಪ್ರೂಫ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ." },
        { title: "ಊಟದ ಮೆನು", desc: "ದೈನಂದಿನ ಶೆಡ್ಯೂಲ್ ನೋಡಿ." },
        { title: "ದೂರು", desc: "ವಿವರವಾಗಿ ಬರೆಯಿರಿ." },
        { title: "ಪ್ರಕಟಣೆಗಳು", desc: "ಮಾಲೀಕರ ಸಂದೇಶಗಳನ್ನು ಓದಿ." },
        { title: "ಚಾಟ್", desc: "ಇತರ ಬಾಡಿಗೆದಾರರೊಂದಿಗೆ ಮಾತನಾಡಿ." },
        { title: "ಬಿಲ್‌ಗಳು", desc: "ವಿದ್ಯುತ್ ನೀರು ಬಿಲ್ ನೋಡಿ." },
        { title: "ರಿವ್ಯೂ", desc: "ರೇಟಿಂಗ್ ಮತ್ತು ರಿವ್ಯೂ ನೀಡಿ." },
      ]},
    ],
  },
  ml: {
    pageTitle: "ഉപയോക്തൃ ഗൈഡ്", pageSubtitle: "PG ഉടമകൾക്കും വാടകക്കാർക്കുമുള്ള സമ്പൂർണ ഗൈഡ്",
    ownerTab: "PG ഉടമകൾക്ക്", tenantTab: "വാടകക്കാർക്ക്",
    stepLabel: "ഘട്ടം", needHelp: "കൂടുതൽ സഹായം വേണോ?",
    needHelpDesc: "support@pgmanager.in ലേക്ക് ഇമെയിൽ അയക്കുക.",
    warningLabel: "⚠️ പ്രധാനം", tipLabel: "💡 നുറുങ്ങ്", importantLabel: "പ്രധാനം",
    videoSectionTitle: "📹 വീഡിയോ ട്യൂട്ടോറിയലുകൾ",
    videoSectionDesc: "പൂർണ്ണ ഫ്ലോ മനസ്സിലാക്കാൻ ഈ വീഡിയോകൾ കാണുക.",
    ownerVideos: [
      { title: "PG പ്രോപ്പർട്ടി സെറ്റപ്പ്", description: "അക്കൗണ്ട്, പ്രോപ്പർട്ടി, മുറികൾ.", videoId: "owner-setup-demo" },
      { title: "വാടകക്കാരെ ക്ഷണിക്കുക", description: "ക്ഷണ കോഡ് അയയ്ക്കുക, പേയ്മെന്റ് ട്രാക്ക്.", videoId: "owner-tenants-demo" },
      { title: "പേയ്മെന്റ് ട്രാക്കിംഗ്", description: "വാടക പേയ്മെന്റുകൾ ട്രാക്ക് ചെയ്യുക.", videoId: "owner-payments-demo" },
    ],
    tenantVideos: [
      { title: "വാടകക്കാരനായി ചേരുക", description: "സൈൻ അപ്പ്, ക്ഷണ കോഡ് നൽകുക.", videoId: "tenant-onboard-demo" },
      { title: "വാടക അടയ്ക്കുക", description: "വാടക കാണുക, തെളിവ് അപ്‌ലോഡ്.", videoId: "tenant-payment-demo" },
      { title: "വാടകക്കാരൻ ഫീച്ചറുകൾ", description: "പരാതികൾ, ഭക്ഷണം, അറിയിപ്പുകൾ, ചാറ്റ്.", videoId: "tenant-features-demo" },
    ],
    ownerSections: [
      { title: "1. അക്കൗണ്ട് & ലോഗിൻ", steps: [
        { title: "വെബ്‌സൈറ്റ് തുറക്കുക", desc: "'Sign Up' ക്ലിക്ക് ചെയ്യുക.", image: "/guide/signup-page.jpg" },
        { title: "'PG Owner' തിരഞ്ഞെടുക്കുക", desc: "'PG Owner' ക്ലിക്ക് ചെയ്യുക.", warning: "സൈൻ അപ്പ് സമയത്ത് 'PG Owner' തിരഞ്ഞെടുക്കണം." },
        { title: "വിവരങ്ങൾ നൽകുക", desc: "പേര്, ഇമെയിൽ, പാസ്‌വേഡ് നൽകുക." },
        { title: "ഇമെയിൽ പരിശോധിക്കുക", desc: "വെരിഫിക്കേഷൻ ലിങ്ക് ക്ലിക്ക് ചെയ്യുക.", warning: "Spam ഫോൾഡർ പരിശോധിക്കുക." },
        { title: "ലോഗിൻ ചെയ്യുക", desc: "'Sign In' ക്ലിക്ക് ചെയ്യുക." },
      ]},
      { title: "2. പ്രോപ്പർട്ടി സെറ്റപ്പ്", steps: [
        { title: "Properties-ലേക്ക് പോകുക", desc: "'Properties' ക്ലിക്ക് ചെയ്യുക.", image: "/guide/owner-dashboard.jpg" },
        { title: "പുതിയ പ്രോപ്പർട്ടി ചേർക്കുക", desc: "PG പേര്, വിലാസം, നഗരം, സൗകര്യങ്ങൾ നൽകുക.", image: "/guide/add-property.jpg" },
        { title: "മുറികൾ സൃഷ്ടിക്കുക", desc: "മുറി നമ്പർ, തരം, വാടക, ഡെപ്പോസിറ്റ് നൽകുക." },
      ]},
      { title: "3. വാടകക്കാരെ ക്ഷണിക്കുക (ഏറ്റവും പ്രധാനം!)", steps: [
        { title: "Invitations പേജിലേക്ക് പോകുക", desc: "'Invitations' ക്ലിക്ക് ചെയ്യുക.", image: "/guide/invite-tenant.jpg" },
        { title: "പുതിയ ക്ഷണം സൃഷ്ടിക്കുക", desc: "വാടകക്കാരന്റെ പേര്, ഇമെയിൽ, ഫോൺ, പ്രോപ്പർട്ടി, മുറി തിരഞ്ഞെടുക്കുക.", warning: "നിങ്ങൾ ഇവിടെ നൽകുന്ന ഇമെയിൽ വാടകക്കാരൻ അക്കൗണ്ട് ഉണ്ടാക്കുമ്പോൾ ഉപയോഗിക്കുന്ന ഇമെയിലുമായി കൃത്യമായി പൊരുത്തപ്പെടണം!" },
        { title: "കോഡ് പങ്കിടുക", desc: "WhatsApp/SMS വഴി കോഡ് അയക്കുക.", warning: "കോഡ് 7 ദിവസത്തിൽ കാലഹരണപ്പെടും." },
      ]},
      { title: "4. വാടക & പേയ്‌മെന്റ്", steps: [
        { title: "പേയ്‌മെന്റ് വിവരം സെറ്റ് ചെയ്യുക", desc: "UPI ID, ബാങ്ക് വിവരങ്ങൾ ചേർക്കുക." },
        { title: "വാടക ട്രാക്ക് ചെയ്യുക", desc: "'Payments'-ൽ റെക്കോർഡുകൾ കാണുക.", image: "/guide/payments-page.jpg" },
        { title: "ചെലവുകൾ ട്രാക്ക് ചെയ്യുക", desc: "'Expenses'-ൽ ചെലവുകൾ രേഖപ്പെടുത്തുക." },
      ]},
      { title: "5. ആശയവിനിമയം & നിർവഹണം", steps: [
        { title: "അറിയിപ്പുകൾ", desc: "'Announcements' വഴി സന്ദേശങ്ങൾ അയക്കുക." },
        { title: "പരാതികൾ", desc: "'Complaints'-ൽ പരാതികൾ പരിഹരിക്കുക." },
        { title: "ഭക്ഷണ മെനു", desc: "'Meal Menu'-ൽ ഷെഡ്യൂൾ സെറ്റ് ചെയ്യുക." },
        { title: "യൂട്ടിലിറ്റി ബില്ലുകൾ", desc: "വൈദ്യുതി, ജല ബില്ലുകൾ ട്രാക്ക് ചെയ്യുക." },
        { title: "സന്ദർശക ലോഗ്", desc: "സന്ദർശക രേഖകൾ സൂക്ഷിക്കുക." },
        { title: "രേഖകൾ", desc: "ID പ്രൂഫ് പരിശോധിക്കുക." },
      ]},
    ],
    tenantSections: [
      { title: "1. അക്കൗണ്ട് & ലോഗിൻ", steps: [
        { title: "വെബ്‌സൈറ്റ് തുറക്കുക", desc: "'Sign Up' ക്ലിക്ക് ചെയ്യുക.", image: "/guide/signup-page.jpg" },
        { title: "'Tenant' തിരഞ്ഞെടുക്കുക", desc: "'Tenant' ക്ലിക്ക് ചെയ്യുക.", warning: "'PG Owner' തിരഞ്ഞെടുക്കരുത്." },
        { title: "ഉടമ നൽകിയ അതേ ഇമെയിൽ ഉപയോഗിക്കുക", desc: "ഉടമ ക്ഷണത്തിൽ ഉപയോഗിച്ച അതേ ഇമെയിൽ ഉപയോഗിക്കുക.", warning: "ഇമെയിൽ പൊരുത്തപ്പെട്ടില്ലെങ്കിൽ മുറി അസൈൻമെന്റ് പ്രവർത്തിക്കില്ല." },
        { title: "വിവരങ്ങൾ നൽകി ഇമെയിൽ പരിശോധിക്കുക", desc: "പേര്, ഇമെയിൽ, പാസ്‌വേഡ് നൽകി വെരിഫിക്കേഷൻ ലിങ്ക് ക്ലിക്ക് ചെയ്യുക." },
        { title: "ലോഗിൻ ചെയ്യുക", desc: "പരിശോധനയ്ക്ക് ശേഷം 'Sign In' ചെയ്യുക." },
      ]},
      { title: "2. ഓൺബോർഡിംഗ്", steps: [
        { title: "പ്രൊഫൈൽ പൂർത്തിയാക്കുക", desc: "ഫോൺ നമ്പർ, നഗരം ചേർക്കുക.", image: "/guide/tenant-onboarding.jpg" },
        { title: "മുറി അസൈൻമെന്റ്", desc: "ശരിയായ ഇമെയിൽ ഉപയോഗിച്ചാൽ മുറി സ്വയമേവ അസൈൻ ചെയ്യപ്പെടും.", warning: "പൂർത്തിയായില്ലെങ്കിൽ ഉടമയെ ബന്ധപ്പെടുക." },
        { title: "ID അപ്‌ലോഡ് ചെയ്യുക", desc: "ആധാർ, PAN അപ്‌ലോഡ് ചെയ്യുക." },
        { title: "എമർജൻസി കോൺടാക്ട്", desc: "പേരും ഫോൺ നമ്പറും ചേർക്കുക." },
        { title: "ആദ്യ വാടക", desc: "UPI/ബാങ്ക് വഴി അടച്ച് രസീത് അപ്‌ലോഡ് ചെയ്യുക." },
      ]},
      { title: "3. ദൈനംദിന ഉപയോഗം", steps: [
        { title: "ഡാഷ്‌ബോർഡ്", desc: "മുറി വിവരങ്ങൾ, വാടക സ്ഥിതി പരിശോധിക്കുക." },
        { title: "പ്രതിമാസ വാടക", desc: "ഓരോ മാസവും അടച്ച് പ്രൂഫ് അപ്‌ലോഡ് ചെയ്യുക." },
        { title: "ഭക്ഷണ മെനു", desc: "ദൈനംദിന ഷെഡ്യൂൾ കാണുക." },
        { title: "പരാതി", desc: "വിശദമായി എഴുതുക." },
        { title: "അറിയിപ്പുകൾ", desc: "ഉടമയുടെ സന്ദേശങ്ങൾ വായിക്കുക." },
        { title: "ചാറ്റ്", desc: "മറ്റ് വാടകക്കാരുമായി സംസാരിക്കുക." },
        { title: "ബില്ലുകൾ", desc: "വൈദ്യുതി, ജല ബില്ലുകൾ കാണുക." },
        { title: "റിവ്യൂ", desc: "റേറ്റിംഗും റിവ്യൂവും നൽകുക." },
      ]},
    ],
  },
  bn: {
    pageTitle: "ব্যবহারকারী গাইড", pageSubtitle: "PG মালিক এবং ভাড়াটেদের জন্য সম্পূর্ণ গাইড",
    ownerTab: "PG মালিকদের জন্য", tenantTab: "ভাড়াটেদের জন্য",
    stepLabel: "ধাপ", needHelp: "আরও সাহায্য দরকার?",
    needHelpDesc: "support@pgmanager.in এ ইমেইল পাঠান।",
    warningLabel: "⚠️ গুরুত্বপূর্ণ", tipLabel: "💡 পরামর্শ", importantLabel: "গুরুত্বপূর্ণ",
    videoSectionTitle: "📹 ভিডিও টিউটোরিয়াল",
    videoSectionDesc: "সম্পূর্ণ প্রবাহ বুঝতে এই ভিডিওগুলি দেখুন।",
    ownerVideos: [
      { title: "PG প্রপার্টি সেটআপ", description: "অ্যাকাউন্ট, প্রপার্টি, রুম তৈরি।", videoId: "owner-setup-demo" },
      { title: "ভাড়াটেদের আমন্ত্রণ", description: "ইনভাইট কোড পাঠানো, পেমেন্ট ট্র্যাক।", videoId: "owner-tenants-demo" },
      { title: "পেমেন্ট ট্র্যাকিং", description: "ভাড়া পেমেন্ট ট্র্যাক করুন।", videoId: "owner-payments-demo" },
    ],
    tenantVideos: [
      { title: "ভাড়াটে হিসেবে যোগদান", description: "সাইন আপ, ইনভাইট কোড দিন।", videoId: "tenant-onboard-demo" },
      { title: "ভাড়া পরিশোধ", description: "ভাড়া দেখুন, প্রমাণ আপলোড করুন।", videoId: "tenant-payment-demo" },
      { title: "ভাড়াটে ফিচার", description: "অভিযোগ, খাবার, ঘোষণা, চ্যাট।", videoId: "tenant-features-demo" },
    ],
    ownerSections: [
      { title: "1. অ্যাকাউন্ট তৈরি ও লগইন", steps: [
        { title: "ওয়েবসাইট খুলুন", desc: "'Sign Up' ক্লিক করুন।", image: "/guide/signup-page.jpg" },
        { title: "'PG Owner' নির্বাচন করুন", desc: "'PG Owner' ক্লিক করুন।", warning: "সাইন আপের সময় 'PG Owner' নির্বাচন করা বাধ্যতামূলক।" },
        { title: "তথ্য পূরণ করুন", desc: "পূর্ণ নাম, ইমেইল, পাসওয়ার্ড দিন।" },
        { title: "ইমেইল যাচাই করুন", desc: "ভেরিফিকেশন লিংকে ক্লিক করুন।", warning: "Spam ফোল্ডার চেক করুন।" },
        { title: "লগইন করুন", desc: "'Sign In' ক্লিক করুন।" },
      ]},
      { title: "2. প্রপার্টি সেটআপ", steps: [
        { title: "Properties এ যান", desc: "'Properties' ক্লিক করুন।", image: "/guide/owner-dashboard.jpg" },
        { title: "নতুন প্রপার্টি যোগ করুন", desc: "PG নাম, ঠিকানা, শহর, সুবিধা পূরণ করুন।", image: "/guide/add-property.jpg" },
        { title: "ঘর তৈরি করুন", desc: "ঘর নম্বর, ধরন, ভাড়া, ডিপোজিট পূরণ করুন।" },
      ]},
      { title: "3. ভাড়াটেদের আমন্ত্রণ করুন (সবচেয়ে গুরুত্বপূর্ণ!)", steps: [
        { title: "Invitations পেজে যান", desc: "'Invitations' ক্লিক করুন।", image: "/guide/invite-tenant.jpg" },
        { title: "নতুন আমন্ত্রণ তৈরি করুন", desc: "ভাড়াটের নাম, ইমেইল, ফোন, প্রপার্টি, ঘর নির্বাচন করুন।", warning: "এখানে দেওয়া ইমেইল অবশ্যই ভাড়াটে অ্যাকাউন্ট তৈরি করার সময় ব্যবহার করা ইমেইলের সাথে হুবহু মিলতে হবে! না মিললে ডেটা দেখাবে না!" },
        { title: "ইনভাইট কোড শেয়ার করুন", desc: "WhatsApp/SMS এ কোড পাঠান।", warning: "কোড ৭ দিনে মেয়াদ শেষ হয়।" },
      ]},
      { title: "4. ভাড়া ও পেমেন্ট", steps: [
        { title: "পেমেন্ট তথ্য সেট করুন", desc: "UPI ID, ব্যাংক তথ্য যোগ করুন।" },
        { title: "ভাড়া ট্র্যাক করুন", desc: "'Payments' এ রেকর্ড দেখুন।", image: "/guide/payments-page.jpg" },
        { title: "খরচ ট্র্যাক করুন", desc: "'Expenses' এ খরচ লিপিবদ্ধ করুন।" },
      ]},
      { title: "5. যোগাযোগ ও ব্যবস্থাপনা", steps: [
        { title: "ঘোষণা", desc: "'Announcements' দিয়ে বার্তা পাঠান।" },
        { title: "অভিযোগ", desc: "'Complaints' এ সমাধান করুন।" },
        { title: "খাবারের মেনু", desc: "'Meal Menu' সেট করুন।" },
        { title: "ইউটিলিটি বিল", desc: "বিদ্যুৎ পানি ব্যবহার ট্র্যাক করুন।" },
        { title: "ভিজিটর লগ", desc: "দর্শকদের রেকর্ড রাখুন।" },
        { title: "ডকুমেন্টস", desc: "ID প্রুফ পরীক্ষা করুন।" },
      ]},
    ],
    tenantSections: [
      { title: "1. অ্যাকাউন্ট তৈরি", steps: [
        { title: "ওয়েবসাইট খুলুন", desc: "'Sign Up' ক্লিক করুন।", image: "/guide/signup-page.jpg" },
        { title: "'Tenant' নির্বাচন করুন", desc: "'Tenant' ক্লিক করুন।", warning: "'PG Owner' নির্বাচন করবেন না।" },
        { title: "মালিক যে ইমেইল দিয়েছেন সেটিই ব্যবহার করুন", desc: "মালিক আমন্ত্রণে যে ইমেইল ব্যবহার করেছেন সেটি দিয়েই সাইন আপ করুন।", warning: "ইমেইল না মিললে ঘর অ্যাসাইনমেন্ট কাজ করবে না।" },
        { title: "তথ্য পূরণ ও ইমেইল যাচাই করুন", desc: "নাম, ইমেইল, পাসওয়ার্ড দিয়ে ভেরিফিকেশন লিংক ক্লিক করুন।" },
        { title: "লগইন করুন", desc: "যাচাইয়ের পর 'Sign In' করুন।" },
      ]},
      { title: "2. অনবোর্ডিং", steps: [
        { title: "প্রোফাইল সম্পূর্ণ করুন", desc: "ফোন নম্বর, শহর যোগ করুন।", image: "/guide/tenant-onboarding.jpg" },
        { title: "ঘর অ্যাসাইনমেন্ট", desc: "সঠিক ইমেইলে সাইন আপ করলে ঘর স্বয়ংক্রিয়ভাবে অ্যাসাইন হবে।", warning: "অসম্পূর্ণ হলে মালিকের সাথে যোগাযোগ করুন।" },
        { title: "ID আপলোড করুন", desc: "আধার, PAN আপলোড করুন।" },
        { title: "জরুরি যোগাযোগ", desc: "নাম ও ফোন নম্বর দিন।" },
        { title: "প্রথম ভাড়া", desc: "UPI/ব্যাংকে পেমেন্ট করে রসিদ আপলোড করুন।" },
      ]},
      { title: "3. দৈনিক ব্যবহার", steps: [
        { title: "ড্যাশবোর্ড", desc: "ঘরের তথ্য, ভাড়ার অবস্থা দেখুন।" },
        { title: "মাসিক ভাড়া", desc: "প্রতি মাসে পেমেন্ট করে প্রুফ আপলোড করুন।" },
        { title: "খাবারের মেনু", desc: "দৈনিক শিডিউল দেখুন।" },
        { title: "অভিযোগ", desc: "বিস্তারিত লিখুন।" },
        { title: "ঘোষণা", desc: "মালিকের বার্তা পড়ুন।" },
        { title: "চ্যাট", desc: "অন্য ভাড়াটেদের সাথে কথা বলুন।" },
        { title: "বিল", desc: "বিদ্যুৎ পানির বিল দেখুন।" },
        { title: "রিভিউ", desc: "রেটিং ও রিভিউ দিন।" },
      ]},
    ],
  },
  gu: {
    pageTitle: "વપરાશકર્તા માર્ગદર્શિકા", pageSubtitle: "PG માલિકો અને ભાડૂતો માટે સંપૂર્ણ માર્ગદર્શિકા",
    ownerTab: "PG માલિકો માટે", tenantTab: "ભાડૂતો માટે",
    stepLabel: "પગલું", needHelp: "વધુ મદદ જોઈએ?",
    needHelpDesc: "support@pgmanager.in પર ઈમેલ કરો.",
    warningLabel: "⚠️ મહત્વપૂર્ણ", tipLabel: "💡 ટિપ", importantLabel: "મહત્વપૂર્ણ",
    videoSectionTitle: "📹 વીડિયો ટ્યુટોરિયલ",
    videoSectionDesc: "સંપૂર્ણ ફ્લો સમજવા માટે આ વીડિયો જુઓ.",
    ownerVideos: [
      { title: "PG પ્રોપર્ટી સેટઅપ", description: "એકાઉન્ટ, પ્રોપર્ટી, રૂમ.", videoId: "owner-setup-demo" },
      { title: "ભાડૂતોને આમંત્રણ", description: "ઇન્વાઇટ કોડ મોકલો, પેમેન્ટ ટ્રેક.", videoId: "owner-tenants-demo" },
      { title: "પેમેન્ટ ટ્રેકિંગ", description: "ભાડું પેમેન્ટ ટ્રેક કરો.", videoId: "owner-payments-demo" },
    ],
    tenantVideos: [
      { title: "ભાડૂત તરીકે જોડાઓ", description: "સાઇન અપ, ઇન્વાઇટ કોડ દાખલ કરો.", videoId: "tenant-onboard-demo" },
      { title: "ભાડું ચૂકવો", description: "ભાડું જુઓ, પુરાવો અપલોડ કરો.", videoId: "tenant-payment-demo" },
      { title: "ભાડૂત ફીચર્સ", description: "ફરિયાદો, ભોજન, જાહેરાતો, ચેટ.", videoId: "tenant-features-demo" },
    ],
    ownerSections: [
      { title: "1. એકાઉન્ટ બનાવો & લોગિન", steps: [
        { title: "વેબસાઈટ ખોલો", desc: "'Sign Up' ક્લિક કરો.", image: "/guide/signup-page.jpg" },
        { title: "'PG Owner' પસંદ કરો", desc: "'PG Owner' ક્લિક કરો.", warning: "સાઈન અપ વખતે 'PG Owner' પસંદ કરવું ફરજિયાત છે." },
        { title: "વિગતો ભરો", desc: "પૂરું નામ, ઈમેલ, પાસવર્ડ દાખલ કરો." },
        { title: "ઈમેલ ચકાસો", desc: "વેરિફિકેશન લિંક ક્લિક કરો.", warning: "Spam ફોલ્ડર ચકાસો." },
        { title: "લોગિન કરો", desc: "'Sign In' ક્લિક કરો." },
      ]},
      { title: "2. પ્રોપર્ટી સેટઅપ", steps: [
        { title: "Properties પર જાઓ", desc: "'Properties' ક્લિક કરો.", image: "/guide/owner-dashboard.jpg" },
        { title: "નવી પ્રોપર્ટી ઉમેરો", desc: "PG નામ, સરનામું, શહેર, સુવિધાઓ ભરો.", image: "/guide/add-property.jpg" },
        { title: "રૂમ બનાવો", desc: "રૂમ નંબર, પ્રકાર, ભાડું, ડિપોઝિટ ભરો." },
      ]},
      { title: "3. ભાડૂતોને આમંત્રણ (સૌથી મહત્વનું!)", steps: [
        { title: "Invitations પેજ પર જાઓ", desc: "'Invitations' ક્લિક કરો.", image: "/guide/invite-tenant.jpg" },
        { title: "નવું આમંત્રણ બનાવો", desc: "ભાડૂતનું નામ, ઈમેલ, ફોન, પ્રોપર્ટી, રૂમ પસંદ કરો.", warning: "અહીં દાખલ કરેલ ઈમેલ ભાડૂત એકાઉન્ટ બનાવે ત્યારે વાપરેલ ઈમેલ સાથે ચોક્કસ મેળ ખાતું હોવું જોઈએ!" },
        { title: "કોડ શેર કરો", desc: "WhatsApp/SMS દ્વારા કોડ મોકલો.", warning: "કોડ 7 દિવસમાં એક્સપાયર થાય છે." },
      ]},
      { title: "4. ભાડું & ચુકવણી", steps: [
        { title: "ચુકવણી માહિતી સેટ કરો", desc: "UPI ID, બેંક વિગતો ઉમેરો." },
        { title: "ભાડું ટ્રેક કરો", desc: "'Payments'માં રેકોર્ડ જુઓ.", image: "/guide/payments-page.jpg" },
        { title: "ખર્ચ ટ્રેક કરો", desc: "'Expenses'માં ખર્ચ નોંધો." },
      ]},
      { title: "5. સંવાદ & સંચાલન", steps: [
        { title: "જાહેરાતો", desc: "'Announcements' દ્વારા સંદેશ મોકલો." },
        { title: "ફરિયાદો", desc: "'Complaints'માં ફરિયાદો ઉકેલો." },
        { title: "ભોજન મેનુ", desc: "'Meal Menu'માં શેડ્યૂલ સેટ કરો." },
        { title: "યુટિલિટી બિલ", desc: "વીજળી પાણી વાપર ટ્રેક કરો." },
        { title: "મુલાકાતી લોગ", desc: "મુલાકાતીઓના રેકોર્ડ રાખો." },
        { title: "દસ્તાવેજો", desc: "ID પ્રૂફ ચકાસો." },
      ]},
    ],
    tenantSections: [
      { title: "1. એકાઉન્ટ બનાવો", steps: [
        { title: "વેબસાઈટ ખોલો", desc: "'Sign Up' ક્લિક કરો.", image: "/guide/signup-page.jpg" },
        { title: "'Tenant' પસંદ કરો", desc: "'Tenant' ક્લિક કરો.", warning: "'PG Owner' પસંદ ન કરો." },
        { title: "માલિકે આપેલ એ જ ઈમેલ વાપરો", desc: "માલિકે આમંત્રણમાં વાપરેલ એ જ ઈમેલથી સાઈન અપ કરો.", warning: "ઈમેલ ન મળે તો રૂમ અસાઈનમેન્ટ કામ નહીં કરે." },
        { title: "વિગતો ભરો & ઈમેલ ચકાસો", desc: "નામ, ઈમેલ, પાસવર્ડ ભરો અને વેરિફિકેશન લિંક ક્લિક કરો." },
        { title: "લોગિન કરો", desc: "ચકાસણી પછી 'Sign In' કરો." },
      ]},
      { title: "2. ઓનબોર્ડિંગ", steps: [
        { title: "પ્રોફાઈલ પૂર્ણ કરો", desc: "ફોન નંબર, શહેર ઉમેરો.", image: "/guide/tenant-onboarding.jpg" },
        { title: "રૂમ અસાઈનમેન્ટ", desc: "સાચા ઈમેલથી સાઈન અપ કરવાથી રૂમ આપમેળે અસાઈન થાય છે.", warning: "અધૂરું હોય તો માલિકનો સંપર્ક કરો." },
        { title: "ID અપલોડ કરો", desc: "આધાર, PAN અપલોડ કરો." },
        { title: "ઈમરજન્સી કોન્ટેક્ટ", desc: "નામ અને ફોન નંબર ઉમેરો." },
        { title: "પહેલું ભાડું", desc: "UPI/બેંકથી ચૂકવો અને રસીદ અપલોડ કરો." },
      ]},
      { title: "3. દૈનિક ઉપયોગ", steps: [
        { title: "ડેશબોર્ડ", desc: "રૂમ વિગતો, ભાડાની સ્થિતિ જુઓ." },
        { title: "માસિક ભાડું", desc: "દર મહિને ચૂકવો અને પ્રૂફ અપલોડ કરો." },
        { title: "ભોજન મેનુ", desc: "દૈનિક શેડ્યૂલ જુઓ." },
        { title: "ફરિયાદ", desc: "વિગતવાર લખો." },
        { title: "જાહેરાતો", desc: "માલિકના સંદેશ વાંચો." },
        { title: "ચેટ", desc: "અન્ય ભાડૂતો સાથે વાત કરો." },
        { title: "બિલ", desc: "વીજળી પાણી બિલ જુઓ." },
        { title: "રિવ્યૂ", desc: "રેટિંગ અને રિવ્યૂ આપો." },
      ]},
    ],
  },
  pa: {
    pageTitle: "ਵਰਤੋਂਕਾਰ ਗਾਈਡ", pageSubtitle: "PG ਮਾਲਕਾਂ ਅਤੇ ਕਿਰਾਏਦਾਰਾਂ ਲਈ ਪੂਰੀ ਗਾਈਡ",
    ownerTab: "PG ਮਾਲਕਾਂ ਲਈ", tenantTab: "ਕਿਰਾਏਦਾਰਾਂ ਲਈ",
    stepLabel: "ਕਦਮ", needHelp: "ਹੋਰ ਮਦਦ ਚਾਹੀਦੀ?",
    needHelpDesc: "support@pgmanager.in 'ਤੇ ਈਮੇਲ ਕਰੋ।",
    warningLabel: "⚠️ ਮਹੱਤਵਪੂਰਨ", tipLabel: "💡 ਟਿਪ", importantLabel: "ਮਹੱਤਵਪੂਰਨ",
    ownerSections: [
      { title: "1. ਅਕਾਊਂਟ ਬਣਾਓ & ਲੌਗਇਨ", steps: [
        { title: "ਵੈੱਬਸਾਈਟ ਖੋਲ੍ਹੋ", desc: "'Sign Up' ਕਲਿੱਕ ਕਰੋ.", image: "/guide/signup-page.jpg" },
        { title: "'PG Owner' ਚੁਣੋ", desc: "'PG Owner' ਕਲਿੱਕ ਕਰੋ.", warning: "ਸਾਈਨ ਅੱਪ ਵੇਲੇ 'PG Owner' ਚੁਣਨਾ ਲਾਜ਼ਮੀ ਹੈ." },
        { title: "ਜਾਣਕਾਰੀ ਭਰੋ", desc: "ਪੂਰਾ ਨਾਮ, ਈਮੇਲ, ਪਾਸਵਰਡ ਦਿਓ." },
        { title: "ਈਮੇਲ ਵੈਰੀਫਾਈ ਕਰੋ", desc: "ਵੈਰੀਫਿਕੇਸ਼ਨ ਲਿੰਕ ਕਲਿੱਕ ਕਰੋ.", warning: "Spam ਫੋਲਡਰ ਚੈੱਕ ਕਰੋ." },
        { title: "ਲੌਗਇਨ ਕਰੋ", desc: "'Sign In' ਕਲਿੱਕ ਕਰੋ." },
      ]},
      { title: "2. ਪ੍ਰਾਪਰਟੀ ਸੈੱਟਅੱਪ", steps: [
        { title: "Properties 'ਤੇ ਜਾਓ", desc: "'Properties' ਕਲਿੱਕ ਕਰੋ.", image: "/guide/owner-dashboard.jpg" },
        { title: "ਨਵੀਂ ਪ੍ਰਾਪਰਟੀ ਜੋੜੋ", desc: "PG ਨਾਮ, ਪਤਾ, ਸ਼ਹਿਰ, ਸੁਵਿਧਾਵਾਂ ਭਰੋ.", image: "/guide/add-property.jpg" },
        { title: "ਕਮਰੇ ਬਣਾਓ", desc: "ਕਮਰਾ ਨੰਬਰ, ਕਿਸਮ, ਕਿਰਾਇਆ, ਡਿਪਾਜ਼ਿਟ ਭਰੋ." },
      ]},
      { title: "3. ਕਿਰਾਏਦਾਰਾਂ ਨੂੰ ਸੱਦੋ (ਸਭ ਤੋਂ ਮਹੱਤਵਪੂਰਨ!)", steps: [
        { title: "Invitations ਪੇਜ 'ਤੇ ਜਾਓ", desc: "'Invitations' ਕਲਿੱਕ ਕਰੋ.", image: "/guide/invite-tenant.jpg" },
        { title: "ਨਵਾਂ ਸੱਦਾ ਬਣਾਓ", desc: "ਕਿਰਾਏਦਾਰ ਦਾ ਨਾਮ, ਈਮੇਲ, ਫ਼ੋਨ, ਪ੍ਰਾਪਰਟੀ, ਕਮਰਾ ਚੁਣੋ.", warning: "ਇੱਥੇ ਦਿੱਤੀ ਈਮੇਲ ਕਿਰਾਏਦਾਰ ਦੇ ਅਕਾਊਂਟ ਬਣਾਉਣ ਵਾਲੀ ਈਮੇਲ ਨਾਲ ਬਿਲਕੁਲ ਮੇਲ ਖਾਣੀ ਚਾਹੀਦੀ!" },
        { title: "ਕੋਡ ਸ਼ੇਅਰ ਕਰੋ", desc: "WhatsApp/SMS ਰਾਹੀਂ ਕੋਡ ਭੇਜੋ.", warning: "ਕੋਡ 7 ਦਿਨਾਂ 'ਚ ਐਕਸਪਾਇਰ ਹੁੰਦਾ." },
      ]},
      { title: "4. ਕਿਰਾਇਆ & ਭੁਗਤਾਨ", steps: [
        { title: "ਭੁਗਤਾਨ ਜਾਣਕਾਰੀ ਸੈੱਟ ਕਰੋ", desc: "UPI ID, ਬੈਂਕ ਵੇਰਵੇ ਜੋੜੋ." },
        { title: "ਕਿਰਾਇਆ ਟ੍ਰੈਕ ਕਰੋ", desc: "'Payments' 'ਚ ਰਿਕਾਰਡ ਵੇਖੋ.", image: "/guide/payments-page.jpg" },
        { title: "ਖਰਚੇ ਟ੍ਰੈਕ ਕਰੋ", desc: "'Expenses' 'ਚ ਖਰਚੇ ਦਰਜ ਕਰੋ." },
      ]},
      { title: "5. ਸੰਚਾਰ & ਪ੍ਰਬੰਧਨ", steps: [
        { title: "ਐਲਾਨ", desc: "'Announcements' ਰਾਹੀਂ ਸੰਦੇਸ਼ ਭੇਜੋ." },
        { title: "ਸ਼ਿਕਾਇਤਾਂ", desc: "'Complaints' 'ਚ ਹੱਲ ਕਰੋ." },
        { title: "ਖਾਣਾ ਮੈਨੂ", desc: "'Meal Menu' ਸੈੱਟ ਕਰੋ." },
        { title: "ਯੂਟਿਲਿਟੀ ਬਿੱਲ", desc: "ਬਿਜਲੀ ਪਾਣੀ ਟ੍ਰੈਕ ਕਰੋ." },
        { title: "ਵਿਜ਼ਿਟਰ ਲੌਗ", desc: "ਮਹਿਮਾਨਾਂ ਦਾ ਰਿਕਾਰਡ ਰੱਖੋ." },
        { title: "ਦਸਤਾਵੇਜ਼", desc: "ID ਪਰੂਫ ਚੈੱਕ ਕਰੋ." },
      ]},
    ],
    tenantSections: [
      { title: "1. ਅਕਾਊਂਟ ਬਣਾਓ", steps: [
        { title: "ਵੈੱਬਸਾਈਟ ਖੋਲ੍ਹੋ", desc: "'Sign Up' ਕਲਿੱਕ ਕਰੋ.", image: "/guide/signup-page.jpg" },
        { title: "'Tenant' ਚੁਣੋ", desc: "'Tenant' ਕਲਿੱਕ ਕਰੋ.", warning: "'PG Owner' ਨਾ ਚੁਣੋ." },
        { title: "ਮਾਲਕ ਵਾਲੀ ਈਮੇਲ ਵਰਤੋ", desc: "ਮਾਲਕ ਨੇ ਸੱਦੇ 'ਚ ਜੋ ਈਮੇਲ ਵਰਤੀ ਉਸੇ ਨਾਲ ਸਾਈਨ ਅੱਪ ਕਰੋ.", warning: "ਈਮੇਲ ਨਾ ਮੇਲ ਖਾਵੇ ਤਾਂ ਕਮਰਾ ਅਸਾਈਨ ਨਹੀਂ ਹੋਵੇਗਾ." },
        { title: "ਜਾਣਕਾਰੀ ਭਰੋ & ਈਮੇਲ ਵੈਰੀਫਾਈ ਕਰੋ", desc: "ਨਾਮ, ਈਮੇਲ, ਪਾਸਵਰਡ ਭਰੋ ਅਤੇ ਲਿੰਕ ਕਲਿੱਕ ਕਰੋ." },
        { title: "ਲੌਗਇਨ ਕਰੋ", desc: "ਵੈਰੀਫਿਕੇਸ਼ਨ ਤੋਂ ਬਾਅਦ 'Sign In' ਕਰੋ." },
      ]},
      { title: "2. ਔਨਬੋਰਡਿੰਗ", steps: [
        { title: "ਪ੍ਰੋਫਾਈਲ ਪੂਰਾ ਕਰੋ", desc: "ਫ਼ੋਨ ਨੰਬਰ, ਸ਼ਹਿਰ ਜੋੜੋ.", image: "/guide/tenant-onboarding.jpg" },
        { title: "ਕਮਰਾ ਅਸਾਈਨਮੈਂਟ", desc: "ਸਹੀ ਈਮੇਲ ਨਾਲ ਸਾਈਨ ਅੱਪ ਕਰਨ 'ਤੇ ਕਮਰਾ ਆਪਣੇ ਆਪ ਅਸਾਈਨ ਹੁੰਦਾ.", warning: "ਅਧੂਰਾ ਹੋਵੇ ਤਾਂ ਮਾਲਕ ਨਾਲ ਗੱਲ ਕਰੋ." },
        { title: "ID ਅਪਲੋਡ ਕਰੋ", desc: "ਆਧਾਰ, PAN ਅਪਲੋਡ ਕਰੋ." },
        { title: "ਐਮਰਜੈਂਸੀ ਕਾਂਟੈਕਟ", desc: "ਨਾਮ ਅਤੇ ਫ਼ੋਨ ਨੰਬਰ ਦਿਓ." },
        { title: "ਪਹਿਲਾ ਕਿਰਾਇਆ", desc: "UPI/ਬੈਂਕ ਰਾਹੀਂ ਭੁਗਤਾਨ ਕਰੋ ਅਤੇ ਰਸੀਦ ਅਪਲੋਡ ਕਰੋ." },
      ]},
      { title: "3. ਰੋਜ਼ਾਨਾ ਵਰਤੋਂ", steps: [
        { title: "ਡੈਸ਼ਬੋਰਡ", desc: "ਕਮਰੇ ਦੀ ਜਾਣਕਾਰੀ, ਕਿਰਾਏ ਦੀ ਸਥਿਤੀ ਵੇਖੋ." },
        { title: "ਮਹੀਨਾਵਾਰ ਕਿਰਾਇਆ", desc: "ਹਰ ਮਹੀਨੇ ਭੁਗਤਾਨ ਕਰੋ ਅਤੇ ਪਰੂਫ ਅਪਲੋਡ ਕਰੋ." },
        { title: "ਖਾਣਾ ਮੈਨੂ", desc: "ਰੋਜ਼ਾਨਾ ਸ਼ਿਡਿਊਲ ਵੇਖੋ." },
        { title: "ਸ਼ਿਕਾਇਤ", desc: "ਵਿਸਥਾਰ ਨਾਲ ਲਿਖੋ." },
        { title: "ਐਲਾਨ", desc: "ਮਾਲਕ ਦੇ ਸੰਦੇਸ਼ ਪੜ੍ਹੋ." },
        { title: "ਚੈਟ", desc: "ਹੋਰ ਕਿਰਾਏਦਾਰਾਂ ਨਾਲ ਗੱਲ ਕਰੋ." },
        { title: "ਬਿੱਲ", desc: "ਬਿਜਲੀ ਪਾਣੀ ਬਿੱਲ ਵੇਖੋ." },
        { title: "ਰਿਵਿਊ", desc: "ਰੇਟਿੰਗ ਅਤੇ ਰਿਵਿਊ ਦਿਓ." },
      ]},
    ],
  },
  or: {
    pageTitle: "ବ୍ୟବହାରକାରୀ ଗାଇଡ୍", pageSubtitle: "PG ମାଲିକ ଏବଂ ଭଡ଼ାଟିଆଙ୍କ ପାଇଁ ସମ୍ପୂର୍ଣ୍ଣ ଗାଇଡ୍",
    ownerTab: "PG ମାଲିକଙ୍କ ପାଇଁ", tenantTab: "ଭଡ଼ାଟିଆଙ୍କ ପାଇଁ",
    stepLabel: "ପଦକ୍ଷେପ", needHelp: "ଅଧିକ ସାହାଯ୍ୟ ଦରକାର?",
    needHelpDesc: "support@pgmanager.in କୁ ଇମେଲ୍ କରନ୍ତୁ।",
    warningLabel: "⚠️ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ", tipLabel: "💡 ଟିପ୍", importantLabel: "ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ",
    ownerSections: [
      { title: "1. ଆକାଉଣ୍ଟ ତିଆରି & ଲଗଇନ୍", steps: [
        { title: "ୱେବସାଇଟ୍ ଖୋଲନ୍ତୁ", desc: "'Sign Up' କ୍ଲିକ୍ କରନ୍ତୁ.", image: "/guide/signup-page.jpg" },
        { title: "'PG Owner' ବାଛନ୍ତୁ", desc: "'PG Owner' କ୍ଲିକ୍ କରନ୍ତୁ.", warning: "ସାଇନ୍ ଅପ୍ ସମୟରେ 'PG Owner' ବାଛିବା ବାଧ୍ୟତାମୂଳକ." },
        { title: "ବିବରଣୀ ପୁରଣ କରନ୍ତୁ", desc: "ପୂରା ନାମ, ଇମେଲ୍, ପାସୱାର୍ଡ ଦିଅନ୍ତୁ." },
        { title: "ଇମେଲ୍ ଯାଞ୍ଚ କରନ୍ତୁ", desc: "ଭେରିଫିକେସନ୍ ଲିଙ୍କ କ୍ଲିକ୍ କରନ୍ତୁ.", warning: "Spam ଫୋଲ୍ଡର ଯାଞ୍ଚ କରନ୍ତୁ." },
        { title: "ଲଗଇନ୍ କରନ୍ତୁ", desc: "'Sign In' କ୍ଲିକ୍ କରନ୍ତୁ." },
      ]},
      { title: "2. ସମ୍ପତ୍ତି ସେଟଅପ୍", steps: [
        { title: "Properties କୁ ଯାଆନ୍ତୁ", desc: "'Properties' କ୍ଲିକ୍ କରନ୍ତୁ.", image: "/guide/owner-dashboard.jpg" },
        { title: "ନୂଆ ସମ୍ପତ୍ତି ଯୋଡ଼ନ୍ତୁ", desc: "PG ନାମ, ଠିକଣା, ସହର, ସୁବିଧା ପୁରଣ କରନ୍ତୁ.", image: "/guide/add-property.jpg" },
        { title: "କୋଠରୀ ତିଆରି କରନ୍ତୁ", desc: "କୋଠରୀ ନମ୍ବର, ପ୍ରକାର, ଭଡ଼ା, ଜମା ପୁରଣ କରନ୍ତୁ." },
      ]},
      { title: "3. ଭଡ଼ାଟିଆଙ୍କୁ ନିମନ୍ତ୍ରଣ (ସବୁଠୁ ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ!)", steps: [
        { title: "Invitations ପୃଷ୍ଠାକୁ ଯାଆନ୍ତୁ", desc: "'Invitations' କ୍ଲିକ୍ କରନ୍ତୁ.", image: "/guide/invite-tenant.jpg" },
        { title: "ନୂଆ ନିମନ୍ତ୍ରଣ ତିଆରି କରନ୍ତୁ", desc: "ଭଡ଼ାଟିଆ ନାମ, ଇମେଲ୍, ଫୋନ୍, ସମ୍ପତ୍ତି, କୋଠରୀ ବାଛନ୍ତୁ.", warning: "ଏଠାରେ ଦିଆଯାଇଥିବା ଇମେଲ୍ ଭଡ଼ାଟିଆ ଆକାଉଣ୍ଟ ତିଆରି ସମୟରେ ବ୍ୟବହାର କରୁଥିବା ଇମେଲ୍ ସହ ଠିକ୍ ମେଳ ଖାଇବା ଜରୁରୀ!" },
        { title: "କୋଡ୍ ସେୟାର କରନ୍ତୁ", desc: "WhatsApp/SMS ରେ କୋଡ୍ ପଠାନ୍ତୁ.", warning: "କୋଡ୍ 7 ଦିନରେ ଏକ୍ସପାୟାର ହୁଏ." },
      ]},
      { title: "4. ଭଡ଼ା & ପେମେଣ୍ଟ", steps: [
        { title: "ପେମେଣ୍ଟ ସୂଚନା ସେଟ୍ କରନ୍ତୁ", desc: "UPI ID, ବ୍ୟାଙ୍କ ବିବରଣୀ ଯୋଡ଼ନ୍ତୁ." },
        { title: "ଭଡ଼ା ଟ୍ରାକ୍ କରନ୍ତୁ", desc: "'Payments'ରେ ରେକର୍ଡ ଦେଖନ୍ତୁ.", image: "/guide/payments-page.jpg" },
        { title: "ଖର୍ଚ୍ଚ ଟ୍ରାକ୍ କରନ୍ତୁ", desc: "'Expenses'ରେ ଖର୍ଚ୍ଚ ଲେଖନ୍ତୁ." },
      ]},
      { title: "5. ଯୋଗାଯୋଗ & ପରିଚାଳନା", steps: [
        { title: "ଘୋଷଣା", desc: "'Announcements' ଦ୍ୱାରା ବାର୍ତ୍ତା ପଠାନ୍ତୁ." },
        { title: "ଅଭିଯୋଗ", desc: "'Complaints'ରେ ସମାଧାନ କରନ୍ତୁ." },
        { title: "ଖାଦ୍ୟ ମେନୁ", desc: "'Meal Menu' ସେଟ୍ କରନ୍ତୁ." },
        { title: "ୟୁଟିଲିଟି ବିଲ", desc: "ବିଜୁଳି ପାଣି ଟ୍ରାକ୍ କରନ୍ତୁ." },
        { title: "ଦର୍ଶକ ଲଗ", desc: "ଦର୍ଶକଙ୍କ ରେକର୍ଡ ରଖନ୍ତୁ." },
        { title: "ଡକୁମେଣ୍ଟ", desc: "ID ପ୍ରୁଫ ଯାଞ୍ଚ କରନ୍ତୁ." },
      ]},
    ],
    tenantSections: [
      { title: "1. ଆକାଉଣ୍ଟ ତିଆରି", steps: [
        { title: "ୱେବସାଇଟ୍ ଖୋଲନ୍ତୁ", desc: "'Sign Up' କ୍ଲିକ୍ କରନ୍ତୁ.", image: "/guide/signup-page.jpg" },
        { title: "'Tenant' ବାଛନ୍ତୁ", desc: "'Tenant' କ୍ଲିକ୍ କରନ୍ତୁ.", warning: "'PG Owner' ବାଛନ୍ତୁ ନାହିଁ." },
        { title: "ମାଲିକ ଦେଇଥିବା ସେହି ଇମେଲ୍ ବ୍ୟବହାର କରନ୍ତୁ", desc: "ମାଲିକ ନିମନ୍ତ୍ରଣରେ ବ୍ୟବହାର କରିଥିବା ସେହି ଇମେଲ୍ ଦ୍ୱାରା ସାଇନ୍ ଅପ୍ କରନ୍ତୁ.", warning: "ଇମେଲ୍ ମେଳ ନ ଖାଇଲେ କୋଠରୀ ଆସାଇନମେଣ୍ଟ କାମ କରିବ ନାହିଁ." },
        { title: "ବିବରଣୀ ପୁରଣ & ଇମେଲ୍ ଯାଞ୍ଚ", desc: "ନାମ, ଇମେଲ୍, ପାସୱାର୍ଡ ଦିଅନ୍ତୁ ଏବଂ ଲିଙ୍କ କ୍ଲିକ୍ କରନ୍ତୁ." },
        { title: "ଲଗଇନ୍ କରନ୍ତୁ", desc: "ଯାଞ୍ଚ ପରେ 'Sign In' କରନ୍ତୁ." },
      ]},
      { title: "2. ଅନବୋର୍ଡିଂ", steps: [
        { title: "ପ୍ରୋଫାଇଲ୍ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ", desc: "ଫୋନ୍ ନମ୍ବର, ସହର ଯୋଡ଼ନ୍ତୁ.", image: "/guide/tenant-onboarding.jpg" },
        { title: "କୋଠରୀ ଆସାଇନମେଣ୍ଟ", desc: "ସଠିକ ଇମେଲ୍ ରେ ସାଇନ୍ ଅପ୍ କଲେ କୋଠରୀ ସ୍ୱୟଂ ଆସାଇନ ହୁଏ.", warning: "ଅସମ୍ପୂର୍ଣ୍ଣ ହେଲେ ମାଲିକଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ." },
        { title: "ID ଅପଲୋଡ କରନ୍ତୁ", desc: "ଆଧାର, PAN ଅପଲୋଡ କରନ୍ତୁ." },
        { title: "ଜରୁରୀ ସମ୍ପର୍କ", desc: "ନାମ ଏବଂ ଫୋନ୍ ନମ୍ବର ଦିଅନ୍ତୁ." },
        { title: "ପ୍ରଥମ ଭଡ଼ା", desc: "UPI/ବ୍ୟାଙ୍କ ରେ ଭୁଗତାନ କରନ୍ତୁ ଏବଂ ରସିଦ ଅପଲୋଡ କରନ୍ତୁ." },
      ]},
      { title: "3. ଦୈନିକ ବ୍ୟବହାର", steps: [
        { title: "ଡ୍ୟାସବୋର୍ଡ", desc: "କୋଠରୀ ବିବରଣୀ, ଭଡ଼ା ସ୍ଥିତି ଦେଖନ୍ତୁ." },
        { title: "ମାସିକ ଭଡ଼ା", desc: "ପ୍ରତି ମାସ ଭୁଗତାନ କରନ୍ତୁ ଏବଂ ପ୍ରୁଫ ଅପଲୋଡ କରନ୍ତୁ." },
        { title: "ଖାଦ୍ୟ ମେନୁ", desc: "ଦୈନିକ ସେଡ୍ୟୁଲ ଦେଖନ୍ତୁ." },
        { title: "ଅଭିଯୋଗ", desc: "ବିସ୍ତୃତ ଭାବରେ ଲେଖନ୍ତୁ." },
        { title: "ଘୋଷଣା", desc: "ମାଲିକଙ୍କ ବାର୍ତ୍ତା ପଢ଼ନ୍ତୁ." },
        { title: "ଚାଟ", desc: "ଅନ୍ୟ ଭଡ଼ାଟିଆଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ." },
        { title: "ବିଲ", desc: "ବିଜୁଳି ପାଣି ବିଲ ଦେଖନ୍ତୁ." },
        { title: "ରିଭ୍ୟୁ", desc: "ରେଟିଂ ଏବଂ ରିଭ୍ୟୁ ଦିଅନ୍ତୁ." },
      ]},
    ],
  },
  as: {
    pageTitle: "ব্যৱহাৰকাৰী গাইড", pageSubtitle: "PG মালিক আৰু ভাড়াতীয়াসকলৰ বাবে সম্পূৰ্ণ গাইড",
    ownerTab: "PG মালিকৰ বাবে", tenantTab: "ভাড়াতীয়াৰ বাবে",
    stepLabel: "পদক্ষেপ", needHelp: "অধিক সহায় লাগে?",
    needHelpDesc: "support@pgmanager.in লৈ ইমেইল কৰক।",
    warningLabel: "⚠️ গুৰুত্বপূৰ্ণ", tipLabel: "💡 পৰামৰ্শ", importantLabel: "গুৰুত্বপূৰ্ণ",
    ownerSections: [
      { title: "1. একাউণ্ট সৃষ্টি & লগইন", steps: [
        { title: "ৱেবছাইট খোলক", desc: "'Sign Up' ক্লিক কৰক.", image: "/guide/signup-page.jpg" },
        { title: "'PG Owner' বাছক", desc: "'PG Owner' ক্লিক কৰক.", warning: "ছাইন আপৰ সময়ত 'PG Owner' বাছনি বাধ্যতামূলক." },
        { title: "বিৱৰণ পূৰণ কৰক", desc: "সম্পূৰ্ণ নাম, ইমেইল, পাছৱৰ্ড দিয়ক." },
        { title: "ইমেইল পৰীক্ষা কৰক", desc: "ভেৰিফিকেচন লিংক ক্লিক কৰক.", warning: "Spam ফোল্ডাৰ পৰীক্ষা কৰক." },
        { title: "লগইন কৰক", desc: "'Sign In' ক্লিক কৰক." },
      ]},
      { title: "2. সম্পত্তি ছেটআপ", steps: [
        { title: "Properties লৈ যাওক", desc: "'Properties' ক্লিক কৰক.", image: "/guide/owner-dashboard.jpg" },
        { title: "নতুন সম্পত্তি যোগ কৰক", desc: "PG নাম, ঠিকনা, চহৰ, সুবিধা পূৰণ কৰক.", image: "/guide/add-property.jpg" },
        { title: "কোঠা সৃষ্টি কৰক", desc: "কোঠা নম্বৰ, প্ৰকাৰ, ভাড়া, জমা পূৰণ কৰক." },
      ]},
      { title: "3. ভাড়াতীয়াক নিমন্ত্ৰণ (আটাইতকৈ গুৰুত্বপূৰ্ণ!)", steps: [
        { title: "Invitations পৃষ্ঠালৈ যাওক", desc: "'Invitations' ক্লিক কৰক.", image: "/guide/invite-tenant.jpg" },
        { title: "নতুন নিমন্ত্ৰণ সৃষ্টি কৰক", desc: "ভাড়াতীয়াৰ নাম, ইমেইল, ফোন, সম্পত্তি, কোঠা বাছক.", warning: "ইয়াত দিয়া ইমেইল ভাড়াতীয়াই একাউণ্ট সৃষ্টি কৰোতে ব্যৱহাৰ কৰা ইমেইলৰ সৈতে হুবহু মিলিব লাগিব!" },
        { title: "কোড শ্বেয়াৰ কৰক", desc: "WhatsApp/SMS ৰে কোড পঠাওক.", warning: "কোড 7 দিনত এক্সপায়াৰ হয়." },
      ]},
      { title: "4. ভাড়া & পেমেণ্ট", steps: [
        { title: "পেমেণ্ট তথ্য ছেট কৰক", desc: "UPI ID, বেংক বিৱৰণ যোগ কৰক." },
        { title: "ভাড়া ট্ৰেক কৰক", desc: "'Payments'ত ৰেকৰ্ড চাওক.", image: "/guide/payments-page.jpg" },
        { title: "খৰচ ট্ৰেক কৰক", desc: "'Expenses'ত খৰচ লিপিবদ্ধ কৰক." },
      ]},
      { title: "5. যোগাযোগ & পৰিচালনা", steps: [
        { title: "ঘোষণা", desc: "'Announcements' ৰে বাৰ্তা পঠাওক." },
        { title: "অভিযোগ", desc: "'Complaints'ত সমাধান কৰক." },
        { title: "আহাৰ মেনু", desc: "'Meal Menu' ছেট কৰক." },
        { title: "ইউটিলিটি বিল", desc: "বিদ্যুৎ পানী ট্ৰেক কৰক." },
        { title: "দৰ্শনাৰ্থী লগ", desc: "দৰ্শনাৰ্থীৰ ৰেকৰ্ড ৰাখক." },
        { title: "নথিপত্ৰ", desc: "ID প্ৰুফ পৰীক্ষা কৰক." },
      ]},
    ],
    tenantSections: [
      { title: "1. একাউণ্ট সৃষ্টি", steps: [
        { title: "ৱেবছাইট খোলক", desc: "'Sign Up' ক্লিক কৰক.", image: "/guide/signup-page.jpg" },
        { title: "'Tenant' বাছক", desc: "'Tenant' ক্লিক কৰক.", warning: "'PG Owner' নাবাছিব." },
        { title: "মালিকে দিয়া সেই ইমেইল ব্যৱহাৰ কৰক", desc: "মালিকে নিমন্ত্ৰণত ব্যৱহাৰ কৰা সেই ইমেইলেৰে ছাইন আপ কৰক.", warning: "ইমেইল নিমিলিলে কোঠা এচাইনমেণ্ট কাম নকৰে." },
        { title: "বিৱৰণ পূৰণ & ইমেইল পৰীক্ষা", desc: "নাম, ইমেইল, পাছৱৰ্ড দিয়ক আৰু লিংক ক্লিক কৰক." },
        { title: "লগইন কৰক", desc: "পৰীক্ষাৰ পিছত 'Sign In' কৰক." },
      ]},
      { title: "2. অনবোৰ্ডিং", steps: [
        { title: "প্ৰফাইল সম্পূৰ্ণ কৰক", desc: "ফোন নম্বৰ, চহৰ যোগ কৰক.", image: "/guide/tenant-onboarding.jpg" },
        { title: "কোঠা এচাইনমেণ্ট", desc: "সঠিক ইমেইলেৰে ছাইন আপ কৰিলে কোঠা স্বয়ংক্ৰিয়ভাৱে এচাইন হয়.", warning: "অসম্পূৰ্ণ হ'লে মালিকৰ সৈতে যোগাযোগ কৰক." },
        { title: "ID আপলোড কৰক", desc: "আধাৰ, PAN আপলোড কৰক." },
        { title: "জৰুৰী সংযোগ", desc: "নাম আৰু ফোন নম্বৰ দিয়ক." },
        { title: "প্ৰথম ভাড়া", desc: "UPI/বেংকত ভুগতান কৰক আৰু ৰচিদ আপলোড কৰক." },
      ]},
      { title: "3. দৈনিক ব্যৱহাৰ", steps: [
        { title: "ডেচব'ৰ্ড", desc: "কোঠাৰ বিৱৰণ, ভাড়াৰ স্থিতি চাওক." },
        { title: "মাহিলী ভাড়া", desc: "প্ৰতি মাহে ভুগতান কৰক আৰু প্ৰুফ আপলোড কৰক." },
        { title: "আহাৰ মেনু", desc: "দৈনিক শ্বেডিউল চাওক." },
        { title: "অভিযোগ", desc: "বিতংকৈ লিখক." },
        { title: "ঘোষণা", desc: "মালিকৰ বাৰ্তা পঢ়ক." },
        { title: "চেট", desc: "আন ভাড়াতীয়াৰ সৈতে কথা পাতক." },
        { title: "বিল", desc: "বিদ্যুৎ পানী বিল চাওক." },
        { title: "ৰিভিউ", desc: "ৰেটিং আৰু ৰিভিউ দিয়ক." },
      ]},
    ],
  },
};
