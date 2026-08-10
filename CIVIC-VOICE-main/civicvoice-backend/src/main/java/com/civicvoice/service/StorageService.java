package com.civicvoice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class StorageService {

    private final Path root;

    public StorageService(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory", e);
        }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;
        String ext = "jpg";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.') + 1).toLowerCase();
        }
        String filename = UUID.randomUUID().toString().replace("-", "") + "." + ext;
        try {
            Path target = root.resolve(filename).normalize();
            file.transferTo(target);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store uploaded file", e);
        }
        return "/uploads/" + filename;
    }
}
