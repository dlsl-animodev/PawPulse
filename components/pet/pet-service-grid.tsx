import React from "react";
import {
  Pill,
  FileText,
  Calendar,
  ShoppingBag,
  ArrowUpRight,
} from "lucide-react";

const services: any[] = [
  {
    id: "1",
    title: "Vet Consult",
    description: "Video call a vet now",
    icon: <Calendar size={32} className="text-white" />,
    action: "Book",
    color: "bg-paw-primary",
  },
  {
    id: "2",
    title: "Pharmacy",
    description: "Meds to your door",
    icon: <Pill size={32} className="text-white" />,
    action: "Shop",
    color: "bg-paw-secondary",
  },
  {
    id: "3",
    title: "Records",
    description: "Vaxx & history",
    icon: <FileText size={32} className="text-white" />,
    action: "View",
    color: "bg-paw-pink",
  },
  {
    id: "4",
    title: "Pet Shop",
    description: "Food & Toys",
    icon: <ShoppingBag size={32} className="text-white" />,
    action: "Browse",
    color: "bg-paw-accent",
  },
];

export function ServiceGrid() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 px-1">
          <div>
            <h2 className="text-3xl font-display font-bold text-paw-dark">
              Explore
            </h2>
            <p className="text-paw-text font-medium text-lg">
              What does your pet need today?
            </p>
          </div>
        </div>

        {/* Mobile: 2 Columns, Desktop: 4 Columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="group relative bg-paw-soft/50 rounded-[2.5rem] p-5 sm:p-6 shadow-sm hover:shadow-xl hover:shadow-orange-200/50 transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden border border-orange-100/50"
            >
              {/* Hover Background Accent */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 ${service.color} opacity-10 rounded-bl-[100%] transition-transform group-hover:scale-150 duration-500`}
              ></div>

              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] ${service.color} flex items-center justify-center shadow-lg shadow-orange-100 mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
              >
                {service.icon}
              </div>

              <h3 className="text-xl sm:text-2xl font-display font-bold text-paw-dark mb-1 leading-tight">
                {service.title}
              </h3>
              <p className="text-paw-text text-sm sm:text-base font-medium mb-6 leading-tight opacity-80">
                {service.description}
              </p>

              <div className="flex items-center text-sm font-bold text-paw-primary/50 group-hover:text-paw-primary transition-colors bg-white w-fit px-3 py-1.5 rounded-full shadow-sm">
                <span className="mr-1">{service.action}</span>
                <ArrowUpRight size={16} strokeWidth={3} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
