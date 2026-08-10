# Vancouver Bridge Club (ACBL Unit 452) — Official Website

Modern, accessible, and responsive website for the **Vancouver Bridge Club (ACBL Sanction #118489)** in Southwest Washington.

---

## 🌟 Key Features

- **High-Contrast & Senior-Friendly Accessibility**: Built-in 1-click **Text Size Resizing** (Normal / Large / Extra Large) and **Dark/Light Mode** toggles.
- **Dynamic "Today at VBC" Widget**: Automatically calculates the day of the week and displays today's sessions, game times, table fee ($8.00), and directions.
- **Interactive Calendar & Schedule (`schedule.html`)**: Filterable monthly calendar supporting *Open Pairs*, *0-750 / 0-1500 Limited*, *Swiss Teams (8-is-Enough)*, *Mentoring*, and *STaC Silver Point Games*.
- **Live Results Hub (`results.html`)**: Direct live links and cards for **ACBL Live for Clubs** and **The Common Game**, plus **Unit 452 Ace of Clubs & Mini-McKenney Race** standings.
- **Digital Partnership Desk (`partnership.html`)**: Interactive bulletin board allowing players to filter and post "Seeking a Partner" requests with instant browser persistence.
- **Bridge Education & Resources (`learn.html`)**: Free Tuesday mini-lesson schedules, ACBL convention charts, alert procedures, zero tolerance conduct guide, and beginner video tutorials.
- **Unit 452 Governance (`governance.html`)**: Directory cards for the Board of Directors & Officers, PDF meeting minutes archive, Unit bylaws, and disciplinary procedures.
- **Community & Heritage (`community.html`)**: Gary Bowers bridge cartoons, tournament photo galleries, In Memoriam memorials, and District 20 sister club links.

---

## 🚀 Instant Deployment with GitHub Pages

This repository is built with standard semantic HTML5, modern CSS3, and vanilla JavaScript (zero build step or npm dependencies required).

### Steps to Deploy:
1. Create a new GitHub repository (e.g., `vancouver-bridge-club`).
2. Push this codebase to your repository's `main` branch.
3. In GitHub, navigate to **Settings** → **Pages**.
4. Under **Branch**, select `main` and root `/`, then click **Save**.
5. Your website will be live in seconds at `https://<your-username>.github.io/vancouver-bridge-club/`!

---

## 📂 Project Structure

```
├── index.html              # Home portal (Hero, Today at VBC, weekly schedule summary, map & contacts)
├── schedule.html           # Interactive Monthly & Weekly Calendar with skill/game type filters
├── results.html            # Results Hub (ACBL Live #118489, The Common Game, Unit 452 MP races)
├── partnership.html        # Interactive Partnership Desk (Bulletin board + request submission modal)
├── learn.html              # Bridge Education Center (Lessons, Convention charts, Alert procedures)
├── governance.html         # Unit 452 Governance (Board, Minutes archive, Bylaws, Disciplinary charts)
├── community.html          # Community & Heritage (Photo gallery, Gary Bowers cartoons, In Memoriam, Sister clubs)
├── css/
│   └── styles.css          # Modern design system, CSS variables, accessibility tokens, suit styling
├── js/
│   ├── app.js              # Global navbar, mobile menu, text-size toggle, notifications
│   ├── calendar.js         # Interactive calendar renderer with event filters & detail popups
│   ├── partnership.js      # Partnership board filtering, post creation & localStorage sync
│   └── data.js             # Structured database (games, events, officers, minutes, resources, sister clubs)
├── assets/
│   └── logo.svg            # Custom modern SVG bridge suit crest & vector icons
└── README.md               # Repository documentation & maintenance guide
```

---

## ✏️ How to Update Club Content

All recurring club information (game times, upcoming events, board officers, announcements) is centralized in `js/data.js` for easy updates by volunteers and club managers without altering HTML code:

- **Weekly Games**: Edit `VBC_DATA.weeklySchedule`
- **Special Monthly Events**: Add items to `VBC_DATA.calendarEvents`
- **Board Officers**: Update `VBC_DATA.governance.officers`
- **Official PDF Links**: Update `VBC_DATA.governance.documents`

---

## 📜 License & Acknowledgements

Created for **Vancouver Bridge Club (ACBL Unit 452)** in Southwest Washington.  
Affiliated with the **American Contract Bridge League (ACBL)** and **District 20**.
