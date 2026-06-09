import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  Camera,
  Upload,
  Trash2,
  CheckCircle2,
  Loader2,
  Mail,
  Building,
  Briefcase,
  IdCard,
  Phone,
  Shield,
  Save,
  ArrowLeft
} from "lucide-react";
import Webcam from "react-webcam";
import toast from "react-hot-toast";
import api from "@/services/api";

const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [profilePhotoPath, setProfilePhotoPath] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/auth/me");
      if (res.data.success && res.data.user) {
        const u = res.data.user;
        setProfile(u);
        setFullName(u.full_name || "");
        setEmployeeId(u.employee_id || "");
        setProfilePhotoPath(u.profile_photo_path || "");
      }
    } catch (err) {
      toast.error("Failed to load profile details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append("file", file);

      try {
        const res = await api.post("/api/visitors/upload-doc", uploadData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        setProfilePhotoPath(res.data.file_path);
        toast.success("Profile photo uploaded successfully!");
      } catch (err) {
        console.error(err);
        toast.error("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    }
  };

  const capturePhoto = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error("Could not capture screenshot. Check webcam permissions.");
      return;
    }

    setUploading(true);
    try {
      const blob = dataURLtoBlob(imageSrc);
      const file = new File([blob], "profile_photo.jpg", { type: "image/jpeg" });
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await api.post("/api/visitors/upload-doc", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfilePhotoPath(res.data.file_path);
      toast.success("Captured profile photo successfully!");
      setUseWebcam(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload captured photo");
    } finally {
      setUploading(false);
    }
  }, [webcamRef]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put("/api/users/profile/update", {
        full_name: fullName,
        employee_id: employeeId || null,
        profile_photo_path: profilePhotoPath || null,
      });

      toast.success("Profile settings updated successfully!");
      // Dispatch event to refresh layout avatar
      window.dispatchEvent(new Event("profileUpdate"));
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
        <span className="text-sm font-semibold text-slate-500">Loading user profile details...</span>
      </div>
    );
  }

  const roleLabel: Record<string, string> = {
    CORPORATE_SUPER_ADMIN: "Corporate Super Admin",
    PLANT_ADMIN: "Plant Administrator",
    DEPARTMENT_HEAD: "Department Head",
    HR_MANAGER: "HR Manager",
    HR_EXECUTIVE: "HR Executive",
    DEPARTMENT_EXECUTIVE: "Department Executive",
    RECEPTIONIST: "Receptionist",
    SECURITY_SUPERVISOR: "Security Supervisor",
    SECURITY_GUARD: "Security Guard",
    EMPLOYEE: "Employee/Host",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          className="border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center shadow-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2 text-slate-500" /> Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
          <User className="h-6 w-6 mr-2 text-blue-600" />
          My Profile Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your personal details, employee identification, and corporate dashboard profile photo.
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Photo Settings */}
        <Card className="border-slate-100 shadow-sm md:col-span-1 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-800">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            
            {/* Image Preview / Avatar */}
            <div className="relative group">
              {profilePhotoPath ? (
                <img
                  src={profilePhotoPath}
                  alt={fullName}
                  className="h-32 w-32 rounded-full object-cover border-2 border-blue-500 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${fullName || "User"}`;
                  }}
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-blue-50 border border-slate-200 flex items-center justify-center text-blue-600 text-4xl font-bold shadow-sm">
                  {(fullName || "U").charAt(0).toUpperCase()}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Photo Action Triggers */}
            {!useWebcam ? (
              <div className="w-full flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUseWebcam(true)}
                  className="w-full justify-center text-xs"
                >
                  <Camera className="h-3.5 w-3.5 mr-1 text-blue-600" /> Use Webcam
                </Button>
                
                <label className="w-full cursor-pointer">
                  <div className="flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-sm">
                    <Upload className="h-3.5 w-3.5 mr-1 text-blue-600" /> Upload File
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>

                {profilePhotoPath && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProfilePhotoPath("")}
                    className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove Photo
                  </Button>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-lg shadow-inner object-cover border border-slate-200 aspect-video"
                  videoConstraints={{
                    width: 400,
                    height: 300,
                    facingMode: "user"
                  }}
                />
                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center text-xs"
                    onClick={() => setUseWebcam(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 justify-center text-xs bg-blue-600 text-white"
                    onClick={capturePhoto}
                  >
                    Capture
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Profile Data */}
        <Card className="border-slate-100 shadow-sm md:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800">Account Credentials & Organization</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            
            {/* Input Editable Section */}
            <div className="space-y-4">
              <Input
                label="Full Name / User Name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your full name"
              />

              <Input
                label="Employee ID (Corporate Identification)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. IGL-EMP-10023"
              />
            </div>

            {/* Read-Only Organizational Details */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Organizational Clearance (Read Only)</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                
                <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase leading-none">Email Address</div>
                    <div className="text-slate-700 font-medium mt-1 break-all">{profile?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase leading-none">Access Level Role</div>
                    <div className="mt-1">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                        {roleLabel[profile?.role] || profile?.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                {profile?.department?.name && (
                  <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <Building className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase leading-none">Department</div>
                      <div className="text-slate-700 font-medium mt-1">{profile.department.name}</div>
                    </div>
                  </div>
                )}

                {profile?.mobile_number && (
                  <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase leading-none">Mobile Number</div>
                      <div className="text-slate-700 font-medium mt-1">{profile.mobile_number}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                isLoading={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto justify-center"
              >
                <Save className="h-4 w-4 mr-2" /> Save Profile Details
              </Button>
            </div>

          </CardContent>
        </Card>

      </form>
    </div>
  );
};

export default Profile;
