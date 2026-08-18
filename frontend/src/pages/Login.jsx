import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("Logging in...");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      // Save authentication token
      localStorage.setItem("token", response.data.token);

      // Save logged-in user
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );
      
      setMessage("Login successful!");

navigate("/dashboard");

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setMessage(
        error.response?.data?.message ||
        "Unable to connect to the server."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">

      <div className="text-center">

        <h1 className="text-5xl font-bold text-pink-500 mb-8">
          Taste It Café
        </h1>

        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-xl shadow-lg w-96"
        >

          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Welcome Back!
          </h2>

          {/* EMAIL */}
          <div className="mb-4 text-left">
            <label className="block mb-2 text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-6 text-left">
            <label className="block mb-2 text-gray-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
            />
          </div>

          {/* SIGN IN */}
          <button
            type="submit"
            className="w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 rounded-lg transition"
          >
            Sign In
          </button>

          {/* MESSAGE */}
          {message && (
            <p className="mt-4 text-gray-700">
              {message}
            </p>
          )}

        </form>

      </div>

    </div>
  );
}

export default Login;