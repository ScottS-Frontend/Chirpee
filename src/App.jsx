import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import FollowingFeed from "./pages/FollowingFeed";
import ProtectedRoute from "./components/ProtectedRoute";
import TweetDetail from "./pages/TweetDetail";


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/following" element={
            <ProtectedRoute><FollowingFeed /></ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/u/:handle" element={<Profile />} />
          <Route path="/tweet/:tweetId" element={<TweetDetail/>}/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
