import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "./ThemeToggle";

function Brand() {
  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/logo-dark.png" : "/logo-light.png";
  
  return (
    <Link to="/" className="brand" aria-label="TutorLink home">
      <img src={logoSrc} alt="TutorLink" className="brand-logo" />
      <span className="brand-name">TutorLink</span>
    </Link>
  );
}

export default function LandingNavBar() {
  const nav = useNavigate();
  
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-in">
        <Brand />

        <nav className="nav">
          <button
            onClick={() => scrollToSection("features")}
            className="nav-link"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="nav-link"
          >
            How it Works
          </button>
          <button
            onClick={() => nav("/browse")}
            className="nav-link"
          >
            Find Tutors
          </button>
        </nav>

        <div className="nav-right">
          <ThemeToggle />
          <Link to="/login" className="nav-link">
            Log in
          </Link>
          <Link to="/register" className="nav-btn primary">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
