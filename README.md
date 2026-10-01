# Deadlines

A calendar for research life: conference pipelines, course work, and professor meetings in one place, with live two-way sync to Google Calendar.

- Month, week, and day views, with light and dark themes
- Groups for conferences, journals, courses, and projects, each with a step-by-step pipeline and a "next step" countdown
- Deadlines are points in time and meetings are blocks. Overlaps are shown explicitly: side-by-side meetings, a red warning when a deadline falls inside a meeting, and a warning for deadline days packed with meetings
- Overnight meetings show on both days
- AoE (Anywhere on Earth) deadlines are converted to your local time
- Live sync with Google Calendar. Deadlines go into their own "Deadlines" calendar and are marked as free, so they never block your schedule. Meetings come from the calendars you choose
- Works offline. Changes wait in a queue and sync when you're back online
- Installs as an app on your laptop and phone
- Search with Ctrl K, keyboard shortcuts, undo on every change

There is no server. The app is static files on GitHub Pages, and your data lives in your own Google account.

---

## Setup (about 25 minutes, once)

### Step 1: Put the app on GitHub Pages (5 min)

1. Sign in at [github.com](https://github.com) and click **New repository**.
2. Name it `deadlines`, set it to **Public** (GitHub Pages is free for public repos), and click **Create repository**.
3. On the new repo page, click **uploading an existing file**. Drag in everything from this folder: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `README.md`, and the `icons` folder. Click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment*, set Source to **Deploy from a branch**, Branch to **main**, and folder to **/ (root)**. Click **Save**.
5. Wait about a minute. Your app is now live at `https://YOUR-USERNAME.github.io/deadlines/`.

The repo only contains the app's code. Your deadlines are never stored on GitHub.

### Step 2: Create your Google sign-in key (15 min)

This lets the app talk to *your* Google Calendar. Google calls the key an "OAuth client ID".

1. Open [console.cloud.google.com](https://console.cloud.google.com) and sign in with the Google account whose calendar you use.
2. Use the project picker at the top to create a **New project** named `Deadline Tracker`, then select it.
3. Search for **Google Calendar API** in the top search bar, open it, and click **Enable**.
4. Search for **Google Auth Platform** (it may also appear as *OAuth consent screen*) and click **Get started**:
   - App name: `Deadlines`. Support email: your email.
   - Audience: **External**.
   - Contact email: your email. Agree, then click **Create**.
5. In Google Auth Platform, open **Audience**. Under *Test users*, click **Add users**, add your own Gmail address, and save.
6. Open **Clients → Create client**:
   - Application type: **Web application**
   - Name: `Deadlines web`
   - Under **Authorized JavaScript origins**, click **Add URI** and enter `https://YOUR-USERNAME.github.io`. Use the origin only, with no `/deadlines` at the end and no trailing slash.
   - Leave *Authorized redirect URIs* empty and click **Create**.
7. Copy the **Client ID**. It ends with `.apps.googleusercontent.com`.

### Step 3: Connect (2 min)

1. Open your app URL and click the gear icon (Settings).
2. Paste the client ID and click **Connect Google Calendar**.
3. Google will show *"Google hasn't verified this app."* That's expected, because this is your own private app. Click **Continue** and allow calendar access.
4. Done. A calendar called **Deadlines** appears in your Google Calendar, and everything on the device moves into it.
5. In Settings, under *Show meetings from these calendars*, tick the calendars your meetings live in, such as your main calendar and a BTH or course calendar.

**Moving data from the old laptop version:** in the old tracker, click **Back up**. In the new app, go to **Settings → Restore** and pick that file. It understands the old format.

---

## Daily use

### Reminders on your phone
Open the **Google Calendar** app on your phone. In its settings, make sure the **Deadlines** calendar is turned on. Every deadline then gets the reminders you chose in the tracker's Settings (3 days and 1 day before by default), straight from Google.

### Morning summary email
On the Google Calendar website, go to **Settings → Settings for my calendars → Deadlines → Other notifications → Daily agenda** and choose **Email**. Do the same for your main calendar. You'll get one email each morning with the day's deadlines and meetings.

### Install it as an app
- **Laptop (Edge):** open your app URL, click the *App available, Install* icon in the address bar, then click **Install**. To make it open when Windows starts, go to `edge://apps`, right-click Deadlines, and choose **Start app when you sign in**.
- **Keep it on top of other windows (Windows):** install Microsoft PowerToys and press `Win + Ctrl + T` on the window.
- **Android (Chrome):** open the URL, tap the menu, then tap **Install app** (or **Add to Home screen**).
- **iPhone (Safari):** open the URL, tap **Share**, then **Add to Home Screen**.

You can now remove the old startup launcher by running `uninstall-windows.bat` from the old version.

### Tag meetings to a group
Every group has a tag, for example `#ICSSP2027`. Put that tag in any Google Calendar event's description, from your phone or anywhere, and the meeting appears in that group's timeline in its color. When you create a meeting in the tracker, pick the group under *Link to group* and the tag is added for you.

### Keyboard
| Key | Action |
|---|---|
| `N` | New deadline |
| `M` | New meeting |
| `G` | New group (for example a conference) |
| `Ctrl K` or `/` | Search everything, or type a date such as `12 Nov` |
| `T` | Jump to today |
| `1` `2` `3` | Month, week, day view |
| `←` `→` | Previous, next |

In the month view, scroll the mouse wheel to change months, double-click a day to add a deadline, and drag a deadline or one of your own meetings to another day. In the week and day views, click an empty time slot to add a meeting there.

---

## How sync works

- Saving anything sends it to Google within a second or two. The app also checks Google when it opens, when you switch back to it, and every 3 minutes.
- Changes made in the Google Calendar app (moving or renaming a deadline, new invites) show up in the tracker on its next check. Each deadline's group, type, done status, and time zone are stored as hidden details on the Google event, so they survive edits on your phone.
- If you're offline, the pill at the top shows *Offline, N waiting*. Your changes are kept and sent as soon as you're online again.
- Meetings organized by someone else, like a professor's invite, are read-only in the tracker. Use **Open in Google** to respond to them.
- Your groups are saved in a hidden event dated 1 Jan 2000 in the Deadlines calendar, named *Deadline Tracker settings (keep this)*. Don't delete it.

## Troubleshooting

| What you see | What to do |
|---|---|
| *Sign in again* in the top pill | Click it. Google sign-ins expire, and while your app is in Testing mode Google may ask about once a week. To stop that, go to **Google Auth Platform → Audience** and click **Publish app**. Google keeps showing the "unverified" notice, which you click through, but sign-ins last longer. |
| `Error 400: redirect_uri_mismatch` or `origin_mismatch` | The JavaScript origin in Step 2.6 must exactly match `https://YOUR-USERNAME.github.io`, with no path and no trailing slash. |
| `access_denied` | Add your Gmail address as a test user (Step 2.5). |
| The sign-in window doesn't open | Allow pop-ups for your app's site in the browser. |
| No meetings appear | In Settings, tick the calendars under *Show meetings from these calendars*. |
| *Sync problem* | Hover over the pill to see Google's message. Click it to retry. |

## Privacy
- The app runs entirely in your browser. There's no server and no analytics.
- Your sign-in token is kept in this browser only. Disconnect in Settings to revoke it.
- The client ID isn't a secret. It only works for your own GitHub Pages address and your test users.

## Updating later
Replace the files in the GitHub repo. The installed app picks up the new version the next time it opens with internet.
