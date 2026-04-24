'use client';
import { Inter, Playfair_Display } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import { Toaster } from "react-hot-toast";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import MobileNav from "@/components/layout/MobileNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAdminPath = pathname?.startsWith('/admin');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable}`}>
        <AuthProvider>
          <CartProvider>
            {!isAdminPath && <Header />}
            <main className={isAdminPath ? "" : "main-content"}>{children}</main>
            {!isAdminPath && <Footer />}
            
            <CartDrawer />
            <Toaster position="bottom-right" />
            {!isAdminPath && <WhatsAppButton />}
            {!isAdminPath && <MobileNav />}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
