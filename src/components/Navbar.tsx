import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/formula">Formula Mode</Link>
        </li>
        <li>
          <Link to="/input">Input Mode</Link>
        </li>
        <li>
          <Link to="/drawing">Drawing Mode</Link>
        </li>
      </ul>
    </nav>
  );
}