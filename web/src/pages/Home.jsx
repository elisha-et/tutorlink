// src/pages/Home.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth";
import { useTheme } from "../contexts/ThemeContext";

export default function Home() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const go = (role) => nav(`/register?role=${role}`);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      nav(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      nav("/browse");
    }
  };

  // Show dashboard for logged-in users
  if (!loading && user) {
    const isTutor = user.role === "tutor";
    return (
      <div className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Welcome back, {user.name}!</h1>
          <p className="page-sub">
            {isTutor 
              ? "Manage your tutoring requests and profile"
              : "Find tutors and get the help you need"}
          </p>
        </div>

        <div style={{ 
          display: "grid", 
          gap: "16px", 
          marginTop: "32px",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
        }}>
          {isTutor ? (
            <>
              <Link to="/tutor/requests" className="form-card" style={{ 
                textDecoration: "none", 
                display: "block",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(2,8,23,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow)";
              }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700 }}>
                  📬 Help Requests
                </h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px" }}>
                  View and respond to student requests
                </p>
              </Link>

              <Link to="/tutor/profile" className="form-card" style={{ 
                textDecoration: "none", 
                display: "block",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(2,8,23,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow)";
              }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700 }}>
                  👤 My Profile
                </h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px" }}>
                  Update your bio, subjects, and availability
                </p>
              </Link>
            </>
          ) : (
            <>
              <Link to="/browse" className="form-card" style={{ 
                textDecoration: "none", 
                display: "block",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(2,8,23,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow)";
              }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700 }}>
                  🔍 Find a Tutor
                </h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px" }}>
                  Browse available tutors by subject
                </p>
              </Link>

              <Link to="/student/requests" className="form-card" style={{ 
                textDecoration: "none", 
                display: "block",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(2,8,23,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow)";
              }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700 }}>
                  📋 My Requests
                </h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px" }}>
                  View your help requests and status
                </p>
              </Link>

              <Link to="/student/profile" className="form-card" style={{ 
                textDecoration: "none", 
                display: "block",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(2,8,23,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--shadow)";
              }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700 }}>
                  👤 My Profile
                </h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "14px" }}>
                  Update your profile information
                </p>
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // Show landing page for non-logged-in users
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-content">
          <div className="trust-badge">
            <span>⭐</span> Trusted by 2,000+ students
          </div>
          <h1 className="landing-hero-title">
            Learn from peers who{" "}
            <span className="landing-hero-accent">actually get it</span>
          </h1>
          <p className="landing-hero-subtitle">
            Connect with verified student tutors who excelled in your exact courses. Real grades, real experience, real results.
          </p>
          <div className="landing-hero-actions">
            <Link to="/browse" className="btn btn-primary">
              Find a Tutor →
            </Link>
            <button className="btn btn-secondary" onClick={() => go("tutor")}>
              Become a Tutor
            </button>
          </div>
        </div>
      </section>

      {/* Subject Search Section */}
      <section className="landing-search-section">
        <form onSubmit={handleSearch} className="subject-search-form">
          <div className="search-input-wrapper">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="subject-search-input"
              placeholder="Search for a subject or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        <div className="popular-tags">
          <span className="popular-label">Popular:</span>
          {["Calculus", "Chemistry", "Economics", "Python"].map((tag) => (
            <button
              key={tag}
              className="tag-btn"
              onClick={() => {
                setSearchQuery(tag);
                nav(`/browse?q=${encodeURIComponent(tag)}`);
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="landing-stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Verified Tutors</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Subjects</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">4.9</div>
            <div className="stat-label">Avg. Rating</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10k+</div>
            <div className="stat-label">Sessions</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-features-section">
        <div className="landing-section-content">
          <h2 className="landing-section-title">Everything you need to succeed</h2>
          <p className="landing-section-subtitle">
            Built by students, for students. We understand what you need because we've been there.
          </p>
          <div className="features-grid">
            {[
              {
                icon: "✓",
                title: "Verified Tutors",
                description: "Every tutor's qualifications are verified through academic transcripts. No guesswork."
              },
              {
                icon: "⚡",
                title: "AI-Powered Matching",
                description: "Our smart algorithm connects you with tutors best suited for your learning style."
              },
              {
                icon: "📅",
                title: "Flexible Scheduling",
                description: "Book sessions that fit your schedule. In-person or online, your choice."
              },
              {
                icon: "💬",
                title: "Direct Messaging",
                description: "Chat with tutors before booking to ensure they're the right fit for you."
              },
              {
                icon: "🛡️",
                title: "Safe & Secure",
                description: "Student-only platform with verified university emails. Your safety matters."
              },
              {
                icon: "📚",
                title: "Course-Specific Help",
                description: "Find tutors who aced the exact course you're taking. Same professor, same material."
              }
            ].map((feature, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="landing-how-it-works-section">
        <div className="landing-section-content">
          <h2 className="landing-section-title">How it works</h2>
          <p className="landing-section-subtitle">
            Getting help has never been easier. Four simple steps to academic success.
          </p>
          <div className="how-it-works-steps">
            {[
              {
                number: "01",
                title: "Search & Discover",
                description: "Browse tutors by subject, course, or availability. Filter by ratings and reviews."
              },
              {
                number: "02",
                title: "Connect & Chat",
                description: "Message tutors directly to discuss your needs and ensure a good fit."
              },
              {
                number: "03",
                title: "Book a Session",
                description: "Schedule a time that works for both of you. Online or in-person."
              },
              {
                number: "04",
                title: "Learn & Grow",
                description: "Get personalized help and watch your grades improve."
              }
            ].map((step, idx) => (
              <div key={idx} className="step-item">
                <div className="step-number">{step.number}</div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-description">{step.description}</p>
                </div>
                {idx < 3 && <div className="step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="landing-cta-section">
        <div className="cta-banner">
          <h2 className="cta-title">Ready to boost your grades?</h2>
          <p className="cta-subtitle">
            Join thousands of students who are already learning smarter, not harder.
          </p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-cta-primary">
              Get Started Free →
            </Link>
            <button className="btn btn-cta-secondary" onClick={() => scrollToSection("how-it-works")}>
              Learn More
          </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"} alt="TutorLink" className="footer-logo" />
            <div className="footer-brand-content">
              <span className="footer-brand-name">TutorLink</span>
              <p className="footer-description">
                Connecting students with verified peer tutors for better learning outcomes.
        </p>
      </div>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-column-title">Product</h4>
              <Link to="/browse" className="footer-link">Find Tutors</Link>
              <button className="footer-link" onClick={() => go("tutor")}>Become a Tutor</button>
              <Link to="/" className="footer-link">FAQ</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">© 2026 TutorLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
