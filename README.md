# 💚 KaamBuffer
### Roz ki kamai aur kharche ka hisaab

**KaamBuffer** is a mobile-friendly cash-flow and micro-savings planning application designed to help Indian gig workers understand their daily finances, protect essential expenses, and estimate how much money they can safely save.

Instead of focusing only on income and savings, KaamBuffer considers work-related expenses, essential bills, unexpected income changes, and a protected financial buffer before calculating the amount available to save.

## 🎯 Problem Statement

Gig workers often experience fluctuating daily earnings while managing fuel, food, rent, bills, and other essential expenses. Saving money becomes difficult when income is unpredictable.

KaamBuffer helps users make more informed daily financial decisions by showing their available funds, upcoming obligations, potential shortfalls, and estimated safe-to-save amount.

## ✨ Features

- **User Authentication:** Sign up, log in, maintain sessions, and access password recovery through Supabase Authentication.
- **Financial Dashboard:** View available funds, expenses, essential bills, and savings estimates.
- **Expense Management:** Add, edit, and delete work-related expenses.
- **Essential Bills:** Track important financial obligations.
- **Safe-to-Save Calculator:** Estimate savings only after accounting for work costs, essential bills, and the protected buffer.
- **Income Stress Simulator:** Explore how reduced earnings could affect financial stability.
- **AI Expense Entry:** Use Gemini AI to help extract expense details from natural-language input.
- **Local Data Persistence:** Preserve supported financial state in browser storage.
- **Responsive UI:** Use the application on mobile and desktop screens.

## 🧮 How It Works

KaamBuffer uses deterministic TypeScript calculations for financial results.

**1. Stress-adjusted income**

Expected next-shift income is adjusted according to the user's estimated income stress percentage.

**2. Total available funds**

Cash in hand + bank balance + stress-adjusted income.

**3. Total required funds**

Work-related expenses + essential bills + protected financial buffer.

**4. Safe-to-save amount**

`SafeToSave = max(0, TotalAvailableFunds - TotalRequiredFunds)`

**5. Financial shortfall**

The application separately calculates a hard shortfall when available funds cannot cover work expenses and essential bills. It also identifies a gap in the protected buffer.

These calculations are intended to help users plan; they do not guarantee future income or financial outcomes.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Authentication:** Supabase Auth
- **AI Integration:** Google Gemini API
- **Testing:** Vitest
- **Data Persistence:** Browser LocalStorage and the integrations configured by the application

## 🚀 Getting Started

### Prerequisites

Install Node.js and npm, and ensure you have access to the required Supabase and Gemini credentials.

### 1. Clone the repository

```bash
git clone https://github.com/sakshambhardwaj868-lgtm/KaamBuffer.git
cd KaamBuffer
```



### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create the required local environment files based on the variable names used by the project.

For Supabase, the frontend configuration uses:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Configure the Gemini API key using the **server-side environment variable name already expected by the project**. Check the server integration before choosing that variable name.

Do not commit `.env`, `.env.local`, API secrets, passwords, or private credentials to GitHub. Keep environment files excluded through `.gitignore`.

### 4. Start the development server

```bash
npm run dev
```

Open the localhost address printed in your terminal.

### 5. Run tests

```bash
npm run test
```

If your project uses a different test script, check the available scripts in `package.json`.

### 6. Create a production build

```bash
npm run build
```

## 🔐 Security Notes

- Supabase handles user authentication.
- Keep private API keys on the server, never in frontend code.
- Configure authentication redirect URLs for both local development and the deployed domain.
- Protect users' financial data and ensure that each account can access only its own records.
- Never upload real user financial information or credentials to a public repository.

## 🌱 Future Improvements

- Cloud synchronization of expenses, bills, and financial preferences across devices.
- Improved financial insights and personalized budgeting guidance.
- More detailed weekly and monthly reports.
- Optional reminders for upcoming essential bills.
- Further accessibility and usability improvements.

## ⚠️ Disclaimer

KaamBuffer is a financial planning aid, not a bank, payment service, or financial adviser. It does not move money or guarantee savings.

## 👨‍💻 Built For

A project exploring how AI, financial calculations, and accessible web interfaces can help gig workers make better day-to-day financial decisions.

---

**KaamBuffer — Protect today's essentials. Plan tomorrow's savings.**
