import React from 'react';
import './globals.css';
import { AuthProvider } from '../lib/authContext';

export const metadata = {
  title: 'Employee Leave Management System',
  description: 'Internal Employee Leave Management Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
