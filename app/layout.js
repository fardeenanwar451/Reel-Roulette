import "./globals.css";

export const metadata = {
  title: "Reel Roulette — Spin your next watch",
  description:
    "Spin the wheel across IMDb, Letterboxd, Metacritic, and Rotten Tomatoes Top 250 lists, and track what you've watched.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
