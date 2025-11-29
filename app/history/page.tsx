import { getDashboardData } from "../dashboard/actions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function HistoryPage() {
  const dashboardData = await getDashboardData();
  const patientAppointments = dashboardData.patientAppointments || [];

  // Past consultations: appointments in the past or completed
  const pastAppointments = patientAppointments.filter(
    (apt) => new Date(apt.date) < new Date() || apt.status === "completed"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Past Consultations
          </h1>
          <p className="text-gray-600">
            Your complete medical history at a glance
          </p>
        </div>

        {pastAppointments.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No past consultations yet
            </h3>
            <p className="text-gray-500">
              Your consultation history will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastAppointments.map((apt) => (
              <Link
                key={apt.id}
                href={`/appointments/${apt.id}`}
                className="group block"
              >
                <div className="relative overflow-hidden p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-1">
                  {/* Decorative gradient accent */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Doctor Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                          {apt.doctors.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                            {apt.doctors.name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                            {apt.doctors.specialty}
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      {apt.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {apt.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Date and Status */}
                    <div className="text-right ml-6 flex flex-col items-end gap-2">
                      <div className="text-sm font-medium text-gray-900 px-3 py-1 bg-gray-100 rounded-lg">
                        {new Date(apt.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <Badge
                        variant={
                          apt.status === "completed" ? "default" : "outline"
                        }
                        className="capitalize text-xs font-medium"
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
