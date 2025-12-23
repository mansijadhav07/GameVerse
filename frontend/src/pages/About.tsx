import { useState, FormEvent } from 'react'; // Import React hooks
import axios from 'axios'; // Import axios
import { toast } from 'sonner'; // Import toast
// --- SWITCHED BACK TO LUCIDE-REACT ---
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Loader2 // Use Loader2 for Spinner
} from 'lucide-react';
// --- END SWITCH ---

const About = () => {
  // State for the contact form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Send data to the new backend endpoint
      const response = await axios.post('http://localhost:3001/api/contact', formData);
      
      // Show success toast
      toast.success(response.data.message || "Message sent successfully!");
      
      // Clear the form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      // Show error toast
      console.error("Contact form error:", error);
      toast.error(error.response?.data?.message || "Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Removed wrapping div, Navbar, and Footer (handled by MainLayout)
    <>
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* About Section */}
          <div className="mb-20 animate-fade-in">
            <div className="text-center mb-12">
              <h1 data-font-orbitron className="text-4xl md:text-5xl font-bold mb-4 text-white text-glow-purple">
                About <span className="text-purple-400">GameVerse</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Your ultimate destination for online gaming excellence
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1: Our Mission */}
              <div className="admin-card p-8">
                <h2 data-font-orbitron className="text-2xl font-bold mb-4 text-white">Our Mission</h2>
                <p className="text-gray-300 leading-relaxed">
                  GameVerse is dedicated to creating the ultimate online gaming platform where players from around the world can connect, compete, and experience the best games available. We believe in fostering a vibrant gaming community built on fair play, skill, and passion.
                </p>
              </div>

              {/* Card 2: Our Vision */}
              <div className="admin-card p-8">
                <h2 data-font-orbitron className="text-2xl font-bold mb-4 text-white">Our Vision</h2>
                <p className="text-gray-300 leading-relaxed">
                  We envision a future where gaming transcends boundaries, bringing people together through shared experiences. Our platform is designed to showcase cutting-edge games while maintaining a user-friendly environment that welcomes both casual and competitive gamers.
                </p>
              </div>
            </div>

            {/* Card 3: About This Project */}
            <div className="admin-card p-8 mt-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
              <h2 data-font-orbitron className="text-2xl font-bold mb-4 text-white">About This Project</h2>
              <p className="text-gray-300 leading-relaxed">
                This platform was developed as part of an Advanced Database Management Systems (DBMS) academic project. It demonstrates modern web development practices, database design principles, and user interface excellence. The project showcases a comprehensive gaming platform with features including user management, game libraries, leaderboards, and achievement systems.
              </p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="animate-scale-in">
            <div className="text-center mb-12">
              <h2 data-font-orbitron className="text-3xl md:text-4xl font-bold mb-4 text-white text-glow-blue">
                Get in <span className="text-blue-400">Touch</span>
              </h2>
              <p className="text-gray-400 text-lg">
                Have questions? We'd love to hear from you.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="admin-card p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="modal-label">Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      className="modal-input" // Use modal-input style
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="modal-label">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      className="modal-input"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="modal-label">Subject</label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="What is this about?"
                      className="modal-input"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="modal-label">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Your message..."
                      className="modal-input min-h-[120px]"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="neon-button w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                    Send Message
                  </button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                {/* Email Card */}
                <div className="admin-card p-6 hover:border-purple-500/70 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-600/20 rounded-lg border border-purple-500/50">
                      <Mail size={20} className="text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">Email</h3>
                      <p className="text-gray-400 text-sm">support@gameverse.com</p>
                      <p className="text-gray-400 text-sm">info@gameverse.com</p>
                    </div>
                  </div>
                </div>

                {/* Phone Card */}
                <div className="admin-card p-6 hover:border-purple-500/70 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-600/20 rounded-lg border border-purple-500/50">
                      <Phone size={20} className="text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">Phone</h3>
                      <p className="text-gray-400 text-sm">+1 (555) 123-4567</p>
                      <p className="text-gray-400 text-sm">Mon-Fri: 9AM - 6PM EST</p>
                    </div>
                  </div>
                </div>

                {/* Address Card */}
                <div className="admin-card p-6 hover:border-purple-500/70 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-600/20 rounded-lg border border-purple-500/50">
                      <MapPin size={20} className="text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-white">Address</h3>
                      <p className="text-gray-400 text-sm">123 Gaming Street</p>
                      <p className="text-gray-400 text-sm">Tech City, TC 12345</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default About;

