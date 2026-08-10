"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function SimpleIssueForm() {
  const { user } = useUser();
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("");
  const [severity, setSeverity] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Auto-fetch location on mount
  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported.");
      return;
    }
    setLocError("");
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const coordString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setCoordinates(coordString);
        setLocation((prev) => prev || coordString);
        // Reverse geocode for a nicer name
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              setLocationName(data.display_name);
              setLocation((prev) => prev || data.display_name);
            }
          }
        } catch (err) {
          // ignore reverse geocode errors
        }
        if (accuracy) {
          setLocationName((prev) => prev || coordString);
        }
        setLocLoading(false);
      },
      (err) => {
        setLocError(err.message || "Unable to fetch location");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const attachStreamToVideo = (stream) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    video.srcObject = stream;
    video.muted = true; // allow autoplay on some mobile browsers
    video.onloadedmetadata = () => {
      video.play().catch(() => {
        /* ignore play errors (user gesture requirements) */
      });
    };
  };

  const handleCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        cameraInputRef.current?.click();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => attachStreamToVideo(stream));
    } catch (err) {
      cameraInputRef.current?.click(); // fallback to input picker
    }
  };

  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "capture.jpg", { type: blob.type });
          setImage(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
        setCameraOpen(false);
        stopStream();
      },
      "image/jpeg",
      0.9
    );
  };

  const closeCamera = () => {
    setCameraOpen(false);
    stopStream();
  };

  const handleSubmit = async () => {
    if (!description || !issueType || !severity || !location) {
      toast.error("All fields are mandatory, including photo.");
      return;
    }
    if (!image) {
      toast.error("Please add a photo (required).");
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("description", description);
    formData.append("issueType", issueType);
    formData.append("severity", severity);
    if (location) formData.append("location", location);
    if (coordinates) formData.append("coordinates", coordinates);
    if (locationName) formData.append("locationName", locationName);
    if (user?.id) formData.append("userId", user.id);

    try {
      const res = await fetch("/api/issues", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }
      toast.success("Issue submitted");
      setDescription("");
      setIssueType("");
      setSeverity("");
      setLocation("");
      setImage(null);
    } catch (err) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
      <div className="grid gap-2">
        <Label className="flex items-center gap-2">
          Photo <span className="text-red-500 text-xs">(required)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={handleCamera}>
            Use Camera
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image
          </Button>
        </div>
        <Input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
        />
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        {image && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              Selected: {image.name} ({Math.round(image.size / 1024)} KB)
            </p>
            {previewUrl && (
              <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800 bg-black">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-auto max-h-80 object-contain"
                />
              </div>
            )}
          </div>
        )}
        {cameraOpen && (
          <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-black/80 p-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-md bg-black"
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={closeCamera}>
                Cancel
              </Button>
              <Button type="button" onClick={captureFromVideo}>
                Capture
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <Label>Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue..."
          required
        />
      </div>

      <div className="grid gap-2">
        <Label>Category</Label>
        <Select value={issueType} onValueChange={setIssueType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pothole">Pothole / Road Damage</SelectItem>
            <SelectItem value="waste">Garbage / Waste</SelectItem>
            <SelectItem value="lighting">Street Light</SelectItem>
            <SelectItem value="water">Water / Drainage</SelectItem>
            <SelectItem value="electricity">Electricity</SelectItem>
            <SelectItem value="public-safety">Public Safety</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Severity</Label>
        <Select value={severity} onValueChange={setSeverity} required>
          <SelectTrigger>
            <SelectValue placeholder="Select severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Location</Label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Address or coordinates"
          required
        />
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchLocation}
            disabled={locLoading}
          >
            {locLoading ? "Fetching..." : "Use current location"}
          </Button>
          {coordinates && !locLoading && <span>{coordinates}</span>}
          {locError && <span className="text-red-500">{locError}</span>}
        </div>
        {locationName && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{locationName}</p>
        )}
      </div>

      <Button onClick={handleSubmit} disabled={submitting} className="w-full">
        {submitting ? "Submitting..." : "Submit Issue"}
      </Button>
    </div>
  );
}

