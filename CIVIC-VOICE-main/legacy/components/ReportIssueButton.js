"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ReportIssueButton({
  ctaText = "Get Started",
  navigateOnly = false, // when true, just redirect to /user without opening camera
  skipNavigate = false, // when true, do not redirect before camera (for /user modal)
  onClickStart, // optional callback before starting capture/navigation
  inlinePreview = false, // when true, render preview/form inline instead of slide-over
} = {}) {
  const { user } = useUser();
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("");
  const [severity, setSeverity] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.display_name) {
        setLocationName(data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported in this browser.");
      return;
    }
    setLocationError("");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setCoordinates(coordString);
        setLocationAccuracy(pos.coords.accuracy);
        if (!location) {
          setLocation(coordString);
        }
        reverseGeocode(latitude, longitude);
        setLocationLoading(false);
      },
      (err) => {
        setLocationError(err.message || "Unable to fetch location.");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      if (!location) getCurrentLocation();
    }
  };

  const handleTakePicture = () => {
    if (onClickStart) onClickStart();

    if (navigateOnly) {
      router.push("/user");
      return;
    }

    // Navigate to user page before initiating camera flow unless explicitly skipped
    if (!skipNavigate) {
      router.push("/user");
    }
    // Try to use camera directly
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          streamRef.current = stream;
          setShowCamera(true);
          // Start video stream when component updates
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
            }
          }, 100);
        })
        .catch((error) => {
          console.error("Error accessing camera:", error);
          // Fallback to file input with capture attribute
          cameraInputRef.current?.click();
        });
    } else {
      // Fallback to file input
      cameraInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            setImage(blob);
            setPreview(URL.createObjectURL(blob));
            if (!location) getCurrentLocation();
            stopCamera();
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleUploadPicture = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!image || !description || !issueType || !severity || !location) return;

    setSubmitting(true);

    const formData = new FormData();
    const fileToSend =
      image instanceof File
        ? image
        : new File([image], "photo.jpg", { type: image.type || "image/jpeg" });

    formData.append("image", fileToSend);
    formData.append("description", description);
    formData.append("issueType", issueType);
    formData.append("severity", severity.toUpperCase());
    if (location) formData.append("location", location);
    if (coordinates) formData.append("coordinates", coordinates);
    if (locationName) {
      formData.append("locationName", locationName);
    } else if (coordinates) {
      formData.append("locationName", coordinates);
    } else if (location) {
      formData.append("locationName", location);
    }
    if (user?.id) formData.append("userId", user.id);

    fetch("/api/issues", {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to submit issue");
        }
        return res.json();
      })
      .then(() => {
        toast.success("Issue submitted successfully");
        handleRemoveImage();
        setDescription("");
        setIssueType("");
        setSeverity("");
        setLocation("");
        setCoordinates("");
        setLocationName("");
        setLocationAccuracy(null);
      })
      .catch((err) => {
        toast.error("Failed to submit issue");
        console.error("Failed to submit issue:", err.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={handleTakePicture}
          size="lg"
          className="text-base px-12 py-4 h-auto"
        >
          <Camera className="mr-2 h-5 w-5" />
          {ctaText}
        </Button>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="rounded-full w-16 h-16 p-0"
              >
                <Camera className="h-6 w-6" />
              </Button>
              <Button
                onClick={stopCamera}
                variant="destructive"
                size="lg"
                className="rounded-full w-16 h-16 p-0"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image preview & form (inline or slide-over) */}
      {preview && inlinePreview && (
        <div className="mt-6 w-full max-w-3xl mx-auto space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-[420px] object-contain"
            />
            <Button
              onClick={handleRemoveImage}
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue..."
                className="min-h-[120px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Type of Civic Problem
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Select a type</option>
                <option value="pothole">Pothole / Road Damage</option>
                <option value="waste">Garbage / Waste</option>
                <option value="lighting">Street Light</option>
                <option value="water">Water / Drainage</option>
                <option value="electricity">Electricity</option>
                <option value="public-safety">Public Safety</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Select severity</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Share location or address"
                className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <div className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="h-8"
                  >
                    {locationLoading && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Use current location
                  </Button>
                  {coordinates && !locationLoading && (
                    <span className="text-green-600 dark:text-green-400">
                      {coordinates}
                    </span>
                  )}
                  {locationAccuracy && !locationLoading && (
                    <span className="text-zinc-500 dark:text-zinc-400">
                      ±{Math.round(locationAccuracy)}m
                    </span>
                  )}
                  {locationError && (
                    <span className="text-red-500">{locationError}</span>
                  )}
                </div>
                {locationName && (
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {locationName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full mt-2"
            disabled={
              submitting || !description || !issueType || !severity || !location
            }
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Report This Issue"
            )}
          </Button>
        </div>
      )}

      {!inlinePreview && preview && (
        <div className="fixed inset-0 z-40 flex bg-black/30 backdrop-blur-sm">
          <div className="ml-auto h-full w-full max-w-3xl bg-white dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur px-4 py-3">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Ready to submit
                </p>
                <h3 className="text-lg font-semibold">Review & report</h3>
              </div>
              <Button
                onClick={handleRemoveImage}
                variant="ghost"
                size="icon"
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6 px-6 py-6">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-auto max-h-[420px] object-contain bg-black"
                />
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue..."
                    className="min-h-[120px] rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Type of Civic Problem
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Select a type</option>
                    <option value="pothole">Pothole / Road Damage</option>
                    <option value="waste">Garbage / Waste</option>
                    <option value="lighting">Street Light</option>
                    <option value="water">Water / Drainage</option>
                    <option value="electricity">Electricity</option>
                    <option value="public-safety">Public Safety</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Select severity</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Location
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Share location or address"
                    className="h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-offset-2 placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  <div className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={locationLoading}
                        className="h-8"
                      >
                        {locationLoading && (
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        )}
                        Use current location
                      </Button>
                      {coordinates && !locationLoading && (
                        <span className="text-green-600 dark:text-green-400">
                          {coordinates}
                        </span>
                      )}
                      {locationAccuracy && !locationLoading && (
                        <span className="text-zinc-500 dark:text-zinc-400">
                          ±{Math.round(locationAccuracy)}m
                        </span>
                      )}
                      {locationError && (
                        <span className="text-red-500">{locationError}</span>
                      )}
                    </div>
                    {locationName && (
                      <span className="text-zinc-600 dark:text-zinc-300">
                        {locationName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                size="lg"
                className="w-full mt-2"
                disabled={
                  submitting ||
                  !description ||
                  !issueType ||
                  !severity ||
                  !location
                }
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Report This Issue"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
