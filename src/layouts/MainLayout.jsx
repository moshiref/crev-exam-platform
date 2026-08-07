import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

/**
 * Shared page shell: Navbar + page content + Footer.
 * Every route is rendered through this layout so navigation and
 * footer stay consistent without repeating markup per page.
 */
export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
