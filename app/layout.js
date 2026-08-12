import "./globals.css";

export const metadata = {
  title: "Hanna's Classroom",
  description: "1-to-1 online English teaching classroom",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
