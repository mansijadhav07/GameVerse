import {
  GameController,
  GithubLogo,
  TwitterLogo,
  DiscordLogo,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-950/50 border-t border-purple-500/30 mt-20 z-10 relative">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <GameController size={32} className="text-purple-400" />
              <span
                data-font-orbitron
                className="text-2xl font-bold text-white tracking-wider"
              >
                GameVerse
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Your ultimate online gaming platform. Play, compete, and connect
              with gamers worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/games"
                  className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Browse Games
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/achievements"
                  className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Achievements
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4 text-white">Connect</h3>
            <div className="flex gap-3">
              <a
                href="#"
                className="p-2 bg-gray-800/50 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-300"
                aria-label="Twitter"
              >
                <TwitterLogo size={24} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800/50 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-300"
                aria-label="Discord"
              >
                <DiscordLogo size={24} />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800/50 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-300"
                aria-label="Github"
              >
                <GithubLogo size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-purple-500/30 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2025 GameVerse. Built for Advanced DBMS Project. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
