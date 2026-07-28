import { EmployeeSidebar } from "./EmployeeSidebar";
import { EmployeeTopBar } from "./EmployeeTopBar";

export function EmployeeLayout({ children }) {
  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] dark:bg-slate-950">
      <EmployeeSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <EmployeeTopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
