import { Code2, Heart, Zap, Award, Users } from "lucide-react";

export function About() {
  return (
    <div className="relative pt-6 pb-20 sm:pt-10 min-h-[60vh]">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-paw-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-paw-secondary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float -translate-x-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-24">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-sm border border-orange-100 text-paw-primary text-sm font-bold mb-6 animate-bounce-slow">
            <Award className="w-4 h-4 mr-2" />
            Hackathon Project
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-paw-dark mb-6">
            Building the Future of <br />
            <span className="text-paw-primary">Pet Care</span>
          </h1>
          <p className="text-xl text-paw-text max-w-2xl mx-auto font-medium leading-relaxed">
            We believe every tail wag deserves the best technology. PawPulse was
            born from a passion for animals and code.
          </p>
        </div>

        {/* Hackathon Card */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-xl shadow-orange-100/50 border border-orange-100 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-paw-accent/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-paw-dark rounded-3xl flex items-center justify-center transform rotate-3 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <span className="text-4xl sm:text-5xl">🚀</span>
              </div>

              <div className="text-center md:text-left">
                <h2 className="text-3xl font-display font-bold text-paw-dark mb-2">
                  Old St. Labs
                </h2>
                <h3 className="text-2xl font-display font-bold text-paw-primary mb-4">
                  C(old) (St)art Hackathon
                </h3>
                <p className="text-paw-text font-medium text-lg">
                  This application was proudly developed for the Old St. Labs
                  hackathon challenge. We aimed to create a warm, engaging, and
                  accessible digital home for pet owners.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Team Name Card */}
          <div className="bg-gradient-to-br from-paw-primary to-paw-primaryDark rounded-[2.5rem] p-8 text-white shadow-lg shadow-paw-primary/30 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 opacity-10 transform translate-x-4 translate-y-4">
              <Users size={180} />
            </div>
            <h3 className="text-xl font-bold opacity-80 mb-1">Created by</h3>
            <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4">
              Metamorphism
            </h2>
            <p className="font-medium opacity-90 relative z-10">
              Transforming ideas into digital reality. We are a team of
              passionate developers who love clean code and cute animals.
            </p>
          </div>

          {/* Tech Stack / Values */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-orange-100 shadow-lg shadow-orange-50 flex flex-col justify-center">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Code2 size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-paw-dark text-lg">
                    Modern Stack
                  </h4>
                  <p className="text-sm text-paw-text font-bold">
                    React • Tailwind • Gemini AI
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center">
                  <Heart size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-paw-dark text-lg">
                    User Centric
                  </h4>
                  <p className="text-sm text-paw-text font-bold">
                    Designed with empathy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-paw-dark text-lg">
                    AI Powered
                  </h4>
                  <p className="text-sm text-paw-text font-bold">
                    Intelligent assistance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-20">
          <p className="text-paw-text font-medium flex items-center justify-center gap-2">
            Made with{" "}
            <Heart
              size={16}
              className="text-red-500 fill-current animate-pulse"
            />{" "}
            by Metamorphism :D
          </p>
        </div>
      </div>
    </div>
  );
}
