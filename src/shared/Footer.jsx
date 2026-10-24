export function Footer() {
  return (
    <footer className="bg-gray-800 text-white w-full p-4 mt-auto">
      <div className="max-w-7xl mx-auto text-center text-sm">
        <p className="mb-2 text-gray-300">
          © 2025{' '}
          <a
            href="https://clue-analytics.web.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors"
          >
            ClueAnalytics
          </a>{' '}
          — EdgeLabel. All rights reserved.
        </p>
        <nav className="flex justify-center gap-4 flex-wrap">
          <a href="./privacy.html" className="text-gray-300 hover:text-blue-400 transition-colors">Privacy Policy</a>
          <a href="./guide.html"   className="text-gray-300 hover:text-blue-400 transition-colors">User Guide</a>
          <a href="./about.html"   className="text-gray-300 hover:text-blue-400 transition-colors">About Us</a>
          <a href="./contact.html" className="text-gray-300 hover:text-blue-400 transition-colors">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
