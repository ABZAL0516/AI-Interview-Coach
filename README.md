# AI Interview Coach

## Run locally
1. Copy `.env.example` to `.env`.
2. Put your Gemini API key in `GEMINI_API_KEY`.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:5000/`.

## Authentication flow
- Sign up saves an account in browser localStorage and immediately creates a session.
- Log in validates against that saved account and creates a session.
- Protected pages redirect to login only when no session exists.
- Navigation changes automatically between logged-out and logged-in states.
- Logout clears only the session and active interview data.
