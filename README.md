# CampusFind 🎓

**A College Lost & Found Platform**

CampusFind is a web-based lost-and-found platform designed to help college students report lost belongings, discover found items, and reconnect people with their possessions.

## ✨ Features

- 🔍 **Browse Items** — View lost and found reports.
- 🔎 **Search & Filters** — Search by item name, description, location, type, and category.
- 📝 **Submit Reports** — Report lost or found belongings with relevant details.
- 📞 **Contact Reporters** — Contact the person who submitted a report through email or WhatsApp.
- 📊 **Report Statistics** — View counts of lost items, found items, and total reports.
- 📅 **60-Day Expiry Visibility** — Reports older than their expiry date are hidden from the website.
- 📱 **Responsive Design** — Use the website on desktop and mobile devices.
- 🖼️ **Photo Preview** — Select an item photo and preview it before submission. Online photo storage is not yet implemented.

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript (ES Modules)
- Firebase Firestore
- Supabase Storage (planned)

## 📁 Project Structure

```text
CampusFind/
├── index.html
├── README.md
├── css/
│   └── style.css
└── js/
    ├── firebase.js
    └── app.js
```

## 🚀 Run Locally

1. Download or clone this repository.
2. Open the project folder in Visual Studio Code.
3. Install the **Live Server** extension if it is not already installed.
4. Right-click `index.html`.
5. Select **Open with Live Server**.
6. The website will open in your browser.

## 🔥 Firebase Configuration

CampusFind uses Firebase Firestore to store and retrieve reports.

To configure the project:

1. Create a Firebase project.
2. Register a web application.
3. Configure the Firebase settings in `js/firebase.js`.
4. Create the `reports` collection through report submissions.
5. Configure appropriate Firestore security rules.

**Security note:** Never publish service-account credentials, secret API keys, passwords, or other private credentials in your repository. Public report access and reporter contact information should be protected appropriately before production deployment.

## 📌 Current Limitations

- Item photos are previewed locally but are not yet uploaded to online storage.
- Expired reports are hidden by the website; they are not automatically deleted from Firestore.
- Report submission and contact details depend on the configured Firebase setup.
- Authentication and report ownership management are not currently implemented.

## 🔮 Future Improvements

- Permanent item photo uploads.
- Mark items as returned or resolved.
- Better spam prevention and validation.
- Improved privacy controls for contact information.
- Public website deployment.
- A more secure report-management workflow.

## 👨‍💻 Author

**Abhinav**

- GitHub: [Your GitHub Profile](https://github.com/)
- Email: [kadiyalabhinav@gmail.com](mailto:kadiyalabhinav@gmail.com)

## 📄 License

This project does not currently specify a license. Please contact the author before reusing or distributing the source code.
