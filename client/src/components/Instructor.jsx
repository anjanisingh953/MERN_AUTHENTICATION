import React from "react";
import "../styles/Instructor.css";
// import instructorImage from "../assets/profile.png";

const Instructor = () => {
  return (
    <div className="instructor-page">
      <div className="instructor-card">
        <div className="instructor-image">
          {/* <img src={instructorImage} alt="Instructor" /> */}
        </div>
        <div className="instructor-info">
          <h1>Anjani Singh</h1>
          <h4>Software Engineer</h4>
          <p>
            Hello! I'm Anjani Singh, a passionate MERN stack developer
            with a love for teaching and building scalable, robust applications.
            With years of experience in JavaScript, React, Node.js, Express, and
            MongoDB, I am dedicated to develop robust and scalable MERN projects. 
          </p>
          <div className="social-links">
            <a
              href="https://github.com/anjani"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/anjanisingh953/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructor;
