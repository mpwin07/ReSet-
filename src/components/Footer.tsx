import { Zap, Mail, Phone, MapPin, Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-bg"></div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
      
      {/* Content */}
      <div className="relative z-10 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mr-4 glow-primary">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-healing bg-clip-text text-transparent neon-text">
                  ReSet
                </h3>
              </div>
              <p className="text-muted-foreground mb-8 max-w-lg text-lg leading-relaxed">
                The First Step of a New Life. Your personalized companion for addiction recovery, 
                helping you build lasting healthy habits with AI-powered daily tasks.
              </p>
              <div className="flex space-x-4">
                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center hover-glow cursor-pointer transition-all duration-300">
                  <Github className="w-5 h-5 text-primary" />
                </div>
                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center hover-glow cursor-pointer transition-all duration-300">
                  <Twitter className="w-5 h-5 text-healing" />
                </div>
                <div className="w-12 h-12 glass rounded-xl flex items-center justify-center hover-glow cursor-pointer transition-all duration-300">
                  <Linkedin className="w-5 h-5 text-encouragement" />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xl font-semibold mb-6 text-foreground">Quick Links</h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center group">
                    <span className="w-2 h-2 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-healing transition-colors duration-300 flex items-center group">
                    <span className="w-2 h-2 bg-healing rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Assessment
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-encouragement transition-colors duration-300 flex items-center group">
                    <span className="w-2 h-2 bg-encouragement rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Progress Tracking
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-success transition-colors duration-300 flex items-center group">
                    <span className="w-2 h-2 bg-success rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Resources
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-xl font-semibold mb-6 text-foreground">Contact</h4>
              <div className="space-y-4">
                <div className="flex items-center group">
                  <div className="w-10 h-10 glass rounded-lg flex items-center justify-center mr-4 group-hover:glow-primary transition-all duration-300">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    itz.mpwin07@gmail.com
                  </span>
                </div>
                <div className="flex items-center group">
                  <div className="w-10 h-10 glass rounded-lg flex items-center justify-center mr-4 group-hover:glow-healing transition-all duration-300">
                    <Phone className="w-4 h-4 text-healing" />
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    +91 7558125182
                  </span>
                </div>
                <div className="flex items-center group">
                  <div className="w-10 h-10 glass rounded-lg flex items-center justify-center mr-4 group-hover:glow transition-all duration-300">
                    <MapPin className="w-4 h-4 text-encouragement" />
                  </div>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    Available 24/7
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-border/30 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm mb-4 md:mb-0">
                © 2024 ReSet - The First Step of a New Life. All rights reserved.
              </p>
              <div className="flex space-x-8 text-sm">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-300">
                  Privacy Policy
                </a>
                <a href="#" className="text-muted-foreground hover:text-healing transition-colors duration-300">
                  Terms of Service
                </a>
                <a href="#" className="text-muted-foreground hover:text-encouragement transition-colors duration-300">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
