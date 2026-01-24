import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";
import { CartProvider } from "@/lib/context/CartContext";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { getCartAction } from "@/lib/actions/cart";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gym Wearables Factory | Direct to Consumer",
  description: "High-quality gym gear directly from the factory. Best prices, premium durability.",

};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  // Fetch cart data server-side for logged-in users
  const initialCartItems = await getCartAction();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${oswald.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <CartProvider initialItems={initialCartItems}>
              {children}
            </CartProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
