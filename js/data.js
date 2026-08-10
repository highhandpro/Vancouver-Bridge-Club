/**
 * Vancouver Bridge Club (ACBL Unit 452)
 * Comprehensive Data Repository & Content Model
 */

const VBC_DATA = {
  clubInfo: {
    name: "Vancouver Bridge Club",
    unit: "ACBL Unit 452",
    clubNumber: "118489",
    district: "District 20",
    phone: "(360) 737-3772",
    email: "vancouverbridgeclub@gmail.com",
    address: "6503 E Mill Plain Blvd, Suite H, Vancouver, WA 98661",
    mapUrl: "https://maps.google.com/?q=6503+E+Mill+Plain+Blvd+Suite+H+Vancouver+WA+98661",
    regularTableFee: "$8.00 per session",
    specialTableFee: "$9.00 - $10.00 for STaC / Upgraded Masterpoint Games",
    announcements: [
      {
        id: 1,
        title: "Summer Sectional & Special STaC Week Coming Up!",
        date: "August 2026",
        content: "Earn extra silver and red masterpoints at VBC! Check the full calendar for session times and partner up early.",
        type: "special"
      },
      {
        id: 2,
        title: "Free Beginner Mentoring Sessions on Tuesdays",
        date: "Weekly",
        content: "Join us every Tuesday at 10:30 AM for a 30-minute mini-lesson followed by supervised play at 11:30 AM.",
        type: "lesson"
      }
    ]
  },

  // Weekly Recurring Game Timetable
  weeklySchedule: [
    {
      day: "Monday",
      time: "11:30 AM",
      title: "Open Pairs & 0-750 Pairs",
      director: "Club Director",
      type: "open",
      fee: "$8.00",
      notes: "Separate section for 0-750 limited players when attendance permits."
    },
    {
      day: "Tuesday",
      time: "10:30 AM",
      title: "Bridge Basics Mini-Lesson",
      director: "Education Coordinator",
      type: "lesson",
      fee: "Free with game",
      notes: "30-minute focus on bidding techniques, defense, or declarer play."
    },
    {
      day: "Tuesday",
      time: "11:30 AM",
      title: "Mentored Play / Non-Life Master Pairs",
      director: "Club Director",
      type: "mentoring",
      fee: "$8.00",
      notes: "Casual, welcoming atmosphere. Ask questions during bidding & review hands."
    },
    {
      day: "Wednesday",
      time: "11:30 AM",
      title: "Open Pairs Session",
      director: "Club Director",
      type: "open",
      fee: "$8.00",
      notes: "Full masterpoint game with The Common Game hand analysis."
    },
    {
      day: "Wednesday",
      time: "6:30 PM",
      title: "Eight-is-Enough Swiss Teams",
      director: "Club Director",
      type: "teams",
      fee: "$8.00",
      notes: "Handicapped Swiss team event. Great strategy & fun team atmosphere!"
    },
    {
      day: "Thursday",
      time: "11:30 AM",
      title: "0-1500 Limited & Open Pairs",
      director: "Club Director",
      type: "limited",
      fee: "$8.00",
      notes: "Ideal for intermediate players working toward Life Master rank."
    },
    {
      day: "Friday",
      time: "11:30 AM",
      title: "Friday Open Pairs Championship",
      director: "Club Director",
      type: "open",
      fee: "$8.00",
      notes: "Competitive Friday open game. Results posted directly to ACBL Live & Common Game."
    },
    {
      day: "Saturday",
      time: "11:00 AM",
      title: "Weekend Open Pairs",
      director: "Club Director",
      type: "open",
      fee: "$8.00",
      notes: "Light snacks provided. Standby host guaranteed—come with or without a partner!"
    }
  ],

  // Sample Upcoming Events for Interactive Calendar
  calendarEvents: [
    { id: "e1", title: "Open Pairs & 0-750", date: "2026-08-03", time: "11:30 AM", type: "open", fee: "$8", notes: "Regular club masterpoints" },
    { id: "e2", title: "Tuesday Mentored Play", date: "2026-08-04", time: "10:30 AM Lesson / 11:30 AM Game", type: "mentoring", fee: "$8", notes: "Supervised play" },
    { id: "e3", title: "Open Pairs Championship", date: "2026-08-05", time: "11:30 AM", type: "open", fee: "$8", notes: "Common Game hands" },
    { id: "e4", title: "Eight is Enough Swiss", date: "2026-08-05", time: "6:30 PM", type: "teams", fee: "$8", notes: "Team rosters formed on site" },
    { id: "e5", title: "0-1500 Pairs", date: "2026-08-06", time: "11:30 AM", type: "limited", fee: "$8", notes: "Limited masterpoints" },
    { id: "e6", title: "Friday Open Pairs", date: "2026-08-07", time: "11:30 AM", type: "open", fee: "$8", notes: "Regular session" },
    { id: "e7", title: "Weekend Open Pairs", date: "2026-08-08", time: "11:00 AM", type: "open", fee: "$8", notes: "Host available" },
    { id: "e8", title: "Unit 452 STaC Silver Game", date: "2026-08-10", time: "11:30 AM", type: "special", fee: "$9", notes: "Silver Masterpoints awarded across District 20!" },
    { id: "e9", title: "STaC Mentored Pairs", date: "2026-08-11", time: "11:30 AM", type: "special", fee: "$9", notes: "Silver Masterpoints for Non-Life Masters" },
    { id: "e10", title: "STaC Open Pairs", date: "2026-08-12", time: "11:30 AM", type: "special", fee: "$9", notes: "Silver points" },
    { id: "e11", title: "STaC Swiss Teams", date: "2026-08-12", time: "6:30 PM", type: "special", fee: "$9", notes: "Silver points for Swiss teams" },
    { id: "e12", title: "STaC Limited Pairs", date: "2026-08-13", time: "11:30 AM", type: "special", fee: "$9", notes: "Silver points 0-1500" },
    { id: "e13", title: "STaC Friday Pairs", date: "2026-08-14", time: "11:30 AM", type: "special", fee: "$9", notes: "District-wide scoring" },
    { id: "e14", title: "Summer Sectional Warmup", date: "2026-08-15", time: "11:00 AM", type: "special", fee: "$10", notes: "Pre-sectional special game" }
  ],

  // Live Results & Masterpoint Race Links
  resultsLinks: [
    {
      name: "VBC ACBL Live for Clubs",
      clubId: "118489",
      url: "https://my.acbl.org/club-results/118489",
      desc: "Official ACBL matchpoint and masterpoint awards for Vancouver Bridge Club.",
      primary: true
    },
    {
      name: "VBC Common Game Results",
      clubId: "118489",
      url: "https://tcgcloud.bridgefinesse.com/ClubWebHost/118489/",
      desc: "Compare your results with hundreds of clubs across North America with hand records and analysis.",
      primary: true
    },
    {
      name: "Longview Bridge Club (LBC) ACBL Live",
      clubId: "140947",
      url: "https://my.acbl.org/club-results/140947",
      desc: "Official ACBL game results for sister club Longview BC.",
      primary: false
    },
    {
      name: "Longview BC Common Game",
      clubId: "140947",
      url: "https://tcgcloud.bridgefinesse.com/ClubWebHost/140947/",
      desc: "Common Game records for Longview Bridge Club.",
      primary: false
    },
    {
      name: "Unit 452 Ace of Clubs Race",
      url: "http://web2.acbl.org/as400/mpraces/unit/2020/ac452.htm",
      desc: "Year-to-date club masterpoint race standings for Unit 452 players.",
      primary: false
    },
    {
      name: "Unit 452 Mini-McKenney Race",
      url: "http://web2.acbl.org/as400/mpraces/unit/2020/mm452.htm",
      desc: "Total masterpoints earned in all tournaments and club games by rank bracket.",
      primary: false
    }
  ],

  // Initial Seed Partnership Posts
  initialPartnershipPosts: [
    {
      id: "p1",
      name: "David S.",
      mps: "420 Masterpoints",
      bracket: "Intermediate (0-750)",
      targetDate: "Monday, Aug 17",
      targetSession: "11:30 AM Open/0-750 Pairs",
      system: "2/1 Game Force, 15-17 NT, Jacoby Transfers",
      notes: "Looking for an enthusiastic partner for the Monday session. Friendly & relaxed play!",
      contact: "Call/Text: (360) 555-0182",
      postedAt: "2 days ago"
    },
    {
      id: "p2",
      name: "Margaret K.",
      mps: "85 Masterpoints",
      bracket: "Novice (0-100)",
      targetDate: "Tuesday, Aug 18",
      targetSession: "11:30 AM Mentored Play",
      system: "Standard American (SAYC), Stayman, Transfers",
      notes: "Seeking a partner for Tuesday Mentored game. Still learning and love to review hands.",
      contact: "Email: margaret.k.bridge@example.com",
      postedAt: "Yesterday"
    },
    {
      id: "p3",
      name: "Robert M. & Carol L.",
      mps: "1,200 combined MPs",
      bracket: "Open / Swiss Teams",
      targetDate: "Wednesday, Aug 19",
      targetSession: "6:30 PM 8-is-Enough Swiss Teams",
      system: "2/1 Game Force",
      notes: "We are a pair looking for two teammates to complete our Swiss team this Wednesday evening.",
      contact: "Call: (360) 555-0144",
      postedAt: "Today"
    }
  ],

  // Unit 452 Officers & Board of Directors
  governance: {
    officers: [
      { role: "President", name: "Frank Africa", email: "president.unit452@gmail.com", phone: "(360) 555-0111" },
      { role: "Vice President", name: "Barbara Seagram", email: "vp.unit452@gmail.com", phone: "(360) 555-0112" },
      { role: "Secretary", name: "Helen Montgomery", email: "secretary.unit452@gmail.com", phone: "(360) 555-0113" },
      { role: "Treasurer", name: "Jim Henderson", email: "treasurer.unit452@gmail.com", phone: "(360) 555-0114" },
      { role: "Tournament Coordinator", name: "Patricia Wilson", email: "tournaments.unit452@gmail.com", phone: "(360) 555-0115" },
      { role: "Education & Mentoring Chair", name: "Susan Miller", email: "education.unit452@gmail.com", phone: "(360) 555-0116" },
      { role: "Partnership Coordinator", name: "Tom Reynolds", email: "partnerships.vbc@gmail.com", phone: "(360) 737-3772" }
    ],
    documents: [
      {
        title: "Unit 452 Bylaws",
        category: "Bylaws",
        url: "https://web2.acbld20.org/vbc/U452_Bylaws.pdf",
        desc: "Official governing bylaws and operational rules of ACBL Unit 452."
      },
      {
        title: "Board Meeting Minutes Archive",
        category: "Minutes",
        url: "https://web2.acbld20.org/vbc/U452_minutes.pdf",
        desc: "Records and financial reports from monthly Unit 452 Board of Directors meetings."
      },
      {
        title: "VBC Disciplinary Flow Chart & Regulations",
        category: "Ethics & Conduct",
        url: "https://web2.acbld20.org/vbc/Library/VBC_Disiplionary_Flow_Chart.pdf",
        desc: "Procedures and guidelines for resolving member disputes and ethical complaints."
      },
      {
        title: "ACBL Zero Tolerance Policy Guide",
        category: "Ethics & Conduct",
        url: "https://s3.amazonaws.com/cdn.acbl.org/wp-content/uploads/2014/02/ZT-Handout-for-Clubs.pdf",
        desc: "Guidelines ensuring a courteous, pleasant, and welcoming playing environment for all."
      },
      {
        title: "Appeals of Tournament & Club Rulings",
        category: "Ruling the Game",
        url: "https://web2.acbld20.org/vbc/Library/Appeals.pdf",
        desc: "Formal process and committee protocol for appealing Director table rulings."
      }
    ]
  },

  // Learning, References & Tools
  learningResources: [
    {
      title: "ACBL Convention Charts",
      category: "Bidding & Systems",
      url: "http://web2.acbl.org/documentLibrary/about/CONVENTIONCHARTS9_19.pdf",
      desc: "Official ACBL guidelines for permitted conventions across Basic, Open, and Open+ events."
    },
    {
      title: "Official ACBL Alert Procedures",
      category: "Alerts & Ethics",
      url: "http://web2.acbl.org/documentLibrary/play/AlertProcedures.pdf",
      desc: "Complete guide to pre-alerts, immediate alerts, and delayed announcements during bidding."
    },
    {
      title: "The Laws of Duplicate Bridge",
      category: "Ruling the Game",
      url: "http://web2.acbl.org/documentlibrary/play/Laws-of-Duplicate-Bridge.pdf",
      desc: "The complete official rulebook governing all sanctioned duplicate bridge competitions worldwide."
    },
    {
      title: "How to Play Bridge (ACBL Beginner Guide)",
      category: "Beginners",
      url: "https://www.acbl.org/learn_page/how-to-play-bridge/",
      desc: "Step-by-step interactive lessons and tutorials for new players."
    },
    {
      title: "New Tricks Bridge Club Video Tutorials",
      category: "Video & Practice",
      url: "https://www.youtube.com/c/NewTricksBridgeClub",
      desc: "Popular video guides covering bidding strategy, defense, and card play."
    },
    {
      title: "ACBL Masterpoint Awards Chart",
      category: "References",
      url: "https://www.acbl.org/clubs_page/club-administration/resources-and-forms/masterpoint-awards-chart/",
      desc: "Formulas and award tables for black, silver, red, and gold masterpoints."
    }
  ],

  // Sister Clubs & Regional Links
  sisterClubs: [
    { name: "ACBL District 20", url: "https://web2.acbld20.org/index.html", region: "Pacific Northwest (OR / SW WA / N CA)" },
    { name: "Portland Bridge Club", url: "https://www.bridgewebs.com/portland/", region: "Portland, OR" },
    { name: "Ace of Clubs Bridge Club", url: "http://www.bridgewebs.com/cgi-bin/bwom/bw.cgi?club=aceofclubs/", region: "Portland, OR" },
    { name: "Longview Bridge Club (LBC)", url: "https://web2.acbld20.org/lbc/LBC_home.html", region: "Longview, WA" },
    { name: "American Contract Bridge League (ACBL)", url: "https://www.acbl.org/", region: "National Headquarters" }
  ],

  // Cartoons by Gary Bowers
  cartoons: [
    { title: "The Finesse Dilemma", caption: "Taking the finesse when eight ever, nine never applies!", suit: "♠" },
    { title: "Bidding Box Accidents", caption: "When the 7NT bidding card accidentally sticks to the 1NT card.", suit: "♥" },
    { title: "The Lead Out of Turn", caption: "When your partner leads before the dummy is even spread.", suit: "♦" },
    { title: "Counting to Thirteen", caption: "The art of remembering who discarded which club on trick four.", suit: "♣" }
  ]
};
