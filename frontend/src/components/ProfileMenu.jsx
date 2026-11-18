import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { UserIcon } from './Icons.jsx';

// The profile icon in the header. It opens the profile page, which shows the
// signed-in person's details and lets them view and change their password.
export default function ProfileMenu() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <NavLink
      to="/app/profile"
      className={({ isActive }) => `icon-btn profile-btn${isActive ? ' is-open' : ''}`}
      aria-label="Your profile"
      title={`${user.name}: your profile`}
    >
      <UserIcon />
    </NavLink>
  );
}
