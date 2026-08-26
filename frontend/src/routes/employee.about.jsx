import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Camera,
  Copy,
  Check,
  Calendar as CalendarIcon,
  ChevronDown,
  User,
  Users,
  Building2,
  Phone,
  Mail,
  Shield,
  Briefcase,
  Loader2,
  Sparkles,
  ExternalLink,
  Save,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employee/about")({
  component: EmployeeAboutPage,
});

export function EmployeeAboutPage() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const api = useApi();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Form State
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "iOS Developer",
    role: "Employee",
    joinedDate: new Date().toISOString(),
    onboardingRequired: true,
    onboardingStatus: "Onboarding",
    onboardingProgress: 38,
    onboardingScripts: [
      { id: "tour", name: "Office Tour", active: true, percentage: 100 },
      { id: "mgmt", name: "Management Introductory", active: false, percentage: 0 },
      { id: "tools", name: "Work Tools", active: true, percentage: 20 },
      { id: "colleagues", name: "Meet Your Colleagues", active: true, percentage: 0 },
      { id: "duties", name: "Duties Journal", active: true, percentage: 0 },
      { id: "requests", name: "Requests Handling", active: true, percentage: 0 },
      { id: "activity", name: "Activity Tracking", active: true, percentage: 0 },
    ],
    manager: {
      name: "Kirk Mitrohin",
      email: "kirk.mitrohin@eximnexus.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      role: "Manager",
    },
    teamMembers: [],
  });

  // Fetch Employee Profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/employees/me");
      if (res.data?.success && res.data?.data) {
        const emp = res.data.data;
        const nameParts = (emp.name || "").split(" ");
        const first = nameParts[0] || user?.firstName || "";
        const last = nameParts.slice(1).join(" ") || user?.lastName || "";

        setProfileData((prev) => ({
          ...prev,
          firstName: first,
          lastName: last,
          email: emp.email || user?.emailAddresses?.[0]?.emailAddress || "",
          phone: emp.phone || "",
          position: emp.position || emp.role || "iOS Developer",
          role: emp.role || "Employee",
          joinedDate: emp.joinedDate || emp.joinedAt || new Date().toISOString(),
          onboardingRequired: emp.onboardingRequired ?? true,
          onboardingStatus: emp.onboardingStatus || "Onboarding",
          onboardingProgress: emp.onboardingProgress ?? 38,
          onboardingScripts: emp.onboardingScripts?.length ? emp.onboardingScripts : prev.onboardingScripts,
          manager: emp.manager || prev.manager,
          hr: emp.hr || prev.hr,
          lead: emp.lead || prev.lead,
          teamMembers: emp.teamMembers || [],
        }));
      }
    } catch (err) {
      console.warn("Could not fetch full backend employee profile, using Clerk defaults:", err);
      if (user) {
        setProfileData((prev) => ({
          ...prev,
          firstName: user.firstName || "Employee",
          lastName: user.lastName || "",
          email: user.emailAddresses?.[0]?.emailAddress || "",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchProfile();
    }
  }, [isLoaded]);

  // Copy to clipboard helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Clerk Profile Image Upload handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      if (user?.setProfileImage) {
        await user.setProfileImage({ file });
        toast.success("Profile photo updated successfully in Clerk!");
      } else {
        toast.info("Image selected. You can also manage photo in Clerk profile settings.");
      }
    } catch (err) {
      console.error("Failed to update profile image:", err);
      toast.error(err.message || "Failed to update profile image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Toggle Onboarding Script item
  const handleToggleScript = (scriptId) => {
    setProfileData((prev) => {
      const updatedScripts = prev.onboardingScripts.map((s) => {
        if (s.id === scriptId) {
          const nextActive = !s.active;
          return {
            ...s,
            active: nextActive,
            percentage: nextActive ? 100 : 0,
          };
        }
        return s;
      });

      const totalActive = updatedScripts.filter((s) => s.active).length;
      const progress = Math.round((totalActive / updatedScripts.length) * 100);

      return {
        ...prev,
        onboardingScripts: updatedScripts,
        onboardingProgress: progress,
        onboardingStatus: progress === 100 ? "Completed" : "Onboarding",
      };
    });
  };

  // Save changes to backend
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const fullName = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim();

      const payload = {
        name: fullName,
        phone: profileData.phone,
        position: profileData.position,
        role: profileData.role,
        onboardingRequired: profileData.onboardingRequired,
        onboardingStatus: profileData.onboardingStatus,
        onboardingProgress: profileData.onboardingProgress,
        onboardingScripts: profileData.onboardingScripts,
      };

      await api.put("/employees/me", payload);
      toast.success("Employee profile and details saved successfully!");
    } catch (err) {
      console.error("Save profile error:", err);
      toast.error(err.response?.data?.message || "Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading employee profile…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const profileImageUrl =
    user?.imageUrl ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";

  const formattedDate = (() => {
    try {
      const d = new Date(profileData.joinedDate);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return "21.05.2022";
    }
  })();

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Main Content Card / Form (Matching Reference Image Design) */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* ================= COLUMN 1: PROFILE IMAGE & DETAILS ================= */}
            <div className="lg:col-span-4 space-y-8">
              {/* PROFILE IMAGE */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  PROFILE IMAGE
                </h3>
                <div className="space-y-3">
                  <div className="relative w-48 h-56 sm:w-56 sm:h-64 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-border/70 shadow-sm group">
                    <img
                      src={profileImageUrl}
                      alt={profileData.firstName || "Profile"}
                      className="w-full h-full object-cover object-center"
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      } else if (clerk?.openUserProfile) {
                        clerk.openUserProfile();
                      }
                    }}
                    className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 transition cursor-pointer pt-1"
                  >
                    <Camera size={15} />
                    <span>Change Profile Image</span>
                  </button>
                </div>
              </div>

              {/* EMPLOYEE DETAILS */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  EMPLOYEE DETAILS
                </h3>

                {/* First Name */}
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-2.5 focus-within:border-primary/60 focus-within:bg-card transition">
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, firstName: e.target.value })
                    }
                    placeholder="Russel"
                    className="w-full bg-transparent text-sm font-semibold text-foreground outline-none mt-0.5"
                  />
                </div>

                {/* Last Name */}
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-2.5 focus-within:border-primary/60 focus-within:bg-card transition">
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, lastName: e.target.value })
                    }
                    placeholder="Sims"
                    className="w-full bg-transparent text-sm font-semibold text-foreground outline-none mt-0.5"
                  />
                </div>

                {/* Email Address */}
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-2.5 flex items-center justify-between transition">
                  <div className="min-w-0 flex-1">
                    <label className="block text-[11px] font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={profileData.email}
                      className="w-full bg-transparent text-sm font-semibold text-foreground outline-none mt-0.5 truncate cursor-default"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(profileData.email, "Email")}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                    title="Copy Email"
                  >
                    {copiedField === "Email" ? (
                      <Check size={15} className="text-emerald-600" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </div>

                {/* Phone Number */}
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-2.5 flex items-center justify-between focus-within:border-primary/60 focus-within:bg-card transition">
                  <div className="min-w-0 flex-1">
                    <label className="block text-[11px] font-medium text-muted-foreground">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                      className="w-full bg-transparent text-sm font-semibold text-foreground outline-none mt-0.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(profileData.phone, "Phone")}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                    title="Copy Phone"
                  >
                    {copiedField === "Phone" ? (
                      <Check size={15} className="text-emerald-600" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                </div>

                {/* Position */}
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-2.5 focus-within:border-primary/60 focus-within:bg-card transition">
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Position
                  </label>
                  <input
                    type="text"
                    value={profileData.position}
                    onChange={(e) =>
                      setProfileData({ ...profileData, position: e.target.value })
                    }
                    placeholder="iOS Developer"
                    className="w-full bg-transparent text-sm font-semibold text-foreground outline-none mt-0.5"
                  />
                </div>
              </div>
            </div>

            {/* ================= COLUMN 2: ROLE & TEAM STRUCTURE ================= */}
            <div className="lg:col-span-4 space-y-8">
              {/* ROLE */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  ROLE
                </h3>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 flex items-center justify-between">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground">
                      Role
                    </label>
                    <div className="text-sm font-bold text-foreground mt-0.5">
                      {profileData.role || "Employee"}
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </div>
              </div>

              {/* TEAM */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  TEAM
                </h3>

                {/* HR */}


                {/* Manager */}
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={profileData.manager.avatar}
                      alt={profileData.manager.name}
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                    />
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Manager
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {profileData.manager.name}
                      </span>
                      {profileData.manager.email && (
                        <span className="text-[10px] text-muted-foreground block">
                          {profileData.manager.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-muted-foreground" />
                </div>

                {/* Lead */}


                {/* Specific Team Members under Manager */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Users size={14} className="text-primary" />
                      Colleagues under {profileData.manager.name}
                    </span>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {profileData.teamMembers.length} Members
                    </span>
                  </div>

                  {profileData.teamMembers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                      No other team members assigned under this manager yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {profileData.teamMembers.map((member) => (
                        <div
                          key={member._id || member.email}
                          className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-2.5 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-foreground truncate">
                                {member.name}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {member.role || member.position || "Member"}
                              </div>
                            </div>
                          </div>
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shrink-0">
                            {member.workingStatus || "Active"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ================= COLUMN 3: ONBOARDING & SCRIPTS ================= */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ONBOARDING
              </h3>

              {/* Starts on (Joined Date) */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 flex items-center justify-between">
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground">
                    Starts on
                  </label>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {formattedDate}
                  </div>
                </div>
                <CalendarIcon size={18} className="text-muted-foreground" />
              </div>

              {/* Onboarding required switch */}
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-foreground">
                  Onboarding required
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setProfileData({
                      ...profileData,
                      onboardingRequired: !profileData.onboardingRequired,
                    })
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none",
                    profileData.onboardingRequired ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5",
                      profileData.onboardingRequired ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>



              {/* Onboarding Scripts List */}

            </div>
          </div>

          {/* ================= BOTTOM ACTIONS ================= */}
          <div className="mt-10 pt-6 border-t border-border/70 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#18181B] text-white dark:bg-white dark:text-black px-7 py-3 text-xs font-bold shadow-md hover:opacity-90 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              <span>Save Changes</span>
            </button>

            <button
              type="button"
              onClick={fetchProfile}
              className="inline-flex items-center gap-2 rounded-2xl bg-muted/60 hover:bg-muted text-foreground px-6 py-3 text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
